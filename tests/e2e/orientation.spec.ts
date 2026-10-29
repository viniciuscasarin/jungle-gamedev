import { test, expect } from './test';
import type { Page } from '@playwright/test';
import type { SimulationSnapshot } from '../../src/simulation/contracts';

const evidence = 'project/automation-reports/startup-landscape';
async function coarse(page: Page, value = true) {
  await page.addInitScript(value => {
    const match = window.matchMedia.bind(window);
    window.matchMedia = query => {
      const result = match(query);
      if (query === '(pointer: coarse)' || query === '(pointer: fine)') Object.defineProperty(result, 'matches', { value: query === '(pointer: coarse)' ? value : !value });
      return result;
    };
  }, value);
}
const inspect = (page: Page) => page.evaluate(() => window.__arenaDiagnostics().navigation as unknown as {
  snapshot: SimulationSnapshot; contacts: unknown[]; target: unknown;
});
for (const origin of ['http://127.0.0.1:5173', 'http://127.0.0.1:4173']) {
  test.describe(`Orientation ${origin}`, () => {
    for (const scenario of ['allowed', 'fullscreen', 'refused', 'unavailable']) {
      test(`native request ${scenario} keeps viewport authoritative and never repeats on fullscreen exit`, async ({ page }) => {
        await coarse(page); await page.setViewportSize({ width: 390, height: 844 });
        await page.addInitScript(scenario => {
          const calls: string[] = []; Reflect.set(window, 'orientationCalls', calls);
          let fullscreen = false;
          Object.defineProperty(document, 'fullscreenEnabled', { value: true });
          Object.defineProperty(document, 'fullscreenElement', { get: () => fullscreen ? document.documentElement : null });
          Element.prototype.requestFullscreen = async () => {
            calls.push('fullscreen'); if (scenario === 'refused') throw new Error('Refused'); fullscreen = true;
          };
          Object.defineProperty(screen.orientation, 'lock', { value: scenario === 'unavailable' ? undefined : async () => {
            calls.push('landscape');
            if (scenario === 'refused' || scenario === 'fullscreen' && !fullscreen) throw new Error('Fullscreen required');
          } });
        }, scenario);
        const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
        await page.goto(origin); await page.getByRole('button', { name: 'Enter landscape' }).click();
        await expect(page.getByRole('main', { name: 'Landscape required' })).toBeVisible();
        const expected = scenario === 'allowed' ? ['landscape'] : scenario === 'fullscreen' ? ['landscape', 'fullscreen', 'landscape'] : scenario === 'refused' ? ['landscape', 'fullscreen'] : [];
        await expect.poll(() => page.evaluate(() => Reflect.get(window, 'orientationCalls'))).toEqual(expected);
        await page.setViewportSize({ width: 844, height: 390 });
        await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
        await page.evaluate(() => document.dispatchEvent(new Event('fullscreenchange')));
        await page.setViewportSize({ width: 390, height: 844 });
        await expect(page.getByRole('main', { name: 'Landscape required' })).toBeVisible();
        expect(await page.evaluate(() => Reflect.get(window, 'orientationCalls'))).toEqual(expected); expect(errors).toEqual([]);
      });
    }
    test('portrait Retry, keyboard containment, safe controls and Options draft survive rotations', async ({ page }, info) => {
      await coarse(page); await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.route(/ui_scene_background.*\.png/, route => route.abort());
      await page.goto(origin);
      await page.addStyleTag({ content: '.startup-screen { --startup-safe-top: 36px; --startup-safe-bottom: 32px; --startup-safe-left: 24px; --startup-safe-right: 28px; }' });
      await expect(page.getByRole('heading', { name: 'Turn your device to landscape' })).toBeVisible();
      const retry = page.getByRole('button', { name: 'Retry', exact: true });
      await expect(retry).toBeVisible();
      await page.screenshot({ path: `${evidence}/${info.project.name}-${origin.slice(-4)}-portrait-error.png` });
      for (const button of [retry, page.getByRole('button', { name: 'Enter landscape' })]) {
        const box = await button.boundingBox(); expect(box!.width).toBeGreaterThanOrEqual(48); expect(box!.height).toBeGreaterThanOrEqual(48);
        expect(box!.x).toBeGreaterThanOrEqual(24); expect(box!.x + box!.width).toBeLessThanOrEqual(390 - 28);
        expect(box!.y).toBeGreaterThanOrEqual(36); expect(box!.y + box!.height).toBeLessThanOrEqual(844 - 32);
      }
      await page.unroute(/ui_scene_background.*\.png/); await retry.click();
      await expect(page.getByRole('progressbar')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Play', exact: true })).toHaveCount(0);
      await page.getByRole('button', { name: 'Enter landscape' }).focus(); await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: 'Enter landscape' })).toBeFocused();
      await page.screenshot({ path: `${evidence}/${info.project.name}-${origin.slice(-4)}-portrait.png` });
      await page.setViewportSize({ width: 844, height: 390 });
      await page.getByRole('button', { name: 'Options', exact: true }).click();
      const field = page.locator('#sessionDurationMs'); await field.fill('123');
      for (let cycle = 0; cycle < 3; cycle++) {
        await page.setViewportSize({ width: 390, height: 844 });
        await expect(page.getByRole('main', { name: 'Landscape required' })).toBeVisible();
        await page.keyboard.press('Escape');
        await page.setViewportSize({ width: 844, height: 390 });
        await expect(field).toHaveValue('123');
        await expect(field).toBeFocused();
      }
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Options', exact: true })).toBeFocused();
      await page.screenshot({ path: `${evidence}/${info.project.name}-${origin.slice(-4)}-landscape-menu.png` });
    });

    test('rotation releases held contacts and preserves the same frozen battle until Resume', async ({ page, context }, info) => {
      await coarse(page); await page.setViewportSize({ width: 844, height: 390 });
      await page.clock.install(); await page.goto(`${origin}/?combatScenario=empty&seed=12`);
      await page.getByRole('button', { name: 'Play', exact: true }).click();
      await expect(page.locator('.arena-screen')).toHaveAttribute('data-state', 'ready');
      await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 1000));
      const session = await context.newCDPSession(page);
      const joy = (await page.locator('.joypad').boundingBox())!, q = (await page.locator('[data-control=front]').boundingBox())!;
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 1, x: joy.x + joy.width / 2 + 28, y: joy.y + joy.height / 2 }, { id: 2, x: q.x + q.width / 2, y: q.y + q.height / 2 }] });
      await page.clock.runFor(100);
      expect((await inspect(page)).contacts!.length).toBeGreaterThan(0);
      await page.locator('[data-control=R]').evaluate((button: HTMLButtonElement) => button.click()); await page.clock.runFor(40);
      const before = (await inspect(page)).snapshot;
      const match = await page.locator('.arena-screen').getAttribute('data-match-id');
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(page.getByRole('main', { name: 'Landscape required' })).toBeVisible();
      const paused = (await inspect(page)).snapshot;
      expect(paused).toEqual({ ...before, state: 'paused', autoSailEnabled: false });
      expect((await inspect(page)).contacts).toEqual([]);
      expect((await inspect(page)).target).toBeNull();
      await page.keyboard.press('Escape'); await page.clock.runFor(10_000);
      expect((await inspect(page)).snapshot).toEqual(paused);
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.setViewportSize({ width: 568, height: 320 }); await page.clock.runFor(50);
      await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeFocused();
      expect((await inspect(page)).snapshot).toEqual(paused); await expect(page.locator('canvas')).toHaveCount(1);
      await expect(page.locator('.arena-screen')).toHaveAttribute('data-match-id', match!);
      await page.screenshot({ path: `${evidence}/${info.project.name}-${origin.slice(-4)}-landscape-paused.png` });
      await page.getByRole('button', { name: 'Resume', exact: true }).click(); await page.clock.runFor(100);
      const resumed = (await inspect(page)).snapshot;
      expect(resumed.activeTimeMs).toBeGreaterThan(paused.activeTimeMs); expect(resumed.player.position).toEqual(paused.player.position);
      expect(resumed.autoSailEnabled).toBe(false);
      await session.detach();
    });

    test('graphics completing in portrait never advances the simulation', async ({ page }) => {
      await coarse(page); await page.setViewportSize({ width: 844, height: 390 });
      await page.clock.install(); await page.goto(`${origin}/?combatScenario=empty`);
      await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
      await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 1000));
      await page.getByRole('button', { name: 'Play', exact: true }).click();
      await page.setViewportSize({ width: 390, height: 844 }); await page.clock.runFor(2000);
      await expect(page.locator('.arena-screen')).toHaveAttribute('data-state', 'ready');
      expect((await inspect(page)).snapshot).toMatchObject({ state: 'paused', activeTimeMs: 0, step: 0, autoSailEnabled: false });
      await page.setViewportSize({ width: 844, height: 390 }); await page.clock.runFor(1000);
      expect((await inspect(page)).snapshot.activeTimeMs).toBe(0);
      await page.getByRole('button', { name: 'Resume', exact: true }).click(); await page.clock.runFor(100);
      expect((await inspect(page)).snapshot.activeTimeMs).toBeGreaterThan(0);
    });

    test('fine primary pointer with extra touch stays usable in a narrow window', async ({ page }) => {
      await coarse(page, false); await page.setViewportSize({ width: 320, height: 568 }); await page.goto(origin);
      await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
      await expect(page.getByRole('main', { name: 'Landscape required' })).toHaveCount(0);
      expect(await page.evaluate(() => navigator.maxTouchPoints)).toBeGreaterThan(0);
    });
  });
}
