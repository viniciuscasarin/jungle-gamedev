import { test, expect, playableSize, playableLayout, settleStartup } from './test';
import type { Page, TestInfo, CDPSession } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { SimulationSnapshot } from '../../src/simulation/contracts';
interface Audit { captures: Map<number,Element>; observers: Set<object>; resize: Set<unknown>; density: Set<unknown>; frames: Set<number>; input: Map<EventTarget, Map<string, Set<unknown>>> }
type NavigationSnapshot = SimulationSnapshot;
interface Diagnostics { applications: number; resources: number; subscriptions: number; inputListeners: number; navigation: { snapshot: NavigationSnapshot; telegraphGraphics:number; dynamicSprites:number; target: { xUnits: number; yUnits: number } | null } | null; cache: { leases: number; textures: number; pending: boolean; closed: boolean } }
declare global { interface Window { __arenaAudit: Audit; __arenaDiagnostics(): Diagnostics } }
const evidence = 'project/automation-reports/startup-landscape/arena-evidence';
async function screenshot(page: Page, info: TestInfo, label: string) {
  await mkdir(evidence,{recursive:true});
  const file=path.resolve(evidence,`${info.project.name}-${label}.png`);
  await page.screenshot({path:file,fullPage:true});await info.attach(label,{path:file,contentType:'image/png'});
}
async function counts(page: Page) {
  return page.evaluate(()=>({ ...window.__arenaDiagnostics(), canvases:document.querySelectorAll('canvas').length,captures:window.__arenaAudit.captures.size, observers:window.__arenaAudit.observers.size, resize:window.__arenaAudit.resize.size, density:window.__arenaAudit.density.size, frames:window.__arenaAudit.frames.size, nativeInput:[...window.__arenaAudit.input].filter(([target])=>!(target instanceof Node)||target.isConnected).reduce((sum,[,events])=>sum+[...events.values()].reduce((n,listeners)=>n+[...listeners].filter(listener=>!String(listener).includes('_hitTargetInterceptor')).length,0),0), orphanBattleInput:[...window.__arenaAudit.input].filter(([target])=>target instanceof HTMLElement&&!target.isConnected&&target.matches('.arena-screen,.arena-host')).reduce((sum,[,events])=>sum+[...events.values()].reduce((n,listeners)=>n+[...listeners].filter(listener=>!String(listener).includes('_hitTargetInterceptor')).length,0),0) }));
}
async function settled(page: Page, frames=0) { await expect.poll(async()=> (await counts(page)).frames).toBe(frames); }
async function arena(page: Page, checkFrames=true) {
  await expect(page.getByRole('heading',{name:'Arena',exact:true})).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Auto-sail Off');
  await expect(page.locator('canvas')).toHaveCount(1);if(checkFrames)await settled(page,1);
}
async function menu(page: Page) {
  await page.getByRole('button',{name:'Main Menu',exact:true}).click();
  if (await page.getByRole('button',{name:'Abandon',exact:true}).isVisible()) await page.getByRole('button',{name:'Abandon',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Pirate Battle'})).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect.poll(async()=> (await counts(page)).applications).toBe(0);
}
test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{
    const audit:Audit={captures:new Map(),observers:new Set(),resize:new Set(),density:new Set(),frames:new Set(),input:new Map()};window.__arenaAudit=audit;
    const capture=Element.prototype.setPointerCapture,release=Element.prototype.releasePointerCapture;
    Element.prototype.setPointerCapture=function(id){capture.call(this,id);audit.captures.set(id,this);};
    Element.prototype.releasePointerCapture=function(id){release.call(this,id);if(audit.captures.get(id)===this)audit.captures.delete(id);};
    document.addEventListener('gotpointercapture',event=>{audit.captures.set((event as PointerEvent).pointerId,event.target as Element);},true);
    document.addEventListener('lostpointercapture',event=>{audit.captures.delete((event as PointerEvent).pointerId);},true);
    const nativeAdd=EventTarget.prototype.addEventListener,nativeRemove=EventTarget.prototype.removeEventListener;
    const tracked=new Set(['keydown','keyup','blur','pointermove','pointerdown','pointerup','pointercancel','lostpointercapture','focusout','click','visibilitychange']);
    EventTarget.prototype.addEventListener=function(type,listener,options){
      if(tracked.has(type)){let events=audit.input.get(this);if(!events){events=new Map();audit.input.set(this,events);}let listeners=events.get(type);if(!listeners){listeners=new Set();events.set(type,listeners);}listeners.add(listener);}
      return nativeAdd.call(this,type,listener,options);
    };
    EventTarget.prototype.removeEventListener=function(type,listener,options){audit.input.get(this)?.get(type)?.delete(listener);return nativeRemove.call(this,type,listener,options);};
    const Observer=window.ResizeObserver;
    window.ResizeObserver=class extends Observer { observe(...args:Parameters<ResizeObserver['observe']>){audit.observers.add(this);return super.observe(...args);}disconnect(){audit.observers.delete(this);return super.disconnect();} };
    const add=window.addEventListener.bind(window),remove=window.removeEventListener.bind(window);
    window.addEventListener=((type: string,listener: EventListenerOrEventListenerObject,options?: boolean | AddEventListenerOptions)=>{if(type==='resize')audit.resize.add(listener);return add(type,listener,options);}) as typeof window.addEventListener;
    window.removeEventListener=((type: string,listener: EventListenerOrEventListenerObject,options?: boolean | AddEventListenerOptions)=>{if(type==='resize')audit.resize.delete(listener);return remove(type,listener,options);}) as typeof window.removeEventListener;
    const match=window.matchMedia.bind(window);
    window.matchMedia=query=>{const result=match(query),a=result.addEventListener.bind(result),r=result.removeEventListener.bind(result);
      result.addEventListener=((type: string,listener: EventListenerOrEventListenerObject,options?: boolean | AddEventListenerOptions)=>{if(type==='change')audit.density.add(listener);return a(type,listener,options);}) as typeof result.addEventListener;
      result.removeEventListener=((type: string,listener: EventListenerOrEventListenerObject,options?: boolean | AddEventListenerOptions)=>{if(type==='change')audit.density.delete(listener);return r(type,listener,options);}) as typeof result.removeEventListener;
      return result;
    };
    const request=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window);
    window.requestAnimationFrame=callback=>{const id=request(time=>{audit.frames.delete(id);callback(time);});audit.frames.add(id);return id;};
    window.cancelAnimationFrame=id=>{audit.frames.delete(id);cancel(id);};
  });
  const issues:string[]=[];
  page.on('pageerror',e=>issues.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')issues.push(`console: ${m.text()}`);});
  // Expected request failures are asserted in their dedicated test; JS exceptions are never ignored.
  (page as Page & {auditIssues:string[]}).auditIssues=issues;
});
test.afterEach(async({page},info)=>{
  const issues=(page as Page & {auditIssues:string[]}).auditIssues;
  await info.attach('console-issues',{body:JSON.stringify(issues,null,2),contentType:'application/json'});
  expect(issues).toEqual([]);
});

test('keyboard menu/loading/arena/menu and five Strict Mode cycles reuse textures',async({page},info)=>{
  await page.goto('/');await expect(page.getByRole('heading',{name:'Pirate Battle'})).toBeVisible();
  await screenshot(page,info,'menu-desktop');
  await page.setViewportSize(playableSize(320, 568));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(playableSize(320, 568).width);
  await expect(page.getByRole('heading',{name:'Pirate Battle'})).toBeVisible();await screenshot(page,info,'menu-320x568');
  await page.setViewportSize({width:1280,height:900});const initial=await counts(page);const cycles=[];
  for(let cycle=1;cycle<=5;cycle++) {
    const start=Date.now();await page.getByRole('button',{name:'Play',exact:true}).focus();await page.keyboard.press('Enter');
    await expect(page.getByRole('heading',{name:'Loading',exact:true})).toBeVisible();
    if(cycle===1)await screenshot(page,info,'loading');
    await arena(page);expect(Date.now()-start).toBeGreaterThanOrEqual(300);
    await expect(page.getByRole('region',{name:'Sailing controls'})).toBeFocused();
    const mounted=await counts(page);
    expect(mounted.nativeInput).toBeGreaterThanOrEqual(initial.nativeInput+7);
    if(cycles.length)expect(mounted.nativeInput).toBe(cycles[0]!.mounted.nativeInput);
    expect(mounted).toMatchObject({applications:1,resources:1,subscriptions:1,canvases:1,observers:2,resize:2,density:2,frames:1,cache:{leases:1,pending:false}});
    await expect(page.locator('.arena-host')).toHaveAttribute('data-ticker-started','false');
    await menu(page);await expect(page.getByRole('button',{name:'Play',exact:true})).toBeFocused();await settled(page);
    const unmounted=await counts(page);
    expect(unmounted.nativeInput).toBe(initial.nativeInput);
    expect(unmounted).toMatchObject({applications:0,resources:0,subscriptions:0,inputListeners:0,canvases:0,observers:0,resize:1,density:1,frames:0,cache:{leases:0,pending:false}});
    expect(unmounted.cache.textures).toBeGreaterThan(0);cycles.push({cycle,mounted,unmounted});
  }
  await info.attach('resource-cycles',{body:JSON.stringify({initial,cycles},null,2),contentType:'application/json'});
});

