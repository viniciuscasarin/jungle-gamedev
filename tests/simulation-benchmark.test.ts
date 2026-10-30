import { describe, expect, it } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { createGameConfig, createMatchSetup } from '../src/domain/config';
import { createSimulation } from '../src/simulation/engine';
import type { StepInput } from '../src/simulation/contracts';

interface BenchmarkMetrics {
  readonly scenario: string;
  readonly totalTicks: number;
  readonly totalCpuTimeMs: number;
  readonly avgTimePerTickMs: number;
  readonly p95TimePerTickMs: number;
  readonly peakEntities: number;
  readonly finalScore: number;
  readonly activeDurationMs: number;
  readonly finalPosition: { xUnits: number; yUnits: number };
  readonly resources: ReturnType<ReturnType<typeof createSimulation>['inspectResources']>;
}

function runSimulationBenchmark(options: {
  scenarioName: string;
  spawnIntervalMs: number;
  totalTicks?: number;
  seed?: number;
}): BenchmarkMetrics {
  const { scenarioName, spawnIntervalMs, totalTicks = 10_800, seed = 42 } = options;
  const config = createGameConfig({
    sessionDurationMs: 180_000,
    enemySpawnIntervalMs: spawnIntervalMs,
  });
  const setup = createMatchSetup(config, seed);
  const sim = createSimulation(setup, {}, () => performance.now());

  const stepDurationsMs: number[] = new Array(totalTicks);
  let peakEntities = 0;

  for (let tick = 0; tick < totalTicks; tick++) {
    // Generate simulated active combat input:
    // periodic firing and directional maneuvering around the arena
    const angle = tick < 90 ? -Math.PI / 2 : 0; // continuous turning
    const fireFront = true;
    const fireBroadside = true;

    const input: StepInput = {
      steering: { kind: 'direction', x: Math.cos(angle), y: Math.sin(angle) },
      movementRequested: true,
      fire: {
        front: fireFront,
        port: fireBroadside,
        starboard: fireBroadside,
      },
      toggleAutoSailPressed: false,
      pausePressed: false,
    };

    const start = performance.now();
    sim.step(input);
    const elapsed = performance.now() - start;
    stepDurationsMs[tick] = elapsed;

    // Track active entities periodically or every tick
    const current = sim.inspect();
    const entityCount = (current.player.health > 0 ? 1 : 0) +
      current.enemies.length +
      current.projectiles.length +
      current.reservations.length;
    if (entityCount > peakEntities) {
      peakEntities = entityCount;
    }
  }

  const finalSnapshot = sim.inspect();
  const totalCpuTimeMs = stepDurationsMs.reduce((sum, d) => sum + d, 0);
  const avgTimePerTickMs = totalCpuTimeMs / totalTicks;

  // Compute p95
  const sorted = [...stepDurationsMs].sort((a, b) => a - b);
  const p95Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  const p95TimePerTickMs = sorted[p95Index]!;

  const resources = sim.inspectResources();
  sim.dispose();
  expect(sim.inspectResources()).toMatchObject({ terrain: { regions: 0 }, navigation: { graphs: 0 } });
  const result = {
    activeDurationMs: finalSnapshot.activeTimeMs, finalPosition: finalSnapshot.player.position, resources,
    scenario: scenarioName,
    totalTicks,
    totalCpuTimeMs,
    avgTimePerTickMs,
    p95TimePerTickMs,
    peakEntities,
    finalScore: finalSnapshot.score,
  };
  mkdirSync('project/automation-reports/infinite-world', { recursive: true });
  writeFileSync(`project/automation-reports/infinite-world/benchmark-${spawnIntervalMs}.json`, JSON.stringify({ node: process.version, platform: process.platform, arch: process.arch, ...result }, null, 2));
  return result;
}

describe('Headless simulation benchmark (10,800 ticks / 180s)', () => {
  it('sustains standard 3.0s spawn scenario with < 0.8ms average CPU per tick', () => {
    const result = runSimulationBenchmark({
      scenarioName: 'Standard 3.0s Spawn',
      spawnIntervalMs: 3_000,
      totalTicks: 10_800,
      seed: 42,
    });

    console.info('[BENCHMARK STANDARD]', {
      scenario: result.scenario,
      totalTicks: result.totalTicks,
      totalCpuTimeMs: Number(result.totalCpuTimeMs.toFixed(2)),
      avgMs: Number(result.avgTimePerTickMs.toFixed(4)),
      p95Ms: Number(result.p95TimePerTickMs.toFixed(4)),
      peakEntities: result.peakEntities,
      score: result.finalScore,
    });

    expect(result.totalTicks).toBe(10_800);
    expect(result.activeDurationMs).toBe(180000);
    expect(result.finalPosition.xUnits).toBeGreaterThan(20 * 1280);
    expect(result.resources.terrain.idleRegions).toBeLessThanOrEqual(8);
    // Normative requirement: CPU time per step < 0.8ms
    expect(result.avgTimePerTickMs).toBeLessThan(0.8);
    expect(result.p95TimePerTickMs).toBeLessThan(2.0);
  }, 30000);

  it('sustains stress 1.0s spawn scenario with geometric stability and < 0.8ms average CPU per tick', () => {
    const result = runSimulationBenchmark({
      scenarioName: 'Stress 1.0s Spawn',
      spawnIntervalMs: 1_000,
      totalTicks: 10_800,
      seed: 42,
    });

    console.info('[BENCHMARK STRESS]', {
      scenario: result.scenario,
      totalTicks: result.totalTicks,
      totalCpuTimeMs: Number(result.totalCpuTimeMs.toFixed(2)),
      avgMs: Number(result.avgTimePerTickMs.toFixed(4)),
      p95Ms: Number(result.p95TimePerTickMs.toFixed(4)),
      peakEntities: result.peakEntities,
      score: result.finalScore,
    });

    expect(result.totalTicks).toBe(10_800);
    expect(result.activeDurationMs).toBe(180000);
    expect(result.finalPosition.xUnits).toBeGreaterThan(20 * 1280);
    expect(result.resources.terrain.idleRegions).toBeLessThanOrEqual(8);
    // Normative requirement: CPU time per step < 0.8ms even in accelerated 1.0s spawn stress
    expect(result.avgTimePerTickMs).toBeLessThan(0.8);
    // Natural geometric ceiling: peak entities bounded by arena space without exponential explosion
    expect(result.peakEntities).toBeGreaterThan(0);
    expect(result.peakEntities).toBeLessThan(200);
  }, 30000);
});
