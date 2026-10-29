import { immutableCopy } from '../domain/immutable';
import type { EndReason } from '../domain/result';

export type PlayerWeapon = 'front' | 'port' | 'starboard';

export interface WorldPoint { readonly xUnits: number; readonly yUnits: number }
/** Direction vectors are normalized by the platform input adapter before a step. */
export type SteeringIntent =
  | { readonly kind: 'none' }
  | { readonly kind: 'target'; readonly target: WorldPoint }
  | { readonly kind: 'direction'; readonly x: number; readonly y: number };

export interface StepInput {
  readonly steering: SteeringIntent;
  readonly movementRequested: boolean;
  readonly fire: { readonly front: boolean; readonly port: boolean; readonly starboard: boolean };
  readonly toggleAutoSailPressed: boolean;
  readonly pausePressed: boolean;
}

export const NEUTRAL_INPUT: StepInput = immutableCopy({ steering: { kind: 'none' }, movementRequested: false, fire: { front: false, port: false, starboard: false }, toggleAutoSailPressed: false, pausePressed: false });

export interface ShipSnapshot {
  readonly id: string;
  readonly archetype: 'player' | 'chaser' | 'shooter';
  readonly position: WorldPoint;
  readonly headingRadians: number;
  readonly health: number;
  readonly maxHealth: number;
}
export interface ProjectileSnapshot {
  readonly id: string;
  readonly ownerId: string;
  readonly faction: 'player' | 'enemy';
  readonly damage: number;
  readonly speedUnitsPerSecond: number;
  readonly radiusUnits: number;
  readonly position: WorldPoint;
  readonly headingRadians: number;
  readonly remainingLifetimeMs: number;
}
/** Captured once. No commands for mutating gameplay after creation. */
export interface InitialCombatData {
  readonly mode?: 'normal' | 'stationary-targets';
  readonly enemies?: readonly ShipSnapshot[];
  readonly projectiles?: readonly ProjectileSnapshot[];
}
export interface SpawnReservation {
  readonly id: string;
  readonly archetype: 'chaser' | 'shooter';
  readonly position: WorldPoint;
  readonly createdAtMs: number;
  readonly materializeAtMs: number;
}
export interface SimulationSnapshot {
  readonly step: number;
  readonly activeTimeMs: number;
  readonly state: 'playing' | 'paused' | 'completed';
  readonly score: number;
  readonly player: ShipSnapshot;
  readonly enemies: readonly ShipSnapshot[];
  readonly projectiles: readonly ProjectileSnapshot[];
  readonly reservations: readonly SpawnReservation[];
  readonly cooldownsMs: { readonly front: number; readonly port: number; readonly starboard: number };
  readonly autoSailEnabled: boolean;
}
interface EventTime { readonly step: number; readonly activeTimeMs: number }
export type SimulationEvent = EventTime & (
  | { readonly type: 'damage'; readonly targetId: string; readonly sourceId: string; readonly amount: number; readonly remainingHealth: number }
  | { readonly type: 'destruction'; readonly entityId: string; readonly sourceId: string; readonly cause: 'projectile' | 'contact' }
  | { readonly type: 'score'; readonly enemyId: string; readonly points: number; readonly totalScore: number }
  | { readonly type: 'ended'; readonly reason: EndReason; readonly score: number }
  | { readonly type: 'fire'; readonly shooterId: string; readonly weapon: PlayerWeapon | 'shooter'; readonly positions: readonly WorldPoint[]; readonly headingRadians: number }
  | { readonly type: 'water_hit'; readonly position: WorldPoint }
);
