import type { GameConfig } from '../domain/config';
import type { WorldPoint } from './contracts';

export const CONTACT_EPSILON = 1e-7;
export const PENETRATION_TOLERANCE = 1e-6;
export const MAX_CONTACT_ITERATIONS = 8;
type Vector = { x: number; y: number };
const dot = (a: Vector, b: Vector) => a.x * b.x + a.y * b.y;
type Hit = { t: number; normal: Vector };

/** Continuous circle sweep against clockwise convex shoreline segments and vertices. */
export function moveHull(position: WorldPoint, displacement: Vector, configuration: GameConfig, radius = configuration.ships.player.hullRadiusUnits): WorldPoint {
  const { widthUnits, heightUnits, islands } = configuration.world;
  let p = { x: position.xUnits, y: position.yUnits }, remaining = { ...displacement };
  for (let iteration = 0; iteration < MAX_CONTACT_ITERATIONS; iteration++) {
    if (Math.hypot(remaining.x, remaining.y) <= CONTACT_EPSILON) break;
    let hit: Hit | undefined;
    const candidate = (t: number, normal: Vector) => {
      if (t < -CONTACT_EPSILON || t > 1 || dot(remaining, normal) >= -CONTACT_EPSILON) return;
      if (!hit || t < hit.t) hit = { t: Math.max(0, t), normal };
    };
    if (remaining.x < 0) candidate((radius - p.x) / remaining.x, { x: 1, y: 0 });
    if (remaining.x > 0) candidate((widthUnits - radius - p.x) / remaining.x, { x: -1, y: 0 });
    if (remaining.y < 0) candidate((radius - p.y) / remaining.y, { x: 0, y: 1 });
    if (remaining.y > 0) candidate((heightUnits - radius - p.y) / remaining.y, { x: 0, y: -1 });
    for (const island of islands) {
      const vertices = island.solidOutline;
      for (let i = 0; i < vertices.length; i++) {
        const vertex = vertices[i]!;
        const a = { x: vertex.xUnits + island.origin.xUnits, y: vertex.yUnits + island.origin.yUnits };
        const next = vertices[(i + 1) % vertices.length]!;
        const edge = { x: next.xUnits + island.origin.xUnits - a.x, y: next.yUnits + island.origin.yUnits - a.y };
        const length = Math.hypot(edge.x, edge.y);
        const normal = { x: edge.y / length, y: -edge.x / length };
        const velocity = dot(remaining, normal);
        if (velocity < -CONTACT_EPSILON) {
          const t = (radius - dot({ x: p.x - a.x, y: p.y - a.y }, normal)) / velocity;
          const along = ((p.x + remaining.x * t - a.x) * edge.x + (p.y + remaining.y * t - a.y) * edge.y) / (length * length);
          if (along >= 0 && along <= 1) candidate(t, normal);
        }
        const offset = { x: p.x - a.x, y: p.y - a.y };
        const quadratic = dot(remaining, remaining), b = dot(offset, remaining);
        const discriminant = b * b - quadratic * (dot(offset, offset) - radius * radius);
        if (discriminant >= 0) {
          const t = (-b - Math.sqrt(discriminant)) / quadratic;
          const nx = offset.x + remaining.x * t, ny = offset.y + remaining.y * t;
          const n = Math.hypot(nx, ny);
          if (n > 0) candidate(t, { x: nx / n, y: ny / n });
        }
      }
    }
    if (!hit) { p = { x: p.x + remaining.x, y: p.y + remaining.y }; break; }
    const contact: Hit = hit;
    // Back off by a distance epsilon, independently of the displacement length.
    const travel = Math.max(0, contact.t - CONTACT_EPSILON / Math.hypot(remaining.x, remaining.y));
    p = { x: p.x + remaining.x * travel, y: p.y + remaining.y * travel };
    remaining = { x: remaining.x * (1 - contact.t), y: remaining.y * (1 - contact.t) };
    const inward = dot(remaining, contact.normal);
    if (inward < 0) remaining = { x: remaining.x - inward * contact.normal.x, y: remaining.y - inward * contact.normal.y };
  }
  return { xUnits: p.x, yUnits: p.y };
}

