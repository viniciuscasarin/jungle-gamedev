import { isProceduralWorld } from '../domain/config';
import { regionAt } from '../simulation/world/generator';
import { createRegionalPresentation } from './regionalPresentation';
import type { GeneratedIsland } from '../simulation/world/types';
import { Application, Container, Graphics, Sprite, TilingSprite } from 'pixi.js';
import type { Texture } from 'pixi.js';
import type { MatchSetup } from '../domain/config';
import { immutableCopy } from '../domain/immutable';
import type { InitialCombatData, ShipSnapshot, SimulationEvent, SimulationSnapshot } from '../simulation/contracts';
import { acceptsGameKey, createInputBuffer, pointerTarget, pointerDirection } from '../input/desktop';
import { createTouchAdapter } from '../input/touch';
import type { InputMode } from '../input/touch';
import { healthBarGeometry, shipIsVisible } from './healthBars';
import { createNavigationLoop } from './navigationLoop';
import { PLAYER_WEAPONS } from '../simulation/combat';
import type { Viewport } from './viewport';
import type { PreviewResource } from './previewOwner';
import { ASSET_MANIFEST } from './assetManifest';
import type { AssetId } from './assetManifest';
import { fitViewport, followCamera, cameraBounds } from './viewport';
import { sessionAssets } from './sessionAssets';
import { createBattleEffects } from './battleEffects';

const live = { applications: 0, resources: 0, subscriptions: 0, inputListeners: 0 };
export interface ArenaStatus { mode: InputMode; cooldownRemainingMs: readonly number[]; cooldownDurationMs: readonly number[]; paused: boolean; autoSail: boolean; score: number; cooldowns: readonly string[]; remainingSeconds: number; health: number; maxHealth: number; state: SimulationSnapshot['state'] }
let inspectNavigation: ((scope?: 'performance') => unknown) | undefined;
/** Read-only inspection, with no gameplay mutation interface. */
Object.defineProperty(window, '__arenaDiagnostics', { configurable: true, value: (scope?: 'performance') => immutableCopy({ ...live, cache: sessionAssets.inspect(), navigation: inspectNavigation?.(scope) ?? null }) });
export function countSubscription(delta: 1 | -1): void { live.subscriptions += delta; }

