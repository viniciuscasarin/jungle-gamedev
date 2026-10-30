import type { ShipSnapshot } from '../simulation/contracts';
import type { WorldAabb } from '../simulation/world/types';
/** Rotated visual bounds include ships partially entering the camera. */
export function shipIsVisible(ship: ShipSnapshot, bounds: WorldAabb): boolean {
  const c = Math.abs(Math.cos(ship.headingRadians)), s = Math.abs(Math.sin(ship.headingRadians));
  const halfWidth = c * 28.25 + s * 16.5, halfHeight = s * 28.25 + c * 16.5;
  return ship.position.xUnits + halfWidth >= bounds.minX && ship.position.xUnits - halfWidth <= bounds.maxX
    && ship.position.yUnits + halfHeight >= bounds.minY && ship.position.yUnits - halfHeight <= bounds.maxY;
}
/** Screen minimums are converted once to world units; bars never inherit hull rotation. */
export function healthBarGeometry(ship: ShipSnapshot, scale: number, worldWidth: number, worldHeight: number, left = 0, top = 0) {
  const width = Math.min(worldWidth, Math.max(36, 24 / Math.max(scale, 0.001)));
  const height = Math.min(worldHeight, Math.max(5, 4 / Math.max(scale, 0.001)));
  return {x: Math.max(left, Math.min(left + worldWidth - width, ship.position.xUnits - width / 2)),
    y: Math.max(top, Math.min(top + worldHeight - height, ship.position.yUnits - 38 - height)), width, height,
    fraction: Number.isFinite(ship.health / ship.maxHealth) ? Math.max(0, Math.min(1, ship.health / ship.maxHealth)) : 0, rotation: 0};
}
