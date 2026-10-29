import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, createMatchSetup } from '../src/domain/config';
import { createSimulation } from '../src/simulation/engine';
import { NEUTRAL_INPUT } from '../src/simulation/contracts';
import type { StepInput } from '../src/simulation/contracts';

describe('simulation engine - determinism and immutability', () => {
  it('produces identical states step-by-step for identical seed and setup', () => {
    const setup1 = createMatchSetup(DEFAULT_CONFIG, 42);
    const setup2 = createMatchSetup(DEFAULT_CONFIG, 42);
    const sim1 = createSimulation(setup1);
    const sim2 = createSimulation(setup2);

    const inputs: StepInput[] = [
      NEUTRAL_INPUT,
      { ...NEUTRAL_INPUT, movementRequested: true },
      { ...NEUTRAL_INPUT, fire: { front: true, port: false, starboard: false } },
      { ...NEUTRAL_INPUT, steering: { kind: 'direction', x: 1, y: 0 } },
      NEUTRAL_INPUT,
    ];

    for (const input of inputs) {
      sim1.step(input);
      sim2.step(input);
      expect(sim1.inspect()).toEqual(sim2.inspect());
    }
  });

  it('preserves immutable snapshots on inspect() boundary', () => {
    const setup = createMatchSetup(DEFAULT_CONFIG, 12345);
    const sim = createSimulation(setup);

    const initial = sim.inspect();
    expect(Object.isFrozen(initial)).toBe(true);
    expect(Object.isFrozen(initial.player)).toBe(true);
    expect(Object.isFrozen(initial.player.position)).toBe(true);
    expect(Object.isFrozen(initial.enemies)).toBe(true);
    expect(Object.isFrozen(initial.projectiles)).toBe(true);
    expect(Object.isFrozen(initial.cooldownsMs)).toBe(true);

    // Attempt mutation
    expect(Reflect.set(initial.player.position, 'xUnits', 999)).toBe(false);
    expect(initial.player.position.xUnits).toBe(DEFAULT_CONFIG.world.playerStart.xUnits);

    // Advance 10 steps
    for (let i = 0; i < 10; i++) {
      sim.step({ ...NEUTRAL_INPUT, movementRequested: true });
    }

    // Historical inspected snapshot must remain completely unchanged
    expect(initial.step).toBe(0);
    expect(initial.player.position.yUnits).toBe(DEFAULT_CONFIG.world.playerStart.yUnits);

    const advanced = sim.inspect();
    expect(advanced.step).toBe(10);
    expect(advanced.player.position.yUnits).not.toBe(initial.player.position.yUnits);
    expect(Object.isFrozen(advanced)).toBe(true);
    expect(Object.isFrozen(advanced.player.position)).toBe(true);
  });

  it('caches frozen snapshot for repeated inspect() without intermediate steps', () => {
    const setup = createMatchSetup(DEFAULT_CONFIG, 999);
    const sim = createSimulation(setup);

    const snap1 = sim.inspect();
    const snap2 = sim.inspect();
    expect(snap1).toBe(snap2); // Exactly same reference

    sim.step(NEUTRAL_INPUT);
    const snap3 = sim.inspect();
    expect(snap3).not.toBe(snap1);
  });

  it('preserves immutable events on events() boundary', () => {
    const setup = createMatchSetup(DEFAULT_CONFIG, 100);
    const sim = createSimulation(setup);

    sim.step({ ...NEUTRAL_INPUT, fire: { front: true, port: false, starboard: false } });
    const events = sim.events();
    expect(events.length).toBeGreaterThan(0);
    expect(Object.isFrozen(events)).toBe(true);
    expect(Object.isFrozen(events[0])).toBe(true);

    const events2 = sim.events();
    expect(events).toBe(events2); // Cached
  });
});