/** Shared validity assertion for diagnostics/tests; the art envelope is not a solid. */
export function hullIsValid(position: WorldPoint, configuration: GameConfig, radius = configuration.ships.player.hullRadiusUnits): boolean {
  const r = radius, t = PENETRATION_TOLERANCE;
  const { widthUnits, heightUnits, islands } = configuration.world;
  if (position.xUnits < r - t || position.xUnits > widthUnits - r + t || position.yUnits < r - t || position.yUnits > heightUnits - r + t) return false;
  for (const island of islands) {
    let inside = true, minimum = Infinity;
    for (let i = 0; i < island.solidOutline.length; i++) {
      const a = island.solidOutline[i]!, b = island.solidOutline[(i + 1) % island.solidOutline.length]!;
      const x = position.xUnits - island.origin.xUnits - a.xUnits, y = position.yUnits - island.origin.yUnits - a.yUnits;
      const dx = b.xUnits - a.xUnits, dy = b.yUnits - a.yUnits;
      if (dx * y - dy * x < 0) inside = false;
      const projection = Math.max(0, Math.min(1, (x * dx + y * dy) / (dx * dx + dy * dy)));
      minimum = Math.min(minimum, Math.hypot(x - projection * dx, y - projection * dy));
    }
    if (inside || minimum < r - t) return false;
  }
  return true;
}

/** Earliest inclusive circle contact. A stationary overlap is a t=0 impact. */
export function sweepCircle(position: WorldPoint, displacement: Vector, center: WorldPoint, radius: number): number | undefined {
  const offset = { x: position.xUnits - center.xUnits, y: position.yUnits - center.yUnits };
  const distance = dot(offset, offset) - radius * radius;
  if (distance <= CONTACT_EPSILON) return 0;
  const a = dot(displacement, displacement), b = dot(offset, displacement);
  if (a === 0 || b >= 0) return;
  const discriminant = b * b - a * distance;
  if (discriminant < -CONTACT_EPSILON) return;
  const t = (-b - Math.sqrt(Math.max(0, discriminant))) / a;
  if (t >= -CONTACT_EPSILON && t <= 1 + CONTACT_EPSILON) return Math.max(0, Math.min(1, t));
}

/** Same convex faces/vertices as hull navigation, without any slide response. */
export function sweepSolid(position: WorldPoint, displacement: Vector, radius: number, configuration: GameConfig): number | undefined {
  // Projectiles consume an initial touch, even if moving tangent or away.
  // Compensate the validity assertion's penetration allowance before testing touch.
  if (!hullIsValid(position, configuration, radius + PENETRATION_TOLERANCE + CONTACT_EPSILON)) return 0;
  let earliest: number | undefined;
  const candidate = (t: number) => {
    if (t >= -CONTACT_EPSILON && t <= 1 + CONTACT_EPSILON && (earliest === undefined || t < earliest)) earliest = Math.max(0, Math.min(1, t));
  };
  const { widthUnits, heightUnits, islands } = configuration.world;
  if (displacement.x < 0) candidate((radius - position.xUnits) / displacement.x);
  if (displacement.x > 0) candidate((widthUnits - radius - position.xUnits) / displacement.x);
  if (displacement.y < 0) candidate((radius - position.yUnits) / displacement.y);
  if (displacement.y > 0) candidate((heightUnits - radius - position.yUnits) / displacement.y);
  for (const island of islands) {
    for (let i = 0; i < island.solidOutline.length; i++) {
      const vertex = island.solidOutline[i]!, next = island.solidOutline[(i + 1) % island.solidOutline.length]!;
      const a = { xUnits: vertex.xUnits + island.origin.xUnits, yUnits: vertex.yUnits + island.origin.yUnits };
      const edge = { x: next.xUnits - vertex.xUnits, y: next.yUnits - vertex.yUnits };
      const length = Math.hypot(edge.x, edge.y), normal = { x: edge.y / length, y: -edge.x / length };
      const velocity = dot(displacement, normal);
      if (velocity < -CONTACT_EPSILON) {
        const t = (radius - dot({ x: position.xUnits - a.xUnits, y: position.yUnits - a.yUnits }, normal)) / velocity;
        const along = ((position.xUnits + displacement.x * t - a.xUnits) * edge.x + (position.yUnits + displacement.y * t - a.yUnits) * edge.y) / (length * length);
        if (along >= 0 && along <= 1) candidate(t);
      }
      const t = sweepCircle(position, displacement, a, radius);
      if (t !== undefined) candidate(t);
    }
  }
  return earliest;
}