async function observe(page: Page) { return page.evaluate(() => { const n = window.__arenaDiagnostics().navigation!; return {snapshot:n.snapshot,target:n.target,dynamicSprites:n.dynamicSprites,telegraphGraphics:n.telegraphGraphics}; }); }
async function pointWorld(page: Page, x: number, y: number) {
  const point = await page.locator('.arena-host').evaluate((host, p) => {
    const v = JSON.parse((host as HTMLElement).dataset.viewport!), rect = host.getBoundingClientRect();
    return { x: rect.left + v.offsetX + p.x * v.scale, y: rect.top + v.offsetY + p.y * v.scale };
  }, { x, y });
  await page.mouse.move(point.x, point.y);
}
async function clockArena(page: Page, query = '?geometry=1') {
  await page.clock.install({time:new Date('2026-10-27T12:00:00Z')}); await page.clock.pauseAt(new Date('2026-10-27T12:00:01Z'));
  await page.goto(`/${query}`); await settleStartup(page); await page.getByRole('button', { name: 'Play', exact: true }).click();
  for (let n = 0; n < 30 && await page.locator('.arena-screen').getAttribute('data-state') !== 'ready'; n++) await page.clock.runFor(100);
  await arena(page,false);
  // Asset/graphics completion is asynchronous relative to the controlled clock.
  // Establish a running RAF baseline before testing short held-input intervals.
  const mountedStep = (await observe(page)).snapshot.step;
  for (let n=0;n<10&&(await observe(page)).snapshot.step<mountedStep+3;n++) await page.clock.runFor(20);
  expect((await observe(page)).snapshot.step).toBeGreaterThanOrEqual(mountedStep+3);
}
async function sailTo(page: Page, x: number, y: number) {
  expect((await observe(page)).snapshot.autoSailEnabled).toBe(false);
  await pointWorld(page, x, y); await page.clock.runFor(1100);
  const p = (await observe(page)).snapshot.player.position;
  await page.keyboard.press('r'); await page.clock.runFor(Math.max(20, (Math.hypot(x - p.xUnits, y - p.yUnits) - 5) / 150 * 1000));
  await page.keyboard.press('r'); await page.clock.runFor(40);
  const result = (await observe(page)).snapshot;
  expect(result.autoSailEnabled).toBe(false); expect(result.player.health).toBe(100);
  expect(Math.hypot(result.player.position.xUnits - x, result.player.position.yUnits - y)).toBeLessThan(12);
  return result;
}
test('real mouse and R traverse four sides of both islands and slide at frontal/oblique contact', async ({ page }, info) => {
  await clockArena(page,'?combatScenario=empty&geometry=1'); const observations = [];
  for (const [x, y] of [[350,270],[350,60],[85,60],[85,260],[350,260],[600,280],[870,280],[870,495],[600,495],[600,280]]) {
    observations.push({ waypoint: [x,y], snapshot: await sailTo(page,x!,y!) });
    await screenshot(page, info, `route-${x}-${y}`);
  }
  await sailTo(page, 350, 150); await pointWorld(page,210,150); await page.clock.runFor(1100);
  await page.keyboard.down('r'); await page.clock.runFor(1800);
  const frontal = await observe(page); expect(frontal.snapshot.autoSailEnabled).toBe(true); expect(frontal.snapshot.player.health).toBe(100);
  expect(frontal.snapshot.player.position.xUnits).toBeGreaterThan(305); expect(frontal.snapshot.player.position.xUnits).toBeLessThan(315);
  await page.keyboard.down('r'); await page.clock.runFor(500); expect((await observe(page)).snapshot.autoSailEnabled).toBe(true);
  await page.keyboard.up('r'); await screenshot(page,info,'northwest-frontal-held-r');
  await pointWorld(page,160,30); await page.clock.runFor(1200); const oblique = await observe(page);
  expect(oblique.snapshot.player.position.yUnits).toBeLessThan(frontal.snapshot.player.position.yUnits - 30);
  expect(oblique.snapshot.player.health).toBe(100); await screenshot(page,info,'northwest-oblique-slide');
  await page.keyboard.press('r'); await page.clock.runFor(40);
  await sailTo(page,600,280); await sailTo(page,600,385); await pointWorld(page,740,385); await page.clock.runFor(1100);
  await page.keyboard.press('r'); await page.clock.runFor(1600); const southeast = await observe(page);
  expect(southeast.snapshot.player.position.xUnits).toBeGreaterThan(640); expect(southeast.snapshot.player.position.xUnits).toBeLessThan(650); expect(southeast.snapshot.player.health).toBe(100);
  await screenshot(page,info,'southeast-frontal'); await pointWorld(page,850,260); await page.clock.runFor(1400);
  expect((await observe(page)).snapshot.player.position.yUnits).toBeLessThan(southeast.snapshot.player.position.yUnits - 30);
  await screenshot(page,info,'southeast-oblique-slide');
  await info.attach('navigation-observations',{body:JSON.stringify({observations,frontal,oblique,southeast,final:await observe(page)},null,2),contentType:'application/json'});
  await menu(page);
});

