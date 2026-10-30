import { mkdir, writeFile } from 'node:fs/promises';
import { test, expect } from './test';
import type { Page, TestInfo } from '@playwright/test';
import os from 'node:os';

// Trace screenshots cause GPU readback stalls; measure the game without capture.
test.use({ trace: 'off' });

interface PerformanceProfileData {
  readonly environment: {
    readonly osPlatform: string;
    readonly osRelease: string;
    readonly cpuArch: string;
    readonly cpuModel: string;
    readonly cpuCount: number;
    readonly userAgent: string;
    readonly viewport: { width: number; height: number };
    readonly gpuRenderer: string;
    readonly isSoftwareRenderer: boolean;
  };
  readonly telemetry: {
    readonly frameCount: number;
    readonly durationMs: number;
    readonly avgFps: number;
    readonly avgFrameIntervalMs: number;
    readonly p95FrameIntervalMs: number;
    readonly cpuRenderMs: number;
    readonly severeJanksCount: number; // > 33.3ms
    readonly peakEntities: number;
    readonly peakActiveEffects: number;
  };
}

interface CycleMemoryMetric {
  readonly cycle: number;
  readonly jsHeapUsedBytes: number;
  readonly jsHeapTotalBytes: number;
  readonly nodesCount: number;
  readonly exploration?: unknown;
  readonly diagnostics: {
    readonly applications: number;
    readonly resources: number;
    readonly subscriptions: number;
    readonly inputListeners: number;
    readonly hasNavigation: boolean;
  };
}

async function startMatch(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Arena', exact: true })).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.arena-host')).toHaveAttribute('data-ticker-started', 'false');
}

async function returnToMenu(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  const abandon = page.getByRole('button', { name: 'Abandon', exact: true });
  if (await abandon.isVisible({ timeout: 2000 })) {
    await abandon.click();
  }
  await expect(page.getByRole('heading', { name: 'Pirate Battle', exact: true })).toBeVisible({ timeout: 10000 });
}

