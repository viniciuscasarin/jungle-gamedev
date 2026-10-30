import type { Terrain } from '../simulation/world/terrain';
import { regionsIn } from '../simulation/world/terrain';
import type { GeneratedRegion, WorldAabb } from '../simulation/world/types';

/** Only the visible rectangle plus one full ownership cell has display objects. */
export function createRegionalPresentation<Node>(terrain: Terrain, size: number, build: (region: GeneratedRegion) => Node, release: (node: Node) => void) {
  const nodes = new Map<string, Node>();
  let builds = 0, peakRegions = 0;
  let previousRange: readonly number[] | undefined;
  return {
    update(bounds: WorldAabb) {
      const range = [Math.floor((bounds.minX - size) / size), Math.floor((bounds.minY - size) / size), Math.floor((bounds.maxX + size) / size), Math.floor((bounds.maxY + size) / size)];
      if (bounds.minX <= bounds.maxX && bounds.minY <= bounds.maxY && previousRange?.every((value, index) => value === range[index])) return;
      const regions = regionsIn({ minX: bounds.minX - size, minY: bounds.minY - size, maxX: bounds.maxX + size, maxY: bounds.maxY + size }, size);
      const required = new Set(regions.map(p => `${p.x}:${p.y}`));
      for (const [id, node] of nodes) if (!required.has(id)) { release(node); nodes.delete(id); }
      for (const p of regions) {
        const id = `${p.x}:${p.y}`;
        if (!nodes.has(id)) { nodes.set(id, build(terrain.region(p.x, p.y))); builds++; }
      }
      peakRegions = Math.max(peakRegions, nodes.size);
      previousRange = range;
    },
    inspect: () => Object.freeze({ regions: nodes.size, builds, peakRegions }),
    dispose() { for (const node of nodes.values()) release(node); nodes.clear(); previousRange = undefined; },
  };
}