test('retains target across leave/resize/DPR; blur and hidden freeze until accessible Resume and new R', async ({ page, context }, info) => {
  await clockArena(page,'?combatScenario=empty&geometry=1'); await pointWorld(page,900,270); await page.clock.runFor(500);
  const stored = (await observe(page)).target; await page.mouse.move(-10,-10); // header/letterbox leave does not replace target
  expect((await observe(page)).target).toEqual(stored);
  await page.keyboard.down('r'); await page.clock.runFor(200);
  // Browser focus transition; no gameplay mutation or direct freeze call.
  const focusSession = await context.newCDPSession(page); await focusSession.send('Emulation.setFocusEmulationEnabled',{enabled:false});
  const other = await context.newPage(); await other.goto('about:blank'); await other.bringToFront();
  await page.clock.runFor(100); await expect(page.getByRole('button',{name:'Resume',exact:true})).toBeVisible();
  const paused = await observe(page); expect(paused.snapshot.state).toBe('paused'); expect(paused.snapshot.autoSailEnabled).toBe(false); expect(paused.target).toBeNull(); await settled(page);
  await page.clock.runFor(30000); await page.bringToFront(); await page.clock.runFor(1000); expect(await observe(page)).toEqual(paused);
  await page.keyboard.up('r'); await screenshot(page,info,'paused-desktop');
  await page.setViewportSize(playableSize(320, 568)); await page.clock.runFor(30); await screenshot(page,info,'paused-320');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(playableSize(320, 568).width);
  await page.getByRole('button',{name:'Resume',exact:true}).focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('region',{name:'Sailing controls'})).toBeFocused(); await page.clock.runFor(1000);
  expect((await observe(page)).snapshot.player).toEqual(paused.snapshot.player); expect((await observe(page)).snapshot.autoSailEnabled).toBe(false);
  await page.keyboard.press('Shift+r'); await page.clock.runFor(20); expect((await observe(page)).snapshot.autoSailEnabled).toBe(false);
  await page.evaluate(()=>{const editor=document.createElement('input');editor.setAttribute('aria-label','Test editor');document.querySelector('.arena-host')!.append(editor);});
  await page.getByRole('textbox',{name:'Test editor'}).focus(); await page.keyboard.press('r'); await page.clock.runFor(40); expect((await observe(page)).snapshot.autoSailEnabled).toBe(false);
  await page.getByRole('textbox',{name:'Test editor'}).evaluate(node=>node.remove());
  await page.getByRole('button',{name:'Main Menu',exact:true}).focus(); await page.keyboard.press('r'); await page.clock.runFor(20); expect((await observe(page)).snapshot.autoSailEnabled).toBe(false);
  await page.getByRole('region',{name:'Sailing controls'}).focus(); await pointWorld(page,900,270); const target = (await observe(page)).target;
  const beforeResize = (await observe(page)).snapshot.player.position;
  for (const [width,height] of ([[390,844],[844,390]]).map(playableLayout)) { await page.setViewportSize({width:width!,height:height!}); await page.clock.runFor(50); expect((await observe(page)).target).toEqual(target); expect((await observe(page)).snapshot.player.position).toEqual(beforeResize); }
  const session = await context.newCDPSession(page); await session.send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:2,mobile:false}); await session.send('Emulation.setEmulatedMedia',{media:'screen'}); await page.clock.runFor(50);
  expect((await observe(page)).target).toEqual(target); expect((await observe(page)).snapshot.player.position).toEqual(beforeResize);
  await session.send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:1,mobile:false}); await session.send('Emulation.setEmulatedMedia',{media:''}); await session.detach();
  await page.keyboard.press('r'); await page.clock.runFor(200); expect((await observe(page)).snapshot.autoSailEnabled).toBe(true);
  // Chromium automation preserves visible state even for background/minimized tabs.
  // Emulate the platform visibility signal only; no gameplay state or callback is set.
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  await page.clock.runFor(100); const hidden = await observe(page);
  expect(hidden.snapshot.state).toBe('paused');expect(hidden.snapshot.autoSailEnabled).toBe(false);expect(hidden.target).toBeNull();
  await page.clock.runFor(30000);expect(await observe(page)).toEqual(hidden);
  await page.evaluate(()=>{Reflect.deleteProperty(document,'hidden');document.dispatchEvent(new Event('visibilitychange'));});
  await page.clock.runFor(100);expect(await observe(page)).toEqual(hidden);await screenshot(page,info,'hidden-paused-landscape');
  const immutable = await page.evaluate(()=>{const d=window.__arenaDiagnostics();try{Object.assign(d.navigation!.snapshot.player.position,{xUnits:0});}catch{/* Expected frozen inspection. */}return Object.isFrozen(d.navigation!.snapshot.player.position)&&window.__arenaDiagnostics().navigation!.snapshot.player.position.xUnits!==0;});expect(immutable).toBe(true);
  await info.attach('focus-observations',{body:JSON.stringify({paused,afterResume:beforeResize,hidden,visibilitySignal:'document.hidden getter + visibilitychange; native CDP blur, no gameplay setters'},null,2),contentType:'application/json'});
  await focusSession.detach();await other.close(); await menu(page);
});
test('fail-once before cold/warm cache and Retry without refresh',async({page},info)=>{
  await page.goto('/?assetScenario=fail-once');await page.getByRole('button',{name:'Play',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Loading failed'})).toBeVisible();expect((await counts(page)).cache.textures).toBeGreaterThan(0);
  const preparedId=await page.locator('.arena-screen').getAttribute('data-match-id');
  await saveOptions(page,180000,10000); // Retry must keep the logical preparation captured before this edit.
  await screenshot(page,info,'fail-once');await page.getByRole('button',{name:'Retry',exact:true}).click();await arena(page);
  expect(await page.locator('.arena-screen').getAttribute('data-match-id')).toBe(preparedId);
  expect((await currentSetup(page)).configuration.options).toEqual({sessionDurationMs:120000,enemySpawnIntervalMs:3000});
  expect((await observe(page)).snapshot.activeTimeMs).toBeLessThan(1000);await menu(page);
  await page.getByRole('button',{name:'Play',exact:true}).click();await arena(page);await menu(page);
  // A new page session first warms normally, then configures the documented URL in-place.
  await page.goto('/');await page.getByRole('button',{name:'Play',exact:true}).click();await arena(page);await menu(page);
  const warm=(await counts(page)).cache.textures;
  await page.evaluate(()=>history.replaceState(null,'','/?assetScenario=fail-once'));
  await page.getByRole('button',{name:'Play',exact:true}).click();await expect(page.getByRole('heading',{name:'Loading failed'})).toBeVisible();
  expect((await counts(page)).cache.textures).toBe(warm);expect((await counts(page)).cache.leases).toBe(0);
  await page.getByRole('button',{name:'Retry',exact:true}).click();await arena(page);expect((await counts(page)).cache.textures).toBe(warm);await menu(page);
});
test('Main Menu cancels pending graphics preparation with warm textures and ignores old callbacks',async({page})=>{
  await page.goto('/');await expect(page.getByRole('button',{name:'Play',exact:true})).toBeVisible();
  await page.clock.install();await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now())+1000));
  await page.getByRole('button',{name:'Play',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Loading',exact:true})).toBeVisible();await menu(page);
  await page.clock.runFor(2000);expect((await counts(page)).cache.pending).toBe(false);expect((await counts(page)).cache.leases).toBe(0);
  await expect(page.getByRole('button',{name:'Play',exact:true})).toBeVisible();await expect(page.locator('canvas')).toHaveCount(0);
  await page.getByRole('button',{name:'Play',exact:true}).click();await page.clock.runFor(2000);await arena(page,false);await menu(page);
});
test('real asset failure retries and graphics init failure stays semantic',async({page},info)=>{
  let failing=true;
  await page.route('**/*ship_5*.png*',async route=>{if(failing)await route.fulfill({status:200,contentType:'image/png',body:'invalid image bytes'});else await route.continue();});
  await page.goto('/');await expect(page.getByText('Game images could not be prepared. Please try again.')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);failing=false;await page.getByRole('button',{name:'Retry',exact:true}).click();
  await page.getByRole('button',{name:'Play',exact:true}).click();await arena(page);await menu(page);
  await page.addInitScript(()=>{HTMLCanvasElement.prototype.getContext=(()=>null) as typeof HTMLCanvasElement.prototype.getContext;});
  await page.goto('/');await page.getByRole('button',{name:'Play',exact:true}).click();await expect(page.getByRole('heading',{name:'Loading failed'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Retry',exact:true})).toBeVisible();await expect(page.locator('canvas')).toHaveCount(0);
  expect((await counts(page)).applications).toBe(0);expect((await counts(page)).cache.leases).toBe(0);
  await screenshot(page,info,'graphics-failure');await menu(page);
});
test('fits desktop/portrait/landscape and isolated DPR changes without rebuilding',async({page,context},info)=>{
  await page.goto('/?geometry=1');await page.getByRole('button',{name:'Play',exact:true}).click();await arena(page);
  const samples=[];
  for(const [label,width,height] of ([['desktop',1280,900],['320x568',320,568],['390x844',390,844],['844x390',844,390]] as const).map(playableLayout)) {
    await page.setViewportSize({width,height});await expect.poll(()=>page.locator('canvas').evaluate(c=>(c as HTMLCanvasElement).width)).toBe(width);
    const sample=await page.locator('.arena-host').evaluate(host=>({viewport:JSON.parse((host as HTMLElement).dataset.viewport!),player:JSON.parse((host as HTMLElement).dataset.player!),width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth}));
    expect(sample.scrollWidth).toBe(width);const v=sample.viewport;expect(v.renderable).toBe(true);
    expect(v.offsetX).toBeGreaterThanOrEqual(-1e-8);expect(v.offsetY).toBeGreaterThanOrEqual(48-1e-8);
    expect(v.offsetX+960*v.scale).toBeLessThanOrEqual(width+1e-8);expect(v.offsetY+540*v.scale).toBeLessThanOrEqual(height-88+1e-8);
    expect(sample.player).toEqual({xUnits:480,yUnits:270,headingRadians:-Math.PI/2,width:33,height:56.5,rotation:-Math.PI});
    samples.push({label,...sample});await screenshot(page,info,label);
  }
  const before=await page.locator('.arena-host').getAttribute('data-viewport');
  const session=await context.newCDPSession(page);
  await session.send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:2,mobile:false});
  // CDP metrics updates DPR but Chromium defers media-query evaluation until media invalidation.
  // This emits the native resolution change; no application callback/resize is invoked.
  await session.send('Emulation.setEmulatedMedia',{media:'screen'});
  await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBe(2);
  await expect.poll(()=>page.locator('canvas').evaluate(c=>(c as HTMLCanvasElement).width)).toBe(1688);
  expect(await page.locator('.arena-host').getAttribute('data-viewport')).toBe(before);expect((await counts(page)).canvases).toBe(1);
  const raw=await session.send('Page.captureScreenshot',{format:'png'});
  const dprFile=path.resolve(evidence,`${info.project.name}-844x390-dpr2.png`);await writeFile(dprFile,Buffer.from(raw.data,'base64'));await info.attach('844x390-dpr2',{path:dprFile,contentType:'image/png'});samples.push({label:'dpr2',buffer:await page.locator('canvas').evaluate(c=>[(c as HTMLCanvasElement).width,(c as HTMLCanvasElement).height]),dpr:await page.evaluate(()=>devicePixelRatio)});
  await session.send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:1,mobile:false});
  await session.send('Emulation.setEmulatedMedia',{media:''});
  await expect.poll(()=>page.locator('canvas').evaluate(c=>(c as HTMLCanvasElement).width)).toBe(844);
  await session.detach();
  await info.attach('viewport-observations',{body:JSON.stringify(samples,null,2),contentType:'application/json'});
  // Use an actual touch event on the provided DOM action.
  const button=await page.getByRole('button',{name:'Main Menu',exact:true}).boundingBox();expect(button).not.toBeNull();await page.touchscreen.tap(button!.x+button!.width/2,button!.y+button!.height/2);
  await page.getByRole('button',{name:'Abandon',exact:true}).click();
  await expect(page.getByRole('button',{name:'Play',exact:true})).toBeVisible();await expect(page.locator('canvas')).toHaveCount(0);
});




test('real Q W E destroy diagnostic targets through collisions, orientation and simultaneous sailing', async ({ page }, info) => {
  await clockArena(page, '?combatScenario=targets&geometry=1');
  const initial = await observe(page); expect(initial.snapshot.enemies.map(e => e.health)).toEqual([40,60,60]);
  await expect(page.getByLabel('Combat status')).toHaveText('Score 0'); for (const key of ['Q', 'W', 'E']) await expect(page.locator('.skill').filter({has: page.locator('kbd', {hasText: key})})).toHaveAttribute('data-state','Ready');
  await pointWorld(page,480,0);
  for (const key of ['q','w','e']) await page.keyboard.down(key);
  await page.clock.runFor(40); const first = await observe(page);
  expect(first.snapshot.projectiles).toHaveLength(7);
  const headings = first.snapshot.projectiles.map(p => p.headingRadians);
  expect(headings.filter(h => Math.abs(h + Math.PI / 2) < 1e-8)).toHaveLength(1);
  expect(headings.filter(h => Math.abs(Math.abs(h) - Math.PI) < 1e-8)).toHaveLength(3);
  expect(headings.filter(h => Math.abs(h) < 1e-8)).toHaveLength(3);
  await screenshot(page,info,'combat-seven-shots-desktop');
  for (const [width,height,label] of ([[320,568,'combat-320'],[844,390,'combat-landscape']] as const).map(playableLayout)) {
    await page.setViewportSize({width,height}); await page.clock.runFor(30);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
    const boxes = await page.locator('.combat-status, #sailing-instructions').evaluateAll(nodes=>nodes.map(n=>{const b=n.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom};}));
    for (const box of boxes) { expect(box.left).toBeGreaterThanOrEqual(0); expect(box.right).toBeLessThanOrEqual(width); expect(box.top).toBeGreaterThanOrEqual(0); expect(box.bottom).toBeLessThanOrEqual(height); }
    await screenshot(page,info,label);
  }
  await page.clock.runFor(1600);
  const destroyed = await observe(page); expect(destroyed.snapshot.score).toBe(3); expect(destroyed.snapshot.enemies).toHaveLength(0);
  await expect(page.getByLabel('Combat status')).toContainText('Score 3');
  for (const key of ['q','w','e']) await page.keyboard.up(key);
  await pointWorld(page,900,270); await page.clock.runFor(600);
  await page.keyboard.press('r'); for (const key of ['q','w','e']) await page.keyboard.down(key);
  await page.clock.runFor(60); const sailing = await observe(page);
  expect(sailing.snapshot.autoSailEnabled).toBe(true); expect(sailing.snapshot.player.position.xUnits).toBeGreaterThan(480);
  const front = sailing.snapshot.projectiles.find(p=>Math.abs(p.headingRadians-sailing.snapshot.player.headingRadians)<1e-8);
  expect(front).toBeDefined();
  await screenshot(page,info,'combat-score-and-sailing');
  const readonly = await page.evaluate(()=>{const d=window.__arenaDiagnostics().navigation!.snapshot;return Object.isFrozen(d)&&Object.isFrozen(d.projectiles)&&d.projectiles.every(Object.isFrozen)&&!Reflect.set(d,'score',999);});expect(readonly).toBe(true);
  await info.attach('combat-observations',{body:JSON.stringify({initial,first,destroyed,sailing},null,2),contentType:'application/json'});
  await menu(page);
});

