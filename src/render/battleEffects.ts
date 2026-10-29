import { Container, Sprite, Text } from 'pixi.js';
import type { Texture } from 'pixi.js';
import type { AssetId } from './assetManifest';
import type { ShipSnapshot, SimulationEvent, WorldPoint } from '../simulation/contracts';

interface MuzzleFlash {
  readonly sprite: Sprite;
  elapsedMs: number;
  readonly maxLifetimeMs: number;
}

interface WoodParticle {
  readonly sprite: Sprite;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  elapsedMs: number;
  readonly maxLifetimeMs: number;
}

interface ExplosionEffect {
  readonly sprite: Sprite;
  x: number;
  y: number;
  elapsedMs: number;
  readonly maxLifetimeMs: number;
}

interface SinkingShip {
  readonly sprite: Sprite;
  elapsedMs: number;
  readonly maxLifetimeMs: number;
  readonly initialScale: number;
  readonly initialRotation: number;
}

interface FloatingScore {
  readonly text: Text;
  x: number;
  y: number;
  elapsedMs: number;
  readonly maxLifetimeMs: number;
}

interface FireOverlay {
  readonly sprite: Sprite;
  frameTimerMs: number;
  currentFrame: 1 | 2;
}

export interface BattleEffectsOptions {
  readonly parent: Container;
  readonly getTexture: (id: AssetId) => Texture;
  readonly isReducedMotion?: () => boolean;
}

export interface BattleEffectsManager {
  readonly handleEvents: (events: readonly SimulationEvent[], shipsById: ReadonlyMap<string, ShipSnapshot>) => void;
  readonly updateShipVisualState: (shipId: string, sprite: Sprite, health: number, maxHealth: number, position: WorldPoint, headingRadians: number) => void;
  readonly removeShip: (shipId: string) => void;
  readonly update: (dtMs: number, isPaused: boolean) => void;
  readonly getActiveEffectCount: () => number;
  readonly destroy: () => void;
}

