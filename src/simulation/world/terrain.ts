import { isProceduralWorld } from '../../domain/config';
import type { GameConfig } from '../../domain/config';
import type { WorldPoint } from '../contracts';
import { generateRegion, regionAt } from './generator';
import type { GeneratedRegion, WorldAabb } from './types';

export const TERRAIN_IDLE_CAPACITY = 8;
export function sweptAabb(p: WorldPoint, displacement: { x: number; y: number }, radius: number): WorldAabb {
  return { minX: Math.min(p.xUnits, p.xUnits + displacement.x) - radius, minY: Math.min(p.yUnits, p.yUnits + displacement.y) - radius,
    maxX: Math.max(p.xUnits, p.xUnits + displacement.x) + radius, maxY: Math.max(p.yUnits, p.yUnits + displacement.y) + radius };
}
export function regionsIn(area: WorldAabb, size: number) {
  if (![area.minX, area.minY, area.maxX, area.maxY].every(Number.isFinite) || area.minX > area.maxX || area.minY > area.maxY) throw new RangeError('Invalid terrain query.');
  const low = regionAt(area.minX, area.minY, size), high = regionAt(area.maxX, area.maxY, size);
  const result = [];
  for (let y = low.y; y <= high.y; y++) for (let x = low.x; x <= high.x; x++) result.push({ x, y });
  return result;
}
export function createTerrain(configuration: GameConfig, seed: number, measureNow?: () => number) {
  const cache = new Map<string, GeneratedRegion>();
  let required = new Set<string>(), queryingStep = false;
  const trim = () => {
    let idle = [...cache.keys()].filter(key => !required.has(key));
    while (idle.length > TERRAIN_IDLE_CAPACITY) { cache.delete(idle[0]!); idle = idle.slice(1); }
  };
  let generations = 0, peakRegions = 0, generationMs = 0, disposed = false;
  const region = (x: number, y: number): GeneratedRegion => {
    if (disposed) throw new Error('Terrain session disposed.');
    if (!isProceduralWorld(configuration.world)) throw new Error('Finite world has no regions.');
    const key = `${x}:${y}`, previous = cache.get(key);
    if (queryingStep) required.add(key);
    if (previous) {
      if (!required.has(key)) { cache.delete(key); cache.set(key, previous); }
      return previous;
    }
    cache.delete(key);
    const started = !previous ? measureNow?.() : undefined;
    const data = previous ?? generateRegion(configuration.world, seed, { x, y });
    if (!previous) { generations++; if (started !== undefined) generationMs += measureNow!() - started; }
    cache.set(key, data);
    trim();
    peakRegions = Math.max(peakRegions, cache.size);
    return data;
  };
  return {
    region,
    beginStep(areas: readonly WorldAabb[]) {
      const world = configuration.world;
      required = new Set(isProceduralWorld(world) ? areas.flatMap(area => regionsIn(area, world.regionSizeUnits).map(p => `${p.x}:${p.y}`)) : []);
      queryingStep = true; trim();
    },
    endStep() { queryingStep = false; trim(); },
    query(area: WorldAabb) {
      const world = configuration.world;
      if (!isProceduralWorld(world)) return [...world.islands].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
      const islands = regionsIn(area, world.regionSizeUnits).flatMap(p => region(p.x, p.y).islands);
      return islands.filter(i => i.origin.xUnits <= area.maxX && i.origin.xUnits + i.widthUnits >= area.minX && i.origin.yUnits <= area.maxY && i.origin.yUnits + i.heightUnits >= area.minY).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    },
    inspect: () => Object.freeze({ regions: cache.size, requiredRegions: required.size, idleRegions: [...cache.keys()].filter(key => !required.has(key)).length, capacity: TERRAIN_IDLE_CAPACITY, generations, peakRegions, generationMs, timingMeasured: !!measureNow, disposed }),
    dispose() { cache.clear(); required.clear(); disposed = true; },
  };
}
export type Terrain = ReturnType<typeof createTerrain>;
/** Stateless fallback for explicit geometry consumers; gameplay supplies its session. */
export function querySolids(c: GameConfig, area: WorldAabb, terrain?: Terrain) {
  if (terrain) return terrain.query(area);
  const temporary = createTerrain(c, 0);
  const result = temporary.query(area);
  temporary.dispose();
  return result;
}