test('held QWE freeze on native blur and platform hidden signal; Resume requires new commands and out-of-context keys stay neutral', async ({ page, context }, info) => {
  await clockArena(page, '?combatScenario=targets');
  await page.bringToFront();
  if ((await observe(page)).snapshot.state === 'paused') await page.getByRole('button',{name:'Resume',exact:true}).click();
  await page.getByRole('region',{name:'Sailing controls'}).focus();
  for (const key of ['q','w','e']) await page.keyboard.down(key); await page.clock.runFor(40);
  expect((await observe(page)).snapshot.projectiles).toHaveLength(7);
  const focusSession = await context.newCDPSession(page); await focusSession.send('Emulation.setFocusEmulationEnabled',{enabled:false});
  const other = await context.newPage(); await other.goto('about:blank'); await other.bringToFront();
  await expect(page.getByRole('button',{name:'Resume',exact:true})).toBeVisible(); const paused = await observe(page);
  expect(paused.snapshot.projectiles.length).toBeGreaterThan(0); expect(paused.snapshot.cooldownsMs.front).toBeGreaterThan(0);
  await page.clock.runFor(30000); expect(await observe(page)).toEqual(paused); await page.bringToFront();
  for (const key of ['q','w','e']) await page.keyboard.up(key);
  await page.getByRole('button',{name:'Resume',exact:true}).focus(); await page.keyboard.press('Enter'); await page.clock.runFor(1400);
  const resumed = await observe(page); expect(resumed.snapshot.projectiles).toHaveLength(0); expect(resumed.snapshot.score).toBe(2);
  expect(resumed.snapshot.cooldownsMs).toEqual({front:0,port:0,starboard:0}); // one volley cannot kill the front target
  await page.keyboard.press('Shift+q'); await page.clock.runFor(40); expect((await observe(page)).snapshot.projectiles).toHaveLength(0);
  await page.getByRole('button',{name:'Main Menu',exact:true}).focus(); await page.keyboard.press('q'); await page.keyboard.press('w'); await page.keyboard.press('e'); await page.clock.runFor(40); expect((await observe(page)).snapshot.projectiles).toHaveLength(0);
  await page.evaluate(()=>{const editor=document.createElement('input');editor.setAttribute('aria-label','Combat test editor');document.querySelector('.arena-host')!.append(editor);});
  await page.getByRole('textbox',{name:'Combat test editor'}).focus(); await page.keyboard.type('qwe'); await page.clock.runFor(40); expect((await observe(page)).snapshot.projectiles).toHaveLength(0);
  await page.getByRole('textbox',{name:'Combat test editor'}).evaluate(n=>n.remove());
  await page.getByRole('region',{name:'Sailing controls'}).focus(); for (const key of ['q','w','e']) await page.keyboard.down(key); await page.clock.runFor(40);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  const hidden = await observe(page); expect(hidden.snapshot.state).toBe('paused');
  await page.clock.runFor(30000); expect(await observe(page)).toEqual(hidden);
  await page.evaluate(()=>{Reflect.deleteProperty(document,'hidden');document.dispatchEvent(new Event('visibilitychange'));});
  for (const key of ['q','w','e']) await page.keyboard.up(key);
  await page.getByRole('button',{name:'Resume',exact:true}).click(); await page.clock.runFor(1500);
  expect((await observe(page)).snapshot.projectiles).toHaveLength(0); expect((await observe(page)).snapshot.score).toBe(3);
  await info.attach('combat-freeze',{body:JSON.stringify({paused,resumed,hidden,final:await observe(page),visibility:'native CDP blur; document.hidden + visibilitychange platform emulation, not OS hidden'},null,2),contentType:'application/json'});
  await focusSession.detach();await other.close();await menu(page);
});

test('default empty and five active projectile teardown cycles reuse textures and release all native resources', async ({ page }, info) => {
  await page.goto('/'); await page.getByRole('button',{name:'Play',exact:true}).click(); await arena(page); expect((await observe(page)).snapshot.enemies).toHaveLength(0); expect((await observe(page)).snapshot.projectiles).toHaveLength(0); await menu(page);
  await page.evaluate(()=>history.replaceState(null,'','/?combatScenario=targets'));
  const baseline = await counts(page), cycles=[];
  for (let cycle=0;cycle<5;cycle++) {
    await page.getByRole('button',{name:'Play',exact:true}).click();
    await arena(page); expect((await observe(page)).snapshot.enemies).toHaveLength(3);
    for(const key of ['q','w','e']) await page.keyboard.down(key);
    await expect.poll(async()=>(await observe(page)).snapshot.projectiles.length).toBe(7);
    const active=await counts(page);expect(active.navigation!.snapshot.projectiles).toHaveLength(7);
    expect(active).toMatchObject({applications:1,resources:1,subscriptions:1,inputListeners:13,canvases:1,observers:2,resize:2,density:2,frames:1});
    expect(active.cache.textures).toBe(baseline.cache.textures);
    await menu(page);for(const key of ['q','w','e'])await page.keyboard.up(key);
    const removed=await counts(page);expect(removed).toMatchObject({applications:0,resources:0,subscriptions:0,inputListeners:0,canvases:0,observers:0,resize:1,density:1,frames:0,navigation:null,cache:{leases:0}});
    expect(removed.nativeInput).toBe(baseline.nativeInput);expect(removed.cache.textures).toBe(active.cache.textures);cycles.push({active,removed});
  }
  await info.attach('combat-dynamic-cycles',{body:JSON.stringify(cycles,null,2),contentType:'application/json'});
});


test('normal director telegraphs freeze with active time, materializes both archetypes and real Q earns score',async({page,context},info)=>{
  await clockArena(page,'?geometry=1');
  while((await observe(page)).snapshot.activeTimeMs<3150)await page.clock.runFor(50);
  const warning=await observe(page);expect(warning.telegraphGraphics).toBe(1);expect(warning.snapshot.reservations).toHaveLength(1);expect(warning.snapshot.enemies).toHaveLength(0);
  await screenshot(page,info,'spawn-warning');
  const focusSession=await context.newCDPSession(page);await focusSession.send('Emulation.setFocusEmulationEnabled',{enabled:false});
  const other=await context.newPage();await other.goto('about:blank');await other.bringToFront();
  await expect(page.getByRole('button',{name:'Resume',exact:true})).toBeVisible();const paused=await observe(page);await page.clock.runFor(15000);expect(await observe(page)).toEqual(paused);
  await page.setViewportSize(playableSize(320, 568));await page.clock.runFor(50);expect(await observe(page)).toEqual(paused);await screenshot(page,info,'spawn-warning-paused-320');await page.setViewportSize({width:1280,height:900});
  await page.bringToFront();await page.getByRole('button',{name:'Resume',exact:true}).click();await page.clock.runFor(100);
  expect((await observe(page)).snapshot.reservations).toHaveLength(1);
  while((await observe(page)).snapshot.activeTimeMs<3650)await page.clock.runFor(50);
  const chaser=await observe(page);expect(chaser.snapshot.enemies[0]!.archetype).toBe('chaser');expect(chaser.snapshot.reservations).toHaveLength(0);expect(chaser.telegraphGraphics).toBe(0);
  await screenshot(page,info,'autonomous-chaser');
  await pointWorld(page,chaser.snapshot.enemies[0]!.position.xUnits,chaser.snapshot.enemies[0]!.position.yUnits);await page.clock.runFor(500);
  await page.getByRole('region',{name:'Sailing controls'}).focus();await page.keyboard.down('q');
  for(let i=0;i<25 && (await observe(page)).snapshot.score===0;i++){
    const enemy=(await observe(page)).snapshot.enemies.find(e=>e.archetype==='chaser');if(!enemy)break;
    await pointWorld(page,enemy.position.xUnits,enemy.position.yUnits);await page.clock.runFor(100);
  }
  await page.keyboard.up('q');const killed=await observe(page);expect(killed.snapshot.score).toBeGreaterThanOrEqual(1);await screenshot(page,info,'autonomous-kill-score');
  while((await observe(page)).snapshot.activeTimeMs<6650)await page.clock.runFor(50);
  const both=await observe(page);expect(both.snapshot.enemies.some(e=>e.archetype==='shooter')).toBe(true);await screenshot(page,info,'autonomous-shooter-after-chaser-kill');
  await info.attach('director-observations',{body:JSON.stringify({warning,paused,chaser,both,killed},null,2),contentType:'application/json'});
  await focusSession.detach();await other.close();await menu(page);const stopped=await counts(page);expect(stopped.frames).toBe(0);expect(stopped.inputListeners).toBe(0);expect(stopped.cache.leases).toBe(0);
  await page.getByRole('button',{name:'Play',exact:true}).click();for(let n=0;n<30&&await page.locator('.arena-screen').getAttribute('data-state')!=='ready';n++)await page.clock.runFor(100);await arena(page,false);
  expect((await observe(page)).snapshot.score).toBe(0);while((await observe(page)).snapshot.activeTimeMs<3100)await page.clock.runFor(50);expect((await observe(page)).telegraphGraphics).toBe(1);await menu(page);expect((await counts(page)).navigation).toBeNull();expect((await counts(page)).frames).toBe(0);
});