/** Owns app/stage/display objects. Textures are borrowed from the session cache. */
export async function initializePixiPreview(host: HTMLElement, textures: ReadonlyMap<string, Texture>, onStatus: (status: ArenaStatus) => void, setup: MatchSetup, initial: InitialCombatData, onEvents: (events: readonly SimulationEvent[]) => void): Promise<PreviewResource> {
  const configuration = setup.configuration;
  const app = new Application();
  live.applications++;
  let countedResource = false;
  let destroyed = false;
  let cleanup = () => {};
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    cleanup();
    try {
      if (app.renderer) app.destroy({ removeView: true }, { children: true, texture: false, textureSource: false });
      else app.stage.destroy({ children: true, texture: false, textureSource: false });
    } finally {
      live.applications--;
      if (countedResource) live.resources--;
    }
  };
  try {
    const canvas = document.createElement('canvas');
    // Supplied PNG edges already carry alpha coverage. Avoid multisampling the
    // full opaque ocean, especially on software WebGL implementations.
    const context = canvas.getContext('webgl2', { alpha: false, antialias: false, stencil: true });
    if (!context) throw new Error('WebGL is unavailable.');
    await app.init({ canvas, context, width: 1, height: 1, background: '#082e3c', antialias: false, autoStart: false, sharedTicker: false, autoDensity: true, resolution: window.devicePixelRatio || 1, preference: 'webgl' });
    const eventTarget = app.renderer.events as { setTargetElement(element: HTMLElement | null): void };
    eventTarget.setTargetElement(null);
    app.renderer.scheduler.destroy();
    app.stop();
    const world = new Container();
    app.stage.addChild(world);
    const texture = (id: AssetId) => {
      const result = textures.get(ASSET_MANIFEST[id].url);
      if (!result) throw new Error(`Missing required texture: ${id}`);
      return result;
    };
    const procedural = isProceduralWorld(configuration.world);
    const finiteWorld = !isProceduralWorld(configuration.world) ? configuration.world : undefined;
    const widthUnits = finiteWorld?.widthUnits ?? 960, heightUnits = finiteWorld?.heightUnits ?? 540;
    const { playerStart } = configuration.world;
    const water = new TilingSprite({ texture: texture('tile73'), width: widthUnits, height: heightUnits });
    water.blendMode = 'none';
    water.tileScale.set(40 / 64); world.addChild(water);
    const terrainLayer = new Container(); world.addChild(terrainLayer);
    const buildIsland = (island: Pick<GeneratedIsland, 'origin' | 'widthUnits' | 'heightUnits' | 'solidOutline'> & { readonly modelId?: string; readonly rotation?: number }, parent: Container) => {
      const model = isProceduralWorld(configuration.world) ? configuration.world.catalog.find(m => m.id === island.modelId) : undefined;
      const w = model?.widthUnits ?? island.widthUnits, h = model?.heightUnits ?? island.heightUnits;
      const frame = new Container(); frame.position.set(island.origin.xUnits, island.origin.yUnits); parent.addChild(frame);
      const art = new Container(); frame.addChild(art);
      const rotation = island.rotation ?? 0; art.rotation = rotation * Math.PI / 180;
      if (rotation === 90) art.position.set(h, 0);
      if (rotation === 180) art.position.set(w, h);
      if (rotation === 270) art.position.set(0, w);
      const cols = Math.round(w / 40), rowCount = Math.round(h / 40);
      for (let y = 0; y < rowCount; y++) for (let x = 0; x < cols; x++) {
        const row = y === 0 ? ['tile6', 'tile7', 'tile8', 'tile9'] : y === rowCount - 1 ? ['tile54', 'tile55', 'tile56', 'tile57'] : ['tile22', 'tile23', 'tile24', 'tile25'];
        const index = x === 0 ? 0 : x === cols - 1 ? 3 : x < cols / 2 ? 1 : 2;
        const tile = new Sprite(texture(row[index] as AssetId)); tile.position.set(x * 40, y * 40); tile.width = 40; tile.height = 40; art.addChild(tile);
      }
      for (const [id, x, y, size] of [['tile70', w / 2 - 5, h / 2 + 4, 32], ['tile72', w / 2 + 29, h / 2 - 7, 39], ['tile49', w / 2 - 31, h / 2 + 13, 22]] as const) {
        const decoration = new Sprite(texture(id)); decoration.anchor.set(0.5); decoration.position.set(x, y); decoration.width = size; decoration.height = size; art.addChild(decoration);
      }
      if (new URLSearchParams(window.location.search).get('geometry') === '1') frame.addChild(new Graphics().poly(island.solidOutline.flatMap(p => [p.xUnits, p.yUnits])).stroke({ color: '#ff2255', width: 1.2 }));
    };
    if (finiteWorld) for (const island of finiteWorld.islands) buildIsland(island, terrainLayer);
    const player = new Sprite(texture('player')); player.anchor.set(0.5); player.scale.set(0.5);
    player.position.set(playerStart.xUnits, playerStart.yUnits); player.rotation = playerStart.headingRadians - Math.PI / 2;
    world.addChild(player); app.canvas.setAttribute('aria-hidden', 'true');
    const battleEffects = createBattleEffects({ parent: world, getTexture: texture });
    const geometry = new URLSearchParams(window.location.search).get('geometry') === '1';
    const overlay = new Graphics(); if (geometry) world.addChild(overlay);
    let viewport: Viewport = { renderable: false }, previousStatus = '';
    let cameraInsets = { top: 0, bottom: 0, left: 0, right: 0 };
    let bounds = { minX: 0, minY: 0, maxX: widthUnits, maxY: heightUnits };
    const visible = (p: { xUnits: number; yUnits: number }, margin = 60) => p.xUnits + margin >= bounds.minX && p.xUnits - margin <= bounds.maxX && p.yUnits + margin >= bounds.minY && p.yUnits - margin <= bounds.maxY;
    const input = createInputBuffer();
    const battle = host.closest<HTMLElement>('.arena-screen')!;
    let mode: InputMode = window.matchMedia('(pointer: coarse)').matches ? 'touch' : 'desktop';
    const enemySprites = new Map<string, Sprite>();
    const projectileSprites = new Map<string, Sprite>();
    const projectilePool: Sprite[] = [];
    const resetProjectileSprite = (sprite: Sprite) => {
      sprite.visible = false;
      sprite.position.set(0, 0);
      sprite.rotation = 0;
      sprite.scale.set(1);
      sprite.anchor.set(0.5);
      sprite.alpha = 1;
    };
    const acquireProjectileSprite = (): Sprite => {
      let sprite = projectilePool.pop();
      if (!sprite) {
        sprite = new Sprite(texture('cannonball'));
        sprite.anchor.set(0.5);
        sprite.scale.set(1);
        world.addChild(sprite);
      }
      sprite.visible = true;
      return sprite;
    };
    const telegraphs = new Map<string, Graphics>();
    const bars = new Map<string, Graphics>();
    let barRects: unknown[] = [];
    let lastPresentTime: number | undefined;
    let lastPresentedSnapshot: SimulationSnapshot | undefined;
    let presentationInvalidated = true;
    const present = (snapshot: SimulationSnapshot) => {
      // High-refresh displays can present the same immutable 60Hz snapshot many
      // times. Reconcile scene objects only when state or layout changes; effects
      // and rendering still advance on every RAF.
      if (snapshot !== lastPresentedSnapshot || presentationInvalidated) {
        lastPresentedSnapshot = snapshot;
        presentationInvalidated = false;
        if (procedural) viewport = followCamera(host.clientWidth, host.clientHeight, { x: snapshot.player.position.xUnits, y: snapshot.player.position.yUnits }, cameraInsets);
        world.visible = viewport.renderable;
        if (viewport.renderable) {
          world.scale.set(viewport.scale); world.position.set(viewport.offsetX, viewport.offsetY);
          bounds = cameraBounds(host.clientWidth, host.clientHeight, viewport);
          if (procedural) {
            water.position.set(bounds.minX, bounds.minY); water.width = bounds.maxX - bounds.minX; water.height = bounds.maxY - bounds.minY;
            water.tilePosition.set(-bounds.minX, -bounds.minY);
            regional?.update(bounds);
          }
        }
        host.dataset.viewport = JSON.stringify(viewport);
        player.position.set(snapshot.player.position.xUnits, snapshot.player.position.yUnits);
        player.rotation = snapshot.player.headingRadians - Math.PI / 2;
        player.visible = snapshot.player.health > 0;
        battleEffects.updateShipVisualState(
          snapshot.player.id,
          player,
          snapshot.player.health,
          snapshot.player.maxHealth,
          snapshot.player.position,
          snapshot.player.headingRadians,
        );
        const activeEnemyIds = new Set<string>();
        for (const enemy of snapshot.enemies.filter(e => shipIsVisible(e, bounds))) {
          activeEnemyIds.add(enemy.id);
          let sprite = enemySprites.get(enemy.id);
          if (!sprite) {
            sprite = new Sprite(texture(enemy.archetype));
            sprite.anchor.set(0.5);
            sprite.scale.set(0.5);
            enemySprites.set(enemy.id, sprite);
            world.addChild(sprite);
          }
          sprite.position.set(enemy.position.xUnits, enemy.position.yUnits);
          sprite.rotation = enemy.headingRadians - Math.PI / 2;
          battleEffects.updateShipVisualState(
            enemy.id,
            sprite,
            enemy.health,
            enemy.maxHealth,
            enemy.position,
            enemy.headingRadians,
          );
        }
        for (const [id, sprite] of enemySprites) {
          if (!activeEnemyIds.has(id)) {
            sprite.destroy({ texture: false, textureSource: false });
            enemySprites.delete(id);
            battleEffects.removeShip(id);
          }
        }
        const activeProjectileIds = new Set<string>();
        for (const ball of snapshot.projectiles.filter(b => visible(b.position))) {
          activeProjectileIds.add(ball.id);
          let sprite = projectileSprites.get(ball.id);
          if (!sprite) {
            sprite = acquireProjectileSprite();
            projectileSprites.set(ball.id, sprite);
          }
          sprite.position.set(ball.position.xUnits, ball.position.yUnits);
          sprite.rotation = ball.headingRadians;
          sprite.visible = true;
        }
        for (const [id, sprite] of projectileSprites) {
          if (!activeProjectileIds.has(id)) {
            resetProjectileSprite(sprite);
            projectilePool.push(sprite);
            projectileSprites.delete(id);
          }
        }
        const reserved = new Set(snapshot.reservations.filter(r => visible(r.position)).map(r => r.id));
        for (const reservation of snapshot.reservations.filter(r => visible(r.position))) {
          let ring=telegraphs.get(reservation.id);
          if(!ring){ring=new Graphics();telegraphs.set(reservation.id,ring);world.addChild(ring);}
          const progress=Math.max(0,Math.min(1,(snapshot.activeTimeMs-reservation.createdAtMs)/(reservation.materializeAtMs-reservation.createdAtMs)));
          const radius=configuration.ships[reservation.archetype].hullRadiusUnits;
          ring.clear().circle(reservation.position.xUnits,reservation.position.yUnits,radius-3).stroke({color:'#fff5a4',width:2,alpha:0.7});
          ring.moveTo(reservation.position.xUnits,reservation.position.yUnits-radius+1).arc(reservation.position.xUnits,reservation.position.yUnits,radius-1,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.max(0.001,progress)).stroke({color:'#ff7b43',width:2});
        }
        for(const [id,ring] of telegraphs)if(!reserved.has(id)){ring.destroy();telegraphs.delete(id);}
        const alive = [snapshot.player, ...snapshot.enemies].filter(ship => ship.health > 0 && shipIsVisible(ship, bounds));
        const aliveIds = new Set(alive.map(ship => ship.id));
        for (const [id, bar] of bars) if (!aliveIds.has(id)) { bar.destroy(); bars.delete(id); }
        barRects = alive.map(ship => {
          const rect = healthBarGeometry(ship, viewport.renderable ? viewport.scale : 1, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY, bounds.minX, bounds.minY);
          let bar = bars.get(ship.id);
          if (!bar) { bar = new Graphics(); bars.set(ship.id, bar); world.addChild(bar); }
          bar.clear().rect(rect.x, rect.y, rect.width, rect.height).fill('#071d29').stroke({color:'#fff3ce', width: viewport.renderable ? 0.7 / viewport.scale : 1});
          bar.rect(rect.x + 1, rect.y + 1, Math.max(0, rect.width - 2) * rect.fraction, Math.max(0, rect.height - 2)).fill('#63dc92');
          world.setChildIndex(bar, world.children.length - 1);
          return {id: ship.id, health: ship.health, maxHealth: ship.maxHealth, ...rect};
        });
        host.dataset.player = JSON.stringify({ ...snapshot.player.position, headingRadians: snapshot.player.headingRadians, width: 33, height: 56.5, rotation: player.rotation });
        if (geometry) {
          const p = snapshot.player.position, r = configuration.ships.player.hullRadiusUnits;
          overlay.clear().rect(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY).stroke({ color: '#ffdc69', width: 1 });
          if (isProceduralWorld(configuration.world)) {
            const size = configuration.world.regionSizeUnits, region = regionAt(p.xUnits, p.yUnits, size);
            overlay.rect(region.x * size, region.y * size, size, size).stroke({ color: '#88aabb', width: 1, alpha: 0.5 });
          }
          overlay.circle(p.xUnits, p.yUnits, r).stroke({ color: '#66ffdd', width: 1.4 });
          for(const enemy of snapshot.enemies) {
            overlay.circle(enemy.position.xUnits,enemy.position.yUnits,configuration.ships[enemy.archetype].hullRadiusUnits).stroke({color:enemy.archetype==='chaser'?'#ff6655':'#ffffff',width:1});
          }
          overlay.moveTo(p.xUnits, p.yUnits).lineTo(p.xUnits + Math.cos(snapshot.player.headingRadians) * 35, p.yUnits + Math.sin(snapshot.player.headingRadians) * 35).stroke({ color: '#ffffff', width: 1.4 });
        }
        if (snapshot.state !== 'playing') touch.clear();
        const cooldownRemainingMs = PLAYER_WEAPONS.map(key => Math.ceil((snapshot.cooldownsMs[key] - 1e-7) / 100) * 100);
        const status: ArenaStatus = { mode, cooldownRemainingMs, cooldownDurationMs: PLAYER_WEAPONS.map(key => configuration.weapons[key].cooldownMs), state: snapshot.state, remainingSeconds: Math.max(0, Math.ceil((configuration.options.sessionDurationMs - snapshot.activeTimeMs - 1e-7) / 1000)), health: snapshot.player.health, maxHealth: snapshot.player.maxHealth, paused: snapshot.state === 'paused', autoSail: snapshot.autoSailEnabled, score: snapshot.score, cooldowns: cooldownRemainingMs.map(ms => ms === 0 ? 'Ready' : `${(ms / 1000).toFixed(1)}s`) };
        const statusKey = JSON.stringify(status);
        if (statusKey !== previousStatus) { previousStatus = statusKey; onStatus(status); }
      }

      // Advance effects simulation
      const now = performance.now();
      const dtMs = lastPresentTime !== undefined ? Math.min(100, Math.max(0, now - lastPresentTime)) : 16.666;
      lastPresentTime = now;
      battleEffects.update(dtMs, snapshot.state !== 'playing');

      const renderStart = performance.now();
      app.render();
      const renderDuration = performance.now() - renderStart;
      (window as unknown as { __lastRenderMs?: number }).__lastRenderMs = renderDuration;
    };
    const loopRef: { current?: ReturnType<typeof createNavigationLoop> } = {};
    const handleEvents = (events: readonly SimulationEvent[]) => {
      const currentSnapshot = loopRef.current?.inspect();
      if (currentSnapshot) {
        const shipsById = new Map<string, ShipSnapshot>([
          [currentSnapshot.player.id, currentSnapshot.player],
          ...currentSnapshot.enemies.map(e => [e.id, e] as const),
        ]);
        battleEffects.handleEvents(events, shipsById);
      }
      onEvents(events);
    };
    const loop = createNavigationLoop(setup, input, { request: cb => window.requestAnimationFrame(cb), cancel: id => window.cancelAnimationFrame(id) }, present, initial, handleEvents, () => performance.now());
    loopRef.current = loop;
    const regional = isProceduralWorld(configuration.world) ? createRegionalPresentation(loop.terrain, configuration.world.regionSizeUnits, region => {
      const node = new Container(); terrainLayer.addChild(node); for (const island of region.islands) buildIsland(island, node); return node;
    }, node => node.destroy({ children: true, texture: false, textureSource: false })) : undefined;
    const selectMode = (next: InputMode) => { if (mode === next) return; touch.clear(); mode = next; presentationInvalidated = true; loop.neutralizeAutoSail(); };
    const touch = createTouchAdapter(input, () => loop.inspect().state === 'playing', selectMode, configuration.controls.joypadDeadZoneNormalized);
    const inspect = (scope?: 'performance') => ({ ...(scope === 'performance' ? {} : { setup }), snapshot: loop.inspect(), mode, sources: input.sources(), contacts: touch.inspect(), healthBars: barRects, healthBarGraphics: bars.size, target: input.inspect() ?? null, dynamicSprites: enemySprites.size + projectileSprites.size, telegraphGraphics:telegraphs.size, activeEffects: battleEffects.getActiveEffectCount(), camera: bounds, region: isProceduralWorld(configuration.world) ? regionAt(loop.inspect().player.position.xUnits, loop.inspect().player.position.yUnits, configuration.world.regionSizeUnits) : null, streaming: { ...loop.inspectResources(), presentation: regional?.inspect() ?? null, terrainSprites: terrainLayer.children.reduce((n, region) => n + region.children.reduce((m, island) => m + island.children.reduce((v, child) => v + child.children.length, 0), 0), 0) } });
    const pointer = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || loop.inspect().state !== 'playing' || (event as PointerEvent & {sourceCapabilities?: {firesTouchEvents: boolean}}).sourceCapabilities?.firesTouchEvents) return;
      selectMode('desktop');
      host.focus({ preventScroll: true });
      const point = pointerTarget(event.clientX, event.clientY, host.getBoundingClientRect(), viewport);
      if (point) input.steer(pointerDirection(point, loop.inspect().player.position, configuration.controls.mouseDeadZoneUnits));
    };
    const keydown = (event: KeyboardEvent) => { if (loop.inspect().state === 'playing' && acceptsGameKey(event, battle)) { selectMode('desktop'); if (['Escape', 'KeyP'].includes(event.code)) { if (!event.repeat) loop.freeze(); } else input.down(event.repeat, event.code); event.preventDefault(); } };
    const keyup = (event: KeyboardEvent) => { input.up(event.code); };
    const lostOwnership = (event: FocusEvent) => { const next = event.relatedTarget; if (!(next instanceof HTMLElement) || !battle.contains(next) || !next.closest('.arena-host, [data-control]')) touch.clear(); };
    const freeze = () => loop.freeze();
    const visibility = () => { if (document.hidden) freeze(); };
    const touchDown = (event: PointerEvent) => { const target = event.target as HTMLElement, control = target.closest<HTMLElement>('[data-control]'); if (control) touch.down(event, control, control.dataset.control!); else if (event.pointerType === 'touch' && loop.inspect().state === 'playing' && host.contains(target)) { selectMode('touch'); if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId); } };
    const semantic = (event: MouseEvent) => { const control = (event.target as HTMLElement).closest<HTMLElement>('[data-control]'); if (event.detail === 0 && control && loop.inspect().state === 'playing') { if (control.dataset.control === 'R') input.toggle(); else if (control.dataset.control !== 'joypad') input.pulse(control.dataset.control as 'front' | 'port' | 'starboard'); } };
    const listeners: [EventTarget, string, EventListener][] = [
      [host, 'pointermove', pointer as EventListener], [host, 'pointerdown', pointer as EventListener],
      [battle, 'keydown', keydown as EventListener], [window, 'keyup', keyup as EventListener], [battle, 'focusout', lostOwnership as EventListener],
      [battle, 'pointerdown', touchDown as EventListener], [battle, 'pointermove', touch.move as EventListener], [battle, 'pointerup', touch.up as EventListener], [battle, 'pointercancel', touch.cancel as EventListener], [battle, 'lostpointercapture', touch.cancel as EventListener], [battle, 'click', semantic as EventListener],
      [window, 'blur', freeze], [document, 'visibilitychange', visibility],
    ];
    let mounted = false;
    cleanup = () => {
      touch.clear();
      regional?.dispose();
      loop.destroy();
      battleEffects.destroy();
      for (const bar of bars.values()) bar.destroy();
      bars.clear();
      barRects = [];
      for (const sprite of enemySprites.values()) sprite.destroy({ texture: false, textureSource: false });
      enemySprites.clear();
      for (const sprite of projectileSprites.values()) sprite.destroy({ texture: false, textureSource: false });
      projectileSprites.clear();
      for (const sprite of projectilePool) sprite.destroy({ texture: false, textureSource: false });
      projectilePool.length = 0;
      for (const ring of telegraphs.values()) ring.destroy();
      telegraphs.clear();
      if (mounted) {
        for (const [target, type, listener] of listeners) target.removeEventListener(type, listener);
        live.inputListeners -= listeners.length;
      }
      if (inspectNavigation === inspect) inspectNavigation = undefined;
    };
    countedResource = true; live.resources++;
    return {
      mount(paused = false) { if (mounted || destroyed) return; mounted = true; host.append(app.canvas); for (const [target, type, listener] of listeners) target.addEventListener(type, listener); live.inputListeners += listeners.length; inspectNavigation = inspect; loop.mount(paused || document.hidden); },
      pause() { loop.freeze(); },
      resume() { loop.resume(); },
      resize() {
        presentationInvalidated = true;
        const width = host.clientWidth, height = host.clientHeight;
        const style = getComputedStyle(battle);
        const safe = (side: string) => parseFloat(style.getPropertyValue(`--safe-${side}`)) || 0;
        const top = battle.querySelector('[data-hud-band="top"]')?.getBoundingClientRect(), bottom = battle.querySelector('[data-hud-band="bottom"]')?.getBoundingClientRect(), origin = host.getBoundingClientRect();
        const insets = { top: top ? top.bottom - origin.top : 0, bottom: bottom ? origin.bottom - bottom.top : 0, left: safe('left'), right: safe('right') };
        cameraInsets = insets;
        viewport = procedural ? followCamera(width, height, { x: loop.inspect().player.position.xUnits, y: loop.inspect().player.position.yUnits }, insets) : fitViewport(width, height, widthUnits, heightUnits, insets);
        host.dataset.insets = JSON.stringify(insets);
        app.renderer.resize(Math.max(1, width), Math.max(1, height), window.devicePixelRatio || 1);
        world.visible = viewport.renderable;
        if (viewport.renderable) { world.scale.set(viewport.scale); world.position.set(viewport.offsetX, viewport.offsetY); }
        host.dataset.viewport = JSON.stringify(viewport);
        host.dataset.tickerStarted = String(app.ticker.started); present(loop.inspect());
      },
      destroy,
    };
  } catch (error) { try { destroy(); } catch { /* Partially initialized graphics may also reject disposal. */ } throw error; }
}
