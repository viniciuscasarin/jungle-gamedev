import { expect, it } from 'vitest';
import { configurationKey } from '../src/domain/validation';
import { DEFAULT_CONFIG } from '../src/domain/config';
import { materializeCompletedResult } from '../src/domain/result';
import type { CompletedMatchResult } from '../src/domain/result';
import { NEUTRAL_INPUT } from '../src/simulation/contracts';
import type { SimulationEvent, SimulationSnapshot, StepInput } from '../src/simulation/contracts';
import type { GeneratedRegion } from '../src/simulation/contracts';
import { immutableCopy } from '../src/domain/immutable';

it('captures signed procedural region data without platform dependencies or nested mutations', () => {
  const source = { id: '-1:0', coordinates: { x: -1, y: 0 }, layoutId: 'compact-pair', islands: [{ id: '-1:0:0', modelId: 'compact', region: { x: -1, y: 0 }, rotation: 0 as const, origin: { xUnits: -1200, yUnits: 80 }, widthUnits: 160, heightUnits: 120, solidOutline: [{ xUnits: 0, yUnits: 40 }, { xUnits: 40, yUnits: 0 }, { xUnits: 160, yUnits: 120 }] }] };
  const region: GeneratedRegion = immutableCopy(source);
  source.islands[0]!.solidOutline[0]!.xUnits = 999;
  expect(region.islands[0]!.solidOutline[0]!.xUnits).toBe(0);
  expect(Reflect.set(region.coordinates, 'x', 1)).toBe(false);
  expect(Reflect.set(region.islands[0]!.solidOutline[0]!, 'xUnits', 2)).toBe(false);
  expect(JSON.parse(JSON.stringify(region))).toEqual(region);
  expect('document' in globalThis).toBe(false);
});

function staticTerrainChecks(region: GeneratedRegion) {
  // @ts-expect-error Region indices are captured readonly.
  region.coordinates.x = 0;
  // @ts-expect-error Generated collections are readonly.
  region.islands.push(region.islands[0]!);
  // @ts-expect-error Shoreline vertices are deeply readonly.
  region.islands[0]!.solidOutline[0]!.xUnits = 0;
}
void staticTerrainChecks;

const fixture: CompletedMatchResult = { matchId: 'match-fixture', playerId: 'player-fixture', playerName: 'Captain-Test', completedAt: '2026-10-27T17:00:00.000Z', score: 3, activeDurationMs: 120000, endReason: 'time_expired', configuration: DEFAULT_CONFIG, configurationKey: configurationKey(DEFAULT_CONFIG), seed: 0 };

it('represents simultaneous normalized input and absent initial target without a browser', () => {
  expect(typeof globalThis).toBe('object');
  expect('window' in globalThis).toBe(false);
  expect('document' in globalThis).toBe(false);
  const input: StepInput = { steering: { kind: 'direction', x: 0, y: -1 }, movementRequested: true, fire: { front: true, port: true, starboard: true }, toggleAutoSailPressed: true, pausePressed: true };
  const target: StepInput = { ...input, steering: { kind: 'target', target: { xUnits: 480, yUnits: 50 } } };
  expect(input.fire).toEqual({ front: true, port: true, starboard: true });
  expect(target.steering.kind).toBe('target');
  expect(NEUTRAL_INPUT).toEqual({ steering: { kind: 'none' }, movementRequested: false, fire: { front: false, port: false, starboard: false }, toggleAutoSailPressed: false, pausePressed: false });
});