export function createBattleEffects(options: BattleEffectsOptions): BattleEffectsManager {
  const { parent, getTexture } = options;
  const isReducedMotion = options.isReducedMotion ?? (() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  const effectsLayer = new Container();
  parent.addChild(effectsLayer);

  const muzzleFlashes: MuzzleFlash[] = [];
  const muzzleFlashPool: Sprite[] = [];
  const woodParticles: WoodParticle[] = [];
  const woodParticlePool: Sprite[] = [];
  const explosions: ExplosionEffect[] = [];
  const sinkingShips: SinkingShip[] = [];
  const floatingScores: FloatingScore[] = [];
  const floatingScorePool: Text[] = [];
  const fireOverlays = new Map<string, FireOverlay>();

  const WOOD_TEXTURE_IDS: readonly AssetId[] = ['wood1', 'wood2', 'wood3', 'wood4'];

  function spawnMuzzleFlash(position: WorldPoint, headingRadians: number): void {
    const reduced = isReducedMotion();
    let sprite = muzzleFlashPool.pop();
    if (!sprite) {
      sprite = new Sprite(getTexture('fire2'));
      effectsLayer.addChild(sprite);
    } else {
      sprite.texture = getTexture('fire2');
    }
    sprite.anchor.set(0.5, 1);
    sprite.scale.set(reduced ? 0.3 : 0.45);
    sprite.position.set(position.xUnits, position.yUnits);
    sprite.rotation = headingRadians + Math.PI / 2;
    sprite.alpha = 1;
    sprite.visible = true;

    muzzleFlashes.push({
      sprite,
      elapsedMs: 0,
      maxLifetimeMs: reduced ? 60 : 100,
    });
  }

  function spawnDebris(x: number, y: number, count = 3): void {
    const reduced = isReducedMotion();
    const finalCount = reduced ? 1 : count;

    for (let i = 0; i < finalCount; i++) {
      const textureId = WOOD_TEXTURE_IDS[Math.floor(Math.random() * WOOD_TEXTURE_IDS.length)]!;
      let sprite = woodParticlePool.pop();
      if (!sprite) {
        sprite = new Sprite(getTexture(textureId));
        effectsLayer.addChild(sprite);
      } else {
        sprite.texture = getTexture(textureId);
      }
      sprite.anchor.set(0.5);
      sprite.scale.set(0.7);
      sprite.position.set(x, y);
      sprite.alpha = 1;
      sprite.visible = true;

      const angle = Math.random() * Math.PI * 2;
      const speed = reduced ? 20 : 40 + Math.random() * 70;

      woodParticles.push({
        sprite,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * Math.PI * 2,
        vRot: reduced ? 0 : (Math.random() - 0.5) * 8,
        elapsedMs: 0,
        maxLifetimeMs: 350 + Math.random() * 150,
      });
    }
  }

  function spawnExplosion(x: number, y: number): void {
    const reduced = isReducedMotion();
    const sprite = new Sprite(getTexture('explosion1'));
    sprite.anchor.set(0.5);
    sprite.scale.set(0.75);
    sprite.position.set(x, y);
    effectsLayer.addChild(sprite);

    explosions.push({
      sprite,
      x,
      y,
      elapsedMs: 0,
      maxLifetimeMs: 400,
    });

    if (!reduced) {
      spawnDebris(x, y, 4);
    }
  }

  function spawnSinkingShip(ship: ShipSnapshot): void {
    const sprite = new Sprite(getTexture(ship.archetype));
    sprite.anchor.set(0.5);
    sprite.scale.set(0.5);
    sprite.position.set(ship.position.xUnits, ship.position.yUnits);
    sprite.rotation = ship.headingRadians - Math.PI / 2;
    sprite.tint = 0x666666;
    effectsLayer.addChild(sprite);

    sinkingShips.push({
      sprite,
      elapsedMs: 0,
      maxLifetimeMs: 1500,
      initialScale: 0.5,
      initialRotation: sprite.rotation,
    });
  }

  function spawnFloatingScore(x: number, y: number): void {
    let textNode = floatingScorePool.pop();
    if (!textNode) {
      try {
        textNode = new Text({
          text: '+1',
          style: {
            fill: '#ffe066',
            fontSize: 18,
            fontWeight: 'bold',
            stroke: { color: '#041824', width: 3 },
          },
        });
      } catch {
        // Fallback for mock/test environments
        textNode = new Text('+1') as unknown as Text;
      }
      effectsLayer.addChild(textNode);
    }
    textNode.text = '+1';
    textNode.alpha = 1;
    textNode.visible = true;
    textNode.anchor?.set?.(0.5);
    textNode.position?.set?.(x, y);

    floatingScores.push({
      text: textNode,
      x,
      y,
      elapsedMs: 0,
      maxLifetimeMs: 800,
    });
  }

  function handleEvents(events: readonly SimulationEvent[], shipsById: ReadonlyMap<string, ShipSnapshot>): void {
    for (const event of events) {
      switch (event.type) {
        case 'fire': {
          for (const pos of event.positions) {
            spawnMuzzleFlash(pos, event.headingRadians);
          }
          break;
        }
        case 'damage': {
          const target = shipsById.get(event.targetId);
          if (target) {
            spawnDebris(target.position.xUnits, target.position.yUnits, 3);
          }
          break;
        }
        case 'destruction': {
          const victim = shipsById.get(event.entityId);
          if (victim) {
            spawnExplosion(victim.position.xUnits, victim.position.yUnits);
            spawnSinkingShip(victim);
            removeShip(victim.id);
          }
          break;
        }
        case 'score': {
          const enemy = shipsById.get(event.enemyId);
          if (enemy) {
            spawnFloatingScore(enemy.position.xUnits, enemy.position.yUnits - 15);
          }
          break;
        }
      }
    }
  }

  function updateShipVisualState(
    shipId: string,
    sprite: Sprite,
    health: number,
    maxHealth: number,
    position: WorldPoint,
    headingRadians: number,
  ): void {
    const fraction = maxHealth > 0 ? health / maxHealth : 0;

    // Healthy > 60%
    if (fraction > 0.6) {
      sprite.tint = 0xffffff;
      removeShip(shipId);
      return;
    }

    // Damaged > 25% to <= 60%
    if (fraction > 0.25) {
      sprite.tint = 0xb8b8b8;
      removeShip(shipId);
      return;
    }

    // Critical <= 25%
    sprite.tint = 0x777777;

    // Deck flame overlay
    let overlay = fireOverlays.get(shipId);
    if (!overlay) {
      const fireSprite = new Sprite(getTexture('fire1'));
      fireSprite.anchor.set(0.5, 0.7);
      fireSprite.scale.set(0.4);
      effectsLayer.addChild(fireSprite);
      overlay = {
        sprite: fireSprite,
        frameTimerMs: 0,
        currentFrame: 1,
      };
      fireOverlays.set(shipId, overlay);
    }

    overlay.sprite.position.set(position.xUnits, position.yUnits);
    overlay.sprite.rotation = headingRadians - Math.PI / 2;
    overlay.sprite.visible = health > 0;
  }

  function removeShip(shipId: string): void {
    const overlay = fireOverlays.get(shipId);
    if (overlay) {
      effectsLayer.removeChild(overlay.sprite);
      overlay.sprite.destroy({ texture: false, textureSource: false });
      fireOverlays.delete(shipId);
    }
  }

  function update(dtMs: number, isPaused: boolean): void {
    // Strict freeze when game is paused
    if (isPaused || dtMs <= 0) return;

    const dtSec = dtMs / 1000;

    // 1. Muzzle flashes
    for (let i = muzzleFlashes.length - 1; i >= 0; i--) {
      const flash = muzzleFlashes[i]!;
      flash.elapsedMs += dtMs;
      const progress = flash.elapsedMs / flash.maxLifetimeMs;
      if (progress >= 1) {
        flash.sprite.visible = false;
        muzzleFlashPool.push(flash.sprite);
        muzzleFlashes.splice(i, 1);
      } else {
        flash.sprite.alpha = 1 - progress;
      }
    }

    // 2. Wood debris
    for (let i = woodParticles.length - 1; i >= 0; i--) {
      const part = woodParticles[i]!;
      part.elapsedMs += dtMs;
      const progress = part.elapsedMs / part.maxLifetimeMs;
      if (progress >= 1) {
        part.sprite.visible = false;
        woodParticlePool.push(part.sprite);
        woodParticles.splice(i, 1);
      } else {
        part.x += part.vx * dtSec;
        part.y += part.vy * dtSec;
        part.rotation += part.vRot * dtSec;
        part.sprite.position.set(part.x, part.y);
        part.sprite.rotation = part.rotation;
        part.sprite.alpha = 1 - progress;
      }
    }

    // 3. Explosions (3 frames)
    for (let i = explosions.length - 1; i >= 0; i--) {
      const exp = explosions[i]!;
      exp.elapsedMs += dtMs;
      const progress = exp.elapsedMs / exp.maxLifetimeMs;
      if (progress >= 1) {
        effectsLayer.removeChild(exp.sprite);
        exp.sprite.destroy({ texture: false, textureSource: false });
        explosions.splice(i, 1);
      } else {
        if (progress < 0.33) {
          exp.sprite.texture = getTexture('explosion1');
        } else if (progress < 0.66) {
          exp.sprite.texture = getTexture('explosion2');
        } else {
          exp.sprite.texture = getTexture('explosion3');
        }
        exp.sprite.alpha = 1 - (progress * progress);
      }
    }

    // 4. Sinking ships
    for (let i = sinkingShips.length - 1; i >= 0; i--) {
      const sink = sinkingShips[i]!;
      sink.elapsedMs += dtMs;
      const progress = sink.elapsedMs / sink.maxLifetimeMs;
      if (progress >= 1) {
        effectsLayer.removeChild(sink.sprite);
        sink.sprite.destroy({ texture: false, textureSource: false });
        sinkingShips.splice(i, 1);
      } else {
        sink.sprite.alpha = 1 - progress;
        const scale = sink.initialScale * (1 - 0.3 * progress);
        sink.sprite.scale.set(scale);
        sink.sprite.rotation = sink.initialRotation + (0.2 * progress);
      }
    }

    // 5. Floating score text
    for (let i = floatingScores.length - 1; i >= 0; i--) {
      const score = floatingScores[i]!;
      score.elapsedMs += dtMs;
      const progress = score.elapsedMs / score.maxLifetimeMs;
      if (progress >= 1) {
        score.text.visible = false;
        floatingScorePool.push(score.text);
        floatingScores.splice(i, 1);
      } else {
        score.y -= 25 * dtSec;
        score.text.position?.set?.(score.x, score.y);
        if (progress > 0.5) {
          score.text.alpha = (1 - progress) / 0.5;
        }
      }
    }

    // 6. Fire overlays (cycle between fire1 and fire2)
    for (const overlay of fireOverlays.values()) {
      overlay.frameTimerMs += dtMs;
      if (overlay.frameTimerMs >= 150) {
        overlay.frameTimerMs -= 150;
        overlay.currentFrame = overlay.currentFrame === 1 ? 2 : 1;
        overlay.sprite.texture = getTexture(overlay.currentFrame === 1 ? 'fire1' : 'fire2');
      }
    }
  }

  function getActiveEffectCount(): number {
    return (
      muzzleFlashes.length +
      woodParticles.length +
      explosions.length +
      sinkingShips.length +
      floatingScores.length +
      fireOverlays.size
    );
  }

  function destroy(): void {
    for (const f of muzzleFlashes) {
      f.sprite.destroy({ texture: false, textureSource: false });
    }
    muzzleFlashes.length = 0;
    for (const s of muzzleFlashPool) {
      s.destroy({ texture: false, textureSource: false });
    }
    muzzleFlashPool.length = 0;

    for (const p of woodParticles) {
      p.sprite.destroy({ texture: false, textureSource: false });
    }
    woodParticles.length = 0;
    for (const s of woodParticlePool) {
      s.destroy({ texture: false, textureSource: false });
    }
    woodParticlePool.length = 0;

    for (const e of explosions) {
      e.sprite.destroy({ texture: false, textureSource: false });
    }
    explosions.length = 0;

    for (const s of sinkingShips) {
      s.sprite.destroy({ texture: false, textureSource: false });
    }
    sinkingShips.length = 0;

    for (const fs of floatingScores) {
      fs.text.destroy?.({ texture: false, textureSource: false });
    }
    floatingScores.length = 0;
    for (const t of floatingScorePool) {
      t.destroy?.({ texture: false, textureSource: false });
    }
    floatingScorePool.length = 0;

    for (const o of fireOverlays.values()) {
      o.sprite.destroy({ texture: false, textureSource: false });
    }
    fireOverlays.clear();

    effectsLayer.destroy({ children: true, texture: false, textureSource: false });
  }

  return {
    handleEvents,
    updateShipVisualState,
    removeShip,
    update,
    getActiveEffectCount,
    destroy,
  };
}