test('normal island preparation blocks Shooter fire until it navigates to actual line of sight',async({page},info)=>{
  await clockArena(page,'?combatScenario=island&geometry=1');const initial=await observe(page);expect(initial.snapshot.enemies[0]!.position.xUnits).toBeLessThan(100);
  await page.clock.runFor(1400);expect((await observe(page)).snapshot.projectiles.filter(p=>p.faction==='enemy')).toEqual([]);await screenshot(page,info,'shooter-island-blocked');
  let firing=await observe(page);
  for(let i=0;i<70&&!firing.snapshot.projectiles.some(p=>p.faction==='enemy');i++){await page.clock.runFor(100);firing=await observe(page);}
  expect(firing.snapshot.projectiles.some(p=>p.faction==='enemy')).toBe(true);expect(firing.snapshot.enemies.find(e=>e.id==='island-shooter')!.position).not.toEqual(initial.snapshot.enemies[0]!.position);
  await screenshot(page,info,'shooter-island-clear-fire');await info.attach('island-observations',{body:JSON.stringify({initial,firing},null,2),contentType:'application/json'});await menu(page);
});

async function runToResult(page: Page, maxMs = 125000) {
  for (let elapsed = 0; elapsed < maxMs && !(await page.getByRole('heading', { name: 'Result', exact: true }).isVisible()); elapsed += 1000) await page.clock.runFor(1000);
  await expect(page.getByRole('heading', { name: 'Result', exact: true })).toBeVisible();
}
async function saveOptions(page: Page, sessionDurationMs = 60000, enemySpawnIntervalMs = 1000) {
  await page.evaluate(data => localStorage.setItem('pirate-battle.options.v1', JSON.stringify({version:1,data})), {sessionDurationMs,enemySpawnIntervalMs});
}
async function currentSetup(page: Page) {
  return page.evaluate(() => (window.__arenaDiagnostics().navigation as unknown as {setup:{configuration:{options:{sessionDurationMs:number;enemySpawnIntervalMs:number};world:{widthUnits:number;heightUnits:number;playerStart:{xUnits:number;yUnits:number}};ships:{player:{hullRadiusUnits:number}}};seed:number}}).setup);
}
async function startClockPlay(page: Page) {
  await page.getByRole('button',{name:'Play',exact:true}).click();
  for(let n=0;n<40&&await page.locator('.arena-screen').getAttribute('data-state')!=='ready';n++)await page.clock.runFor(100);
  await arena(page,false);
  await page.clock.runFor(50);
}

test('lifecycle valid 60s empty timer, terminal freeze, historical Last Result, refresh and current-settings replay',async({page},info)=>{
  test.setTimeout(180000);
  await page.clock.install({time:new Date('2026-10-28T03:00:00Z')});await page.clock.pauseAt(new Date('2026-10-28T03:00:01Z'));
  await page.goto('/?combatScenario=empty&seed=123');await settleStartup(page);await saveOptions(page);await startClockPlay(page);
  const firstId=await page.locator('.arena-screen').getAttribute('data-match-id');
  expect((await currentSetup(page)).configuration.options.sessionDurationMs).toBe(60000);
  await saveOptions(page,180000,10000); // changes after capture must affect only the next preparation
  await page.clock.runFor(59000);expect((await observe(page)).snapshot.state).toBe('playing');
  await runToResult(page,3000);await expect(page.getByText('Time expired',{exact:true})).toBeVisible();
  await expect(page.getByText('Saved on this device',{exact:true})).toBeVisible();
  const terminal=await observe(page);expect(terminal.snapshot).toMatchObject({state:'completed',activeTimeMs:60000,step:3600,score:0,player:{health:100},projectiles:[],reservations:[]});
  const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('pirate-battle.last-result.v1')!));
  expect(persisted.data).toMatchObject({matchId:firstId,activeDurationMs:60000,score:0,endReason:'time_expired',configuration:{options:{sessionDurationMs:60000}},seed:123});
  await page.clock.runFor(30000);expect(await observe(page)).toEqual(terminal);expect((await counts(page)).frames).toBe(0);
  await page.setViewportSize(playableSize(320, 568));await page.clock.runFor(40);expect(await observe(page)).toEqual(terminal);await screenshot(page,info,'result-time-320');
  for(const [width,height,label] of ([[1280,900,'desktop'],[320,568,'320'],[844,390,'landscape']] as const).map(playableLayout)){
    await page.setViewportSize({width,height});await page.clock.runFor(40);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);await screenshot(page,info,`result-time-${label}`);
  }
  await menu(page);await expect(page.getByRole('button',{name:'Last Result',exact:true})).toBeVisible();
  for(const [width,height,label] of ([[1280,900,'desktop'],[320,568,'320'],[844,390,'landscape']] as const).map(playableLayout)){await page.setViewportSize({width,height});await screenshot(page,info,`menu-last-result-${label}`);}
  await page.getByRole('button',{name:'Last Result',exact:true}).click();await expect(page.getByRole('heading',{name:'Result',exact:true})).toBeFocused();expect((await counts(page)).navigation).toBeNull();
  expect(await page.locator('.result-screen').getAttribute('data-match-id')).toBe(firstId);await menu(page);
  await page.reload();await expect(page.getByRole('button',{name:'Last Result',exact:true})).toBeVisible();await page.getByRole('button',{name:'Last Result',exact:true}).click();
  await page.getByRole('button',{name:'Play Again',exact:true}).click();for(let n=0;n<40&&await page.locator('.arena-screen').getAttribute('data-state')!=='ready';n++)await page.clock.runFor(100);
  await arena(page,false);const replayId=await page.locator('.arena-screen').getAttribute('data-match-id');expect(replayId).not.toBe(firstId);
  expect((await currentSetup(page)).configuration.options).toEqual({sessionDurationMs:180000,enemySpawnIntervalMs:10000});
  const replay=await observe(page);expect(replay.snapshot).toMatchObject({score:0,autoSailEnabled:false,player:{health:100},enemies:[],projectiles:[],reservations:[],cooldownsMs:{front:0,port:0,starboard:0}});expect(replay.snapshot.activeTimeMs).toBeLessThan(200);expect(replay.target).toBeNull();
  // Refresh abandons the active replay; no active-session storage is written.
  await page.reload();await expect(page.getByRole('button',{name:'Play',exact:true})).toBeVisible();expect((await counts(page)).navigation).toBeNull();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('pirate-battle.last-result.v1')!).data)).toEqual(persisted.data);
  await info.attach('lifecycle-timer-replay',{body:JSON.stringify({terminal,persisted,replay,replayId,firstId},null,2),contentType:'application/json'});
});

test('lifecycle Escape P Pause, contained dialogs, Keep Playing stays Paused, real AI death and result visuals',async({page},info)=>{
  test.setTimeout(180000);
  await clockArena(page,'?geometry=1&seed=0');
  await pointWorld(page,900,270);for(const key of ['q','w','e'])await page.keyboard.down(key);await page.keyboard.press('r');await page.clock.runFor(50);
  await page.keyboard.press('Escape');const paused=await observe(page);expect(paused.snapshot.state).toBe('paused');expect(paused.snapshot.autoSailEnabled).toBe(false);expect(paused.target).toBeNull();expect((await counts(page)).frames).toBe(0);
  await expect(page.getByRole('button',{name:'Resume',exact:true})).toBeFocused();
  await page.keyboard.press('Shift+Tab');await expect(page.getByRole('button',{name:'Main Menu',exact:true})).toBeFocused();await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Resume',exact:true})).toBeFocused();
  await page.keyboard.press('p');await page.keyboard.press('Escape');await page.keyboard.press('q');await page.clock.runFor(30000);expect(await observe(page)).toEqual(paused);
  for(const [width,height,label] of ([[1280,900,'desktop'],[320,568,'320'],[844,390,'landscape']] as const).map(playableLayout)){
    await page.setViewportSize({width,height});await page.clock.runFor(40);await screenshot(page,info,`paused-${label}`);
    await page.getByRole('button',{name:'Main Menu',exact:true}).click();await expect(page.getByRole('dialog',{name:'Abandon this match?'})).toBeVisible();await expect(page.getByRole('button',{name:'Keep Playing',exact:true})).toBeFocused();
    await screenshot(page,info,`abandon-confirm-${label}`);await page.keyboard.press('Shift+Tab');await expect(page.getByRole('button',{name:'Abandon',exact:true})).toBeFocused();await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Keep Playing',exact:true})).toBeFocused();
    await page.keyboard.press('q');await page.getByRole('button',{name:'Keep Playing',exact:true}).click();await expect(page.getByRole('button',{name:'Resume',exact:true})).toBeFocused();expect(await observe(page)).toEqual(paused);
  }
  for(const key of ['q','w','e'])await page.keyboard.up(key);
  await page.getByRole('button',{name:'Resume',exact:true}).click();await expect(page.getByRole('region',{name:'Sailing controls'})).toBeFocused();await page.clock.runFor(50);expect((await observe(page)).snapshot.autoSailEnabled).toBe(false);
  await page.keyboard.press('p');const p=await observe(page);expect(p.snapshot.state).toBe('paused');await page.clock.runFor(5000);expect(await observe(page)).toEqual(p);
  await page.getByRole('button',{name:'Resume',exact:true}).click();await page.clock.runFor(50);await page.getByRole('button',{name:'Pause',exact:true}).click();expect((await observe(page)).snapshot.state).toBe('paused');
  await page.getByRole('button',{name:'Resume',exact:true}).click();await runToResult(page);
  await expect(page.getByText('Ship destroyed',{exact:true})).toBeVisible();const dead=await observe(page);expect(dead.snapshot.player.health).toBe(0);expect(dead.snapshot.state).toBe('completed');expect(dead.snapshot.activeTimeMs).toBeLessThan(120000);
  for(const [width,height,label] of ([[1280,900,'desktop'],[320,568,'320'],[844,390,'landscape']] as const).map(playableLayout)){await page.setViewportSize({width,height});await page.clock.runFor(40);await screenshot(page,info,`result-death-${label}`);}
  await info.attach('lifecycle-ai-death',{body:JSON.stringify({paused,p,dead},null,2),contentType:'application/json'});await menu(page);
});

