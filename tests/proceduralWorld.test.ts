import { expect, it } from 'vitest';
import { createMatchSetup, DEFAULT_CONFIG as c } from '../src/domain/config';
import { configurationKey, validateConfiguration } from '../src/domain/validation';
import { createTerrain } from '../src/simulation/world/terrain';
import { generateRegion, regionAt } from '../src/simulation/world/generator';
import { polygonDistance, worldOutline } from '../src/simulation/world/geometry';
import { hullIsValid, moveHull, sweepSolid } from '../src/simulation/collision';
import { createNavigator, segmentIsSafe } from '../src/simulation/navigation';
import { createSimulation } from '../src/simulation/engine';
import { NEUTRAL_INPUT } from '../src/simulation/contracts';
import historicalFixture from './fixtures/finite-arena-v2.json';
import { createRegionalPresentation } from '../src/render/regionalPresentation';

it('validates the complete procedural catalog and frozen finite historical schema independently', () => {
  expect(validateConfiguration(c)).toEqual(c);
  expect(validateConfiguration(historicalFixture)).toEqual(historicalFixture);
  expect(() => validateConfiguration({ ...historicalFixture, world: { ...historicalFixture.world, islands: undefined } })).toThrow();
  expect(() => validateConfiguration({ ...c, world: { ...c.world, borderWaterUnits: 20 } })).toThrow();
  expect(() => validateConfiguration({ ...c, world: { ...c.world, tileSizeUnits: 20 } })).toThrow();
  expect(() => validateConfiguration({ ...c, world: { ...c.world, catalog: [{ ...c.world.catalog[0]!, solidOutline: [{ xUnits: 0, yUnits: 0 }, { xUnits: 160, yUnits: 0 }, { xUnits: 0, yUnits: 120 }] }] } })).toThrow();
  expect(() => validateConfiguration({ ...c, world: { ...c.world, playerStart: { ...c.world.playerStart, xUnits: 100 } } })).toThrow();
  const negative = { ...c, world: { ...c.world, playerStart: { ...c.world.playerStart, xUnits: -800, yUnits: -1010 } } };
  expect(validateConfiguration(negative)).toEqual(negative);
});

it.each([0, 4294967295])('generates signed regions reproducibly with seed %s, unique IDs and safe initial disk', seed => {
  const a = createTerrain(c, seed), b = createTerrain(c, seed);
  const coordinates = Array.from({ length: 25 }, (_, n) => ({ x: n - 12, y: (n % 5) - 2 }));
  const expected = coordinates.map(p => a.region(p.x, p.y));
  const ids = expected.flatMap(r => r.islands.map(i => i.id));
  expect(new Set(ids).size).toBe(ids.length);
  expect(new Set(expected.flatMap(r => r.islands.map(i => i.modelId)))).toEqual(new Set(['compact', 'elongated', 'wide']));
  for (const p of [...coordinates].reverse()) expect(b.region(p.x, p.y)).toEqual(expected[coordinates.indexOf(p)]);
  expect(a.inspect().regions).toBeLessThanOrEqual(8);
  expect(a.region(-12, -2)).toEqual(expected[0]);
  const initial = a.region(0, 0);
  expect(hullIsValid(c.world.playerStart, c, 160, a)).toBe(true);
  for (const island of initial.islands) expect(Reflect.set(island.origin, 'xUnits', 1)).toBe(false);
  a.dispose(); b.dispose();
  expect(a.inspect().regions).toBe(0);
  expect(initial).toEqual(generateRegion(c.world, seed, { x: 0, y: 0 }));
});

it('uses floor and upper-exclusive ownership, including exact negative boundaries', () => {
  expect(regionAt(-0.001, 1280, 1280)).toEqual({ x: -1, y: 1 });
  expect(regionAt(-1280, -1280.001, 1280)).toEqual({ x: -1, y: -2 });
  expect(regionAt(0, 0, 1280)).toEqual({ x: 0, y: 0 });
});

it('measures designated shoreline pairs and verifies every finite layout plus orthogonal and diagonal margins', () => {
  for (const layout of c.world.layouts) {
    // Force each approved layout independently of hash selection.
    const world = { ...c.world, layouts: [layout], initialLayoutIds: [layout.id], playerStart: { ...c.world.playerStart, yUnits: 270 } };
    const islands = generateRegion(world, 0, { x: 2, y: -2 }).islands;
    for (const pair of layout.pairs) {
      const profile = world.spacingProfiles.find(p => p.id === pair.spacingId)!;
      expect(polygonDistance(worldOutline(islands[pair.first]!), worldOutline(islands[pair.second]!))).toBeCloseTo(profile.targetUnits, 6);
    }
    for (const island of islands) for (const p of worldOutline(island)) {
      expect(p.xUnits).toBeGreaterThanOrEqual(2 * 1280 + 80);
      expect(p.xUnits).toBeLessThanOrEqual(3 * 1280 - 80);
      expect(p.yUnits).toBeGreaterThanOrEqual(-2 * 1280 + 80);
      expect(p.yUnits).toBeLessThanOrEqual(-1280 - 80);
    }
  }
});

