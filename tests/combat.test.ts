import { expect, it } from 'vitest';
import { createMatchSetup } from '../src/domain/config';
import { HISTORICAL_FINITE_CONFIG as c } from '../src/domain/historicalFiniteConfig';
import type { HistoricalFiniteConfig as GameConfig } from '../src/domain/historicalFiniteConfig';
import { createSimulation } from '../src/simulation/engine';
import { captureCombatData, diagnosticTargets, emitWeapon } from '../src/simulation/combat';
import { hullIsValid, sweepCircle, sweepSolid } from '../src/simulation/collision';
import { NEUTRAL_INPUT } from '../src/simulation/contracts';
import type { InitialCombatData, ProjectileSnapshot, ShipSnapshot, StepInput } from '../src/simulation/contracts';
import { createInputBuffer } from '../src/input/desktop';
import { createNavigationLoop } from '../src/render/navigationLoop';
import { DEFAULT_CONFIG as ocean } from '../src/domain/config';
import { createTerrain } from '../src/simulation/world/terrain';
const setup = createMatchSetup(c, 7);
const fire: StepInput = { ...NEUTRAL_INPUT, fire: { front: true, port: true, starboard: true } };
const enemy = (id = 'victim', archetype: 'chaser' | 'shooter' = 'chaser', xUnits = 480, yUnits = 145): ShipSnapshot => ({ id, archetype, position: { xUnits, yUnits }, headingRadians: 0, health: c.ships[archetype].maxHealth, maxHealth: c.ships[archetype].maxHealth });
const ball = (id = 'ball', patch: Partial<ProjectileSnapshot> = {}): ProjectileSnapshot => ({ id, ownerId: 'player', faction: 'player', damage: 20, radiusUnits: 5, speedUnitsPerSecond: 420, headingRadians: -Math.PI / 2, position: { xUnits: 480, yUnits: 180 }, remainingLifetimeMs: 1200, ...patch });
const run = (sim: ReturnType<typeof createSimulation>, count: number, input = NEUTRAL_INPUT) => { for (let i = 0; i < count; i++) sim.step(input); return sim.inspect(); };

it('resolves first shoreline impact in cold signed terrain and protects the far-side enemy', () => {
  const terrain = createTerrain(ocean, 0), island = terrain.region(-2, -2).islands[0]!;
  const y = island.origin.yUnits + island.heightUnits / 2;
  const initial = { mode: 'stationary-targets' as const, enemies: [enemy('protected', 'shooter', island.origin.xUnits + island.widthUnits + 60, y)],
    projectiles: [ball('fast', { position: { xUnits: island.origin.xUnits - 80, yUnits: y }, headingRadians: 0, speedUnitsPerSecond: 100000 })] };
  const sim = createSimulation(createMatchSetup(ocean, 0), initial);
  sim.terrain.region(50, 50); // evict independently of the requested solid
  sim.step(NEUTRAL_INPUT);
  expect(sim.inspect().projectiles).toHaveLength(0); expect(sim.inspect().enemies[0]!.health).toBe(60);
  expect(sim.events()).toEqual([]);
  const shooter = { ...enemy('muzzle', 'shooter', island.origin.xUnits - 18.0001, y), headingRadians: 0 };
  let n = 0;
  expect(emitWeapon(shooter, 'shooter', ocean, () => `cold-${n++}`, sim.terrain)).toHaveLength(0);
  sim.dispose(); terrain.dispose();
});

it('preserves signed emission and partial lifetime across empty ownership borders', () => {
  const sim = createSimulation(createMatchSetup(ocean, 0), { mode: 'stationary-targets', projectiles: [ball('cross', { position: { xUnits: -1, yUnits: 40 }, headingRadians: 0, speedUnitsPerSecond: 420, remainingLifetimeMs: 50 })] });
  expect(run(sim, 1).projectiles[0]!.position.xUnits).toBeCloseTo(6);
  expect(run(sim, 2).projectiles).toHaveLength(0);
  expect(sim.events().map(e => e.type)).toEqual(['water_hit']);
  const shooter = { ...sim.inspect().player, position: { xUnits: -2000, yUnits: 40 }, headingRadians: 0 };
  expect(emitWeapon(shooter, 'front', ocean, () => 'signed', sim.terrain)[0]!.position.xUnits).toBeLessThan(0);
  sim.dispose();
});

