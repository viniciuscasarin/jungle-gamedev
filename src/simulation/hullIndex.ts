import type { ShipSnapshot, WorldPoint } from './contracts';

/** Exact broad phase only; ordering and narrow-phase rules remain authoritative. */
export function createHullIndex(ships: readonly ShipSnapshot[]) {
  const cells = new Map<string, Map<string, ShipSnapshot>>(), positions = new Map<string, string>();
  const order = new Map(ships.map((s, i) => [s.id, i]));
  const cell = (p: WorldPoint) => `${Math.floor(p.xUnits / 128)}:${Math.floor(p.yUnits / 128)}`;
  const remove = (id: string) => {
    const key = positions.get(id); if (key === undefined) return;
    const bucket = cells.get(key)!; bucket.delete(id); if (!bucket.size) cells.delete(key);
    positions.delete(id);
  };
  const update = (ship: ShipSnapshot) => {
    const key = cell(ship.position), previous = positions.get(ship.id);
    if (key !== previous) remove(ship.id);
    let bucket = cells.get(key); if (!bucket) { bucket = new Map(); cells.set(key, bucket); }
    bucket.set(ship.id, ship); positions.set(ship.id, key);
  };
  for (const ship of ships) update(ship);
  return {
    update, remove, has: (id: string) => positions.has(id),
    near(p: WorldPoint, padding: number, exclude: string): ShipSnapshot[] {
      const result: ShipSnapshot[] = [];
      for (let y = Math.floor((p.yUnits - padding) / 128); y <= Math.floor((p.yUnits + padding) / 128); y++) for (let x = Math.floor((p.xUnits - padding) / 128); x <= Math.floor((p.xUnits + padding) / 128); x++) {
        for (const ship of cells.get(`${x}:${y}`)?.values() ?? []) if (ship.id !== exclude && Math.abs(ship.position.xUnits - p.xUnits) <= padding && Math.abs(ship.position.yUnits - p.yUnits) <= padding) result.push(ship);
      }
      return result.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
    },
  };
}
