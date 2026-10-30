import type { DeepReadonly } from '../../domain/immutable';
import type { WorldPoint } from '../contracts';

/** Half-open ownership cells. Indices and world coordinates are signed. */
export interface RegionCoordinates { readonly x: number; readonly y: number }
export interface WorldAabb { readonly minX: number; readonly minY: number; readonly maxX: number; readonly maxY: number }
export type IslandRotation = 0 | 90 | 180 | 270;
export type IslandFamily = 'compact' | 'elongated' | 'wide';
export interface IslandModel {
  readonly id: string;
  readonly family: IslandFamily;
  readonly widthUnits: number;
  readonly heightUnits: number;
  readonly solidOutline: readonly WorldPoint[];
  readonly rotations: readonly IslandRotation[];
}
export interface RegionLayout {
  readonly id: string;
  readonly slots: readonly { readonly modelId: string; readonly rotation: IslandRotation; readonly origin: WorldPoint }[];
  readonly pairs: readonly { readonly first: number; readonly second: number; readonly spacingId: string }[];
}
export type ProceduralWorldDescriptor = DeepReadonly<{
  kind: 'procedural';
  generatorVersion: string;
  regionSizeUnits: number;
  tileSizeUnits: number;
  borderWaterUnits: number;
  maneuverClearanceUnits: number;
  initialWaterRadiusUnits: number;
  playerStart: WorldPoint & { headingRadians: number };
  catalog: readonly IslandModel[];
  layouts: readonly RegionLayout[];
  initialLayoutIds: readonly string[];
  spacingProfiles: readonly { id: string; targetUnits: number; toleranceUnits: number }[];
}>;
export interface GeneratedIsland {
  readonly id: string;
  readonly modelId: string;
  readonly region: RegionCoordinates;
  readonly rotation: IslandRotation;
  readonly origin: WorldPoint;
  readonly widthUnits: number;
  readonly heightUnits: number;
  /** Local clockwise convex sand shoreline; excludes water and decoration. */
  readonly solidOutline: readonly WorldPoint[];
}
export interface GeneratedRegion {
  readonly id: string;
  readonly coordinates: RegionCoordinates;
  readonly layoutId: string;
  readonly islands: readonly GeneratedIsland[];
}
