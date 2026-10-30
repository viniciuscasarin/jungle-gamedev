import { immutableCopy } from './immutable';
import type { DeepReadonly } from './immutable';

const radians = (degrees: number): number => degrees * Math.PI / 180;
const broadside = { damage: 20, projectileCount: 3, cooldownMs: 1_200, projectileSpeedUnitsPerSecond: 360, projectileLifetimeMs: 1_000, longitudinalSpacingUnits: 14 };

// Clockwise in screen coordinates; measured convex sand shoreline, local to each island.
const shorelineOutline = [{"xUnits": 0.0, "yUnits": 64.375}, {"xUnits": 0.625, "yUnits": 28.125}, {"xUnits": 1.25, "yUnits": 23.75}, {"xUnits": 1.875, "yUnits": 21.25}, {"xUnits": 2.5, "yUnits": 19.375}, {"xUnits": 4.375, "yUnits": 15.625}, {"xUnits": 5.625, "yUnits": 13.75}, {"xUnits": 7.5, "yUnits": 11.875}, {"xUnits": 9.375, "yUnits": 10.625}, {"xUnits": 14.375, "yUnits": 8.125}, {"xUnits": 17.5, "yUnits": 6.875}, {"xUnits": 22.5, "yUnits": 5.0}, {"xUnits": 24.375, "yUnits": 4.375}, {"xUnits": 28.75, "yUnits": 3.125}, {"xUnits": 33.75, "yUnits": 1.875}, {"xUnits": 40.0, "yUnits": 0.625}, {"xUnits": 44.375, "yUnits": 0.0}, {"xUnits": 95.0, "yUnits": 0.0}, {"xUnits": 130.625, "yUnits": 0.625}, {"xUnits": 135.625, "yUnits": 1.25}, {"xUnits": 138.125, "yUnits": 1.875}, {"xUnits": 140.0, "yUnits": 2.5}, {"xUnits": 143.75, "yUnits": 4.375}, {"xUnits": 146.25, "yUnits": 6.25}, {"xUnits": 147.5, "yUnits": 7.5}, {"xUnits": 148.75, "yUnits": 9.375}, {"xUnits": 150.625, "yUnits": 13.125}, {"xUnits": 152.5, "yUnits": 17.5}, {"xUnits": 155.625, "yUnits": 26.875}, {"xUnits": 156.875, "yUnits": 31.25}, {"xUnits": 157.5, "yUnits": 33.75}, {"xUnits": 158.75, "yUnits": 40.0}, {"xUnits": 159.375, "yUnits": 44.375}, {"xUnits": 159.375, "yUnits": 55.0}, {"xUnits": 158.75, "yUnits": 90.625}, {"xUnits": 158.125, "yUnits": 95.0}, {"xUnits": 157.5, "yUnits": 97.5}, {"xUnits": 156.25, "yUnits": 101.25}, {"xUnits": 155.0, "yUnits": 103.75}, {"xUnits": 153.75, "yUnits": 105.625}, {"xUnits": 151.875, "yUnits": 107.5}, {"xUnits": 150.0, "yUnits": 108.75}, {"xUnits": 146.25, "yUnits": 110.625}, {"xUnits": 141.875, "yUnits": 112.5}, {"xUnits": 130.625, "yUnits": 116.25}, {"xUnits": 125.625, "yUnits": 117.5}, {"xUnits": 119.375, "yUnits": 118.75}, {"xUnits": 115.625, "yUnits": 119.375}, {"xUnits": 63.75, "yUnits": 119.375}, {"xUnits": 28.125, "yUnits": 118.75}, {"xUnits": 24.375, "yUnits": 118.125}, {"xUnits": 21.875, "yUnits": 117.5}, {"xUnits": 18.125, "yUnits": 116.25}, {"xUnits": 15.625, "yUnits": 115.0}, {"xUnits": 13.75, "yUnits": 113.75}, {"xUnits": 11.875, "yUnits": 111.875}, {"xUnits": 10.625, "yUnits": 110.0}, {"xUnits": 8.125, "yUnits": 105.0}, {"xUnits": 6.875, "yUnits": 101.875}, {"xUnits": 5.0, "yUnits": 96.875}, {"xUnits": 4.375, "yUnits": 95.0}, {"xUnits": 3.125, "yUnits": 90.625}, {"xUnits": 1.875, "yUnits": 85.625}, {"xUnits": 0.625, "yUnits": 79.375}, {"xUnits": 0.0, "yUnits": 75.0}];

