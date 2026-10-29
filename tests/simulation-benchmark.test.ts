import { describe, expect, it } from 'vitest';
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
  const sim = createSimulation(setup);

  const stepDurationsMs: number[] = new Array(totalTicks);
  let peakEntities = 0;

  for (let tick = 0; tick < totalTicks; tick++) {
    // Generate simulated active combat input:
    // periodic firing and directional maneuvering around the arena
    const angle = (tick / 60) * 0.5; // continuous turning
    const fireFront = tick % 25 === 0;
    const fireBroadside = tick % 75 === 0;

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

  return {
    scenario: scenarioName,
    totalTicks,
    totalCpuTimeMs,
    avgTimePerTickMs,
    p95TimePerTickMs,
    peakEntities,
    finalScore: finalSnapshot.score,
  };
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
    // Normative requirement: CPU time per step < 0.8ms
    expect(result.avgTimePerTickMs).toBeLessThan(0.8);
    expect(result.p95TimePerTickMs).toBeLessThan(2.0);
  });

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
    // Normative requirement: CPU time per step < 0.8ms even in accelerated 1.0s spawn stress
    expect(result.avgTimePerTickMs).toBeLessThan(0.8);
    // Natural geometric ceiling: peak entities bounded by arena space without exponential explosion
    expect(result.peakEntities).toBeGreaterThan(0);
    expect(result.peakEntities).toBeLessThan(200);
  });
});
