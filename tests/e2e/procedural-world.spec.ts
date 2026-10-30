import { test, expect, APP_ORIGINS, settleStartup } from './test';
import type { Page } from '@playwright/test';
import type { SimulationSnapshot } from '../../src/simulation/contracts';
import type { ProceduralGameConfig } from '../../src/domain/config';
import { DEFAULT_CONFIG } from '../../src/domain/config';
import { generateRegion } from '../../src/simulation/world/generator';

interface Inspection {
  setup: { configuration: ProceduralGameConfig; seed: number };
  snapshot: SimulationSnapshot;
  region: { x: number; y: number };
  camera: { minX: number; minY: number; maxX: number; maxY: number };
  sources: { direction: unknown };
  streaming: { terrain: { regions: number; requiredRegions: number; idleRegions: number }; navigation: { graphs: number }; presentation: { regions: number }; terrainSprites: number };
}
const inspect = (page: Page) => page.evaluate(() => window.__arenaDiagnostics().navigation as unknown as Inspection);
async function start(page: Page, origin: string, query: string) {
  await page.clock.install({ time: new Date('2026-10-30T03:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-30T03:00:01Z'));
  await page.goto(`${origin}/?${query}`); await settleStartup(page);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  for (let n = 0; n < 50 && await page.locator('.arena-screen').getAttribute('data-state') !== 'ready'; n++) await page.clock.runFor(100);
  await expect(page.locator('canvas')).toHaveCount(1);
  await page.clock.runFor(40);
}
async function aim(page: Page, x: number, y: number) {
  const p = await page.locator('.arena-host').evaluate((node, point) => {
    const host = node as HTMLElement, v = JSON.parse(host.dataset.viewport!), r = host.getBoundingClientRect();
    const dx = point.x - point.px, dy = point.y - point.py, d = Math.hypot(dx, dy);
    return { x: r.left + v.offsetX + point.px * v.scale + dx / d * 40, y: r.top + v.offsetY + point.py * v.scale + dy / d * 40 };
  }, { x, y, px: (await inspect(page)).snapshot.player.position.xUnits, py: (await inspect(page)).snapshot.player.position.yUnits });
  await page.mouse.move(p.x, p.y);
}
async function sail(page: Page, x: number, y: number) {
  await aim(page, x, y); await page.clock.runFor(1100);
  const p = (await inspect(page)).snapshot.player.position;
  await page.keyboard.press('KeyR');
  await page.clock.runFor(Math.hypot(x - p.xUnits, y - p.yUnits) / 150 * 1000);
  await page.keyboard.press('KeyR'); await page.clock.runFor(35);
  const state = (await inspect(page)).snapshot;
  expect(Math.hypot(state.player.position.xUnits - x, state.player.position.yUnits - y)).toBeLessThan(8);
  return state;
}
async function leave(page: Page) {
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Abandon', exact: true }).click();
  expect(await page.evaluate(() => window.__arenaDiagnostics())).toMatchObject({ applications: 0, resources: 0, inputListeners: 0, navigation: null });
  await expect(page.locator('canvas')).toHaveCount(0);
}

for (const origin of APP_ORIGINS) {
  test(`real mouse explores signed regions with active combat, stable direction and frozen resize ${origin}`, async ({ page }, info) => {
    const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
    await start(page, origin, 'seed=42&geometry=1');
    await aim(page, 4000, 270); await page.clock.runFor(1100);
    const direction = (await inspect(page)).sources.direction;
    await page.keyboard.press('KeyR'); await page.keyboard.down('KeyQ'); await page.keyboard.down('KeyW'); await page.keyboard.down('KeyE');
    const observations = [];
    for (let n = 0; n < 5; n++) { await page.clock.runFor(4000); observations.push(await inspect(page)); }
    const east = await inspect(page);
    expect(east.snapshot.player.position.xUnits).toBeGreaterThan(2560);
    expect(east.region.x).toBeGreaterThanOrEqual(2);
    expect(east.sources.direction).toEqual(direction);
    expect(east.streaming.terrain.idleRegions).toBeLessThanOrEqual(8);
    expect(east.streaming.navigation.graphs).toBeLessThanOrEqual(8);
    expect(east.streaming.presentation.regions).toBeLessThanOrEqual(16);
    expect(east.snapshot.enemies.length).toBeGreaterThan(0);
    for (const key of ['KeyQ', 'KeyW', 'KeyE']) await page.keyboard.up(key);
    await page.keyboard.press('KeyR');
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    const frozen = (await inspect(page)).snapshot;
    for (const size of [{ width: 844, height: 390 }, { width: 568, height: 320 }]) {
      await page.setViewportSize(size); await page.clock.runFor(100);
      expect((await inspect(page)).snapshot).toEqual(frozen);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(size.width);
      const v = await page.locator('.arena-host').evaluate(h => JSON.parse((h as HTMLElement).dataset.viewport!));
      expect(v.scale).toBe(Math.max(size.width / 960, size.height / 540));
      await page.screenshot({ path: info.outputPath(`filled-${size.width}.png`) });
    }
    await info.attach('procedural-voyage', { body: JSON.stringify({ observations, east, frozen, errors }), contentType: 'application/json' });
    await page.getByRole('button', { name: 'Resume', exact: true }).click();
    await sail(page, -200, 270);
    expect((await inspect(page)).region.x).toBe(-1);
    expect(errors).toEqual([]); await leave(page);
  });

  for (const family of ['compact', 'elongated', 'wide']) test(`real steering circles ${family} island ${origin}`, async ({ page }, info) => {
      let seed = 0;
      while (generateRegion(DEFAULT_CONFIG.world, seed, { x: 0, y: 0 }).islands[0]!.modelId !== family) seed++;
      await start(page, origin, `seed=${seed}&geometry=1&combatScenario=empty`);
      const state = await inspect(page), island = generateRegion(state.setup.configuration.world, seed, { x: 0, y: 0 }).islands[0]!;
      const left = island.origin.xUnits - 60, top = island.origin.yUnits - 60;
      const right = island.origin.xUnits + island.widthUnits + 60, bottom = island.origin.yUnits + island.heightUnits + 60;
      for (const [x, y] of [[right, top], [left, top], [left, bottom], [right, bottom], [right, top]]) expect((await sail(page, x!, y!)).player.health).toBe(100);
      await page.screenshot({ path: info.outputPath(`${family}-geometry.png`) });
      await leave(page);
  });

  test(`real touch crosses old and regional bounds with compact HUD ${origin}`, async ({ page, context }, info) => {
    await page.setViewportSize({ width: 568, height: 320 });
    await start(page, origin, 'seed=42&combatScenario=empty');
    const cdp = await context.newCDPSession(page);
    const joy = page.locator('.joypad');
    // Primary touch selects this modality through the actual browser input path.
    await page.touchscreen.tap(280, 160); await page.clock.runFor(35);
    const rect = (await joy.boundingBox())!, cx = rect.x + rect.width / 2, cy = rect.y + rect.height / 2;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy, id: 1 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx + rect.width, y: cy, id: 1 }] });
    await page.clock.runFor(18000);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const state = await inspect(page);
    expect(state.snapshot.player.position.xUnits).toBeGreaterThan(2560);
    expect(state.region.x).toBeGreaterThanOrEqual(2);
    const stopped = state.snapshot.player.position; await page.clock.runFor(1000);
    expect((await inspect(page)).snapshot.player.position).toEqual(stopped);
    for (const box of await page.locator('.skill, .joypad').evaluateAll(nodes => nodes.map(n => { const r = n.getBoundingClientRect(); return { width: r.width, height: r.height, right: r.right, bottom: r.bottom }; }))) {
      expect(box.width).toBeGreaterThanOrEqual(48); expect(box.height).toBeGreaterThanOrEqual(48);
      expect(box.right).toBeLessThanOrEqual(568); expect(box.bottom).toBeLessThanOrEqual(320);
    }
    await page.screenshot({ path: info.outputPath('touch-voyage.png') });
    await cdp.detach(); await leave(page);
  });
}