it('captures technical geometry, real archetypes, initial data and default emptiness without a DOM', () => {
  expect('document' in globalThis).toBe(false);
  expect(c.projectiles).toEqual({ radiusUnits: 5, muzzleClearanceUnits: 0.5 });
  expect(Object.isFrozen(c.projectiles)).toBe(true);
  expect(createSimulation(setup).inspect()).toMatchObject({ enemies: [], projectiles: [], score: 0 });
  const data = { enemies: [enemy()], projectiles: [ball()] }, sim = createSimulation(setup, data);
  data.enemies[0] = enemy('changed'); data.projectiles[0] = ball('changed');
  expect(sim.inspect().enemies[0]!.id).toBe('victim'); expect(sim.inspect().projectiles[0]!.id).toBe('ball');
  expect(createSimulation(setup, diagnosticTargets(c)).inspect().enemies.map(e => e.health)).toEqual([40, 60, 60]);
  expect(captureCombatData(diagnosticTargets(c), c)).toEqual(diagnosticTargets(c));
});
it.each([
  { enemies: [enemy('player')] }, { enemies: [enemy(), enemy()] },
  { enemies: [{ ...enemy(), health: 0 }] }, { enemies: [{ ...enemy(), health: 41 }] },
  { enemies: [{ ...enemy(), headingRadians: NaN }] }, { enemies: [enemy('land', 'chaser', 210, 150)] },
  { projectiles: [ball('x', { remainingLifetimeMs: 0 })] }, { projectiles: [ball('x', { speedUnitsPerSecond: Infinity })] },
  { projectiles: [ball('x', { damage: -1 })] }, { projectiles: [ball('x', { radiusUnits: 0 })] },
  { projectiles: [ball('x', { faction: 'enemy' })] }, { projectiles: [ball('x', { ownerId: '' })] },
])('rejects invalid initial data %#', data => expect(() => createSimulation(setup, data as InitialCombatData)).toThrow(RangeError));

