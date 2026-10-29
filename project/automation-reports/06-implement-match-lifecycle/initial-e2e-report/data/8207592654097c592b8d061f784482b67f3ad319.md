# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: arena.spec.ts >> retains target across leave/resize/DPR; blur and hidden freeze until accessible Resume and new R
- Location: tests\e2e\arena.spec.ts:152:1

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator:  getByRole('region', { name: 'Sailing controls' })
Expected: focused
Received: inactive
Timeout:  15000ms

Call log:
  - Expect "toBeFocused" getByRole('region', { name: 'Sailing controls' }) with timeout 15000ms
  - waiting for getByRole('region', { name: 'Sailing controls' })
    33 × locator resolved to <div tabindex="0" role="region" class="arena-host" aria-hidden="false" data-ticker-started="false" aria-label="Sailing controls" aria-describedby="sailing-instructions" data-player="{"xUnits":510,"yUnits":270,"headingRadians":0,"width":33,"height":56.5,"rotation":-1.5707963267948966}" data-viewport="{"renderable":true,"scale":0.3333333333333333,"availableWidth":320,"availableHeight":432,"offsetX":0,"offsetY":174}">…</div>
       - unexpected value "inactive"

```

```yaml
- region "Sailing controls"
```

# Test source

```ts
  67  | });
  68  | 
  69  | test('keyboard menu/loading/arena/menu and five Strict Mode cycles reuse textures',async({page},info)=>{
  70  |   await page.goto('/');await expect(page.getByRole('heading',{name:'Pirate Battle'})).toBeVisible();
  71  |   await screenshot(page,info,'menu-desktop');
  72  |   await page.setViewportSize({width:320,height:568});
  73  |   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320);
  74  |   await expect(page.getByRole('heading',{name:'Pirate Battle'})).toBeVisible();await screenshot(page,info,'menu-320x568');
  75  |   await page.setViewportSize({width:1280,height:900});const initial=await counts(page);const cycles=[];
  76  |   for(let cycle=1;cycle<=5;cycle++) {
  77  |     const start=Date.now();await page.getByRole('button',{name:'Play',exact:true}).focus();await page.keyboard.press('Enter');
  78  |     await expect(page.getByRole('heading',{name:'Loading',exact:true})).toBeVisible();
  79  |     if(cycle===1)await screenshot(page,info,'loading');
  80  |     await arena(page);expect(Date.now()-start).toBeGreaterThanOrEqual(300);
  81  |     await expect(page.getByRole('region',{name:'Sailing controls'})).toBeFocused();
  82  |     const mounted=await counts(page);
  83  |     expect(mounted.nativeInput).toBeGreaterThanOrEqual(initial.nativeInput+7);
  84  |     if(cycles.length)expect(mounted.nativeInput).toBe(cycles[0]!.mounted.nativeInput);
  85  |     expect(mounted).toMatchObject({applications:1,resources:1,subscriptions:1,canvases:1,observers:2,resize:1,density:1,frames:1,cache:{leases:1,pending:false}});
  86  |     await expect(page.locator('.arena-host')).toHaveAttribute('data-ticker-started','false');
  87  |     await menu(page);await expect(page.getByRole('button',{name:'Play',exact:true})).toBeFocused();await settled(page);
  88  |     const unmounted=await counts(page);
  89  |     expect(unmounted.nativeInput).toBe(initial.nativeInput);
  90  |     expect(unmounted).toMatchObject({applications:0,resources:0,subscriptions:0,inputListeners:0,canvases:0,observers:0,resize:0,density:0,frames:0,cache:{leases:0,pending:false}});
  91  |     expect(unmounted.cache.textures).toBeGreaterThan(0);cycles.push({cycle,mounted,unmounted});
  92  |   }
  93  |   await info.attach('resource-cycles',{body:JSON.stringify({initial,cycles},null,2),contentType:'application/json'});
  94  | });
  95  | 
  96  | async function observe(page: Page) { return page.evaluate(() => window.__arenaDiagnostics().navigation!); }
  97  | async function pointWorld(page: Page, x: number, y: number) {
  98  |   const point = await page.locator('.arena-host').evaluate((host, p) => {
  99  |     const v = JSON.parse((host as HTMLElement).dataset.viewport!), rect = host.getBoundingClientRect();
  100 |     return { x: rect.left + v.offsetX + p.x * v.scale, y: rect.top + v.offsetY + p.y * v.scale };
  101 |   }, { x, y });
  102 |   await page.mouse.move(point.x, point.y);
  103 | }
  104 | async function clockArena(page: Page, query = '?geometry=1') {
  105 |   await page.clock.install({time:new Date('2026-10-27T12:00:00Z')}); await page.clock.pauseAt(new Date('2026-10-27T12:00:01Z'));
  106 |   await page.goto(`/${query}`); await page.getByRole('button', { name: 'Play', exact: true }).click();
  107 |   for (let n = 0; n < 30 && await page.locator('.arena-screen').getAttribute('data-state') !== 'ready'; n++) await page.clock.runFor(100);
  108 |   await arena(page,false);
  109 |   // Asset/graphics completion is asynchronous relative to the controlled clock.
  110 |   // Establish a running RAF baseline before testing short held-input intervals.
  111 |   const mountedStep = (await observe(page)).snapshot.step;
  112 |   for (let n=0;n<10&&(await observe(page)).snapshot.step<mountedStep+3;n++) await page.clock.runFor(20);
  113 |   expect((await observe(page)).snapshot.step).toBeGreaterThanOrEqual(mountedStep+3);
  114 | }
  115 | async function sailTo(page: Page, x: number, y: number) {
  116 |   expect((await observe(page)).snapshot.autoSailEnabled).toBe(false);
  117 |   await pointWorld(page, x, y); await page.clock.runFor(1100);
  118 |   const p = (await observe(page)).snapshot.player.position;
  119 |   await page.keyboard.press('r'); await page.clock.runFor(Math.max(20, (Math.hypot(x - p.xUnits, y - p.yUnits) - 5) / 150 * 1000));
  120 |   await page.keyboard.press('r'); await page.clock.runFor(40);
  121 |   const result = (await observe(page)).snapshot;
  122 |   expect(result.autoSailEnabled).toBe(false); expect(result.player.health).toBe(100);
  123 |   expect(Math.hypot(result.player.position.xUnits - x, result.player.position.yUnits - y)).toBeLessThan(12);
  124 |   return result;
  125 | }
  126 | test('real mouse and R traverse four sides of both islands and slide at frontal/oblique contact', async ({ page }, info) => {
  127 |   await clockArena(page,'?combatScenario=empty&geometry=1'); const observations = [];
  128 |   for (const [x, y] of [[350,270],[350,60],[85,60],[85,260],[350,260],[600,280],[870,280],[870,495],[600,495],[600,280]]) {
  129 |     observations.push({ waypoint: [x,y], snapshot: await sailTo(page,x!,y!) });
  130 |     await screenshot(page, info, `route-${x}-${y}`);
  131 |   }
  132 |   await sailTo(page, 350, 150); await pointWorld(page,210,150); await page.clock.runFor(1100);
  133 |   await page.keyboard.down('r'); await page.clock.runFor(1800);
  134 |   const frontal = await observe(page); expect(frontal.snapshot.autoSailEnabled).toBe(true); expect(frontal.snapshot.player.health).toBe(100);
  135 |   expect(frontal.snapshot.player.position.xUnits).toBeGreaterThan(305); expect(frontal.snapshot.player.position.xUnits).toBeLessThan(315);
  136 |   await page.keyboard.down('r'); await page.clock.runFor(500); expect((await observe(page)).snapshot.autoSailEnabled).toBe(true);
  137 |   await page.keyboard.up('r'); await screenshot(page,info,'northwest-frontal-held-r');
  138 |   await pointWorld(page,160,30); await page.clock.runFor(1200); const oblique = await observe(page);
  139 |   expect(oblique.snapshot.player.position.yUnits).toBeLessThan(frontal.snapshot.player.position.yUnits - 30);
  140 |   expect(oblique.snapshot.player.health).toBe(100); await screenshot(page,info,'northwest-oblique-slide');
  141 |   await page.keyboard.press('r'); await page.clock.runFor(40);
  142 |   await sailTo(page,600,280); await sailTo(page,600,385); await pointWorld(page,740,385); await page.clock.runFor(1100);
  143 |   await page.keyboard.press('r'); await page.clock.runFor(1600); const southeast = await observe(page);
  144 |   expect(southeast.snapshot.player.position.xUnits).toBeGreaterThan(640); expect(southeast.snapshot.player.position.xUnits).toBeLessThan(650); expect(southeast.snapshot.player.health).toBe(100);
  145 |   await screenshot(page,info,'southeast-frontal'); await pointWorld(page,850,260); await page.clock.runFor(1400);
  146 |   expect((await observe(page)).snapshot.player.position.yUnits).toBeLessThan(southeast.snapshot.player.position.yUnits - 30);
  147 |   await screenshot(page,info,'southeast-oblique-slide');
  148 |   await info.attach('navigation-observations',{body:JSON.stringify({observations,frontal,oblique,southeast,final:await observe(page)},null,2),contentType:'application/json'});
  149 |   await menu(page);
  150 | });
  151 | 
  152 | test('retains target across leave/resize/DPR; blur and hidden freeze until accessible Resume and new R', async ({ page, context }, info) => {
  153 |   await clockArena(page,'?combatScenario=empty&geometry=1'); await pointWorld(page,900,270); await page.clock.runFor(500);
  154 |   const stored = (await observe(page)).target; await page.mouse.move(-10,-10); // header/letterbox leave does not replace target
  155 |   expect((await observe(page)).target).toEqual(stored);
  156 |   await page.keyboard.down('r'); await page.clock.runFor(200);
  157 |   // Browser focus transition; no gameplay mutation or direct freeze call.
  158 |   const focusSession = await context.newCDPSession(page); await focusSession.send('Emulation.setFocusEmulationEnabled',{enabled:false});
  159 |   const other = await context.newPage(); await other.goto('about:blank'); await other.bringToFront();
  160 |   await page.clock.runFor(100); await expect(page.getByRole('button',{name:'Resume',exact:true})).toBeVisible();
  161 |   const paused = await observe(page); expect(paused.snapshot.state).toBe('paused'); expect(paused.snapshot.autoSailEnabled).toBe(false); expect(paused.target).toBeNull(); await settled(page);
  162 |   await page.clock.runFor(30000); await page.bringToFront(); await page.clock.runFor(1000); expect(await observe(page)).toEqual(paused);
  163 |   await page.keyboard.up('r'); await screenshot(page,info,'paused-desktop');
  164 |   await page.setViewportSize({width:320,height:568}); await page.clock.runFor(30); await screenshot(page,info,'paused-320');
  165 |   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320);
  166 |   await page.getByRole('button',{name:'Resume',exact:true}).focus(); await page.keyboard.press('Enter');
> 167 |   await expect(page.getByRole('region',{name:'Sailing controls'})).toBeFocused(); await page.clock.runFor(1000);
      |                                                                    ^ Error: expect(locator).toBeFocused() failed
  168 |   expect((await observe(page)).snapshot.player).toEqual(paused.snapshot.player); expect((await observe(page)).snapshot.autoSailEnabled).toBe(false);
  169 |   await page.keyboard.press('Shift+r'); await page.clock.runFor(20); expect((await observe(page)).snapshot.autoSailEnabled).toBe(false);
  170 |   await page.evaluate(()=>{const editor=document.createElement('input');editor.setAttribute('aria-label','Test editor');document.querySelector('.arena-host')!.append(editor);});
  171 |   await page.getByRole('textbox',{name:'Test editor'}).focus(); await page.keyboard.press('r'); await page.clock.runFor(40); expect((await observe(page)).snapshot.autoSailEnabled).toBe(false);
  172 |   await page.getByRole('textbox',{name:'Test editor'}).evaluate(node=>node.remove());
  173 |   await page.getByRole('button',{name:'Main Menu',exact:true}).focus(); await page.keyboard.press('r'); await page.clock.runFor(20); expect((await observe(page)).snapshot.autoSailEnabled).toBe(false);
  174 |   await page.getByRole('region',{name:'Sailing controls'}).focus(); await pointWorld(page,900,270); const target = (await observe(page)).target;
  175 |   const beforeResize = (await observe(page)).snapshot.player.position;
  176 |   for (const [width,height] of [[390,844],[844,390]]) { await page.setViewportSize({width:width!,height:height!}); await page.clock.runFor(50); expect((await observe(page)).target).toEqual(target); expect((await observe(page)).snapshot.player.position).toEqual(beforeResize); }
  177 |   const session = await context.newCDPSession(page); await session.send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:2,mobile:false}); await session.send('Emulation.setEmulatedMedia',{media:'screen'}); await page.clock.runFor(50);
  178 |   expect((await observe(page)).target).toEqual(target); expect((await observe(page)).snapshot.player.position).toEqual(beforeResize);
  179 |   await session.send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:1,mobile:false}); await session.send('Emulation.setEmulatedMedia',{media:''}); await session.detach();
  180 |   await page.keyboard.press('r'); await page.clock.runFor(200); expect((await observe(page)).snapshot.autoSailEnabled).toBe(true);
  181 |   // Chromium automation preserves visible state even for background/minimized tabs.
  182 |   // Emulate the platform visibility signal only; no gameplay state or callback is set.
  183 |   await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  184 |   await page.clock.runFor(100); const hidden = await observe(page);
  185 |   expect(hidden.snapshot.state).toBe('paused');expect(hidden.snapshot.autoSailEnabled).toBe(false);expect(hidden.target).toBeNull();
  186 |   await page.clock.runFor(30000);expect(await observe(page)).toEqual(hidden);
  187 |   await page.evaluate(()=>{Reflect.deleteProperty(document,'hidden');document.dispatchEvent(new Event('visibilitychange'));});
  188 |   await page.clock.runFor(100);expect(await observe(page)).toEqual(hidden);await screenshot(page,info,'hidden-paused-landscape');
  189 |   const immutable = await page.evaluate(()=>{const d=window.__arenaDiagnostics();try{Object.assign(d.navigation!.snapshot.player.position,{xUnits:0});}catch{/* Expected frozen inspection. */}return Object.isFrozen(d.navigation!.snapshot.player.position)&&window.__arenaDiagnostics().navigation!.snapshot.player.position.xUnits!==0;});expect(immutable).toBe(true);
  190 |   await info.attach('focus-observations',{body:JSON.stringify({paused,afterResume:beforeResize,hidden,visibilitySignal:'document.hidden getter + visibilitychange; native CDP blur, no gameplay setters'},null,2),contentType:'application/json'});
  191 |   await focusSession.detach();await other.close(); await menu(page);
  192 | });
  193 | test('fail-once before cold/warm cache and Retry without refresh',async({page},info)=>{
  194 |   await page.goto('/?assetScenario=fail-once');await page.getByRole('button',{name:'Play',exact:true}).click();
  195 |   await expect(page.getByRole('heading',{name:'Loading failed'})).toBeVisible();expect((await counts(page)).cache.textures).toBe(0);
  196 |   await screenshot(page,info,'fail-once');await page.getByRole('button',{name:'Retry',exact:true}).click();await arena(page);await menu(page);
  197 |   await page.getByRole('button',{name:'Play',exact:true}).click();await arena(page);await menu(page);
  198 |   // A new page session first warms normally, then configures the documented URL in-place.
  199 |   await page.goto('/');await page.getByRole('button',{name:'Play',exact:true}).click();await arena(page);await menu(page);
  200 |   const warm=(await counts(page)).cache.textures;
  201 |   await page.evaluate(()=>history.replaceState(null,'','/?assetScenario=fail-once'));
  202 |   await page.getByRole('button',{name:'Play',exact:true}).click();await expect(page.getByRole('heading',{name:'Loading failed'})).toBeVisible();
  203 |   expect((await counts(page)).cache.textures).toBe(warm);expect((await counts(page)).cache.leases).toBe(0);
  204 |   await page.getByRole('button',{name:'Retry',exact:true}).click();await arena(page);expect((await counts(page)).cache.textures).toBe(warm);await menu(page);
  205 | });
  206 | test('Main Menu cancels a pending load and old callbacks cannot replace a new attempt',async({page})=>{
  207 |   let release!:()=>void;let requested!:()=>void;const requestStarted=new Promise<void>(resolve=>{requested=resolve;});const gate=new Promise<void>(resolve=>{release=resolve;});
  208 |   await page.route('**/*ship_5*.png*',async route=>{requested();await gate;await route.continue();});
  209 |   await page.goto('/');await page.getByRole('button',{name:'Play',exact:true}).click();await requestStarted;
  210 |   await expect(page.getByRole('heading',{name:'Loading',exact:true})).toBeVisible();await menu(page);
  211 |   expect((await counts(page)).cache.pending).toBe(true);expect((await counts(page)).cache.leases).toBe(0);
  212 |   release();await expect.poll(async()=> (await counts(page)).cache.pending).toBe(false);
  213 |   await expect(page.getByRole('button',{name:'Play',exact:true})).toBeVisible();await expect(page.locator('canvas')).toHaveCount(0);
  214 |   await page.getByRole('button',{name:'Play',exact:true}).click();await arena(page);await menu(page);
  215 | });
  216 | test('real asset failure retries and graphics init failure stays semantic',async({page},info)=>{
  217 |   let failing=true;
  218 |   await page.route('**/*ship_5*.png*',async route=>{if(failing)await route.fulfill({status:200,contentType:'image/png',body:'invalid image bytes'});else await route.continue();});
  219 |   await page.goto('/');await page.getByRole('button',{name:'Play',exact:true}).click();await expect(page.getByRole('heading',{name:'Loading failed'})).toBeVisible();
  220 |   await expect(page.locator('canvas')).toHaveCount(0);failing=false;await page.getByRole('button',{name:'Retry',exact:true}).click();await arena(page);await menu(page);
  221 |   await page.addInitScript(()=>{HTMLCanvasElement.prototype.getContext=(()=>null) as typeof HTMLCanvasElement.prototype.getContext;});
  222 |   await page.goto('/');await page.getByRole('button',{name:'Play',exact:true}).click();await expect(page.getByRole('heading',{name:'Loading failed'})).toBeVisible();
  223 |   await expect(page.getByRole('button',{name:'Retry',exact:true})).toBeVisible();await expect(page.locator('canvas')).toHaveCount(0);
  224 |   expect((await counts(page)).applications).toBe(0);expect((await counts(page)).cache.leases).toBe(0);
  225 |   await screenshot(page,info,'graphics-failure');await menu(page);
  226 | });
  227 | test('fits desktop/portrait/landscape and isolated DPR changes without rebuilding',async({page,context},info)=>{
  228 |   await page.goto('/?geometry=1');await page.getByRole('button',{name:'Play',exact:true}).click();await arena(page);
  229 |   const samples=[];
  230 |   for(const [label,width,height] of [['desktop',1280,900],['320x568',320,568],['390x844',390,844],['844x390',844,390]] as const) {
  231 |     await page.setViewportSize({width,height});await expect.poll(()=>page.locator('canvas').evaluate(c=>(c as HTMLCanvasElement).width)).toBe(width);
  232 |     const sample=await page.locator('.arena-host').evaluate(host=>({viewport:JSON.parse((host as HTMLElement).dataset.viewport!),player:JSON.parse((host as HTMLElement).dataset.player!),width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth}));
  233 |     expect(sample.scrollWidth).toBe(width);const v=sample.viewport;expect(v.renderable).toBe(true);
  234 |     expect(v.offsetX).toBeGreaterThanOrEqual(-1e-8);expect(v.offsetY).toBeGreaterThanOrEqual(48-1e-8);
  235 |     expect(v.offsetX+960*v.scale).toBeLessThanOrEqual(width+1e-8);expect(v.offsetY+540*v.scale).toBeLessThanOrEqual(height-88+1e-8);
  236 |     expect(sample.player).toEqual({xUnits:480,yUnits:270,headingRadians:-Math.PI/2,width:33,height:56.5,rotation:-Math.PI});
  237 |     samples.push({label,...sample});await screenshot(page,info,label);
  238 |   }
  239 |   const before=await page.locator('.arena-host').getAttribute('data-viewport');
  240 |   const session=await context.newCDPSession(page);
  241 |   await session.send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:2,mobile:false});
  242 |   // CDP metrics updates DPR but Chromium defers media-query evaluation until media invalidation.
  243 |   // This emits the native resolution change; no application callback/resize is invoked.
  244 |   await session.send('Emulation.setEmulatedMedia',{media:'screen'});
  245 |   await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBe(2);
  246 |   await expect.poll(()=>page.locator('canvas').evaluate(c=>(c as HTMLCanvasElement).width)).toBe(1688);
  247 |   expect(await page.locator('.arena-host').getAttribute('data-viewport')).toBe(before);expect((await counts(page)).canvases).toBe(1);
  248 |   const raw=await session.send('Page.captureScreenshot',{format:'png'});
  249 |   const dprFile=path.resolve(evidence,`${info.project.name}-844x390-dpr2.png`);await writeFile(dprFile,Buffer.from(raw.data,'base64'));await info.attach('844x390-dpr2',{path:dprFile,contentType:'image/png'});samples.push({label:'dpr2',buffer:await page.locator('canvas').evaluate(c=>[(c as HTMLCanvasElement).width,(c as HTMLCanvasElement).height]),dpr:await page.evaluate(()=>devicePixelRatio)});
  250 |   await session.send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:1,mobile:false});
  251 |   await session.send('Emulation.setEmulatedMedia',{media:''});
  252 |   await expect.poll(()=>page.locator('canvas').evaluate(c=>(c as HTMLCanvasElement).width)).toBe(844);
  253 |   await session.detach();
  254 |   await info.attach('viewport-observations',{body:JSON.stringify(samples,null,2),contentType:'application/json'});
  255 |   // Use an actual touch event on the provided DOM action.
  256 |   const button=await page.getByRole('button',{name:'Main Menu',exact:true}).boundingBox();expect(button).not.toBeNull();await page.touchscreen.tap(button!.x+button!.width/2,button!.y+button!.height/2);
  257 |   await page.getByRole('button',{name:'Abandon',exact:true}).click();
  258 |   await expect(page.getByRole('button',{name:'Play',exact:true})).toBeVisible();await expect(page.locator('canvas')).toHaveCount(0);
  259 | });
  260 | 
  261 | 
  262 | 
  263 | 
  264 | test('real Q W E destroy diagnostic targets through collisions, orientation and simultaneous sailing', async ({ page }, info) => {
  265 |   await clockArena(page, '?combatScenario=targets&geometry=1');
  266 |   const initial = await observe(page); expect(initial.snapshot.enemies.map(e => e.health)).toEqual([40,60,60]);
  267 |   await expect(page.getByLabel('Combat status')).toHaveText('Score 0Q ReadyW ReadyE Ready');
```