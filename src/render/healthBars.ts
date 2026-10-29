import type { ShipSnapshot } from '../simulation/contracts';
/** Screen minimums are converted once to world units; bars never inherit hull rotation. */
export function healthBarGeometry(ship: ShipSnapshot, scale: number, worldWidth: number, worldHeight: number) {
  const width = Math.min(worldWidth, Math.max(36, 24 / Math.max(scale, 0.001)));
  const height = Math.min(worldHeight, Math.max(5, 4 / Math.max(scale, 0.001)));
  return {x: Math.max(0, Math.min(worldWidth - width, ship.position.xUnits - width / 2)),
    y: Math.max(0, Math.min(worldHeight - height, ship.position.yUnits - 38 - height)), width, height,
    fraction: Number.isFinite(ship.health / ship.maxHealth) ? Math.max(0, Math.min(1, ship.health / ship.maxHealth)) : 0, rotation: 0};
}
