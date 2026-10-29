// Independent native browser probe: no app, callbacks or synthetic resize events.
const { chromium } = require('@playwright/test');
const { writeFileSync } = require('node:fs');
const { join } = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  try {
    const page = await browser.newPage({ viewport: { width: 844, height: 390 } });
    await page.goto('about:blank');
    await page.setContent('<style>body{background:#123} @media (resolution: 2dppx){body{background:#456}}</style><p>Native media query probe</p>');
    await page.evaluate(() => {
      window.probe = { events: [], resizes: [] };
      const query = matchMedia('(resolution: 1dppx)');
      window.probe.query = query;
      query.addEventListener('change', event => window.probe.events.push({ matches: event.matches, dpr: devicePixelRatio, width: innerWidth, height: innerHeight }));
      addEventListener('resize', () => window.probe.resizes.push({ dpr: devicePixelRatio, width: innerWidth, height: innerHeight }));
    });
    const client = await page.context().newCDPSession(page);
    const steps = [];
    for (const [dpr, media] of [[2, 'screen'], [1, '']]) {
      await client.send('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: dpr, mobile: false });
      await page.waitForTimeout(250);
      // Do not read query.matches here: its getter can synchronously recalculate
      // the result before Chromium delivers its queued change notification.
      const afterMetrics = await page.evaluate(() => ({ dpr: devicePixelRatio, events: [...window.probe.events], resizes: [...window.probe.resizes] }));
      console.log('afterMetrics', JSON.stringify(afterMetrics));
      await client.send('Emulation.setEmulatedMedia', { media });
      await page.waitForFunction(d => window.probe.events.some(e => e.dpr === d), dpr, { timeout: 5000 });
      const afterMedia = await page.evaluate(() => ({ dpr: devicePixelRatio, width: innerWidth, height: innerHeight, matches: window.probe.query.matches, events: [...window.probe.events], resizes: [...window.probe.resizes] }));
      assert.equal(afterMedia.dpr, dpr);
      assert.equal(afterMedia.width, 844);
      assert.equal(afterMedia.height, 390);
      assert.equal(afterMedia.matches, dpr === 1);
      steps.push({ dpr, afterMetrics, afterMedia });
    }
    const result = { browser: browser.version(), steps, applicationLoaded: false, syntheticResizeDispatched: false };
    writeFileSync(join(__dirname, 'verify-dpr.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
