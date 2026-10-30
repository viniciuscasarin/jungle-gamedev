import { HISTORICAL_FINITE_CONFIG } from './historicalFiniteConfig';
import { isProceduralWorld } from './config';
import { validateProceduralWorld } from '../simulation/world/validate';
import { DEFAULT_CONFIG, createGameConfig } from './config';
import type { GameConfig, GameOptions } from './config';
import { immutableCopy } from './immutable';
import { hullIsValid } from '../simulation/collision';

export const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
export const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const requireValid: (condition: unknown) => asserts condition = condition => { if (!condition) throw new RangeError('Invalid configuration data.'); };

/** Validate every required leaf, without filling missing historical fields from defaults. */
function shape(value: unknown, example: unknown, path = '', signedCoordinates = false): void {
  if (Array.isArray(example)) {
    requireValid(Array.isArray(value));
    for (const item of value) shape(item, example[0], `${path}[]`, signedCoordinates);
  } else if (isRecord(example)) {
    requireValid(isRecord(value));
    requireValid(Object.keys(value).length === Object.keys(example).length);
    for (const [key, child] of Object.entries(example)) { requireValid(Object.hasOwn(value, key)); shape(value[key], child, `${path}.${key}`, signedCoordinates); }
  } else if (typeof example === 'number') {
    requireValid(finite(value));
    // Finite history keeps its original schema; procedural world points are signed.
    if (!path.endsWith('headingRadians') && !(signedCoordinates && (path.endsWith('xUnits') || path.endsWith('yUnits')))) requireValid(value >= 0);
    if (example > 0 && !path.endsWith('headingRadians') && !path.includes('solidOutline') && !path.includes('.origin.') && !path.includes('.playerStart.')) requireValid(value > 0);
  } else if (typeof example === 'string') requireValid(isText(value));
  else if (typeof example === 'boolean') requireValid(typeof value === 'boolean');
  else requireValid(value === null);
}

export function validateOptions(value: unknown): GameOptions {
  requireValid(isRecord(value) && Object.keys(value).length === 2 && finite(value.sessionDurationMs) && finite(value.enemySpawnIntervalMs));
  return createGameConfig({ sessionDurationMs: value.sessionDurationMs, enemySpawnIntervalMs: value.enemySpawnIntervalMs }).options;
}

export function validateConfiguration(value: unknown): GameConfig {
  requireValid(isRecord(value) && isRecord(value.world));
  const procedural = value.world.kind === 'procedural';
  shape(value, procedural ? DEFAULT_CONFIG : HISTORICAL_FINITE_CONFIG, '', procedural);
  const c = value as GameConfig;
  validateOptions(c.options);
  requireValid(c.timing.fixedStepMs === 1000 / 60 && Number.isSafeInteger(c.timing.maxCatchUpStepsPerFrame));
  requireValid(c.weapons.front.projectileCount === 1 && c.weapons.shooter.projectileCount === 1 && c.weapons.port.projectileCount === 3 && c.weapons.starboard.projectileCount === 3);
  requireValid(c.spawn.archetypeSequence.length > 0 && c.spawn.archetypeSequence.every(a => a === 'chaser' || a === 'shooter'));
  requireValid(c.controls.joypadDeadZoneNormalized < 1 && c.shooter.aimToleranceRadians <= Math.PI && c.shooter.hysteresisUnits < c.shooter.preferredDistanceUnits);
  // These switches are explicit unsupported rules, never silently interpreted as implemented.
  requireValid(!c.rules.friendlyFire && !c.rules.piercing && !c.rules.splashDamage && !c.rules.shorelineDamage && !c.rules.projectileCollisions && c.rules.damageProtectionMs === 0);
  requireValid(!c.controls.initialAutoSail && c.weapons.playerInitiallyReady && c.shooter.firstShotWaitsFullCooldown && c.spawn.firstSpawnWaitsFullInterval && !c.spawn.accumulateBacklog);
  for (const n of [c.navigation.endpointConnections, c.navigation.separationIterations, c.director.candidateAttempts, c.rules.pointsPerPlayerEnemyDestruction, c.rules.pointsPerChaserContactDestruction]) requireValid(Number.isSafeInteger(n));
  const world = c.world;
  if (isProceduralWorld(world)) {
    requireValid('maximumPlayerDistanceUnits' in c.spawn && c.spawn.maximumPlayerDistanceUnits > c.spawn.minimumPlayerDistanceUnits);
    validateProceduralWorld(world, Object.values(c.ships), c.navigation.clearanceUnits);
  } else {
  requireValid(new Set(world.islands.map(i => i.id)).size === world.islands.length);
  for (const island of world.islands) {
    requireValid(island.origin.xUnits + island.widthUnits <= world.widthUnits && island.origin.yUnits + island.heightUnits <= world.heightUnits);
    const outline = island.solidOutline;
    requireValid(outline.length >= 3);
    let area = 0;
    for (let i = 0; i < outline.length; i++) {
      const a = outline[i]!, b = outline[(i + 1) % outline.length]!, d = outline[(i + 2) % outline.length]!;
      requireValid(a.xUnits <= island.widthUnits && a.yUnits <= island.heightUnits && Math.hypot(a.xUnits - b.xUnits, a.yUnits - b.yUnits) > 1e-9);
      requireValid((b.xUnits - a.xUnits) * (d.yUnits - b.yUnits) - (b.yUnits - a.yUnits) * (d.xUnits - b.xUnits) >= -1e-7);
      for (const vertex of outline) requireValid((b.xUnits - a.xUnits) * (vertex.yUnits - a.yUnits) - (b.yUnits - a.yUnits) * (vertex.xUnits - a.xUnits) >= -1e-7);
      area += a.xUnits * b.yUnits - b.xUnits * a.yUnits;
    }
    requireValid(area > 1e-7);
  }
  for (const ship of Object.values(c.ships)) requireValid(ship.hullRadiusUnits * 2 < Math.min(world.widthUnits, world.heightUnits));
  requireValid(world.islands.every(i => i.origin.xUnits >= 0 && i.origin.yUnits >= 0));
  requireValid(hullIsValid(world.playerStart, c));
  }
  return immutableCopy(c);
}

/** Versioned full canonical JSON; arrays preserve semantic order. No hash collisions. */
export function configurationKey(configuration: GameConfig): string {
  const canonical = (value: unknown): string => {
    if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
    if (isRecord(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
    if (typeof value === 'number' && !Number.isFinite(value)) throw new RangeError('Nonfinite canonical data.');
    return JSON.stringify(value);
  };
  return `gameplay-v1:${canonical(configuration)}`;
}
