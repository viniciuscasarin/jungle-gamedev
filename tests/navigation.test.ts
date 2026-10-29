import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, createMatchSetup } from '../src/domain/config';
import { createSimulation, normalizeAngle } from '../src/simulation/engine';
import { createAccumulator } from '../src/simulation/accumulator';
import { NEUTRAL_INPUT } from '../src/simulation/contracts';
import { hullIsValid, moveHull } from '../src/simulation/collision';
import { createInputBuffer, pointerTarget } from '../src/input/desktop';
import { fitViewport } from '../src/render/viewport';
import { createNavigationLoop } from '../src/render/navigationLoop';
import type { StepInput } from '../src/simulation/contracts';
const setup = createMatchSetup(DEFAULT_CONFIG, 123);
const target = (xUnits: number, yUnits: number, toggleAutoSailPressed = false): StepInput => ({ ...NEUTRAL_INPUT, steering: { kind: 'target', target: { xUnits, yUnits } }, toggleAutoSailPressed });

it('initializes explicitly and preserves deeply immutable historical snapshots and neutral events', () => {
  const a = createSimulation(setup), b = createSimulation(setup), initial = a.inspect();
  expect(initial).toMatchObject({ step: 0, activeTimeMs: 0, state: 'playing', autoSailEnabled: false, score: 0, enemies: [], projectiles: [], player: { position: { xUnits: 480, yUnits: 270 }, health: 100, headingRadians: -Math.PI / 2 } });
  for (let i = 0; i < 100; i++) { a.step(target(900, 270, i === 0)); b.step(target(900, 270, i === 0)); }
  expect(a.inspect()).toEqual(b.inspect()); expect(a.events()).toEqual([]);
  expect(initial.step).toBe(0); expect(initial.player.position.xUnits).toBe(480);
  expect(Object.isFrozen(initial.player.position)).toBe(true); expect(Object.isFrozen(a.events())).toBe(true);
  expect(() => Object.assign(initial.player.position, { xUnits: 1 })).toThrow();
});
it('retains heading without target, at and inside deadzone; turns outside by finite shortest arc', () => {
  for (const distance of [11.999, 12]) { const sim = createSimulation(setup); sim.step(target(480 + distance, 270)); expect(sim.inspect().player.headingRadians).toBe(-Math.PI / 2); }
  const sim = createSimulation(setup); sim.step(NEUTRAL_INPUT); sim.step(target(492.001, 270));
  expect(sim.inspect().player.headingRadians).toBeCloseTo(-Math.PI / 2 + Math.PI / 60, 12);
  expect(sim.inspect().player.position).toEqual({ xUnits: 480, yUnits: 270 });
  expect(normalizeAngle(-Math.PI)).toBe(Math.PI); expect(normalizeAngle(-Math.PI + .01 - (Math.PI - .01))).toBeCloseTo(.02);
  const moving = createSimulation(setup); moving.step({ ...NEUTRAL_INPUT, toggleAutoSailPressed: true });
  expect(moving.inspect().player.position.yUnits).toBe(267.5);
  moving.step({ ...NEUTRAL_INPUT, toggleAutoSailPressed: true }); expect(moving.inspect().player.position.yUnits).toBe(267.5);
});
it('chooses positive half-turn tie and wraps across pi using the shortest arc', () => {
  const configuration = { ...DEFAULT_CONFIG, world: { ...DEFAULT_CONFIG.world, playerStart: { xUnits: 480, yUnits: 270, headingRadians: Math.PI - .01 } } };
  const sim = createSimulation(createMatchSetup(configuration, 0)); sim.step(target(380, 269));
  expect(Math.abs(normalizeAngle(sim.inspect().player.headingRadians - (Math.PI - .01)))).toBeLessThanOrEqual(Math.PI / 60 + 1e-10);
  const tie = createSimulation(setup); tie.step(target(480, 400)); expect(tie.inspect().player.headingRadians).toBeCloseTo(-Math.PI / 2 + Math.PI / 60);
});
it('produces identical authoritative steps at 30/60/120/144Hz and drops whole stalled backlog', () => {
  const results = [30, 60, 120, 144].map(fps => {
    const sim = createSimulation(setup), clock = createAccumulator(1000 / 60, 5);
    for (let frame = 0; frame < fps * 2; frame++) clock.advance(1000 / fps, () => sim.step(target(960, 270, sim.inspect().step === 0)));
    return sim.inspect();
  });
  for (const result of results) { expect(result.step).toBe(120); expect(result).toEqual(results[0]); }
  const clock = createAccumulator(1000 / 60, 5); let steps = 0;
  for (const dt of [-1, NaN, Infinity]) expect(clock.advance(dt, () => steps++)).toBe(0);
  expect(clock.advance(10000 + 7, () => steps++)).toBe(5); expect(clock.inspect()).toBeCloseTo(7);
  expect(clock.advance(0, () => steps++)).toBe(0); expect(steps).toBe(5);
});
describe('continuous circle and actual shoreline geometry', () => {
  for (const island of DEFAULT_CONFIG.world.islands) {
    it(`sweeps and slides past every edge and vertex of ${island.id}, without tunnelling`, () => {
      const ox = island.origin.xUnits, oy = island.origin.yUnits;
      const front = moveHull({ xUnits: ox - 80, yUnits: oy + 60 }, { x: 1000, y: 0 }, DEFAULT_CONFIG);
      expect(front.xUnits).toBeLessThan(ox); expect(hullIsValid(front, DEFAULT_CONFIG)).toBe(true);
      for (let i = 0; i < island.solidOutline.length; i++) {
        const a = island.solidOutline[i]!, b = island.solidOutline[(i + 1) % island.solidOutline.length]!;
        const dx = b.xUnits - a.xUnits, dy = b.yUnits - a.yUnits, length = Math.hypot(dx, dy), nx = dy / length, ny = -dx / length;
        const start = { xUnits: ox + (a.xUnits + b.xUnits) / 2 + nx * 30, yUnits: oy + (a.yUnits + b.yUnits) / 2 + ny * 30 };
        const contact = moveHull(start, { x: -nx * 100, y: -ny * 100 }, DEFAULT_CONFIG);
        expect(hullIsValid(contact, DEFAULT_CONFIG)).toBe(true);
        const tangent = moveHull(contact, { x: dx / length * 4, y: dy / length * 4 }, DEFAULT_CONFIG);
        expect(hullIsValid(tangent, DEFAULT_CONFIG)).toBe(true);
        expect(Math.hypot(tangent.xUnits - contact.xUnits, tangent.yUnits - contact.yUnits)).toBeGreaterThan(3.9);
        const away = moveHull(contact, { x: nx * 4, y: ny * 4 }, DEFAULT_CONFIG); expect(hullIsValid(away, DEFAULT_CONFIG)).toBe(true);
        let repeated = contact;
        for (let n = 0; n < 20; n++) { repeated = moveHull(repeated, { x: -nx * 3 + dy / length, y: -ny * 3 - dx / length }, DEFAULT_CONFIG); expect(hullIsValid(repeated, DEFAULT_CONFIG)).toBe(true); }
        const vx = ox + a.xUnits, vy = oy + a.yUnits;
        const from = { xUnits: vx + nx * 40, yUnits: vy + ny * 40 };
        if (hullIsValid(from, DEFAULT_CONFIG)) expect(hullIsValid(moveHull(from, { x: -nx * 100, y: -ny * 100 }, DEFAULT_CONFIG), DEFAULT_CONFIG)).toBe(true);
      }
    });
  }
  it('contains all four world edges and two simultaneous corner normals', () => {
    for (const [x, y] of [[-10000, 0], [10000, 0], [0, -10000], [0, 10000], [-10000, -10000], [10000, 10000]]) {
      const result = moveHull({ xUnits: 480, yUnits: 270 }, { x: x!, y: y! }, DEFAULT_CONFIG); expect(hullIsValid(result, DEFAULT_CONFIG)).toBe(true);
    }
    const corner = moveHull({ xUnits: 18, yUnits: 18 }, { x: -10, y: -20 }, DEFAULT_CONFIG); expect(corner).toEqual({ xUnits: 18, yUnits: 18 });
    expect(moveHull(corner, { x: 5, y: 0 }, DEFAULT_CONFIG)).toEqual({ xUnits: 23, yUnits: 18 });
  });
  it('runs long authoritative steering/contact trajectories with constant health at each step', () => {
    const sim = createSimulation(setup, {mode: 'stationary-targets'});
    for (const [x, y] of [[180, 160], [90, 50], [350, 50], [350, 260], [90, 260], [600, 280], [860, 280], [860, 490], [600, 490], [600, 280]]) {
      for (let i = 0; i < 200; i++) { const snapshot = sim.step(target(x!, y!, sim.inspect().step === 0)); expect(hullIsValid(snapshot.player.position, DEFAULT_CONFIG)).toBe(true); expect(snapshot.player.health).toBe(100); expect(sim.events()).toEqual([]); }
    }
  });
});
it('queues R edges across zero and multiple steps; ignores repeats and duplicate downs; clears all commands', () => {
  const input = createInputBuffer(); input.down(false); input.down(true); input.down(false);
  input.up(); input.down(false); expect(input.consume().toggleAutoSailPressed).toBe(true); expect(input.consume().toggleAutoSailPressed).toBe(true); expect(input.consume().toggleAutoSailPressed).toBe(false);
  input.point({ xUnits: 33, yUnits: 44 }); input.up(); input.down(false); input.clear(); expect(input.consume()).toEqual(NEUTRAL_INPUT);
});
it('converts current CSS origin and letterbox with clamp, preserving logical stored target on resize/DPR/leave', () => {
  const viewport = fitViewport(1200, 900, 960, 540), origin = { left: 20, top: 30 };
  if (!viewport.renderable) throw new Error('viewport');
  const input = createInputBuffer(); input.point(pointerTarget(origin.left + viewport.offsetX + 40 * viewport.scale, origin.top + viewport.offsetY + 50 * viewport.scale, origin, viewport, 960, 540)!);
  expect(input.inspect()).toEqual({ xUnits: 40, yUnits: 50 });
  fitViewport(320, 568, 960, 540); expect(input.inspect()).toEqual({ xUnits: 40, yUnits: 50 });
  expect(pointerTarget(-999, 9999, origin, viewport, 960, 540)).toEqual({ xUnits: 0, yUnits: 540 });
  expect(pointerTarget(1, 2, origin, { renderable: false }, 960, 540)).toBeUndefined();
});
it('only mounts one RAF, freezes immediately, resumes with a new baseline and destroys idempotently', () => {
  const callbacks = new Map<number, (t: number) => void>(); let id = 0;
  const input = createInputBuffer();
  const loop = createNavigationLoop(setup, input, { request: cb => { callbacks.set(++id, cb); return id; }, cancel: key => { callbacks.delete(key); } }, () => {});
  const frame = (time: number) => { const [key, cb] = [...callbacks][0]!; callbacks.delete(key); cb(time); };
  expect(callbacks.size).toBe(0); loop.mount(); loop.mount(); expect(callbacks.size).toBe(1);
  input.down(false); frame(100); frame(120); expect(loop.inspect().autoSailEnabled).toBe(true);
  loop.freeze(); const paused = loop.inspect(); expect(callbacks.size).toBe(0); expect(paused.autoSailEnabled).toBe(false);
  loop.resume(); frame(100000); expect(loop.inspect().step).toBe(paused.step); frame(100020); expect(loop.inspect().player.position).toEqual(paused.player.position);
  loop.destroy(); loop.destroy(); expect(callbacks.size).toBe(0);
});