test('lifecycle denied storage keeps play and memory result available with honest status',async({page},info)=>{
  test.setTimeout(180000);
  await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('Access denied','SecurityError');}});});
  await clockArena(page,'?seed=0');await runToResult(page);
  await expect(page.getByText('Ship destroyed',{exact:true})).toBeVisible();await expect(page.getByRole('status')).toContainText('Could not save on this device');
  await screenshot(page,info,'result-storage-denied');const id=await page.locator('.result-screen').getAttribute('data-match-id');await menu(page);
  await expect(page.getByRole('status')).toContainText('could not be read');await page.getByRole('button',{name:'Last Result',exact:true}).click();expect(await page.locator('.result-screen').getAttribute('data-match-id')).toBe(id);expect((await counts(page)).navigation).toBeNull();
  await page.getByRole('button',{name:'Play Again',exact:true}).click();for(let n=0;n<40&&await page.locator('.arena-screen').getAttribute('data-state')!=='ready';n++)await page.clock.runFor(100);await arena(page,false);await menu(page);
});

test('lifecycle captured custom renderer geometry and pointer world clamp survive resize',async({page},info)=>{
  await clockArena(page,'?combatScenario=empty&configScenario=custom&geometry=1&seed=23');const setup=await currentSetup(page);expect(setup.configuration.world).toMatchObject({widthUnits:1200,heightUnits:600,playerStart:{xUnits:600,yUnits:300}});
  expect((await observe(page)).snapshot.player.position).toEqual({xUnits:600,yUnits:300});expect(setup.configuration.ships.player.hullRadiusUnits).toBe(22);
  // Use the actual letterbox below the measured HUD.
  await pointWorld(page,600,-1);expect((await observe(page)).target).toEqual({xUnits:600,yUnits:0});
  await page.getByRole('button',{name:'Pause',exact:true}).click();const paused=await observe(page);
  for(const [width,height] of ([[320,568],[844,390]]).map(playableLayout)){await page.setViewportSize({width:width!,height:height!});await page.clock.runFor(40);expect(await observe(page)).toEqual(paused);const v=await page.locator('.arena-host').evaluate(h=>JSON.parse((h as HTMLElement).dataset.viewport!));expect(v.offsetX+1200*v.scale).toBeLessThanOrEqual(width!+1e-6);expect(v.offsetY+600*v.scale).toBeLessThanOrEqual(height!-88+1e-6);}
  await screenshot(page,info,'captured-custom-map');await menu(page);
});

test('lifecycle five completed replay abandon cycles have no stale native resources under Strict Mode',async({page},info)=>{
  test.setTimeout(240000);
  await clockArena(page,'?seed=0');await menu(page);const baseline=await counts(page), cycles=[];
  for(let cycle=0;cycle<5;cycle++){
    await startClockPlay(page);const id=await page.locator('.arena-screen').getAttribute('data-match-id');await runToResult(page);const completed=await counts(page);expect(completed.frames).toBe(0);expect(completed.navigation!.snapshot.state).toBe('completed');
    await page.getByRole('button',{name:'Play Again',exact:true}).click();for(let n=0;n<40&&await page.locator('.arena-screen').getAttribute('data-state')!=='ready';n++)await page.clock.runFor(100);await arena(page,false);
    const fresh=await counts(page);expect(await page.locator('.arena-screen').getAttribute('data-match-id')).not.toBe(id);expect(fresh).toMatchObject({applications:1,resources:1,subscriptions:1,inputListeners:13,canvases:1,observers:2,resize:2,density:2});expect(fresh.navigation!.snapshot).toMatchObject({score:0,player:{health:100},enemies:[],projectiles:[],reservations:[],autoSailEnabled:false,cooldownsMs:{front:0,port:0,starboard:0}});
    await page.getByRole('button',{name:'Pause',exact:true}).click();await page.getByRole('button',{name:'Main Menu',exact:true}).click();await page.getByRole('button',{name:'Abandon',exact:true}).click();
    const removed=await counts(page);expect(removed).toMatchObject({applications:0,resources:0,subscriptions:0,inputListeners:0,canvases:0,observers:0,resize:1,density:1,frames:0,navigation:null,cache:{leases:0}});expect(removed.nativeInput).toBe(baseline.nativeInput);expect(removed.cache.textures).toBe(baseline.cache.textures);
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('pirate-battle.last-result.v1')!).data.matchId)).toBe(id);cycles.push({cycle,id,completed,fresh,removed});
  }
  await info.attach('lifecycle-five-cycles',{body:JSON.stringify({baseline,cycles,limitation:'Headless Chromium counters; not a hardware memory/FPS benchmark.'},null,2),contentType:'application/json'});
});

interface TouchNavigation {
  mode: string; contacts: {id:number;control:string;captured:boolean}[];
  sources: {joypad:number|null;moving:boolean;direction:unknown;fire:Record<string,string[]>};
  healthBarGraphics:number; healthBars:{id:string;health:number;maxHealth:number;x:number;y:number;width:number;height:number;fraction:number;rotation:number}[];
}
async function touchNavigation(page:Page) { return page.evaluate(()=>window.__arenaDiagnostics().navigation as unknown as TouchNavigation); }
type Contact = {id:number;x:number;y:number};
const activeContacts = new WeakMap<CDPSession,Contact[]>();
async function touch(session:CDPSession,type:'touchStart'|'touchMove'|'touchEnd'|'touchCancel',points:Contact[]) {
  // Chromium's nonempty touchEnd list identifies the contacts being released.
  // Callers pass the remaining contacts; retain protocol IDs across the sequence.
  const emitted = type === 'touchEnd' && points.length ? (activeContacts.get(session) ?? []).filter(p=>!points.some(next=>next.id===p.id)) : points;
  await session.send('Input.dispatchTouchEvent',{type,touchPoints:emitted.map(p=>({...p,radiusX:2,radiusY:2,force:1}))});
  activeContacts.set(session,type==='touchCancel'?[]:points);
}
async function center(page:Page,selector:string,id:number):Promise<Contact> {
  const b=await page.locator(selector).boundingBox();if(!b)throw new Error(`Missing ${selector}`);return {id,x:b.x+b.width/2,y:b.y+b.height/2};
}
async function useTouch(page:Page,session:CDPSession) {
  const h=await page.locator('.arena-host').boundingBox();
  await touch(session,'touchStart',[{id:91,x:h!.width/2,y:h!.height/2}]);await touch(session,'touchMove',[{id:91,x:h!.width/2+1,y:h!.height/2}]);expect((await counts(page)).captures).toBe(0);await touch(session,'touchEnd',[]);await page.clock.runFor(20);
  await expect(page.locator('.arena-screen')).toHaveAttribute('data-input-mode','touch');
}
async function tracePointers(page:Page) {
  await page.evaluate(()=>{
    const events:unknown[]=[];Reflect.set(window,'nativePointers',events);
    const targets=new Map<number,Element>();Reflect.set(window,'nativePointerTargets',targets);
    for(const type of ['pointerdown','pointerup','pointercancel','gotpointercapture','lostpointercapture']) document.addEventListener(type,e=>{
      const p=e as PointerEvent;if(type==='pointerdown')targets.set(p.pointerId,p.target as Element);events.push({type,id:p.pointerId,pointerType:p.pointerType,trusted:p.isTrusted,control:(p.target as HTMLElement).closest<HTMLElement>('[data-control]')?.dataset.control ?? null});
    });
  });
}
test('native multitouch joypad plus QWE uses capture, real projectiles and damage/score',async({page,context},info)=>{
  await clockArena(page,'?combatScenario=targets&geometry=1');await page.setViewportSize(playableSize(390, 844));
  const session=await context.newCDPSession(page);await tracePointers(page);await useTouch(page,session);
  const joy=await center(page,'.joypad',10);joy.y-=24;
  const q=await center(page,'[data-control=front]',20),w=await center(page,'[data-control=port]',30),e=await center(page,'[data-control=starboard]',40);
  await touch(session,'touchStart',[joy]);await touch(session,'touchStart',[joy,q]);await touch(session,'touchStart',[joy,q,w]);await touch(session,'touchStart',[joy,q,w,e]);
  const captured=await touchNavigation(page);expect(captured.contacts).toHaveLength(4);expect(captured.contacts.every(c=>c.captured)).toBe(true);expect(new Set(captured.contacts.map(c=>c.id)).size).toBe(4);
  await page.clock.runFor(40);const simultaneous=await observe(page);expect(simultaneous.snapshot.projectiles).toHaveLength(7);expect(simultaneous.snapshot.player.position.yUnits).toBeLessThan(270);
  await screenshot(page,info,'touch-four-native-contacts-cooldown');
  await touch(session,'touchEnd',[q,w,e]);await page.clock.runFor(210);
  const damaged=await touchNavigation(page);expect(damaged.healthBars.find(b=>b.id==='front-target')!.health).toBe(20);await screenshot(page,info,'touch-chaser-damaged-real-projectile');
  await page.clock.runFor(1000);expect((await observe(page)).snapshot.score).toBe(3);expect((await touchNavigation(page)).healthBarGraphics).toBe(1);
  await touch(session,'touchEnd',[]);await page.clock.runFor(1400);expect((await observe(page)).snapshot.projectiles).toHaveLength(0);expect((await touchNavigation(page)).contacts).toEqual([]);
  const native=await page.evaluate(()=>Reflect.get(window,'nativePointers')) as {trusted:boolean;pointerType:string;type:string}[];expect(native.length).toBeGreaterThan(10);expect(native.every(e=>e.trusted&&e.pointerType==='touch')).toBe(true);expect(native.some(e=>e.type==='gotpointercapture')).toBe(true);
  await info.attach('native-multitouch-proof',{body:JSON.stringify({captured,simultaneous,damaged,native},null,2),contentType:'application/json'});await session.detach();await menu(page);
});

