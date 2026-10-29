import { describe, expect, it } from 'vitest';
import { Container, Sprite, Texture } from 'pixi.js';
import { createBattleEffects } from '../src/render/battleEffects';
import type { ShipSnapshot, SimulationEvent } from '../src/simulation/contracts';

function createFixture(isReducedMotion = () => false) {
  const parent = new Container();
  const getTexture = () => Texture.EMPTY;
  const effects = createBattleEffects({
    parent,
    getTexture,
    isReducedMotion,
  });
  return { parent, effects };
}

const dummyShip = (id: string, health: number, maxHealth = 100): ShipSnapshot => ({
  id,
  archetype: 'chaser',
  position: { xUnits: 100, yUnits: 100 },
  headingRadians: 0,
  health,
  maxHealth,
});

describe('battleEffects', () => {
  it('starts with zero active effects and cleans up on destroy', () => {
    const { effects } = createFixture();
    expect(effects.getActiveEffectCount()).toBe(0);
    effects.destroy();
    expect(effects.getActiveEffectCount()).toBe(0);
  });

  it('spawns muzzle flashes on fire event', () => {
    const { effects } = createFixture();
    const event: SimulationEvent = {
      step: 1,
      activeTimeMs: 16,
      type: 'fire',
      shooterId: 'player',
      weapon: 'port',
      positions: [
        { xUnits: 100, yUnits: 100 },
        { xUnits: 100, yUnits: 114 },
        { xUnits: 100, yUnits: 128 },
      ],
      headingRadians: -Math.PI / 2,
    };

    effects.handleEvents([event], new Map());
    expect(effects.getActiveEffectCount()).toBe(3);

    // After 150ms of active update, muzzle flashes expire (lifetime ~100ms)
    effects.update(150, false);
    expect(effects.getActiveEffectCount()).toBe(0);
  });

  it('spawns debris on damage, and explosions with sinking ships on destruction', () => {
    const { effects } = createFixture();
    const ship = dummyShip('victim', 40);
    const shipsById = new Map([['victim', ship]]);

    // Damage event spawns debris
    effects.handleEvents(
      [{ step: 1, activeTimeMs: 16, type: 'damage', targetId: 'victim', sourceId: 'player', amount: 20, remainingHealth: 20 }],
      shipsById,
    );
    expect(effects.getActiveEffectCount()).toBeGreaterThanOrEqual(2);

    // Destruction event spawns explosion + debris + sinking ship
    effects.handleEvents(
      [{ step: 2, activeTimeMs: 32, type: 'destruction', entityId: 'victim', sourceId: 'player', cause: 'projectile' }],
      shipsById,
    );
    expect(effects.getActiveEffectCount()).toBeGreaterThan(5);
  });

  it('modulates ship hull tint and attaches fire overlay only at critical health', () => {
    const { effects } = createFixture();
    const sprite = new Sprite(Texture.EMPTY);

    // Healthy (>60%)
    effects.updateShipVisualState('player', sprite, 100, 100, { xUnits: 0, yUnits: 0 }, 0);
    expect(sprite.tint).toBe(0xffffff);
    expect(effects.getActiveEffectCount()).toBe(0);

    // Damaged (25% to 60%)
    effects.updateShipVisualState('player', sprite, 50, 100, { xUnits: 0, yUnits: 0 }, 0);
    expect(sprite.tint).toBe(0xb8b8b8);
    expect(effects.getActiveEffectCount()).toBe(0);

    // Critical (<=25%)
    effects.updateShipVisualState('player', sprite, 25, 100, { xUnits: 0, yUnits: 0 }, 0);
    expect(sprite.tint).toBe(0x777777);
    expect(effects.getActiveEffectCount()).toBe(1); // 1 fire overlay attached

    // Healing back to healthy removes fire overlay
    effects.updateShipVisualState('player', sprite, 90, 100, { xUnits: 0, yUnits: 0 }, 0);
    expect(sprite.tint).toBe(0xffffff);
    expect(effects.getActiveEffectCount()).toBe(0);
  });

  it('strictly freezes particles, animations and lifetimes when paused', () => {
    const { effects } = createFixture();
    const event: SimulationEvent = {
      step: 1,
      activeTimeMs: 16,
      type: 'fire',
      shooterId: 'player',
      weapon: 'front',
      positions: [{ xUnits: 100, yUnits: 100 }],
      headingRadians: 0,
    };
    effects.handleEvents([event], new Map());
    expect(effects.getActiveEffectCount()).toBe(1);

    // Advance 5000ms while paused
    effects.update(5000, true);
    // Lifetime did not advance: effect still present!
    expect(effects.getActiveEffectCount()).toBe(1);

    // Resume (not paused) advances and expires the effect
    effects.update(120, false);
    expect(effects.getActiveEffectCount()).toBe(0);
  });

  it('respects prefers-reduced-motion by reducing particle count and debris', () => {
    const normalFixture = createFixture(() => false);
    const reducedFixture = createFixture(() => true);

    const ship = dummyShip('victim', 50);
    const shipsById = new Map([['victim', ship]]);

    // Damage event
    normalFixture.effects.handleEvents(
      [{ step: 1, activeTimeMs: 16, type: 'damage', targetId: 'victim', sourceId: 'player', amount: 10, remainingHealth: 40 }],
      shipsById,
    );
    reducedFixture.effects.handleEvents(
      [{ step: 1, activeTimeMs: 16, type: 'damage', targetId: 'victim', sourceId: 'player', amount: 10, remainingHealth: 40 }],
      shipsById,
    );

    // Reduced motion spawns only 1 debris particle instead of 3
    expect(reducedFixture.effects.getActiveEffectCount()).toBe(1);
    expect(normalFixture.effects.getActiveEffectCount()).toBe(3);
  });

  it('reuses pooled instances for muzzle flashes, debris and score indicators across cycles', () => {
    const { parent, effects } = createFixture();
    const ship = dummyShip('victim', 50);
    const shipsById = new Map([['victim', ship]]);

    // Cycle 1: spawn muzzle flash
    effects.handleEvents(
      [{ step: 1, activeTimeMs: 16, type: 'fire', shooterId: 'player', weapon: 'front', positions: [{ xUnits: 100, yUnits: 100 }], headingRadians: 0 }],
      shipsById,
    );
    expect(effects.getActiveEffectCount()).toBe(1);
    const initialChildrenCount = (parent.children[0] as Container).children.length;
    expect(initialChildrenCount).toBe(1);

    // Expire muzzle flash
    effects.update(150, false);
    expect(effects.getActiveEffectCount()).toBe(0);
    // Pooled sprite remains in container as visible=false
    expect((parent.children[0] as Container).children.length).toBe(1);

    // Cycle 2: spawn muzzle flash again -> must reuse pooled sprite, child count does not grow
    effects.handleEvents(
      [{ step: 2, activeTimeMs: 166, type: 'fire', shooterId: 'player', weapon: 'front', positions: [{ xUnits: 100, yUnits: 100 }], headingRadians: 0 }],
      shipsById,
    );
    expect(effects.getActiveEffectCount()).toBe(1);
    expect((parent.children[0] as Container).children.length).toBe(1);

    // Score indicator pooling
    effects.handleEvents(
      [{ step: 3, activeTimeMs: 200, type: 'score', enemyId: 'victim', points: 1, totalScore: 1 }],
      shipsById,
    );
    const scoreChildCount = (parent.children[0] as Container).children.length;
    expect(scoreChildCount).toBe(2);

    // Expire score indicator
    effects.update(900, false);
    expect(effects.getActiveEffectCount()).toBe(0);
    expect((parent.children[0] as Container).children.length).toBe(2);

    // Spawn score again -> reuse pooled text node
    effects.handleEvents(
      [{ step: 4, activeTimeMs: 1100, type: 'score', enemyId: 'victim', points: 1, totalScore: 2 }],
      shipsById,
    );
    expect((parent.children[0] as Container).children.length).toBe(2);
  });
});