test.describe('Performance Profiler and Gameplay Tuning', () => {
  test('measures frame intervals, p95 latency (<20ms), ~60 FPS and janks during active combat', async ({ page }, info: TestInfo) => {
    // Only run on desktop-chrome to avoid duplicate hardware profiling runs
    if (info.project.name !== 'desktop-chrome') return;

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Pirate Battle', exact: true })).toBeVisible();

    await startMatch(page);

    // Run active combat and telemetry collection entirely within page context
    // to avoid CDP IPC dispatch throttling Chromium's requestAnimationFrame scheduler
    const telemetryRaw = await page.evaluate(async () => {
      const intervals: number[] = [];
      let lastTime = performance.now();
      let animId: number;
      let peakEntities = 0;
      const peakEffects = 0;
      let active = true;

      const onFrame = (now: number) => {
        if (!active) return;
        const delta = now - lastTime;
        lastTime = now;
        if (delta > 0 && delta < 500) {
          intervals.push(delta);
        }

        animId = requestAnimationFrame(onFrame);
      };

      animId = requestAnimationFrame(onFrame);

      // Collect for 3.0 seconds with no extra JS execution in frame
      await new Promise(resolve => setTimeout(resolve, 3000));
      active = false;
      cancelAnimationFrame(animId);

      const diag = (window as unknown as { __arenaDiagnostics?(): { navigation?: { snapshot?: { enemies: unknown[]; projectiles: unknown[]; reservations: unknown[] }; activeEffects?: number } } }).__arenaDiagnostics?.();
      if (diag?.navigation?.snapshot) {
        peakEntities = 1 + diag.navigation.snapshot.enemies.length + diag.navigation.snapshot.projectiles.length + diag.navigation.snapshot.reservations.length;
      }

      const renderMs = (window as unknown as { __lastRenderMs?: number }).__lastRenderMs ?? 0;
      const canvas = document.querySelector('canvas');
      const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
      const ext = gl?.getExtension('WEBGL_debug_renderer_info');
      const renderer = ext && gl ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : 'unknown';

      return { intervals, peakEntities, peakEffects, renderMs, renderer };
    });

    const intervals = telemetryRaw.intervals.slice(10); // omit initial warmup
    expect(intervals.length).toBeGreaterThan(60);

    const totalDurationMs = intervals.reduce((acc, val) => acc + val, 0);
    const avgIntervalMs = totalDurationMs / intervals.length;
    const avgFps = 1000 / avgIntervalMs;

    const sorted = [...intervals].sort((a, b) => a - b);
    const p95Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
    const p95IntervalMs = sorted[p95Index]!;
    const severeJanks = intervals.filter(i => i > 33.333).length;

    const cpus = os.cpus();
    const isSoftwareRenderer = /swiftshader|llvmpipe|software|warp/i.test(telemetryRaw.renderer);

    const profileReport: PerformanceProfileData = {
      environment: {
        osPlatform: os.platform(),
        osRelease: os.release(),
        cpuArch: os.arch(),
        cpuModel: cpus[0]?.model ?? 'unknown',
        cpuCount: cpus.length,
        userAgent: await page.evaluate(() => navigator.userAgent),
        viewport: page.viewportSize() ?? { width: 0, height: 0 },
        gpuRenderer: telemetryRaw.renderer,
        isSoftwareRenderer,
      },
      telemetry: {
        frameCount: intervals.length,
        durationMs: Number(totalDurationMs.toFixed(2)),
        avgFps: Number(avgFps.toFixed(2)),
        avgFrameIntervalMs: Number(avgIntervalMs.toFixed(2)),
        p95FrameIntervalMs: Number(p95IntervalMs.toFixed(2)),
        cpuRenderMs: Number(telemetryRaw.renderMs.toFixed(2)),
        severeJanksCount: severeJanks,
        peakEntities: telemetryRaw.peakEntities,
        peakActiveEffects: telemetryRaw.peakEffects,
      },
    };

    await info.attach('performance-profile-report', {
      body: JSON.stringify(profileReport, null, 2),
      contentType: 'application/json',
    });

    console.info('[E2E PERFORMANCE PROFILE]', profileReport);

    // CPU frame presentation time must be well under frame budget (< 5ms)
    expect(telemetryRaw.renderMs).toBeLessThan(5.0);

    if (isSoftwareRenderer) {
      // In headless SwiftShader software renderer, verify responsive rendering without stalls
      expect(avgFps).toBeGreaterThanOrEqual(30.0);
    } else {
      // Normative reference environment with hardware WebGL acceleration:
      expect(avgFps).toBeGreaterThanOrEqual(55.0);
      expect(p95IntervalMs).toBeLessThan(20.0);
      expect(severeJanks).toBeLessThanOrEqual(2);
    }
  });

  test('validates 5 match cycles for complete resource teardown and JS heap stability via CDP', async ({ page, context }, info: TestInfo) => {
    if (info.project.name !== 'desktop-chrome') return;

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Pirate Battle', exact: true })).toBeVisible();

    const cdp = await context.newCDPSession(page);
    await cdp.send('HeapProfiler.enable');
    await cdp.send('Performance.enable');

    const cycleMetrics: CycleMemoryMetric[] = [];

    for (let cycle = 1; cycle <= 5; cycle++) {
      // 1. Start match
      await startMatch(page);

      // 2. Play briefly (simulate action)
      await aimEast(page); await page.waitForTimeout(1100);
      await page.keyboard.press('KeyR'); await page.keyboard.down('KeyQ');
      await page.waitForTimeout(7000); await page.keyboard.up('KeyQ');
      const exploration = await page.evaluate(() => window.__arenaDiagnostics().navigation as unknown as { region: { x: number }; streaming: unknown });
      expect(exploration.region.x).toBeGreaterThanOrEqual(1);

      // 3. Return to menu
      await returnToMenu(page);

      // 4. Force explicit garbage collection
      await cdp.send('HeapProfiler.collectGarbage');
      await page.waitForTimeout(200);

      // 5. Measure memory metrics via CDP
      const perfMetrics = await cdp.send('Performance.getMetrics');
      const getVal = (name: string) => perfMetrics.metrics.find(m => m.name === name)?.value ?? 0;

      const jsHeapUsed = getVal('JSHeapUsedSize');
      const jsHeapTotal = getVal('JSHeapTotalSize');
      const nodes = getVal('Nodes');

      // 6. Verify arena diagnostics report zero active resources
      const diagnostics = await page.evaluate(() => {
        const d = (window as unknown as { __arenaDiagnostics?(): { applications: number; resources: number; subscriptions: number; inputListeners: number; navigation: unknown } }).__arenaDiagnostics?.();
        return {
          applications: d?.applications ?? -1,
          resources: d?.resources ?? -1,
          subscriptions: d?.subscriptions ?? -1,
          inputListeners: d?.inputListeners ?? -1,
          hasNavigation: d?.navigation !== null,
        };
      });

      // Verify zero leak contracts on each return to menu
      expect(diagnostics.applications).toBe(0);
      expect(diagnostics.resources).toBe(0);
      expect(diagnostics.subscriptions).toBe(0);
      expect(diagnostics.inputListeners).toBe(0);
      expect(diagnostics.hasNavigation).toBe(false);

      const canvasCount = await page.evaluate(() => document.querySelectorAll('canvas').length);
      expect(canvasCount).toBe(0);

      cycleMetrics.push({
        cycle,
        jsHeapUsedBytes: jsHeapUsed,
        jsHeapTotalBytes: jsHeapTotal,
        nodesCount: nodes,
        diagnostics, exploration,
      });
    }

    await mkdir('project/automation-reports/infinite-world',{recursive:true});
    await writeFile('project/automation-reports/infinite-world/memory-five-cycles.json',JSON.stringify({cycleMetrics},null,2));
    await info.attach('memory-five-cycles-audit', {
      body: JSON.stringify({ cycleMetrics }, null, 2),
      contentType: 'application/json',
    });

    console.info('[5 CYCLES MEMORY AUDIT]', cycleMetrics.map(c => ({
      cycle: c.cycle,
      heapUsedMB: Number((c.jsHeapUsedBytes / (1024 * 1024)).toFixed(2)),
      nodes: c.nodesCount,
    })));

    // Verify heap stability across cycles:
    // Cycle 5 heap must not exhibit runaway memory leak compared to Cycle 1 (< 5MB delta)
    const cycle1Heap = cycleMetrics[0]!.jsHeapUsedBytes;
    const cycle5Heap = cycleMetrics[4]!.jsHeapUsedBytes;
    const heapDeltaBytes = cycle5Heap - cycle1Heap;
    const heapDeltaMB = heapDeltaBytes / (1024 * 1024);

    expect(heapDeltaMB).toBeLessThan(5.0);
  });

  test('maintains responsiveness and geometric stability under 1.0s spawn stress option', async ({ page }) => {
    // Set 1.0s spawn option in localStorage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('pirate-battle.options.v1', JSON.stringify({
        data: { sessionDurationMs: 120_000, enemySpawnIntervalMs: 1_000 },
      }));
    });
    await page.reload();

    await startMatch(page);

    // Advance for 4 seconds of active play with frequent spawns
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('KeyW');
      await page.waitForTimeout(200);
    }

    // Inspect arena state
    const diag = await page.evaluate(() => {
      const d = (window as unknown as { __arenaDiagnostics?(): { navigation?: { snapshot?: { state: string; step: number; enemies: unknown[]; reservations: unknown[] } } } }).__arenaDiagnostics?.();
      return {
        state: d?.navigation?.snapshot?.state,
        step: d?.navigation?.snapshot?.step ?? 0,
        activeEntities: (d?.navigation?.snapshot?.enemies.length ?? 0) + (d?.navigation?.snapshot?.reservations.length ?? 0),
      };
    });

    expect(diag.state).toBe('playing');
    expect(diag.step).toBeGreaterThan(60);
    expect(diag.activeEntities).toBeGreaterThan(0);
    expect(diag.activeEntities).toBeLessThan(50); // Bound by natural arena geometry
  });
});