test('native independent releases, drag-out, foreign joypad ID, R cancel/up and pause with contacts',async({page,context},info)=>{
  await clockArena(page,'?combatScenario=empty');await page.setViewportSize(playableSize(320, 568));const session=await context.newCDPSession(page);await tracePointers(page);await useTouch(page,session);
  const joy=await center(page,'.joypad',1);joy.x+=28;
  const q=await center(page,'[data-control=front]',2),q2={...q,id:3,x:q.x+5},foreign={...joy,id:4,x:joy.x-40};
  await touch(session,'touchStart',[joy]);await touch(session,'touchStart',[joy,q]);await touch(session,'touchStart',[joy,q,q2]);await touch(session,'touchStart',[joy,q,q2,foreign]);await page.clock.runFor(40);
  let n=await touchNavigation(page);expect(n.contacts).toHaveLength(3);expect(n.sources.fire.front).toHaveLength(2);const owner=n.sources.joypad;
  const foreignId=await page.evaluate(owner=>{const events=Reflect.get(window,'nativePointers') as {type:string;id:number;control:string}[];return events.find(e=>e.type==='pointerdown'&&e.control==='joypad'&&e.id!==owner)!.id;},owner);
  expect(await page.evaluate(id=>(Reflect.get(window,'nativePointerTargets') as Map<number,Element>).get(id)!.hasPointerCapture(id),foreignId)).toBe(false);
  await page.locator('[data-control=port]').focus();expect((await touchNavigation(page)).sources.joypad).toBe(owner);
  const dragged={...q,x:5,y:150};await touch(session,'touchMove',[joy,dragged,q2,foreign]);await touch(session,'touchEnd',[joy,q2,foreign]);
  n=await touchNavigation(page);expect(n.sources.fire.front).toHaveLength(1);expect(n.sources.moving, JSON.stringify(n)).toBe(true);
  await touch(session,'touchEnd',[joy,q2]);expect((await touchNavigation(page)).sources.joypad).toBe(owner);
  await touch(session,'touchCancel',[]);expect((await touchNavigation(page)).contacts).toEqual([]);expect((await touchNavigation(page)).sources.moving).toBe(false);
  await page.clock.runFor(1400);expect((await observe(page)).snapshot.projectiles).toHaveLength(0);
  const r=await center(page,'[data-control=R]',10);const before=(await observe(page)).snapshot;
  await touch(session,'touchStart',[r]);await touch(session,'touchCancel',[]);await page.clock.runFor(40);expect((await observe(page)).snapshot.autoSailEnabled).toBe(false);
  await touch(session,'touchStart',[r]);await touch(session,'touchMove',[{...r,x:5,y:150}]);await touch(session,'touchEnd',[]);await page.clock.runFor(40);expect((await observe(page)).snapshot.autoSailEnabled).toBe(false);
  await touch(session,'touchStart',[r]);await touch(session,'touchEnd',[]);expect((await observe(page)).snapshot.autoSailEnabled).toBe(false);await page.clock.runFor(40);expect((await observe(page)).snapshot.autoSailEnabled).toBe(true);
  await page.clock.runFor(40);expect((await observe(page)).snapshot.autoSailEnabled).toBe(true); // automatic lostcapture/click did not toggle again
  await touch(session,'touchStart',[joy,q]);await page.clock.runFor(40);await page.getByRole('button',{name:'Pause',exact:true}).evaluate((b:HTMLButtonElement)=>b.click());
  const paused=(await observe(page)).snapshot, cooldown=await page.locator('.skills').innerHTML();expect(paused.autoSailEnabled).toBe(false);expect((await touchNavigation(page)).contacts).toEqual([]);
  const dialogBox=await page.getByRole('dialog',{name:'Paused',exact:true}).boundingBox();expect(dialogBox!.x).toBeGreaterThanOrEqual(0);expect(dialogBox!.x+dialogBox!.width).toBeLessThanOrEqual(320);
  await page.clock.runFor(30000);expect((await observe(page)).snapshot).toEqual(paused);expect(await page.locator('.skills').innerHTML()).toBe(cooldown);
  await screenshot(page,info,'touch-paused-cooldown-exact');await touch(session,'touchEnd',[]);await page.getByRole('button',{name:'Resume',exact:true}).click();await page.clock.runFor(1400);
  expect((await observe(page)).snapshot.player.position).toEqual(paused.player.position);expect((await observe(page)).snapshot.projectiles).toHaveLength(0);expect((await touchNavigation(page)).sources.moving).toBe(false);
  // A native lost-capture event before up cancels the pending R intention.
  await touch(session,'touchStart',[r]);await touch(session,'touchMove',[{...r,x:r.x+1}]);const pending=(await touchNavigation(page)).contacts[0]!;
  await page.locator('[data-control=R]').evaluate((b,id)=>b.releasePointerCapture(id),pending.id);await touch(session,'touchMove',[{...r,x:r.x+2}]);await touch(session,'touchEnd',[]);await page.clock.runFor(40);expect((await observe(page)).snapshot.autoSailEnabled).toBe(false);
  await info.attach('release-cancel-R-proof',{body:JSON.stringify({before,paused,native:await page.evaluate(()=>Reflect.get(window,'nativePointers'))},null,2),contentType:'application/json'});await session.detach();await menu(page);
});

test('native mode switches neutralize without stepping; resize and DPR retain the same match and logical command',async({page,context},info)=>{
  await clockArena(page,'?combatScenario=empty&seed=12');const session=await context.newCDPSession(page);
  expect((await touchNavigation(page)).mode).toBe(await page.evaluate(()=>matchMedia('(pointer: coarse)').matches ? 'touch' : 'desktop')); // primary capability selects initial mode
  await pointWorld(page,900,270);await page.clock.runFor(600);await page.keyboard.press('r');await page.clock.runFor(40);
  const before=(await observe(page)).snapshot,id=await page.locator('.arena-screen').getAttribute('data-match-id'),setup=await currentSetup(page);
  const h=await page.locator('.arena-host').boundingBox();await touch(session,'touchStart',[{id:1,x:h!.width/2,y:h!.height/2}]);await touch(session,'touchEnd',[]);
  expect((await observe(page)).snapshot).toEqual({...before,autoSailEnabled:false});expect((await observe(page)).target).toBeNull();await page.clock.runFor(20);
  const joy=await center(page,'.joypad',2);joy.y-=30;await touch(session,'touchStart',[joy]);await page.clock.runFor(40);await touch(session,'touchEnd',[]);
  const r=await center(page,'[data-control=R]',3);await touch(session,'touchStart',[r]);await touch(session,'touchEnd',[]);await page.clock.runFor(40);
  const stable=(await observe(page)).snapshot,logical=(await touchNavigation(page)).sources;
  for(const [width,height] of ([[320,568],[844,390],[568,320]]).map(playableLayout)) {await page.setViewportSize({width:width!,height:height!});expect((await observe(page)).snapshot).toEqual(stable);expect((await touchNavigation(page)).sources).toEqual(logical);expect((await touchNavigation(page)).mode).toBe('touch');}
  await session.send('Emulation.setDeviceMetricsOverride',{width:568,height:320,deviceScaleFactor:2,mobile:false});await session.send('Emulation.setEmulatedMedia',{media:'screen'});
  expect((await observe(page)).snapshot).toEqual(stable);expect((await touchNavigation(page)).sources).toEqual(logical);expect(await page.locator('.arena-screen').getAttribute('data-match-id')).toBe(id);expect(await currentSetup(page)).toEqual(setup);
  await page.mouse.move(200,160);expect((await observe(page)).snapshot).toEqual({...stable,autoSailEnabled:false});expect((await touchNavigation(page)).mode).toBe('desktop');expect((await touchNavigation(page)).sources.direction).toBeNull();
  await info.attach('same-match-modes-resize-dpr',{body:JSON.stringify({before,stable,final:await observe(page),id,setup},null,2),contentType:'application/json'});await session.detach();await menu(page);
});

