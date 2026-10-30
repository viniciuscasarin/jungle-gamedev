import type { ProceduralWorldDescriptor } from './types';
import { containsPoint, pointSegmentDistance, polygonDistance, rotatedModel, worldOutline } from './geometry';
import { regionAt } from './generator';
import { ISLAND_CATALOG } from './catalog';

const valid: (condition: unknown) => asserts condition = condition => { if (!condition) throw new RangeError('Incompatible procedural catalog or clearance.'); };
export function validateProceduralWorld(world: ProceduralWorldDescriptor, ships: readonly { hullRadiusUnits: number; forwardSpeedUnitsPerSecond: number; turnSpeedRadiansPerSecond: number }[], navigationClearance: number): void {
  const size = world.regionSizeUnits, margin = world.borderWaterUnits;
  const clearance = Math.max(...ships.map(s => Math.max(s.hullRadiusUnits + world.maneuverClearanceUnits, s.hullRadiusUnits + s.forwardSpeedUnitsPerSecond / s.turnSpeedRadiansPerSecond + navigationClearance)));
  valid(size > margin * 2 && margin >= clearance && world.tileSizeUnits === 40 && world.initialWaterRadiusUnits >= clearance);
  valid(world.catalog.length > 0 && world.layouts.length > 0 && world.initialLayoutIds.length > 0 && world.spacingProfiles.length > 0);
  for (const values of [world.catalog, world.layouts, world.spacingProfiles]) valid(new Set(values.map(v => v.id)).size === values.length);
  for (const model of world.catalog) {
    valid(['compact', 'elongated', 'wide'].includes(model.family));
    const approved = ISLAND_CATALOG.find(m => m.family === model.family);
    valid(approved && model.widthUnits === approved.widthUnits && model.heightUnits === approved.heightUnits);
    valid(model.solidOutline.length === approved.solidOutline.length && model.solidOutline.every((p, i) => p.xUnits === approved.solidOutline[i]!.xUnits && p.yUnits === approved.solidOutline[i]!.yUnits));
    valid(model.widthUnits % world.tileSizeUnits === 0 && model.heightUnits % world.tileSizeUnits === 0 && model.widthUnits >= 160 && model.heightUnits >= 120);
    valid(model.rotations.length > 0 && model.rotations.every(r => [0, 90, 180, 270].includes(r)));
    const polygon = model.solidOutline;
    valid(polygon.length >= 3);
    let area = 0;
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i]!, b = polygon[(i + 1) % polygon.length]!;
      valid(a.xUnits >= 0 && a.yUnits >= 0 && a.xUnits <= model.widthUnits && a.yUnits <= model.heightUnits && Math.hypot(a.xUnits - b.xUnits, a.yUnits - b.yUnits) > 1e-9);
      for (const p of polygon) valid((b.xUnits - a.xUnits) * (p.yUnits - a.yUnits) - (b.yUnits - a.yUnits) * (p.xUnits - a.xUnits) >= -1e-7);
      area += a.xUnits * b.yUnits - b.xUnits * a.yUnits;
    }
    valid(area > 0);
  }
  const initialRegion = regionAt(world.playerStart.xUnits, world.playerStart.yUnits, size);
  const start = { xUnits: world.playerStart.xUnits - initialRegion.x * size, yUnits: world.playerStart.yUnits - initialRegion.y * size };
  // Keep the whole start disk in its owner cell: all neighboring layouts are safe too.
  valid(start.xUnits >= world.initialWaterRadiusUnits && start.yUnits >= world.initialWaterRadiusUnits && start.xUnits + world.initialWaterRadiusUnits <= size && start.yUnits + world.initialWaterRadiusUnits <= size);
  valid(world.initialLayoutIds.every(id => world.layouts.some(l => l.id === id)));
  const minimumGap = Math.min(...world.spacingProfiles.map(p => p.targetUnits));
  valid(minimumGap >= clearance * 2 && margin * 2 >= minimumGap);
  for (const p of world.spacingProfiles) valid(p.toleranceUnits > 0 && p.toleranceUnits <= 1);
  for (const layout of world.layouts) {
    valid(layout.slots.length >= 2 && layout.slots.length <= 4 && layout.pairs.length > 0);
    const polygons = layout.slots.map(slot => {
      const model = world.catalog.find(m => m.id === slot.modelId);
      valid(model && model.rotations.includes(slot.rotation));
      const island = { ...rotatedModel(model, slot.rotation), origin: slot.origin };
      const polygon = worldOutline(island);
      valid(polygon.every(p => p.xUnits >= margin && p.yUnits >= margin && p.xUnits <= size - margin && p.yUnits <= size - margin));
      if (world.initialLayoutIds.includes(layout.id)) {
        valid(!containsPoint(start, polygon));
        valid(polygon.every((a, i) => pointSegmentDistance(start, a, polygon[(i + 1) % polygon.length]!) >= world.initialWaterRadiusUnits));
      }
      return polygon;
    });
    // Disjoint, strictly convex inflated obstacles entirely inside a rectangle cannot
    // enclose a water pocket. The free outer corridor connects all boundary portals.
    for (let i = 0; i < polygons.length; i++) for (let j = i + 1; j < polygons.length; j++) valid(polygonDistance(polygons[i]!, polygons[j]!) >= minimumGap - 1e-7);
    for (const pair of layout.pairs) {
      const profile = world.spacingProfiles.find(p => p.id === pair.spacingId);
      valid(profile && Number.isSafeInteger(pair.first) && Number.isSafeInteger(pair.second) && pair.first !== pair.second && polygons[pair.first] && polygons[pair.second]);
      valid(Math.abs(polygonDistance(polygons[pair.first]!, polygons[pair.second]!) - profile.targetUnits) <= profile.toleranceUnits);
    }
  }
}
