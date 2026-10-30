import { isProceduralWorld } from '../domain/config';
import type { GameConfig } from '../domain/config';
import type { WorldPoint } from './contracts';
import { hullIsValid, moveHull } from './collision';
import { createTerrain } from './world/terrain';
import type { Terrain } from './world/terrain';
import { regionAt } from './world/generator';

export const GRAPH_IDLE_CAPACITY = 8;
export const distanceBetween = (a: WorldPoint, b: WorldPoint) => Math.hypot(a.xUnits - b.xUnits, a.yUnits - b.yUnits);
export function segmentIsSafe(a: WorldPoint, b: WorldPoint, radius: number, c: GameConfig, terrain?: Terrain): boolean {
  return hullIsValid(a, c, radius, terrain) && hullIsValid(b, c, radius, terrain)
    && distanceBetween(moveHull(a, { x: b.xUnits - a.xUnits, y: b.yUnits - a.yUnits }, c, radius, terrain), b) < 1e-6;
}
type Graph = { nodes: WorldPoint[]; edges: number[][] };
/** Session-local sparse visibility graphs. A* operates on safe water corners. */
export function createNavigator(c: GameConfig, terrain: Terrain, measureNow?: () => number) {
  const graphs = new Map<string, Graph>();
  let builds = 0, routes = 0, routeMs = 0, disposed = false;
  function graphFor(start: WorldPoint, radius: number): Graph {
    const world = c.world;
    const region = isProceduralWorld(world) ? regionAt(start.xUnits, start.yUnits, world.regionSizeUnits) : { x: 0, y: 0 };
    const key = `${region.x}:${region.y}:${radius}`;
    const cached = graphs.get(key);
    if (cached) { graphs.delete(key); graphs.set(key, cached); return cached; }
    const islands = isProceduralWorld(world) ? terrain.region(region.x, region.y).islands : world.islands;
    const nodes: WorldPoint[] = [], edges: number[][] = [];
    for (const island of islands) {
      const x0 = island.origin.xUnits - radius, y0 = island.origin.yUnits - radius;
      const x1 = island.origin.xUnits + island.widthUnits + radius, y1 = island.origin.yUnits + island.heightUnits + radius;
      for (const [x, y] of [[x0, y0], [(x0 + x1) / 2, y0], [x1, y0], [x1, (y0 + y1) / 2], [x1, y1], [(x0 + x1) / 2, y1], [x0, y1], [x0, (y0 + y1) / 2]]) {
        const p = { xUnits: x!, yUnits: y! };
        if (hullIsValid(p, c, radius, terrain)) { nodes.push(p); edges.push([]); }
      }
    }
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) if (segmentIsSafe(nodes[i]!, nodes[j]!, radius, c, terrain)) { edges[i]!.push(j); edges[j]!.push(i); }
    const graph = { nodes, edges };
    builds++; graphs.set(key, graph);
    while (graphs.size > GRAPH_IDLE_CAPACITY) graphs.delete(graphs.keys().next().value!);
    return graph;
  }
  return {
    findRoute(start: WorldPoint, destination: WorldPoint, hullRadius: number): readonly WorldPoint[] {
      if (disposed) throw new Error('Navigation session disposed.');
      routes++;
      const started = measureNow?.();
      try {
      if (!hullIsValid(start, c, hullRadius, terrain) || !hullIsValid(destination, c, hullRadius, terrain)) return [];
      const world = c.world;
      let target = destination;
      if (isProceduralWorld(world)) {
        const a = regionAt(start.xUnits, start.yUnits, world.regionSizeUnits), b = regionAt(destination.xUnits, destination.yUnits, world.regionSizeUnits);
        const size = world.regionSizeUnits, half = world.borderWaterUnits / 2;
        // Fixed x-before-y descent crosses inside the next cell through its water margin.
        if (a.x !== b.x) target = { xUnits: (a.x + (b.x > a.x ? 1 : 0)) * size + (b.x > a.x ? half : -half), yUnits: a.y * size + half };
        else if (a.y !== b.y) target = { xUnits: a.x * size + half, yUnits: (a.y + (b.y > a.y ? 1 : 0)) * size + (b.y > a.y ? half : -half) };
      }
      if (segmentIsSafe(start, target, hullRadius, c, terrain)) return [target];
      const radius = hullRadius + c.navigation.clearanceUnits;
      const { nodes, edges } = graphFor(start, radius);
      const nearest = (p: WorldPoint) => nodes.map((node, i) => ({ i, d: distanceBetween(node, p) })).sort((a, b) => a.d - b.d || a.i - b.i).filter(v => segmentIsSafe(p, nodes[v.i]!, hullRadius, c, terrain)).slice(0, c.navigation.endpointConnections);
      const starts = nearest(start), ends = new Set(nearest(target).map(v => v.i));
      const costs = new Map<number, number>(), parent = new Map<number, number>(), open = new Set<number>();
      for (const { i, d } of starts) { costs.set(i, d); open.add(i); }
      while (open.size) {
        let current = -1, best = Infinity;
        for (const i of open) { const f = costs.get(i)! + distanceBetween(nodes[i]!, target); if (f < best || f === best && i < current) { current = i; best = f; } }
        if (ends.has(current)) {
          const path: WorldPoint[] = [target];
          let index: number | undefined = current;
          while (index !== undefined) { path.unshift(nodes[index]!); index = parent.get(index); }
          const result: WorldPoint[] = []; let anchor = start;
          for (let i = 0; i < path.length;) { let last = i; for (let j = i + 1; j < path.length; j++) if (segmentIsSafe(anchor, path[j]!, hullRadius, c, terrain)) last = j; result.push(path[last]!); anchor = path[last]!; i = last + 1; }
          return result;
        }
        open.delete(current);
        for (const next of edges[current]!) {
          const cost = costs.get(current)! + distanceBetween(nodes[current]!, nodes[next]!);
          if (cost < (costs.get(next) ?? Infinity)) { costs.set(next, cost); parent.set(next, current); open.add(next); }
        }
      }
      return [];
      } finally { if (started !== undefined) routeMs += measureNow!() - started; }
    },
    inspect: () => Object.freeze({ graphs: graphs.size, capacity: GRAPH_IDLE_CAPACITY, builds, routes, routeMs, timingMeasured: !!measureNow, disposed }),
    dispose() { graphs.clear(); disposed = true; },
  };
}
export type Navigator = ReturnType<typeof createNavigator>;
export function findRoute(start: WorldPoint, destination: WorldPoint, radius: number, c: GameConfig): readonly WorldPoint[] {
  const terrain = createTerrain(c, 0), navigation = createNavigator(c, terrain);
  try { return navigation.findRoute(start, destination, radius); } finally { navigation.dispose(); terrain.dispose(); }
}
