import type { GameConfig } from '../domain/config';
import type { WorldPoint } from './contracts';
import { hullIsValid, moveHull } from './collision';

export const distanceBetween = (a: WorldPoint, b: WorldPoint) => Math.hypot(a.xUnits - b.xUnits, a.yUnits - b.yUnits);
export function segmentIsSafe(a: WorldPoint, b: WorldPoint, radius: number, c: GameConfig): boolean {
  if(!hullIsValid(a,c,radius) || !hullIsValid(b,c,radius))return false;
  const moved=moveHull(a,{x:b.xUnits-a.xUnits,y:b.yUnits-a.yUnits},c,radius);
  return distanceBetween(moved,b)<1e-6;
}
type Graph = { nodes: WorldPoint[]; edges: number[][] };
const graphs = new Map<string, Graph>();
function graphFor(radius: number, c: GameConfig): Graph {
  const key = JSON.stringify([c.world.widthUnits,c.world.heightUnits,c.world.islands,radius,c.navigation.waypointSpacingUnits]);
  const cached = graphs.get(key); if (cached) return cached;
  const nodes: WorldPoint[] = [], edges: number[][] = [], indices = new Map<string, number>();
  const spacing = c.navigation.waypointSpacingUnits;
  for (let y = spacing; y < c.world.heightUnits; y += spacing) for (let x = spacing; x < c.world.widthUnits; x += spacing) {
    const point = { xUnits: x, yUnits: y };
    if (hullIsValid(point, c, radius)) { indices.set(`${x},${y}`, nodes.length); nodes.push(point); edges.push([]); }
  }
  nodes.forEach((node, i) => {
    for (const [dx, dy] of [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]]) {
      const j = indices.get(`${node.xUnits + dx! * spacing},${node.yUnits + dy! * spacing}`);
      if (j !== undefined && segmentIsSafe(node, nodes[j]!, radius, c)) edges[i]!.push(j);
    }
  });
  const graph = { nodes, edges }; graphs.set(key, graph); return graph;
}

/** Deterministic A*, real endpoints, circular sweeps on every edge and shortcut. */
export function findRoute(start: WorldPoint, destination: WorldPoint, hullRadius: number, c: GameConfig): readonly WorldPoint[] {
  const radius = hullRadius;
  if (!hullIsValid(start, c, radius)) return [];
  if (segmentIsSafe(start, destination, radius, c)) return [destination];
  const { nodes, edges } = graphFor(radius + c.navigation.clearanceUnits, c);
  const nearest = (p: WorldPoint) => nodes.map((node, i) => ({ i, d: distanceBetween(node, p) })).sort((a,b) => a.d-b.d || a.i-b.i);
  const starts: {i:number;d:number}[]=[];
  for(const candidate of nearest(start)) {if(segmentIsSafe(start,nodes[candidate.i]!,radius,c))starts.push(candidate);if(starts.length===c.navigation.endpointConnections)break;}
  const validDestination = hullIsValid(destination, c, radius);
  const ends: {i:number;d:number}[]=[];
  for(const candidate of nearest(destination)) {if(validDestination ? segmentIsSafe(nodes[candidate.i]!,destination,radius,c) : candidate.d<=c.navigation.waypointSpacingUnits*2)ends.push(candidate);if(ends.length===c.navigation.endpointConnections)break;}
  const endSet = new Set(ends.map(e => e.i));
  if (!starts.length || !ends.length) return [];
  const costs = new Map<number, number>(), parent = new Map<number, number>(), open = new Set<number>();
  for (const { i, d } of starts) { costs.set(i,d); open.add(i); }
  while (open.size) {
    let current = -1, best = Infinity;
    for (const i of open) { const f = costs.get(i)! + distanceBetween(nodes[i]!, destination); if (f < best || f === best && i < current) { current=i; best=f; } }
    if (endSet.has(current)) {
      const path: WorldPoint[] = validDestination ? [destination] : [];
      let index: number | undefined = current;
      while (index !== undefined) { path.unshift(nodes[index]!); index=parent.get(index); }
      const result: WorldPoint[]=[]; let anchor=start;
      for (let i=0;i<path.length;) { let last=i; for(let j=i+1;j<path.length;j++) if(segmentIsSafe(anchor,path[j]!,radius,c)) last=j; result.push(path[last]!); anchor=path[last]!; i=last+1; }
      return result;
    }
    open.delete(current);
    for (const next of edges[current]!) { const candidate=costs.get(current)!+distanceBetween(nodes[current]!,nodes[next]!); if(candidate < (costs.get(next) ?? Infinity)) { costs.set(next,candidate);parent.set(next,current);open.add(next); } }
  }
  return [];
}