// GDD v0.2 sections 4–8, 13: tuning hypotheses, not measured balance.
const initialConfiguration = {
  mapVersion: 'arena-v2',
  balanceVersion: 'balance-v1',
  options: { sessionDurationMs: 120_000, enemySpawnIntervalMs: 3_000 },
  world: {
    widthUnits: 960, heightUnits: 540,
    playerStart: { xUnits: 480, yUnits: 270, headingRadians: -Math.PI / 2 },
    islands: [
      { id: 'northwest', origin: { xUnits: 135, yUnits: 95 }, widthUnits: 160, heightUnits: 120, solidOutline: shorelineOutline },
      { id: 'southeast', origin: { xUnits: 665, yUnits: 325 }, widthUnits: 160, heightUnits: 120, solidOutline: shorelineOutline },
    ],
  },
  ships: {
    player: { maxHealth: 100, forwardSpeedUnitsPerSecond: 150, turnSpeedRadiansPerSecond: radians(180), hullRadiusUnits: 18, contactDamage: 0 },
    chaser: { maxHealth: 40, forwardSpeedUnitsPerSecond: 115, turnSpeedRadiansPerSecond: radians(140), hullRadiusUnits: 16, contactDamage: 25 },
    shooter: { maxHealth: 60, forwardSpeedUnitsPerSecond: 90, turnSpeedRadiansPerSecond: radians(110), hullRadiusUnits: 18, contactDamage: 0 },
  },
  weapons: {
    front: { damage: 20, projectileCount: 1, cooldownMs: 350, projectileSpeedUnitsPerSecond: 420, projectileLifetimeMs: 1_200 },
    port: { ...broadside }, starboard: { ...broadside },
    shooter: { damage: 10, projectileCount: 1, cooldownMs: 1_500, projectileSpeedUnitsPerSecond: 260, projectileLifetimeMs: 1_500 },
    playerInitiallyReady: true,
  },
  projectiles: { radiusUnits: 5, muzzleClearanceUnits: 0.5 },
  shooter: { attackRangeUnits: 300, preferredDistanceUnits: 240, hysteresisUnits: 30, aimToleranceRadians: radians(10), firstShotWaitsFullCooldown: true },
  spawn: { minimumPlayerDistanceUnits: 240, telegraphMs: 600, archetypeSequence: ['chaser', 'shooter'] as readonly ('chaser' | 'shooter')[], liveEnemyCap: null, firstSpawnWaitsFullInterval: true, accumulateBacklog: false },
  controls: { mouseDeadZoneUnits: 12, joypadDeadZoneNormalized: 0.15, initialAutoSail: false },
  rules: { damageProtectionMs: 0, pointsPerPlayerEnemyDestruction: 1, pointsPerChaserContactDestruction: 0, friendlyFire: false, piercing: false, splashDamage: false, shorelineDamage: false, projectileCollisions: false },
  navigation: { waypointSpacingUnits: 20, clearanceUnits: 0.05, replanMs: 250, endpointConnections: 12, separationMarginUnits: 0.05, separationIterations: 24 },
  director: { candidateAttempts: 64 },
  timing: { fixedStepMs: 1_000 / 60, maxCatchUpStepsPerFrame: 5 },
};

export type HistoricalFiniteConfig = DeepReadonly<typeof initialConfiguration>;
export const HISTORICAL_FINITE_CONFIG: HistoricalFiniteConfig = immutableCopy(initialConfiguration);