async function hudGeometry(page:Page,width:number,height:number) {
  const result=await page.evaluate(()=>{
    const box=(e:Element)=>{const r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
    const host=document.querySelector<HTMLElement>('.arena-host')!;
    return {scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,viewport:JSON.parse(host.dataset.viewport!),insets:JSON.parse(host.dataset.insets!),top:box(document.querySelector('[data-hud-band=top]')!),bottom:box(document.querySelector('[data-hud-band=bottom]')!),controls:[...document.querySelectorAll('.skill,.joypad,.pause-control,.menu-control')].map(box)};
  });
  expect(result.scrollWidth).toBe(width);expect(result.scrollHeight).toBe(height);expect(result.viewport.renderable).toBe(true);
  expect(result.viewport.offsetY).toBeGreaterThanOrEqual(result.top.bottom-0.1);
  expect(result.viewport.offsetY+540*result.viewport.scale).toBeLessThanOrEqual(result.bottom.top+0.1);
  expect(result.viewport.offsetX).toBeGreaterThanOrEqual(result.insets.left-0.1);expect(result.viewport.offsetX+960*result.viewport.scale).toBeLessThanOrEqual(width-result.insets.right+0.1);
  for(const b of result.controls){expect(b.width).toBeGreaterThanOrEqual(48);expect(b.height).toBeGreaterThanOrEqual(48);expect(b.left).toBeGreaterThanOrEqual(0);expect(b.right).toBeLessThanOrEqual(width);expect(b.top).toBeGreaterThanOrEqual(0);expect(b.bottom).toBeLessThanOrEqual(height);}
  for(let i=0;i<result.controls.length;i++)for(let j=i+1;j<result.controls.length;j++){
    const a=result.controls[i]!,b=result.controls[j]!;expect(a.right<=b.left+.1||b.right<=a.left+.1||a.bottom<=b.top+.1||b.bottom<=a.top+.1).toBe(true);
  }
  const n=await touchNavigation(page);expect(n.healthBarGraphics).toBe((await observe(page)).snapshot.enemies.length+1);
  for(const bar of n.healthBars){expect(bar.rotation).toBe(0);expect(bar.width*result.viewport.scale).toBeGreaterThanOrEqual(24-1e-6);expect(bar.height*result.viewport.scale).toBeGreaterThanOrEqual(4-1e-6);expect(bar.x).toBeGreaterThanOrEqual(0);expect(bar.x+bar.width).toBeLessThanOrEqual(960);expect(bar.y).toBeGreaterThanOrEqual(0);expect(bar.y+bar.height).toBeLessThanOrEqual(540);}
  return result;
}
test('HUD measured bands, safe areas, all five layouts and horizontal bars from real damage',async({page,context},info)=>{
  await clockArena(page,'?combatScenario=targets&geometry=1');const session=await context.newCDPSession(page);
  await pointWorld(page,480,0);await page.clock.runFor(40);await screenshot(page,info,'hud-desktop-1280x900-ready');
  await page.keyboard.down('q');await page.clock.runFor(40);await page.keyboard.up('q');await page.clock.runFor(230);
  const chaser=await touchNavigation(page);expect(chaser.healthBars.find(b=>b.id==='front-target')!.fraction).toBe(.5);await screenshot(page,info,'hud-desktop-chaser-half-health');
  await pointWorld(page,350,270);await page.clock.runFor(650);await page.keyboard.down('q');await page.clock.runFor(30);await page.keyboard.up('q');await page.clock.runFor(300);
  const shooter=await touchNavigation(page);expect(shooter.healthBars.find(b=>b.id==='port-target')!.health).toBe(40);await screenshot(page,info,'hud-desktop-rotated-shooter-damaged');
  await page.keyboard.press('r');for(const key of ['q','w','e'])await page.keyboard.down(key);await page.clock.runFor(40);for(const key of ['q','w','e'])await page.keyboard.up(key);
  await expect(page.locator('[data-control=R]')).toHaveAttribute('data-state','On');await screenshot(page,info,'hud-desktop-1280x900-cooldown-Ron');await hudGeometry(page,1280,900);
  await useTouch(page,session);const measurements=[];
  for(const [width,height] of ([[320,568],[390,844],[844,390],[568,320]]).map(playableLayout)) {
    await page.setViewportSize({width:width!,height:height!});await page.clock.runFor(40);
    await page.locator('.arena-screen').evaluate(e=>{const s=(e as HTMLElement).style;s.setProperty('--safe-top','7px');s.setProperty('--safe-bottom','9px');s.setProperty('--safe-left','5px');s.setProperty('--safe-right','6px');});
    await page.clock.runFor(40);await expect.poll(()=>page.locator('.arena-host').evaluate(h=>{const i=JSON.parse((h as HTMLElement).dataset.insets!);return Math.abs(i.top-document.querySelector('[data-hud-band=top]')!.getBoundingClientRect().bottom)<.1&&i.left===5;})).toBe(true);const measured=await hudGeometry(page,width!,height!);measurements.push({width,height,measured});
    expect(measured.insets.top).toBeCloseTo(measured.top.bottom);expect(measured.insets.bottom).toBeCloseTo(height!-measured.bottom.top);expect(measured.insets.left).toBe(5);expect(measured.insets.right).toBe(6);
    await screenshot(page,info,`hud-touch-${width}x${height}-safe-ready`);
    if(!(await observe(page)).snapshot.autoSailEnabled) {const r=await center(page,'[data-control=R]',80);await touch(session,'touchStart',[r]);await touch(session,'touchEnd',[]);}
    const q=await center(page,'[data-control=front]',81),w=await center(page,'[data-control=port]',82),e=await center(page,'[data-control=starboard]',83);
    await touch(session,'touchStart',[q,w,e]);await page.clock.runFor(40);await touch(session,'touchEnd',[]);await screenshot(page,info,`hud-touch-${width}x${height}-cooldown-Ron`);
  }
  await menu(page);await page.evaluate(()=>history.replaceState(null,'','/?seed=0&geometry=1'));await startClockPlay(page);
  while((await observe(page)).snapshot.player.health===100)await page.clock.runFor(100);
  const playerDamage=(await observe(page)).snapshot;expect(playerDamage.player.health).toBeLessThan(100);expect(playerDamage.player.health).toBeGreaterThan(0);
  await page.setViewportSize(playableSize(390, 844));await screenshot(page,info,'hud-player-real-contact-damage-390x844');await page.getByRole('button',{name:'Pause',exact:true}).click();const damagedBars=await touchNavigation(page);expect(damagedBars.healthBars.find(b=>b.id==='player')!.fraction).toBe(playerDamage.player.health/100);
  await screenshot(page,info,'hud-player-real-contact-damage-paused-390x844');await page.clock.runFor(10000);expect((await touchNavigation(page)).healthBars).toEqual(damagedBars.healthBars);
  await info.attach('hud-geometry-real-damage',{body:JSON.stringify({chaser,shooter,playerDamage,damagedBars,measurements,safeAreas:'Controlled CSS insets, not physical notch hardware.'},null,2),contentType:'application/json'});await session.detach();await menu(page);
});

test('native contacts are cleared across five Pause Menu Play cycles and active-pointer teardown',async({page,context},info)=>{
  await clockArena(page,'?combatScenario=empty');await menu(page);const baseline=await counts(page),session=await context.newCDPSession(page),cycles=[];
  for(let cycle=0;cycle<5;cycle++) {
    await startClockPlay(page);await useTouch(page,session);const joy=await center(page,'.joypad',10);joy.x+=24;const q=await center(page,'[data-control=front]',20);
    const foreign={...joy,id:30,x:joy.x-20};await touch(session,'touchStart',[joy,q,foreign]);await touch(session,'touchMove',[{...joy,x:joy.x+1},q,foreign]);await page.clock.runFor(40);const active=await counts(page);expect((await touchNavigation(page)).contacts).toHaveLength(2);
    if(cycle%2===0){await page.getByRole('button',{name:'Pause',exact:true}).evaluate((b:HTMLButtonElement)=>b.click());expect((await touchNavigation(page)).contacts).toEqual([]);await screenshot(page,info,`touch-cycle-${cycle}-paused`);}
    // Main Menu synchronously freezes and clears active contacts before abandonment.
    await menu(page);await touch(session,'touchEnd',[]);const removed=await counts(page);expect(removed).toMatchObject({applications:0,resources:0,subscriptions:0,inputListeners:0,canvases:0,observers:0,resize:1,density:1,frames:0,navigation:null,cache:{leases:0}});expect(removed.nativeInput).toBe(baseline.nativeInput);expect(removed.orphanBattleInput).toBe(0);expect(removed.captures).toBe(0);cycles.push({active,removed});
  }
  await startClockPlay(page);await page.clock.runFor(1400);expect((await observe(page)).snapshot).toMatchObject({autoSailEnabled:false,player:{position:{xUnits:480,yUnits:270}},projectiles:[]});expect((await touchNavigation(page)).contacts).toEqual([]);
  await info.attach('native-five-cycles',{body:JSON.stringify(cycles,null,2),contentType:'application/json'});await session.detach();await menu(page);
});














