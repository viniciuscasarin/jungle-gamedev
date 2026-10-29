import { test, expect, settleStartup } from './test';

const evidence = 'project/automation-reports/startup-landscape';
for (const origin of ['http://127.0.0.1:5173', 'http://127.0.0.1:4173']) {
  test.describe(`Startup ${origin}`, () => {
    test('resources finish below 100 while mocks are delayed and the menu stays unavailable', async ({ page }) => {
      await page.clock.install({ time: new Date('2026-10-29T12:00:00Z') });
      await page.clock.pauseAt(new Date('2026-10-29T12:00:01Z'));
      let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
      await page.route(origin.includes('5173') ? '**/src/mocks/browser.ts*' : /\/assets\/browser-[^/]*\.js$/, async route => { await gate; await route.continue(); });
      await page.goto(origin);
      await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '99');
      await expect(page.getByText('Finishing initialization…')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Play', exact: true })).toHaveCount(0);
      release(); await settleStartup(page);
    });
    test('fatal module failure leaves an accessible image-independent recovery', async ({ page }) => {
      await page.route(origin.includes('5173') ? '**/src/main.tsx*' : /\/assets\/index-.*\.js$/, route => route.abort());
      await page.goto(origin);
      await expect(page.getByRole('heading', { name: 'Pirate Battle could not start' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Play', exact: true })).toHaveCount(0);
    });
    test('static black cover survives delayed modules and mocks', async ({ page }, info) => {
      let release!: () => void;
      const gate = new Promise<void>(resolve => { release = resolve; });
      await page.route(origin.includes('5173') ? '**/src/main.tsx*' : /\/assets\/index-.*\.js$/, async route => { await gate; await route.continue(); });
      await page.goto(origin, { waitUntil: 'commit' });
      await expect(page.locator('#startup-cover')).toBeVisible();
      await expect(page.locator('#startup-cover')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
      await expect(page.getByRole('progressbar')).toHaveCount(1);
      await expect(page.getByRole('button', { name: 'Play', exact: true })).toHaveCount(0);
      await page.screenshot({ path: `${evidence}/${info.project.name}-${origin.slice(-4)}-initial.png` });
      release();
      await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
      await expect(page.locator('#startup-cover')).toHaveCount(0);
    });

    test('real partial progress, stable pirate phrases and immediate completion', async ({ page }, info) => {
      await page.clock.install();
      let release!: () => void;
      const gate = new Promise<void>(resolve => { release = resolve; });
      await page.route(/ui_scene_background.*\.png/, async route => { await gate; await route.continue(); });
      await page.goto(origin, { waitUntil: 'domcontentloaded' });
      const bar = page.getByRole('progressbar', { name: 'Preparing game resources' });
      await expect.poll(async () => Number(await bar.getAttribute('aria-valuenow'))).toBeGreaterThan(0);
      expect(Number(await bar.getAttribute('aria-valuenow'))).toBeLessThan(100);
      await expect(bar).toHaveCount(1); await expect(bar).toHaveCSS('border-top-width', '2px');
      await expect(bar).toHaveCSS('border-top-color', 'rgb(255, 255, 255)');
      const phrase = page.locator('.startup-phrase'); const position = await bar.boundingBox();
      await expect(phrase).toHaveText('Bribing the kraken…');
      await page.clock.fastForward(3000); await expect(phrase).toHaveText('Teaching the parrot bad words…');
      await page.clock.fastForward(3000); await expect(phrase).toHaveText('Counting suspiciously acquired gold…');
      expect(await bar.boundingBox()).toEqual(position); await expect(phrase).not.toHaveAttribute('aria-live');
      await page.screenshot({ path: `${evidence}/${info.project.name}-${origin.slice(-4)}-partial.png` });
      await expect(page.getByRole('button', { name: 'Play', exact: true })).toHaveCount(0);
      release(); await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
    });

    for (const resource of ['logo_jungle_gaming.*\\.svg', 'ui_scene_background.*\\.png', 'ship_5[-.].*png']) {
      test(`visual failure and Retry: ${resource}`, async ({ page }, info) => {
        const failures: string[] = []; page.on('pageerror', error => failures.push(error.message));
        const pattern = new RegExp(resource);
        await page.route(pattern, route => route.abort());
        await page.goto(origin);
        await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
        await expect(page.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow', '100');
        await expect(page.getByRole('button', { name: 'Play', exact: true })).toHaveCount(0);
        await page.screenshot({ path: `${evidence}/${info.project.name}-${origin.slice(-4)}-error-${resource.slice(0, 6)}.png` });
        await page.unroute(pattern); await page.getByRole('button', { name: 'Retry', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
        expect(failures).toEqual([]);
      });
    }
  });
}
