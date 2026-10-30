import { immutableCopy } from './immutable';
import { HISTORICAL_FINITE_CONFIG } from './historicalFiniteConfig';
import type { HistoricalFiniteConfig } from './historicalFiniteConfig';
import { PROCEDURAL_WORLD } from '../simulation/world/catalog';
import type { ProceduralWorldDescriptor } from '../simulation/world/types';

/** Options metadata is the single source for creation and the future Options form. */
export const OPTION_METADATA = immutableCopy({
  sessionDurationMs: { label: 'Game session time', unit: 'ms', default: 120_000, min: 60_000, max: 180_000, step: 1_000 },
  enemySpawnIntervalMs: { label: 'Enemy spawn time', unit: 'ms', default: 3_000, min: 1_000, max: 10_000, step: 500 },
});

export interface GameOptions {
  readonly sessionDurationMs: number;
  readonly enemySpawnIntervalMs: number;
}

export type ProceduralGameConfig = Omit<HistoricalFiniteConfig, 'world' | 'spawn'> & { readonly world: ProceduralWorldDescriptor; readonly spawn: HistoricalFiniteConfig['spawn'] & { readonly maximumPlayerDistanceUnits: number } };
export type GameConfig = HistoricalFiniteConfig | ProceduralGameConfig;
const initialConfiguration: ProceduralGameConfig = { ...HISTORICAL_FINITE_CONFIG, mapVersion: 'ocean-v1', world: PROCEDURAL_WORLD, spawn: { ...HISTORICAL_FINITE_CONFIG.spawn, maximumPlayerDistanceUnits: 520 } };
export const isProceduralWorld = (world: GameConfig['world']): world is ProceduralWorldDescriptor => 'kind' in world && world.kind === 'procedural';
export const DEFAULT_CONFIG: ProceduralGameConfig = immutableCopy(initialConfiguration);

export function snapshotConfiguration<T extends GameConfig>(configuration: T): T {
  return immutableCopy(configuration) as T;
}

export function createGameConfig(options: GameOptions = DEFAULT_CONFIG.options): ProceduralGameConfig {
  for (const key of ['sessionDurationMs', 'enemySpawnIntervalMs'] as const) {
    const value = options[key];
    const metadata = OPTION_METADATA[key];
    if (!Number.isFinite(value) || value < metadata.min || value > metadata.max || (value - metadata.min) % metadata.step !== 0) {
      throw new RangeError(`${metadata.label} must be ${metadata.min}–${metadata.max} ${metadata.unit} in steps of ${metadata.step}.`);
    }
  }
  return immutableCopy({ ...DEFAULT_CONFIG, options });
}

export function projectileRangeUnits(weapon: { readonly projectileSpeedUnitsPerSecond: number; readonly projectileLifetimeMs: number }): number {
  return weapon.projectileSpeedUnitsPerSecond * weapon.projectileLifetimeMs / 1_000;
}

export function validateSeed(seed: number): void {
  if (!Number.isInteger(seed) || seed < 0 || seed > 4_294_967_295) throw new RangeError('Seed must be a uint32 integer.');
}

export interface MatchSetup { readonly configuration: GameConfig; readonly seed: number }

export function createMatchSetup(configuration: GameConfig, seed: number): MatchSetup {
  validateSeed(seed);
  return immutableCopy({ configuration, seed });
}