it('constructs readonly snapshot and discriminated events as plain data in Node', () => {
  const snapshot: SimulationSnapshot = { step: 60, activeTimeMs: 1000, state: 'playing', score: 1, player: { id: 'player', archetype: 'player', position: { xUnits: 480, yUnits: 270 }, headingRadians: -Math.PI / 2, health: 100, maxHealth: 100 }, enemies: [], reservations: [], projectiles: [{ id: 'ball', ownerId: 'player', faction: 'player', damage: 20, speedUnitsPerSecond: 420, radiusUnits: 5, position: { xUnits: 480, yUnits: 200 }, headingRadians: -Math.PI / 2, remainingLifetimeMs: 500 }], cooldownsMs: { front: 350, port: 0, starboard: 0 }, autoSailEnabled: false };
  const time = { step: snapshot.step, activeTimeMs: snapshot.activeTimeMs };
  const events: readonly SimulationEvent[] = [
    { ...time, type: 'damage', targetId: 'enemy', sourceId: 'player', amount: 20, remainingHealth: 0 },
    { ...time, type: 'destruction', entityId: 'enemy', sourceId: 'player', cause: 'projectile' },
    { ...time, type: 'score', enemyId: 'enemy', points: 1, totalScore: 1 },
    { ...time, type: 'ended', reason: 'time_expired', score: 1 },
    { ...time, type: 'fire', shooterId: 'player', weapon: 'front', positions: [{ xUnits: 480, yUnits: 250 }], headingRadians: -Math.PI / 2 },
    { ...time, type: 'water_hit', position: { xUnits: 480, yUnits: 150 } },
  ];
  expect(events.map(event => event.type)).toEqual(['damage', 'destruction', 'score', 'ended', 'fire', 'water_hit']);
  expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot);
  expect(events.every(event => event.step === 60 && event.activeTimeMs === 1000)).toBe(true);
});

it('materializes every supplied result field with a detached deep configuration', () => {
  const source = { ...fixture, configuration: { ...DEFAULT_CONFIG, weapons: { ...DEFAULT_CONFIG.weapons, front: { ...DEFAULT_CONFIG.weapons.front } }, spawn: { ...DEFAULT_CONFIG.spawn, archetypeSequence: [...DEFAULT_CONFIG.spawn.archetypeSequence] } } };
  const result = materializeCompletedResult(source);
  source.score = 999;
  source.configuration.weapons.front.damage = 999;
  source.configuration.spawn.archetypeSequence.push('chaser');
  expect(result).toEqual(fixture);
  expect(Reflect.set(result, 'score', 999)).toBe(false);
  expect(Reflect.set(result.configuration.weapons.front, 'damage', 999)).toBe(false);
  expect(Reflect.set(result.configuration.spawn.archetypeSequence, '0', 'shooter')).toBe(false);
});

it.each([-1, 0.5, NaN, Infinity])('rejects invalid result score %s', score => {
  expect(() => materializeCompletedResult({ ...fixture, score })).toThrow(RangeError);
});
it.each([-1, NaN, Infinity])('rejects invalid active duration %s', activeDurationMs => {
  expect(() => materializeCompletedResult({ ...fixture, activeDurationMs })).toThrow(RangeError);
});
it.each(['2026-02-29T10:00:00Z', '2024-02-30T10:00:00Z', '2026-10-27T24:00:00Z', '2026-10-27T12:00:00+00:00', 'not-a-date'])('rejects invalid/non-UTC timestamp %s', completedAt => {
  expect(() => materializeCompletedResult({ ...fixture, completedAt })).toThrow(RangeError);
});
it('accepts valid leap day, fractional duration and boundary seeds', () => {
  expect(materializeCompletedResult({ ...fixture, completedAt: '2024-02-29T23:59:59Z', activeDurationMs: 0.5, endReason: 'player_destroyed', seed: 4294967295 }).seed).toBe(4294967295);
  expect(() => materializeCompletedResult({ ...fixture, seed: -1 })).toThrow(RangeError);
});

// This function is compiled but never invoked: negative checks must remain type errors.
function staticContractChecks(result: CompletedMatchResult, snapshot: SimulationSnapshot) {
  // @ts-expect-error Complete results require seed and every other field.
  const incomplete: CompletedMatchResult = { matchId: 'incomplete' };
  // @ts-expect-error Captured result fields cannot be reassigned.
  result.score = 2;
  // @ts-expect-error Nested configuration is readonly.
  result.configuration.weapons.front.damage = 2;
  // @ts-expect-error Collections in configuration are readonly.
  result.configuration.spawn.archetypeSequence.push('chaser');
  // @ts-expect-error Snapshot entity data is deeply readonly.
  snapshot.player.position.xUnits = 2;
  return incomplete;
}
void staticContractChecks;
