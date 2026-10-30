import type { WorldPoint } from '../contracts';
import type { GeneratedIsland, IslandModel, IslandRotation } from './types';

export function rotatedModel(model: IslandModel, rotation: IslandRotation) {
  const w = model.widthUnits, h = model.heightUnits;
  const outline = model.solidOutline.map(p => rotation === 90 ? { xUnits: h - p.yUnits, yUnits: p.xUnits }
    : rotation === 180 ? { xUnits: w - p.xUnits, yUnits: h - p.yUnits }
    : rotation === 270 ? { xUnits: p.yUnits, yUnits: w - p.xUnits } : { ...p });
  return { widthUnits: rotation % 180 ? h : w, heightUnits: rotation % 180 ? w : h, solidOutline: outline };
}
export function pointSegmentDistance(p: WorldPoint, a: WorldPoint, b: WorldPoint): number {
  const dx = b.xUnits - a.xUnits, dy = b.yUnits - a.yUnits;
  const t = Math.max(0, Math.min(1, ((p.xUnits - a.xUnits) * dx + (p.yUnits - a.yUnits) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(p.xUnits - a.xUnits - t * dx, p.yUnits - a.yUnits - t * dy);
}
export function worldOutline(island: Pick<GeneratedIsland, 'origin' | 'solidOutline'>): readonly WorldPoint[] {
  return island.solidOutline.map(p => ({ xUnits: p.xUnits + island.origin.xUnits, yUnits: p.yUnits + island.origin.yUnits }));
}
export function containsPoint(p: WorldPoint, polygon: readonly WorldPoint[]): boolean {
  return polygon.every((a, i) => { const b = polygon[(i + 1) % polygon.length]!; return (b.xUnits - a.xUnits) * (p.yUnits - a.yUnits) - (b.yUnits - a.yUnits) * (p.xUnits - a.xUnits) >= -1e-7; });
}
/** Convex polygons: crossing edges or containment have zero distance. */
export function polygonDistance(a: readonly WorldPoint[], b: readonly WorldPoint[]): number {
  if (containsPoint(a[0]!, b) || containsPoint(b[0]!, a)) return 0;
  let distance = Infinity;
  const cross = (p: WorldPoint, q: WorldPoint, r: WorldPoint) => (q.xUnits - p.xUnits) * (r.yUnits - p.yUnits) - (q.yUnits - p.yUnits) * (r.xUnits - p.xUnits);
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) {
    const p = a[i]!, q = a[(i + 1) % a.length]!, r = b[j]!, s = b[(j + 1) % b.length]!;
    if (cross(p, q, r) * cross(p, q, s) < 0 && cross(r, s, p) * cross(r, s, q) < 0) return 0;
    distance = Math.min(distance, pointSegmentDistance(p, r, s), pointSegmentDistance(r, p, q));
  }
  return distance;
}
