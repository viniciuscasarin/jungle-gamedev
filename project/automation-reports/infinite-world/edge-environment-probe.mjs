import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--enable-gpu', '--use-angle=d3d11', '--disable-frame-rate-limit', '--disable-gpu-vsync'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const result = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280; canvas.height = 900; document.body.append(canvas);
    const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, stencil: true });
    if (!gl) throw new Error('WebGL2 unavailable');
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : 'unknown';
    const frames = []; let last = performance.now(); const started = last;
    await new Promise(resolve => {
      const collect = now => {
        if (now > last) frames.push(now - last); last = now;
        gl.clearColor(0.03, 0.18, 0.24, 1); gl.clear(gl.COLOR_BUFFER_BIT);
        if (now - started < 30000) requestAnimationFrame(collect); else resolve();
      };
      requestAnimationFrame(collect);
    });
    const measured = frames.slice(10), sorted = [...measured].sort((a, b) => a - b);
    return { renderer, durationMs: performance.now() - started, frames: measured.length,
      avgFps: 1000 / (measured.reduce((a, b) => a + b, 0) / measured.length),
      p95FrameMs: sorted[Math.floor((sorted.length - 1) * .95)],
      severeFrameIntervalsMs: measured.filter(ms => ms > 33.3) };
  });
  await writeFile('project/automation-reports/infinite-world/edge-environment-probe.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ ...result, severeFrameIntervalsMs: result.severeFrameIntervalsMs.length }));
} finally { await browser.close(); }
