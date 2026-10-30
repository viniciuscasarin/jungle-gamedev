import { immutableCopy } from '../../domain/immutable';
import { HISTORICAL_FINITE_CONFIG } from '../../domain/historicalFiniteConfig';
import type { IslandModel, ProceduralWorldDescriptor, RegionLayout } from './types';
import { polygonDistance, rotatedModel, worldOutline } from './geometry';

/** Extra middle tile strips preserve the measured corners at 40 units per tile. */
const model = (id: IslandModel['family'], widthUnits: number, heightUnits: number): IslandModel => ({
  id, family: id, widthUnits, heightUnits, rotations: [0, 90, 180, 270],
  solidOutline: HISTORICAL_FINITE_CONFIG.world.islands[0]!.solidOutline.map(p => ({
    xUnits: p.xUnits + (p.xUnits >= 80 ? widthUnits - 160 : 0),
    yUnits: p.yUnits + (p.yUnits >= 60 ? heightUnits - 120 : 0),
  })),
});
export const ISLAND_CATALOG = immutableCopy([model('compact', 160, 120), model('elongated', 160, 280), model('wide', 320, 120)]);

function pairLayout(first: IslandModel, second: IslandModel, target: number, rotation: 0 | 90): RegionLayout {
  const a = { ...rotatedModel(first, rotation), origin: { xUnits: 100, yUnits: 580 } };
  const b = { ...rotatedModel(second, rotation), origin: { xUnits: 0, yUnits: 580 } };
  let low = a.origin.xUnits + a.widthUnits, high = low + target + 80;
  for (let n = 0; n < 48; n++) {
    b.origin.xUnits = (low + high) / 2;
    if (polygonDistance(worldOutline(a), worldOutline(b)) < target) low = b.origin.xUnits; else high = b.origin.xUnits;
  }
  b.origin.xUnits = high;
  return { id: `${first.id}-${second.id}-${rotation}-${target}`, slots: [
    { modelId: first.id, rotation, origin: a.origin }, { modelId: second.id, rotation, origin: b.origin },
  ], pairs: [{ first: 0, second: 1, spacingId: `gap-${target}` }] };
}
const pairs = ISLAND_CATALOG.flatMap(a => ISLAND_CATALOG.flatMap(b => [160, 280, 440].flatMap(gap => ([0, 90] as const).map(rotation => pairLayout(a, b, gap, rotation)))));
// Upper rows add variety while remaining well outside every lower row's clearance.
const extras: RegionLayout[] = pairs.slice(0, 12).map((layout, i) => ({
  id: `${layout.id}-upper`, slots: [...layout.slots,
    { modelId: 'compact', rotation: 0, origin: { xUnits: 100, yUnits: 100 } },
    ...(i % 2 ? [{ modelId: 'wide', rotation: 0 as const, origin: { xUnits: 700, yUnits: 100 } }] : []),
  ], pairs: layout.pairs,
}));
export const PROCEDURAL_WORLD: ProceduralWorldDescriptor = immutableCopy({
  kind: 'procedural', generatorVersion: 'archipelago-v1', regionSizeUnits: 1280, tileSizeUnits: 40,
  borderWaterUnits: 80, maneuverClearanceUnits: 40, initialWaterRadiusUnits: 160,
  playerStart: { xUnits: 480, yUnits: 270, headingRadians: -Math.PI / 2 },
  catalog: ISLAND_CATALOG, layouts: [...pairs, ...extras], initialLayoutIds: pairs.map(l => l.id),
  spacingProfiles: [160, 280, 440].map(targetUnits => ({ id: `gap-${targetUnits}`, targetUnits, toleranceUnits: 1 })),
});