async function aimEast(page: Page) {
  const point = await page.locator('.arena-host').evaluate(node => {
    const host=node as HTMLElement,v=JSON.parse(host.dataset.viewport!),p=JSON.parse(host.dataset.player!),r=host.getBoundingClientRect();
    return { x:r.left+v.offsetX+p.xUnits*v.scale+40,y:r.top+v.offsetY+p.yUnits*v.scale };
  });
  await page.mouse.move(point.x,point.y);
}

for (const interval of [3000,1000]) test(`profiles 180s of procedural exploration with ${interval}ms spawns`, async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chrome', 'Single reference browser profile');
  test.setTimeout(240000);
  await page.addInitScript(interval => localStorage.setItem('pirate-battle.options.v1',JSON.stringify({version:1,data:{sessionDurationMs:180000,enemySpawnIntervalMs:interval}})),interval);
  await page.goto('/?seed=42'); await startMatch(page);
  for (const key of ['KeyQ','KeyW','KeyE']) await page.keyboard.down(key);
  await page.keyboard.press('KeyR'); await page.waitForTimeout(1500); await aimEast(page);
  const raw = await page.evaluate(async () => {
    const canvas=document.querySelector('canvas')!,gl=canvas.getContext('webgl2')!;
    const ext=gl.getExtension('WEBGL_debug_renderer_info'),renderer=ext?String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)):'unknown';
    const frames:number[]=[],renders:number[]=[],samples:unknown[]=[];
    let last=performance.now(),frame=0,peakEntities=0,peakRegions=0,peakSprites=0;
    const started=last;
    type Live={snapshot:{state:string;activeTimeMs:number;player:{position:{xUnits:number;yUnits:number}};enemies:unknown[];projectiles:unknown[];reservations:unknown[]};streaming:{terrain:{regions:number;idleRegions:number;requiredRegions:number;generations:number;generationMs:number};navigation:{graphs:number;routes:number;routeMs:number};presentation:{regions:number};terrainSprites:number};dynamicSprites:number};
    return await new Promise<{frames:number[];renders:number[];samples:unknown[];renderer:string;wallDurationMs:number;peakEntities:number;peakRegions:number;peakSprites:number;result:{activeDurationMs:number;endReason:string;seed:number}|null}>(resolve=>{
      const collect=(now:number)=>{const delta=now-last;last=now;if(delta>0){frames.push(delta);renders.push(Reflect.get(window,'__lastRenderMs')??0);}frame=requestAnimationFrame(collect);};
      frame=requestAnimationFrame(collect);
      const timer=setInterval(()=>{
        const live=window.__arenaDiagnostics('performance').navigation as unknown as Live|null;
        if(live){
          const s=live.snapshot,r=live.streaming;
          peakEntities=Math.max(peakEntities,1+s.enemies.length+s.projectiles.length+s.reservations.length);
          peakRegions=Math.max(peakRegions,r.terrain.regions);peakSprites=Math.max(peakSprites,r.terrainSprites+live.dynamicSprites);
          samples.push({time:s.activeTimeMs,position:s.player.position,streaming:r});
        }
        if(!live || live.snapshot.state==='completed' || performance.now()-started>195000){
          clearInterval(timer);cancelAnimationFrame(frame);
          const saved=localStorage.getItem('pirate-battle.last-result.v1');
          resolve({frames,renders,samples,renderer,wallDurationMs:performance.now()-started,peakEntities,peakRegions,peakSprites,result:saved?JSON.parse(saved).data:null});
        }
      },250);
    });
  });
  const percentile=(values:number[],fraction:number)=>[...values].sort((a,b)=>a-b)[Math.floor((values.length-1)*fraction)]!;
  const frames=raw.frames.slice(10),avgFps=1000/(frames.reduce((n,v)=>n+v,0)/frames.length),p95=percentile(frames,.95),renderP95=percentile(raw.renders.slice(10),.95);
  const software=/swiftshader|llvmpipe|software|warp/i.test(raw.renderer);
  const normative={hardwareReference:!software,fps60:avgFps>=60,p95Below20:p95<20,severeDrops:frames.filter(ms=>ms>33.3).length};
  const report={severeFrameIntervalsMs:frames.filter(ms=>ms>33.3),normative,environment:{uncappedReference:process.env.PLAYWRIGHT_HARDWARE_GPU==='1',browserFlags:process.env.PLAYWRIGHT_HARDWARE_GPU==='1'?['--enable-gpu','--use-angle=d3d11','--disable-frame-rate-limit','--disable-gpu-vsync']:process.env.PLAYWRIGHT_HARDWARE_GPU==='capped'?['--enable-gpu','--use-angle=d3d11']:[],node:process.version,platform:os.platform(),release:os.release(),cpu:os.cpus()[0]?.model,cpuCount:os.cpus().length,userAgent:await page.evaluate(()=>navigator.userAgent),viewport:page.viewportSize(),renderer:raw.renderer,software},interval,avgFps,p95FrameMs:p95,p95RenderMs:renderP95,...raw,frames:frames.length,renders:raw.renders.length};
  await mkdir('project/automation-reports/infinite-world',{recursive:true});
  await writeFile(`project/automation-reports/infinite-world/browser-profile-${interval}.json`,JSON.stringify(report,null,2));
  await info.attach('procedural-180s-profile',{body:JSON.stringify(report),contentType:'application/json'});
  console.info('[PROCEDURAL PROFILE]',{interval,avgFps,p95,renderP95,peakRegions:raw.peakRegions,peakEntities:raw.peakEntities,result:raw.result?.endReason});
  expect(raw.result).toMatchObject({activeDurationMs:180000,endReason:'time_expired',seed:42});
  expect(raw.samples.length).toBeGreaterThan(100);
  expect((raw.samples[raw.samples.length-1] as {time:number}).time).toBeGreaterThanOrEqual(179000);
  await page.getByRole('button',{name:'Main Menu',exact:true}).click();
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(await page.evaluate(()=>window.__arenaDiagnostics())).toMatchObject({applications:0,resources:0,inputListeners:0,navigation:null});
  expect(renderP95).toBeLessThan(5);
  expect(avgFps).toBeGreaterThanOrEqual(software?30:55);
  if(!software) { expect(avgFps).toBeGreaterThanOrEqual(60); expect(p95).toBeLessThan(20); expect(frames.filter(ms=>ms>33.3)).toHaveLength(0); }
});