it.each([0, Math.PI / 2, Math.PI, -Math.PI / 2, 0.63])('emits parallel broadsides at three longitudinal origins and real heading %s', headingRadians => {
  const ship = { ...createSimulation(setup).inspect().player, headingRadians };
  let id = 0;
  for (const weapon of ['front', 'port', 'starboard'] as const) {
    const balls = emitWeapon(ship, weapon, c, () => String(++id));
    expect(balls).toHaveLength(weapon === 'front' ? 1 : 3);
    const angle = headingRadians + (weapon === 'front' ? 0 : weapon === 'port' ? -Math.PI / 2 : Math.PI / 2);
    balls.forEach((b, i) => {
      expect(Math.cos(b.headingRadians)).toBeCloseTo(Math.cos(angle)); expect(Math.sin(b.headingRadians)).toBeCloseTo(Math.sin(angle));
      const dx = b.position.xUnits - ship.position.xUnits, dy = b.position.yUnits - ship.position.yUnits;
      expect(Math.hypot(dx, dy)).toBeCloseTo(23.5);
      if (weapon !== 'front') expect(dx * Math.cos(headingRadians) + dy * Math.sin(headingRadians)).toBeCloseTo((i - 1) * 14);
    });
  }
});
it('uses navigation position and limited actual turn before simultaneous fire, and moves new balls next step', () => {
  const sim = createSimulation(setup);
  const first = sim.step({ ...fire, steering: { kind: 'target', target: { xUnits: 900, yUnits: 270 } }, toggleAutoSailPressed: true });
  expect(first.projectiles).toHaveLength(7); expect(first.autoSailEnabled).toBe(true);
  expect(first.player.headingRadians).toBeCloseTo(-Math.PI / 2 + Math.PI / 60);
  expect(first.player.position.yUnits).toBeLessThan(270);
  expect(first.projectiles[0]!.remainingLifetimeMs).toBe(1200);
  const second = sim.step(NEUTRAL_INPUT);
  expect(second.projectiles[0]!.remainingLifetimeMs).toBeCloseTo(1200 - c.timing.fixedStepMs);
  expect(second.projectiles[0]!.position).not.toEqual(first.projectiles[0]!.position);
});
it('fires initially and at exact 350/1200ms deadlines, independently of release and repress', () => {
  const sim = createSimulation(setup);
  sim.step(fire); expect(sim.inspect().projectiles).toHaveLength(7);
  run(sim, 20, fire); expect(sim.inspect().cooldownsMs.front).toBeCloseTo(c.timing.fixedStepMs);
  expect(sim.step(fire).cooldownsMs.front).toBeCloseTo(350);
  expect(sim.inspect().cooldownsMs.port).toBeCloseTo(850);
  run(sim, 50, fire); expect(sim.inspect().cooldownsMs.port).toBeCloseTo(c.timing.fixedStepMs);
  expect(sim.step(fire).cooldownsMs.port).toBeCloseTo(1200);
  const other = createSimulation(setup); other.step(fire); run(other, 21); expect(other.inspect().cooldownsMs.front).toBe(0);
  expect(other.step(fire).cooldownsMs.front).toBe(350);
});
it('freezes lifetime/cooldowns/events and drops wall stall through the existing loop', () => {
  const input = createInputBuffer(), callbacks = new Map<number, (t: number) => void>(); let id = 0;
  const loop = createNavigationLoop(setup, input, { request: cb => { callbacks.set(++id, cb); return id; }, cancel: i => { callbacks.delete(i); } }, () => {});
  const frame = (t: number) => { const [i, cb] = [...callbacks][0]!; callbacks.delete(i); cb(t); };
  loop.mount(); input.down(false, 'KeyQ'); frame(0); frame(20); const first = loop.inspect();
  frame(100000); expect(loop.inspect().step - first.step).toBe(5); expect(loop.inspect().cooldownsMs.front).toBeGreaterThan(250);
  loop.freeze(); const paused = loop.inspect(); expect(callbacks.size).toBe(0);
  loop.resume(); frame(200000); expect(loop.inspect().projectiles).toEqual(paused.projectiles);
  frame(201000); expect(loop.inspect().cooldownsMs.front).toBeGreaterThan(150); loop.destroy(); expect(callbacks.size).toBe(0);
});
it('selects earliest global solid/hostile hit independent of candidate ordering, including whole island and corners', () => {
  const a = enemy('near', 'chaser', 480, 145), b = enemy('far', 'shooter', 480, 90);
  for (const enemies of [[a, b], [b, a]]) {
    const sim = createSimulation(setup, { enemies, projectiles: [ball('fast', { damage: 40, speedUnitsPerSecond: 30000, position: { xUnits: 480, yUnits: 250 } })] });
    expect(sim.step(NEUTRAL_INPUT).enemies.map(e => e.id)).toEqual(['far']); expect(sim.inspect().score).toBe(1);
  }
  const target = enemy('protected', 'chaser', 350, 150);
  const sim = createSimulation(setup, { enemies: [target], projectiles: [ball('island', { position: { xUnits: 90, yUnits: 150 }, headingRadians: 0, speedUnitsPerSecond: 30000 })] });
  expect(sim.step(NEUTRAL_INPUT).enemies[0]!.health).toBe(40); expect(sim.inspect().projectiles).toHaveLength(0);
  expect(sweepSolid({ xUnits: 90, yUnits: 150 }, { x: 300, y: 0 }, 5, c)).toBeLessThan(0.2);
  expect(sweepSolid({ xUnits: 10, yUnits: 10 }, { x: -20, y: -20 }, 5, c)).toBeCloseTo(0.25);
  expect(sweepCircle({ xUnits: 0, yUnits: 0 }, { x: 10, y: 0 }, { xUnits: 5, yUnits: 5 }, 5)).toBeCloseTo(0.5);
  const reversed: GameConfig = { ...c, world: { ...c.world, islands: [...c.world.islands].reverse() } };
  expect(sweepSolid({ xUnits: 90, yUnits: 150 }, { x: 900, y: 200 }, 5, c)).toBe(sweepSolid({ xUnits: 90, yUnits: 150 }, { x: 900, y: 200 }, 5, reversed));
});
it('blocks adjacent boundary and shoreline muzzle without refunding cooldown or losing valid side balls', () => {
  const edgeConfig: GameConfig = { ...c, world: { ...c.world, playerStart: { xUnits: 480, yUnits: 18, headingRadians: -Math.PI / 2 } } };
  const sim = createSimulation(createMatchSetup(edgeConfig, 0));
  const snap = sim.step(fire); expect(snap.projectiles).toHaveLength(4); expect(snap.cooldownsMs.front).toBe(350);
  expect(snap.projectiles.every(b => hullIsValid(b.position, edgeConfig, 5))).toBe(true);
  const coast: GameConfig = { ...c, world: { ...c.world, playerStart: { xUnits: 313, yUnits: 150, headingRadians: Math.PI } } };
  const coastal = createSimulation(createMatchSetup(coast, 0)); expect(coastal.step(fire).projectiles.some(p => Math.abs(Math.sin(p.headingRadians)) < 1e-8)).toBe(false);
  // Thin solid lies between valid origin and valid muzzle: endpoint-only would pass.
  const thin: GameConfig = { ...c, world: { ...c.world, playerStart: { ...c.world.playerStart, headingRadians: 0 }, islands: [{ ...c.world.islands[0]!, origin: { xUnits: 498.1, yUnits: 260 }, solidOutline: [{ xUnits: 0, yUnits: 0 }, { xUnits: 0.1, yUnits: 0 }, { xUnits: 0.1, yUnits: 20 }, { xUnits: 0, yUnits: 20 }] }] } };
  expect(hullIsValid({ xUnits: 480, yUnits: 270 }, thin)).toBe(true);
  expect(hullIsValid({ xUnits: 503.5, yUnits: 270 }, thin, 5)).toBe(true);
  expect(sweepSolid({ xUnits: 480, yUnits: 270 }, { x: 23.5, y: 0 }, 5, thin)).toBeDefined();
  const thinSim = createSimulation(createMatchSetup(thin, 0));
  expect(thinSim.step({ ...NEUTRAL_INPUT, fire: { front: true, port: false, starboard: false } })).toMatchObject({ projectiles: [], cooldownsMs: { front: 350 } });
});
it('prioritizes solid at an exact tangent tie and stable enemy ID at equal hull TOI', () => {
  const custom: GameConfig = { ...c, world: { ...c.world, islands: [{ ...c.world.islands[0]!, origin: { xUnits: 600, yUnits: 200 }, solidOutline: [{ xUnits: 0, yUnits: 0 }, { xUnits: 100, yUnits: 0 }, { xUnits: 100, yUnits: 100 }, { xUnits: 0, yUnits: 100 }] }] } };
  const sim = createSimulation(createMatchSetup(custom, 0), { enemies: [enemy('tangent', 'chaser', 600, 174)], projectiles: [ball('tie', { position: { xUnits: 500, yUnits: 195 }, headingRadians: 0, speedUnitsPerSecond: 12000 })] });
  expect(sweepSolid({ xUnits: 650, yUnits: 195 }, { x: 10, y: 0 }, 5, custom)).toBe(0);
  expect(sweepSolid({ xUnits: 650, yUnits: 195 }, { x: 0, y: -10 }, 5, custom)).toBe(0);
  expect(sim.step(NEUTRAL_INPUT).enemies[0]!.health).toBe(40); expect(sim.inspect().projectiles).toHaveLength(0); expect(sim.events()).toEqual([]);
  for (const enemies of [[enemy('a'), enemy('z')], [enemy('z'), enemy('a')]]) {
    const equal = createSimulation(setup, { enemies, projectiles: [ball('tie', { position: { xUnits: 480, yUnits: 170 }, damage: 40 })] });
    expect(equal.step(NEUTRAL_INPUT).enemies.map(e => e.id)).toEqual(['z']);
  }
});
it('uses only partial lifetime and includes the final valid instant', () => {
  const victim = enemy('end', 'chaser', 480, 145);
  const near = ball('partial', { position: { xUnits: 480, yUnits: 167 }, speedUnitsPerSecond: 1000, remainingLifetimeMs: 1 });
  const hit = createSimulation(setup, { enemies: [victim], projectiles: [near] });
  expect(hit.step(NEUTRAL_INPUT).enemies[0]!.health).toBe(20); expect(hit.inspect().projectiles).toHaveLength(0);
  const miss = createSimulation(setup, { enemies: [victim], projectiles: [{ ...near, position: { xUnits: 480, yUnits: 168 } }] });
  expect(miss.step(NEUTRAL_INPUT).enemies[0]!.health).toBe(40); expect(miss.inspect().projectiles).toHaveLength(0);
});
it('ignores allies and crossed balls, preserves provenance after owner dies, and clamps health atomically', () => {
  const owner = enemy('owner', 'shooter', 480, 200), victim = enemy('victim', 'chaser', 480, 145);
  const sim = createSimulation(setup, { enemies: [owner, victim], projectiles: [ball('a', { damage: 60, position: { xUnits: 480, yUnits: 225 } }), ball('b', { faction: 'enemy', ownerId: 'owner', damage: 1000, position: { xUnits: 480, yUnits: 245 }, headingRadians: Math.PI / 2 }), ball('c', { damage: 40, position: { xUnits: 480, yUnits: 170 } }), ball('d', { damage: 40, position: { xUnits: 480, yUnits: 170 } })] });
  const old = sim.inspect(), now = sim.step(fire), events = sim.events();
  expect(now.player.health).toBe(0); expect(now.enemies).toHaveLength(0); expect(now.score).toBe(2); expect(now.autoSailEnabled).toBe(false);
  expect(events.filter(e => e.type === 'destruction')).toHaveLength(3); expect(events.filter(e => e.type === 'score')).toHaveLength(2);
  expect(events.map(e => e.type)).toEqual(['damage','destruction','score','damage','destruction','damage','destruction','score','ended']);
  expect(events.at(-1)).toMatchObject({ type:'ended', reason:'player_destroyed', score:2, step:1 });
  expect(events.find(e => e.type === 'damage' && e.targetId === 'player')).toMatchObject({ sourceId: 'owner', remainingHealth: 0 });
  expect(now.projectiles.map(p => p.id)).toEqual(['d']); // corpse no longer absorbs it
  run(sim, 1); expect(sim.events()).toEqual([]); expect(events.length).toBeGreaterThan(0); expect(old.player.health).toBe(100);
  expect(Object.isFrozen(events[0])).toBe(true); expect(Reflect.set(old.player.position, 'xUnits', 0)).toBe(false);
  const ally = createSimulation(setup, { enemies: [enemy('ally', 'chaser', 480, 230)], projectiles: [ball('enemy-round', { faction: 'enemy', ownerId: 'absent-owner', position: { xUnits: 480, yUnits: 200 }, headingRadians: Math.PI / 2, speedUnitsPerSecond: 6000 }), ball('cross', { position: { xUnits: 450, yUnits: 240 }, headingRadians: 0 })] });
  expect(ally.step(NEUTRAL_INPUT).player.health).toBe(80); expect(ally.inspect().enemies[0]!.health).toBe(40); expect(ally.inspect().projectiles.map(p => p.id)).toEqual(['cross']);
});
it('resolves projectiles before contact, contact once with zero score, shooter harmless, dead player inactive', () => {
  const touching = enemy('contact', 'chaser', 480, 237);
  const saved = createSimulation(setup, { enemies: [touching], projectiles: [ball('save', { position: { xUnits: 480, yUnits: 240 }, damage: 40 })] });
  expect(saved.step(NEUTRAL_INPUT)).toMatchObject({ score: 1, player: { health: 100 }, enemies: [] });
  const contact = createSimulation(setup, { enemies: [touching] });
  expect(contact.step(NEUTRAL_INPUT)).toMatchObject({ score: 0, player: { health: 75 }, enemies: [] }); run(contact, 10); expect(contact.inspect().player.health).toBe(75);
  const shooter = createSimulation(setup, { enemies: [enemy('shooter', 'shooter', 480, 270)] }); expect(shooter.step(NEUTRAL_INPUT).player.health).toBe(100);
  const dead = createSimulation(setup, { enemies: [touching], projectiles: [ball('lethal', { faction: 'enemy', ownerId: 'gone', damage: 100, position: { xUnits: 480, yUnits: 270 } })] });
  const snapshot = dead.step({ ...fire, toggleAutoSailPressed: true, steering: { kind: 'target', target: { xUnits: 900, yUnits: 270 } } });
  expect(snapshot.player).toMatchObject({ health: 0, position: { xUnits: 480, yUnits: 270 }, headingRadians: -Math.PI / 2 });
  expect(snapshot.enemies).toHaveLength(1); expect(snapshot.projectiles).toHaveLength(0); expect(snapshot.score).toBe(0);
});
it('replays a full held combat sequence deterministically with history and freeze preserved', () => {
  const a = createSimulation(setup, diagnosticTargets(c)), b = createSimulation(setup, diagnosticTargets(c));
  for (let i = 0; i < 100; i++) { expect(a.step(fire)).toEqual(b.step(fire)); expect(a.events()).toEqual(b.events()); }
  expect(a.inspect().score).toBe(3); const historic = a.inspect(); a.freeze(); a.step(fire); a.resume();
  expect(a.inspect().activeTimeMs).toBe(historic.activeTimeMs); expect(a.inspect().cooldownsMs).toEqual(historic.cooldownsMs);
});
it('buffers simultaneous attacks and R edges; repeats cannot restore cleared held keys', () => {
  const input = createInputBuffer(); input.point({ xUnits: 600, yUnits: 100 });
  for (const key of ['KeyQ', 'KeyW', 'KeyE', 'KeyR']) input.down(false, key);
  expect(input.consume()).toMatchObject({ fire: fire.fire, toggleAutoSailPressed: true, steering: { kind: 'target' } });
  input.down(true, 'KeyR'); expect(input.consume().toggleAutoSailPressed).toBe(false);
  input.up('KeyW'); expect(input.consume().fire).toEqual({ front: true, port: false, starboard: true });
  input.clear(); input.down(true, 'KeyQ'); input.down(true, 'KeyR'); expect(input.consume()).toEqual(NEUTRAL_INPUT);
});

