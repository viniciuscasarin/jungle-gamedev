import type { Page } from '@playwright/test';

/** Local external-geometry fixture, no Netlify script or remote iframe content. */
function updateBadge(action: 'insert' | 'resize' | 'move' | 'remove') {
    if (window.top !== window) return;
    if (!document.body) { document.addEventListener('DOMContentLoaded', () => updateBadge(action), { once: true }); return; }
    let frame = document.querySelector<HTMLIFrameElement>('#nl-badge-frame');
    if (action === 'remove') { frame?.remove(); return; }
    if (!frame) {
      frame = document.createElement('iframe'); frame.id = 'nl-badge-frame'; frame.title = 'Local hosting badge fixture';
      frame.srcdoc = '<body style="margin:0;background:#123;color:white;font:14px system-ui">Powered by Netlify<br>Local fixture</body>';
      frame.style.cssText = 'position:fixed;right:0;bottom:0;width:216px;height:92px;border:0;z-index:2147483645';
      document.body.append(frame);
    }
    if (action === 'resize') { frame.style.width = '200px'; frame.style.height = '72px'; }
    if (action === 'move') { frame.style.bottom = '16px'; }
}
export async function hostingBadge(page: Page, action: 'insert' | 'resize' | 'move' | 'remove' = 'insert') {
  await page.evaluate(updateBadge, action);
}
export async function initialHostingBadge(page: Page) {
  await page.addInitScript(updateBadge, 'insert' as const);
}
