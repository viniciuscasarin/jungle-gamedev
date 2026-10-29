import { describe, expect, it } from 'vitest';
import { createGameConfig, createMatchSetup, DEFAULT_CONFIG, OPTION_METADATA, projectileRangeUnits, snapshotConfiguration } from '../src/domain/config';

describe('GDD initial configuration', () => {
  it('keeps all proposed values, units and versions centralized', () => {
    const c = createGameConfig();
    expect(c.mapVersion).toBe('arena-v2');
    expect(c.balanceVersion).toBe('balance-v1');
    expect(c.options).toEqual({ sessionDurationMs: 120000, enemySpawnIntervalMs: 3000 });
    expect(c.world.widthUnits).toBe(960); expect(c.world.heightUnits).toBe(540);
    expect(c.world.playerStart).toEqual({ xUnits: 480, yUnits: 270, headingRadians: -Math.PI / 2 });
    expect(c.world.islands.map(i => [i.id, i.origin, i.widthUnits, i.heightUnits])).toEqual([
      ['northwest', { xUnits: 135, yUnits: 95 }, 160, 120], ['southeast', { xUnits: 665, yUnits: 325 }, 160, 120],
    ]);
    expect(Object.values(c.ships).map(s => [s.maxHealth, s.forwardSpeedUnitsPerSecond, s.hullRadiusUnits, s.contactDamage])).toEqual([[100,150,18,0], [40,115,16,25], [60,90,18,0]]);
    expect(Object.values(c.ships).map(s => s.turnSpeedRadiansPerSecond)).toEqual([Math.PI, 140 * Math.PI / 180, 110 * Math.PI / 180]);
    expect(c.weapons.front).toEqual({ damage: 20, projectileCount: 1, cooldownMs: 350, projectileSpeedUnitsPerSecond: 420, projectileLifetimeMs: 1200 });
    expect(c.weapons.port).toEqual({ damage: 20, projectileCount: 3, cooldownMs: 1200, projectileSpeedUnitsPerSecond: 360, projectileLifetimeMs: 1000, longitudinalSpacingUnits: 14 });
    expect(c.weapons.starboard).toEqual(c.weapons.port);
    expect(c.weapons.shooter).toEqual({ damage: 10, projectileCount: 1, cooldownMs: 1500, projectileSpeedUnitsPerSecond: 260, projectileLifetimeMs: 1500 });
    expect(c.weapons.playerInitiallyReady).toBe(true);
    expect([c.weapons.front, c.weapons.port, c.weapons.shooter].map(projectileRangeUnits)).toEqual([504,360,390]);
    expect(c.shooter).toEqual({ attackRangeUnits: 300, preferredDistanceUnits: 240, hysteresisUnits: 30, aimToleranceRadians: 10 * Math.PI / 180, firstShotWaitsFullCooldown: true });
    expect(c.spawn).toEqual({ minimumPlayerDistanceUnits: 240, telegraphMs: 600, archetypeSequence: ['chaser','shooter'], liveEnemyCap: null, firstSpawnWaitsFullInterval: true, accumulateBacklog: false });
    expect(c.controls).toEqual({ mouseDeadZoneUnits: 12, joypadDeadZoneNormalized: 0.15, initialAutoSail: false });
    expect(c.rules).toEqual({ damageProtectionMs: 0, pointsPerPlayerEnemyDestruction: 1, pointsPerChaserContactDestruction: 0, friendlyFire: false, piercing: false, splashDamage: false, shorelineDamage: false, projectileCollisions: false });
    expect(c.timing).toEqual({ fixedStepMs: 1000/60, maxCatchUpStepsPerFrame: 5 });
  });

  it.each([[60000,1000], [180000,10000], [61000,1500]])('accepts valid options %i/%i ms', (sessionDurationMs, enemySpawnIntervalMs) => {
    expect(createGameConfig({ sessionDurationMs, enemySpawnIntervalMs }).options).toEqual({ sessionDurationMs, enemySpawnIntervalMs });
  });
  for (const key of ['sessionDurationMs', 'enemySpawnIntervalMs'] as const) {
    const metadata = OPTION_METADATA[key];
    it.each([NaN, Infinity, -Infinity, metadata.min - 1, metadata.max + 1, metadata.min + metadata.step / 2])(`rejects invalid ${key}: %s`, value => {
      expect(() => createGameConfig({ ...DEFAULT_CONFIG.options, [key]: value })).toThrow(RangeError);
    });
  }
  it('copies and freezes nested objects and collections without freezing the source', () => {
    const source = { ...DEFAULT_CONFIG, options: { ...DEFAULT_CONFIG.options }, weapons: { ...DEFAULT_CONFIG.weapons, front: { ...DEFAULT_CONFIG.weapons.front } }, world: { ...DEFAULT_CONFIG.world, islands: DEFAULT_CONFIG.world.islands.map(island => ({ ...island, origin: { ...island.origin }, solidOutline: island.solidOutline.map(p => ({ ...p })) })) }, spawn: { ...DEFAULT_CONFIG.spawn, archetypeSequence: [...DEFAULT_CONFIG.spawn.archetypeSequence] } };
    const snapshot = snapshotConfiguration(source);
    source.options.sessionDurationMs = 60000;
    source.weapons.front.damage = 999;
    source.world.islands[0]!.origin.xUnits = 999; source.world.islands[0]!.solidOutline[0]!.xUnits = 999;
    source.spawn.archetypeSequence.push('chaser');
    expect(snapshot).toEqual(DEFAULT_CONFIG);
    expect(Reflect.set(snapshot.weapons.front, 'damage', 999)).toBe(false);
    expect(Reflect.set(snapshot.world.islands[0]!.solidOutline[0]!, 'xUnits', 999)).toBe(false);
    expect(Reflect.set(snapshot.spawn.archetypeSequence, '0', 'shooter')).toBe(false);
    expect(Object.isFrozen(DEFAULT_CONFIG.spawn.archetypeSequence)).toBe(true);
    expect(snapshot).not.toBe(source);
    expect(snapshot.world.islands).not.toBe(source.world.islands);
  });
  it.each([0,4294967295])('keeps seed %s separate from identical configuration', seed => {
    const setup = createMatchSetup(DEFAULT_CONFIG, seed);
    expect(setup.seed).toBe(seed);
    expect(setup.configuration).toEqual(DEFAULT_CONFIG);
    expect(setup.configuration).not.toBe(DEFAULT_CONFIG);
    expect('seed' in setup.configuration).toBe(false);
    expect(Object.isFrozen(setup)).toBe(true);
  });
  it.each([-1, 1.5, 4294967296, NaN, Infinity, -Infinity])('rejects invalid seed %s', seed => {
    expect(() => createMatchSetup(DEFAULT_CONFIG, seed)).toThrow(RangeError);
  });
});