it('sweeps cold signed regions, leaves former walls open, and retains terrain-independent snapshots and RNG', () => {
  const terrain = createTerrain(c, 0), region = terrain.region(-1, -1), island = region.islands[0]!;
  const start = { xUnits: island.origin.xUnits - 100, yUnits: island.origin.yUnits + island.heightUnits / 2 };
  terrain.dispose();
  const cold = createTerrain(c, 0);
  expect(sweepSolid(start, { x: island.widthUnits + 200, y: 0 }, 5, c, cold)).toBeGreaterThan(0);
  const moved = moveHull(start, { x: island.widthUnits + 200, y: 0 }, c, 18, cold);
  expect(moved.xUnits).toBeLessThan(island.origin.xUnits);
  expect(hullIsValid(moved, c, 18, cold)).toBe(true);
  expect(moveHull({ xUnits: 0, yUnits: 40 }, { x: -30, y: 0 }, c, 18, cold)).toEqual({ xUnits: -30, yUnits: 40 });
  const a = createSimulation(createMatchSetup(c, 0)), b = createSimulation(createMatchSetup(c, 0));
  const originalKey = configurationKey(c), size = JSON.stringify(c).length;
  for (let i = 0; i < 450; i++) {
    a.terrain.region(i - 225, -10);
    a.step(NEUTRAL_INPUT); b.step(NEUTRAL_INPUT);
    expect(a.events()).toEqual(b.events());
  }
  expect(a.inspect()).toEqual(b.inspect());
  expect(configurationKey(c)).toBe(originalKey);
  expect(JSON.stringify(c).length).toBe(size);
  a.dispose(); b.dispose(); cold.dispose();
});

it('reconstructs local graphs on a 20-region round trip and routes both ways through corridors', () => {
  const terrain = createTerrain(c, 0), nav = createNavigator(c, terrain);
  let initialRoute: readonly { xUnits: number; yUnits: number }[] = [];
  for (let x = -10; x < 10; x++) for (const radius of [16, 18]) {
    const island = terrain.region(x, -2).islands[0]!;
    const from = { xUnits: island.origin.xUnits - 40, yUnits: island.origin.yUnits + island.heightUnits / 2 };
    const to = { xUnits: island.origin.xUnits + island.widthUnits + 40, yUnits: from.yUnits };
    for (const [a, b] of [[from, to], [to, from]] as const) {
      const route = nav.findRoute(a, b, radius);
      if (x === -10 && radius === 16 && a === from) initialRoute = route;
      expect(route.length).toBeGreaterThan(0);
      let p = a;
      for (const q of route) { expect(segmentIsSafe(p, q, radius, c, terrain)).toBe(true); p = q; }
      expect(p).toEqual(b);
    }
    expect(nav.inspect().graphs).toBeLessThanOrEqual(8);
  }
  const first = terrain.region(-10, -2).islands[0]!;
  const from = { xUnits: first.origin.xUnits - 40, yUnits: first.origin.yUnits + first.heightUnits / 2 };
  const to = { xUnits: first.origin.xUnits + first.widthUnits + 40, yUnits: from.yUnits };
  expect(nav.findRoute(from, to, 16)).toEqual(initialRoute);
  for (const [start, end] of [[{ xUnits: -1240, yUnits: -1240 }, { xUnits: 1320, yUnits: 1320 }], [{ xUnits: 1320, yUnits: 1320 }, { xUnits: -1240, yUnits: -1240 }]] as const) {
    let p: { xUnits: number; yUnits: number } = start;
    for (let n = 0; n < 12 && (p.xUnits !== end.xUnits || p.yUnits !== end.yUnits); n++) {
      const route = nav.findRoute(p, end, 18);
      expect(route.length).toBeGreaterThan(0);
      for (const q of route) { expect(segmentIsSafe(p, q, 18, c, terrain)).toBe(true); p = q; }
    }
    expect(p).toEqual(end);
  }
  nav.dispose(); terrain.dispose();
  expect(nav.inspect().graphs).toBe(0);
});

it('retains exactly the active terrain plus bounded idle entries and releases previous requirements', () => {
  const terrain = createTerrain(c, 0);
  const areas = Array.from({ length: 20 }, (_, n) => ({ minX: n * 1280 + 40, maxX: n * 1280 + 80, minY: 40, maxY: 80 }));
  terrain.beginStep(areas);
  for (const area of areas) terrain.query(area);
  terrain.endStep();
  expect(terrain.inspect()).toMatchObject({ requiredRegions: 20, regions: 20, idleRegions: 0 });
  for (let x = 50; x < 70; x++) terrain.region(x, 0);
  expect(terrain.inspect()).toMatchObject({ requiredRegions: 20, regions: 28, idleRegions: 8 });
  terrain.beginStep([]); terrain.endStep();
  expect(terrain.inspect()).toMatchObject({ requiredRegions: 0, regions: 8, idleRegions: 8 });
  terrain.dispose(); expect(terrain.inspect()).toMatchObject({ regions: 0, requiredRegions: 0 });
});

it('bounds visual regions across 20 cells, rapid camera changes and revisits without duplicate owners', () => {
  const terrain = createTerrain(c, 0), live = new Set<string>(), seen = new Map<string, unknown>();
  const renderer = createRegionalPresentation(terrain, 1280, region => {
    expect(live.has(region.id)).toBe(false); live.add(region.id);
    if (seen.has(region.id)) expect(region).toEqual(seen.get(region.id)); else seen.set(region.id, region);
    return region.id;
  }, id => { expect(live.delete(id)).toBe(true); });
  for (const x of [...Array.from({ length: 20 }, (_, i) => i - 10), 30, -30, 0, -10]) {
    renderer.update({ minX: x * 1280 + 20, minY: 20, maxX: x * 1280 + 980, maxY: 560 });
    expect(renderer.inspect().regions).toBe(9); expect(live.size).toBe(9);
    expect(terrain.inspect().regions).toBeLessThanOrEqual(8);
  }
  renderer.dispose(); terrain.dispose(); expect(live.size).toBe(0);
});