it('emits decoupled fire events for player and shooter, and water_hit on unhindered expiry', () => {
  const sim = createSimulation(setup);
  sim.step({ ...NEUTRAL_INPUT, fire: { front: true, port: false, starboard: false } });
  const frontFire = sim.events().find(e => e.type === 'fire');
  expect(frontFire).toBeDefined();
  if (frontFire && frontFire.type === 'fire') {
    expect(frontFire.shooterId).toBe('player');
    expect(frontFire.weapon).toBe('front');
    expect(frontFire.positions).toHaveLength(1);
    expect(frontFire.headingRadians).toBeCloseTo(-Math.PI / 2);
  }

  // Broadside fire emits 3 positions
  const simBroadside = createSimulation(setup);
  simBroadside.step({ ...NEUTRAL_INPUT, fire: { front: false, port: true, starboard: true } });
  const fires = simBroadside.events().filter(e => e.type === 'fire');
  expect(fires).toHaveLength(2);
  const portFire = fires.find(f => f.type === 'fire' && f.weapon === 'port');
  const starboardFire = fires.find(f => f.type === 'fire' && f.weapon === 'starboard');
  expect(portFire?.type === 'fire' && portFire.positions).toHaveLength(3);
  expect(starboardFire?.type === 'fire' && starboardFire.positions).toHaveLength(3);

  // water_hit on projectile expiry in open water
  // Fixed step is ~16.666ms (60 fps). A projectile with 20ms lifetime will expire on step 2.
  const waterSim = createSimulation(setup, {
    projectiles: [ball('expiring-ball', { position: { xUnits: 480, yUnits: 200 }, remainingLifetimeMs: 20, speedUnitsPerSecond: 100 })],
  });
  waterSim.step(NEUTRAL_INPUT);
  expect(waterSim.events().some(e => e.type === 'water_hit')).toBe(false);
  waterSim.step(NEUTRAL_INPUT);
  const waterHit = waterSim.events().find(e => e.type === 'water_hit');
  expect(waterHit).toBeDefined();
  if (waterHit && waterHit.type === 'water_hit') {
    expect(waterHit.position.xUnits).toBeCloseTo(480);
    expect(waterHit.position.yUnits).toBeLessThan(200);
  }

  // Projectile hitting enemy or land does NOT emit water_hit
  const hitSim = createSimulation(setup, {
    enemies: [enemy('target', 'chaser', 480, 195)],
    projectiles: [ball('hitting-ball', { position: { xUnits: 480, yUnits: 200 }, remainingLifetimeMs: 20, speedUnitsPerSecond: 600 })],
  });
  hitSim.step(NEUTRAL_INPUT);
  expect(hitSim.events().some(e => e.type === 'water_hit')).toBe(false);
  expect(hitSim.events().some(e => e.type === 'damage')).toBe(true);
});


