import { test as base, expect, type Page } from '@playwright/test';

export const test = base.extend<{ primaryPointer: void }>({
  primaryPointer: [async ({ page }, use, info) => {
    if (info.project.name === 'desktop-chrome' && !info.file.endsWith('orientation.spec.ts')) {
      await page.addInitScript(() => {
        // Chromium touch emulation otherwise makes the primary pointer coarse.
        const match = window.matchMedia.bind(window);
        window.matchMedia = query => {
          const result = match(query);
          if (query === '(pointer: coarse)' || query === '(pointer: fine)') {
            Object.defineProperty(result, 'matches', { value: query === '(pointer: fine)' });
          }
          return result;
        };
      });
    }
    await use();
  }, { auto: true }],
});
export { expect };

/** Let native worker registration settle before advancing a frozen startup clock. */
export async function waitForMockWorker(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise<void>(resolve => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
  });
}

export async function settleStartup(page: Page) {
  // Tests that freeze time before navigation must let resource preparation settle.
  for (let n = 0; n < 100 && !await page.getByRole('button', { name: 'Play', exact: true }).isVisible(); n++) await page.clock.runFor(100);
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
}

export function playableSize(width: number, height: number) {
  return test.info().project.name === 'mobile-chrome' && width <= height ? { width: height, height: width } : { width, height };
}
/** Preserve fine desktop portrait coverage; coarse gameplay layouts use landscape. */
export function playableLayout<T extends readonly (string | number)[]>(layout: T): T {
  const result = [...layout]; const offset = typeof layout[0] === 'string' ? 1 : 0;
  const size = playableSize(Number(layout[offset]), Number(layout[offset + 1]));
  result[offset] = size.width; result[offset + 1] = size.height;
  return result as unknown as T;
}

export const APP_ORIGINS = [`http://127.0.0.1:${process.env.PLAYWRIGHT_DEV_PORT ?? 5173}`, `http://127.0.0.1:${process.env.PLAYWRIGHT_PREVIEW_PORT ?? 4173}`];
