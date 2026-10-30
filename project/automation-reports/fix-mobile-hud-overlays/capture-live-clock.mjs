// Evidência complementar sem relógio virtual; fixture local, sem conteúdo remoto.
import { chromium, expect } from '@playwright/test';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const measurements = [];
try {
  for (const [width, height] of [[568, 320], [844, 390]]) {
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: true, isMobile: true });
    await page.addInitScript(() => {
      const match = window.matchMedia.bind(window);
      window.matchMedia = query => { const result = match(query); if (query === '(pointer: coarse)' || query === '(pointer: fine)') Object.defineProperty(result, 'matches', { value: query === '(pointer: coarse)' }); return result; };
    });
    await page.goto(`${process.env.PLAYWRIGHT_CAPTURE_ORIGIN ?? 'http://127.0.0.1:4183'}/?combatScenario=empty&seed=0&geometry=1`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(page.locator('.arena-screen')).toHaveAttribute('data-state', 'ready');
    await page.evaluate(() => {
      const style = document.querySelector('.arena-screen').style;
      for (const [side, value] of [['top', 7], ['right', 6], ['bottom', 9], ['left', 5]]) style.setProperty(`--safe-${side}`, `${value}px`);
      const frame = document.createElement('iframe');
      frame.id = 'nl-badge-frame'; frame.title = 'Local hosting badge fixture';
      frame.srcdoc = '<body style="margin:0;background:#123;color:white;font:14px system-ui">Powered by Netlify<br>Local fixture</body>';
      frame.style.cssText = 'position:fixed;right:0;bottom:0;width:216px;height:92px;border:0;z-index:2147483645';
      document.body.append(frame);
    });
    await expect(page.locator('.arena-screen')).toHaveAttribute('data-hosting-badge', 'present');
    for (const state of ['open', 'closed']) {
      if (state === 'closed') await page.getByRole('button', { name: 'Dismiss control tips' }).tap();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const geometry = await page.evaluate(() => {
        const box = element => element?.getBoundingClientRect().toJSON() ?? null;
        const host = document.querySelector('.arena-host');
        return {
          badge: box(document.querySelector('#nl-badge-frame')),
          guide: box(document.querySelector('.control-guide')),
          canvas: box(document.querySelector('canvas')),
          top: box(document.querySelector('[data-hud-band=top]')),
          bottom: box(document.querySelector('[data-hud-band=bottom]')),
          insets: JSON.parse(host.dataset.insets), viewport: JSON.parse(host.dataset.viewport),
          controls: [...document.querySelectorAll('.joypad,.skill,.dismiss-control-tips')].map(element => {
            const rect = element.getBoundingClientRect();
            return { name: element.getAttribute('aria-label'), rect: rect.toJSON(), reachable: element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)) };
          }),
        };
      });
      for (const control of geometry.controls) {
        expect(control.rect.width).toBeGreaterThanOrEqual(48); expect(control.rect.height).toBeGreaterThanOrEqual(48);
        expect(control.reachable).toBe(true);
        expect(control.rect.right <= geometry.badge.left - 8 || control.rect.bottom <= geometry.badge.top - 8).toBe(true);
      }
      expect(geometry.canvas).toMatchObject({ x: 0, y: 0, width, height });
      measurements.push({ width, height, state, geometry });
      await page.screenshot({ path: path.resolve(`project/automation-reports/fix-mobile-hud-overlays/live-clock-${width}-${state}.png`) });
    }
    await page.close();
  }
  await writeFile('project/automation-reports/fix-mobile-hud-overlays/live-clock-geometry.json', JSON.stringify(measurements, null, 2));
} finally { await browser.close(); }
