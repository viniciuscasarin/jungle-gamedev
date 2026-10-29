# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: arena.spec.ts >> lifecycle Escape P Pause, contained dialogs, Keep Playing stays Paused, real AI death and result visuals
- Location: tests\e2e\arena.spec.ts:441:1

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
    33 × locator resolved to <div tabindex="0" role="region" class="arena-host" aria-hidden="false" data-ticker-started="false" aria-label="Sailing controls" aria-describedby="sailing-instructions" data-viewport="{"renderable":true,"scale":0.4703703703703704,"availableWidth":844,"availableHeight":254,"offsetX":196.22222222222223,"offsetY":48}" data-player="{"xUnits":480.7832472113771,"yUnits":262.547900573205,"headingRadians":-1.413716694115406,"width":33,"height":56.5,"rotation":-2.9845130209103026}">…</div>
       - unexpected value "inactive"

```

```yaml
- region "Sailing controls"
```

# Test source

```ts
  356 | 
  357 | 
  358 | test('normal director telegraphs freeze with active time, materializes both archetypes and real Q earns score',async({page,context},info)=>{
  359 |   await clockArena(page,'?geometry=1');
  360 |   while((await observe(page)).snapshot.activeTimeMs<3150)await page.clock.runFor(50);
  361 |   const warning=await observe(page);expect(warning.telegraphGraphics).toBe(1);expect(warning.snapshot.reservations).toHaveLength(1);expect(warning.snapshot.enemies).toHaveLength(0);
  362 |   await screenshot(page,info,'spawn-warning');
  363 |   const focusSession=await context.newCDPSession(page);await focusSession.send('Emulation.setFocusEmulationEnabled',{enabled:false});
  364 |   const other=await context.newPage();await other.goto('about:blank');await other.bringToFront();
  365 |   await expect(page.getByRole('button',{name:'Resume',exact:true})).toBeVisible();const paused=await observe(page);await page.clock.runFor(15000);expect(await observe(page)).toEqual(paused);
  366 |   await page.setViewportSize({width:320,height:568});await page.clock.runFor(50);expect(await observe(page)).toEqual(paused);await screenshot(page,info,'spawn-warning-paused-320');await page.setViewportSize({width:1280,height:900});
  367 |   await page.bringToFront();await page.getByRole('button',{name:'Resume',exact:true}).click();await page.clock.runFor(100);
  368 |   expect((await observe(page)).snapshot.reservations).toHaveLength(1);
  369 |   while((await observe(page)).snapshot.activeTimeMs<3650)await page.clock.runFor(50);
  370 |   const chaser=await observe(page);expect(chaser.snapshot.enemies[0]!.archetype).toBe('chaser');expect(chaser.snapshot.reservations).toHaveLength(0);expect(chaser.telegraphGraphics).toBe(0);
  371 |   await screenshot(page,info,'autonomous-chaser');
  372 |   await pointWorld(page,chaser.snapshot.enemies[0]!.position.xUnits,chaser.snapshot.enemies[0]!.position.yUnits);await page.clock.runFor(500);
  373 |   await page.getByRole('region',{name:'Sailing controls'}).focus();await page.keyboard.down('q');
  374 |   for(let i=0;i<25 && (await observe(page)).snapshot.score===0;i++){
  375 |     const enemy=(await observe(page)).snapshot.enemies.find(e=>e.archetype==='chaser');if(!enemy)break;
  376 |     await pointWorld(page,enemy.position.xUnits,enemy.position.yUnits);await page.clock.runFor(100);
  377 |   }
  378 |   await page.keyboard.up('q');const killed=await observe(page);expect(killed.snapshot.score).toBeGreaterThanOrEqual(1);await screenshot(page,info,'autonomous-kill-score');
  379 |   while((await observe(page)).snapshot.activeTimeMs<6650)await page.clock.runFor(50);
  380 |   const both=await observe(page);expect(both.snapshot.enemies.some(e=>e.archetype==='shooter')).toBe(true);await screenshot(page,info,'autonomous-shooter-after-chaser-kill');
  381 |   await info.attach('director-observations',{body:JSON.stringify({warning,paused,chaser,both,killed},null,2),contentType:'application/json'});
  382 |   await focusSession.detach();await other.close();await menu(page);const stopped=await counts(page);expect(stopped.frames).toBe(0);expect(stopped.inputListeners).toBe(0);expect(stopped.cache.leases).toBe(0);
  383 |   await page.getByRole('button',{name:'Play',exact:true}).click();for(let n=0;n<30&&await page.locator('.arena-screen').getAttribute('data-state')!=='ready';n++)await page.clock.runFor(100);await arena(page,false);
  384 |   expect((await observe(page)).snapshot.score).toBe(0);while((await observe(page)).snapshot.activeTimeMs<3100)await page.clock.runFor(50);expect((await observe(page)).telegraphGraphics).toBe(1);await menu(page);expect((await counts(page)).navigation).toBeNull();expect((await counts(page)).frames).toBe(0);
  385 | });
  386 | 
  387 | test('normal island preparation blocks Shooter fire until it navigates to actual line of sight',async({page},info)=>{
  388 |   await clockArena(page,'?combatScenario=island&geometry=1');const initial=await observe(page);expect(initial.snapshot.enemies[0]!.position.xUnits).toBeLessThan(100);
  389 |   await page.clock.runFor(1400);expect((await observe(page)).snapshot.projectiles.filter(p=>p.faction==='enemy')).toEqual([]);await screenshot(page,info,'shooter-island-blocked');
  390 |   let firing=await observe(page);
  391 |   for(let i=0;i<70&&!firing.snapshot.projectiles.some(p=>p.faction==='enemy');i++){await page.clock.runFor(100);firing=await observe(page);}
  392 |   expect(firing.snapshot.projectiles.some(p=>p.faction==='enemy')).toBe(true);expect(firing.snapshot.enemies.find(e=>e.id==='island-shooter')!.position).not.toEqual(initial.snapshot.enemies[0]!.position);
  393 |   await screenshot(page,info,'shooter-island-clear-fire');await info.attach('island-observations',{body:JSON.stringify({initial,firing},null,2),contentType:'application/json'});await menu(page);
  394 | });
  395 | 
  396 | async function runToResult(page: Page, maxMs = 125000) {
  397 |   for (let elapsed = 0; elapsed < maxMs && !(await page.getByRole('heading', { name: 'Result', exact: true }).isVisible()); elapsed += 1000) await page.clock.runFor(1000);
  398 |   await expect(page.getByRole('heading', { name: 'Result', exact: true })).toBeVisible();
  399 | }
  400 | async function saveOptions(page: Page, sessionDurationMs = 60000, enemySpawnIntervalMs = 1000) {
  401 |   await page.evaluate(data => localStorage.setItem('pirate-battle.options.v1', JSON.stringify({version:1,data})), {sessionDurationMs,enemySpawnIntervalMs});
  402 | }
  403 | async function currentSetup(page: Page) {
  404 |   return page.evaluate(() => (window.__arenaDiagnostics().navigation as unknown as {setup:{configuration:{options:{sessionDurationMs:number;enemySpawnIntervalMs:number};world:{widthUnits:number;heightUnits:number;playerStart:{xUnits:number;yUnits:number}};ships:{player:{hullRadiusUnits:number}}};seed:number}}).setup);
  405 | }
  406 | async function startClockPlay(page: Page) {
  407 |   await page.getByRole('button',{name:'Play',exact:true}).click();
  408 |   for(let n=0;n<40&&await page.locator('.arena-screen').getAttribute('data-state')!=='ready';n++)await page.clock.runFor(100);
  409 |   await arena(page,false);
  410 |   await page.clock.runFor(50);
  411 | }
  412 | 
  413 | test('lifecycle valid 60s empty timer, terminal freeze, historical Last Result, refresh and current-settings replay',async({page},info)=>{
  414 |   test.setTimeout(180000);
  415 |   await page.clock.install({time:new Date('2026-10-28T03:00:00Z')});await page.clock.pauseAt(new Date('2026-10-28T03:00:01Z'));
  416 |   await page.goto('/?combatScenario=empty&seed=123');await saveOptions(page);await startClockPlay(page);
  417 |   const firstId=await page.locator('.arena-screen').getAttribute('data-match-id');
  418 |   expect((await currentSetup(page)).configuration.options.sessionDurationMs).toBe(60000);
  419 |   await saveOptions(page,180000,10000); // changes after capture must affect only the next preparation
  420 |   await page.clock.runFor(59000);expect((await observe(page)).snapshot.state).toBe('playing');
  421 |   await runToResult(page,3000);await expect(page.getByText('Time expired',{exact:true})).toBeVisible();
  422 |   await expect(page.getByText('Saved on this device',{exact:true})).toBeVisible();
  423 |   const terminal=await observe(page);expect(terminal.snapshot).toMatchObject({state:'completed',activeTimeMs:60000,step:3600,score:0,player:{health:100},projectiles:[],reservations:[]});
  424 |   const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('pirate-battle.last-result.v1')!));
  425 |   expect(persisted.data).toMatchObject({matchId:firstId,activeDurationMs:60000,score:0,endReason:'time_expired',configuration:{options:{sessionDurationMs:60000}},seed:123});
  426 |   await page.clock.runFor(30000);expect(await observe(page)).toEqual(terminal);expect((await counts(page)).frames).toBe(0);
  427 |   await page.setViewportSize({width:320,height:568});await page.clock.runFor(40);expect(await observe(page)).toEqual(terminal);await screenshot(page,info,'result-time-320');
  428 |   for(const [width,height,label] of [[1280,900,'desktop'],[320,568,'320'],[844,390,'landscape']] as const){
  429 |     await page.setViewportSize({width,height});await page.clock.runFor(40);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);await screenshot(page,info,`result-time-${label}`);
  430 |   }
  431 |   await menu(page);await expect(page.getByRole('button',{name:'Last Result',exact:true})).toBeVisible();
  432 |   for(const [width,height,label] of [[1280,900,'desktop'],[320,568,'320'],[844,390,'landscape']] as const){await page.setViewportSize({width,height});await screenshot(page,info,`menu-last-result-${label}`);}
  433 |   await page.getByRole('button',{name:'Last Result',exact:true}).click();await expect(page.getByRole('heading',{name:'Result',exact:true})).toBeFocused();expect((await counts(page)).navigation).toBeNull();
  434 |   expect(await page.locator('.result-screen').getAttribute('data-match-id')).toBe(firstId);await menu(page);
  435 |   await page.reload();await expect(page.getByRole('button',{name:'Last Result',exact:true})).toBeVisible();await page.getByRole('button',{name:'Last Result',exact:true}).click();
  436 |   await page.getByRole('button',{name:'Play Again',exact:true}).click();for(let n=0;n<40&&await page.locator('.arena-screen').getAttribute('data-state')!=='ready';n++)await page.clock.runFor(100);
  437 |   await arena(page,false);const replayId=await page.locator('.arena-screen').getAttribute('data-match-id');expect(replayId).not.toBe(firstId);
  438 |   expect((await currentSetup(page)).configuration.options).toEqual({sessionDurationMs:180000,enemySpawnIntervalMs:10000});
  439 |   const replay=await observe(page);expect(replay.snapshot).toMatchObject({score:0,autoSailEnabled:false,player:{health:100},enemies:[],projectiles:[],reservations:[],cooldownsMs:{front:0,port:0,starboard:0}});expect(replay.snapshot.activeTimeMs).toBeLessThan(200);expect(replay.target).toBeNull();
  440 |   // Refresh abandons the active replay; no active-session storage is written.
  441 |   await page.reload();await expect(page.getByRole('button',{name:'Play',exact:true})).toBeVisible();expect((await counts(page)).navigation).toBeNull();
  442 |   expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('pirate-battle.last-result.v1')!).data)).toEqual(persisted.data);
  443 |   await info.attach('lifecycle-timer-replay',{body:JSON.stringify({terminal,persisted,replay,replayId,firstId},null,2),contentType:'application/json'});
  444 | });
  445 | 
  446 | test('lifecycle Escape P Pause, contained dialogs, Keep Playing stays Paused, real AI death and result visuals',async({page},info)=>{
  447 |   test.setTimeout(180000);
  448 |   await clockArena(page,'?geometry=1&seed=0');
  449 |   await pointWorld(page,900,270);for(const key of ['q','w','e'])await page.keyboard.down(key);await page.keyboard.press('r');await page.clock.runFor(50);
  450 |   await page.keyboard.press('Escape');const paused=await observe(page);expect(paused.snapshot.state).toBe('paused');expect(paused.snapshot.autoSailEnabled).toBe(false);expect(paused.target).toBeNull();expect((await counts(page)).frames).toBe(0);
  451 |   await expect(page.getByRole('button',{name:'Resume',exact:true})).toBeFocused();
  452 |   await page.keyboard.press('Shift+Tab');await expect(page.getByRole('button',{name:'Main Menu',exact:true})).toBeFocused();await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Resume',exact:true})).toBeFocused();
  453 |   await page.keyboard.press('p');await page.keyboard.press('Escape');await page.keyboard.press('q');await page.clock.runFor(30000);expect(await observe(page)).toEqual(paused);
  454 |   for(const [width,height,label] of [[1280,900,'desktop'],[320,568,'320'],[844,390,'landscape']] as const){
  455 |     await page.setViewportSize({width,height});await page.clock.runFor(40);await screenshot(page,info,`paused-${label}`);
> 456 |     await page.getByRole('button',{name:'Main Menu',exact:true}).click();await expect(page.getByRole('dialog',{name:'Abandon this match?'})).toBeVisible();await expect(page.getByRole('button',{name:'Keep Playing',exact:true})).toBeFocused();
      |                                                                                                                                      ^ Error: expect(locator).toBeFocused() failed
  457 |     await screenshot(page,info,`abandon-confirm-${label}`);await page.keyboard.press('Shift+Tab');await expect(page.getByRole('button',{name:'Abandon',exact:true})).toBeFocused();await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Keep Playing',exact:true})).toBeFocused();
  458 |     await page.keyboard.press('q');await page.getByRole('button',{name:'Keep Playing',exact:true}).click();await expect(page.getByRole('button',{name:'Resume',exact:true})).toBeFocused();expect(await observe(page)).toEqual(paused);
  459 |   }
  460 |   for(const key of ['q','w','e'])await page.keyboard.up(key);
  461 |   await page.getByRole('button',{name:'Resume',exact:true}).click();await expect(page.getByRole('region',{name:'Sailing controls'})).toBeFocused();await page.clock.runFor(50);expect((await observe(page)).snapshot.autoSailEnabled).toBe(false);
  462 |   await page.keyboard.press('p');const p=await observe(page);expect(p.snapshot.state).toBe('paused');await page.clock.runFor(5000);expect(await observe(page)).toEqual(p);
  463 |   await page.getByRole('button',{name:'Resume',exact:true}).click();await page.clock.runFor(50);await page.getByRole('button',{name:'Pause',exact:true}).click();expect((await observe(page)).snapshot.state).toBe('paused');
  464 |   await page.getByRole('button',{name:'Resume',exact:true}).click();await runToResult(page);
  465 |   await expect(page.getByText('Ship destroyed',{exact:true})).toBeVisible();const dead=await observe(page);expect(dead.snapshot.player.health).toBe(0);expect(dead.snapshot.state).toBe('completed');expect(dead.snapshot.activeTimeMs).toBeLessThan(120000);
  466 |   for(const [width,height,label] of [[1280,900,'desktop'],[320,568,'320'],[844,390,'landscape']] as const){await page.setViewportSize({width,height});await page.clock.runFor(40);await screenshot(page,info,`result-death-${label}`);}
  467 |   await info.attach('lifecycle-ai-death',{body:JSON.stringify({paused,p,dead},null,2),contentType:'application/json'});await menu(page);
  468 | });
  469 | 
  470 | test('lifecycle denied storage keeps play and memory result available with honest status',async({page},info)=>{
  471 |   test.setTimeout(180000);
  472 |   await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('Access denied','SecurityError');}});});
  473 |   await clockArena(page,'?seed=0');await runToResult(page);
  474 |   await expect(page.getByText('Ship destroyed',{exact:true})).toBeVisible();await expect(page.getByRole('status')).toContainText('Could not save on this device');
  475 |   await screenshot(page,info,'result-storage-denied');const id=await page.locator('.result-screen').getAttribute('data-match-id');await menu(page);
  476 |   await expect(page.getByRole('status')).toContainText('could not be read');await page.getByRole('button',{name:'Last Result',exact:true}).click();expect(await page.locator('.result-screen').getAttribute('data-match-id')).toBe(id);expect((await counts(page)).navigation).toBeNull();
  477 |   await page.getByRole('button',{name:'Play Again',exact:true}).click();for(let n=0;n<40&&await page.locator('.arena-screen').getAttribute('data-state')!=='ready';n++)await page.clock.runFor(100);await arena(page,false);await menu(page);
  478 | });
  479 | 
  480 | test('lifecycle captured custom renderer geometry and pointer world clamp survive resize',async({page},info)=>{
  481 |   await clockArena(page,'?combatScenario=empty&configScenario=custom&geometry=1&seed=23');const setup=await currentSetup(page);expect(setup.configuration.world).toMatchObject({widthUnits:1200,heightUnits:600,playerStart:{xUnits:600,yUnits:300}});
  482 |   expect((await observe(page)).snapshot.player.position).toEqual({xUnits:600,yUnits:300});expect(setup.configuration.ships.player.hullRadiusUnits).toBe(22);
  483 |   await pointWorld(page,600,-20);expect((await observe(page)).target).toEqual({xUnits:600,yUnits:0});
  484 |   await page.getByRole('button',{name:'Pause',exact:true}).click();const paused=await observe(page);
  485 |   for(const [width,height] of [[320,568],[844,390]]){await page.setViewportSize({width:width!,height:height!});await page.clock.runFor(40);expect(await observe(page)).toEqual(paused);const v=await page.locator('.arena-host').evaluate(h=>JSON.parse((h as HTMLElement).dataset.viewport!));expect(v.offsetX+1200*v.scale).toBeLessThanOrEqual(width!+1e-6);expect(v.offsetY+600*v.scale).toBeLessThanOrEqual(height!-88+1e-6);}
  486 |   await screenshot(page,info,'captured-custom-map');await menu(page);
  487 | });
  488 | 
  489 | test('lifecycle five completed replay abandon cycles have no stale native resources under Strict Mode',async({page},info)=>{
  490 |   test.setTimeout(240000);
  491 |   await clockArena(page,'?seed=0');await menu(page);const baseline=await counts(page), cycles=[];
  492 |   for(let cycle=0;cycle<5;cycle++){
  493 |     await startClockPlay(page);const id=await page.locator('.arena-screen').getAttribute('data-match-id');await runToResult(page);const completed=await counts(page);expect(completed.frames).toBe(0);expect(completed.navigation!.snapshot.state).toBe('completed');
  494 |     await page.getByRole('button',{name:'Play Again',exact:true}).click();for(let n=0;n<40&&await page.locator('.arena-screen').getAttribute('data-state')!=='ready';n++)await page.clock.runFor(100);await arena(page,false);
  495 |     const fresh=await counts(page);expect(await page.locator('.arena-screen').getAttribute('data-match-id')).not.toBe(id);expect(fresh).toMatchObject({applications:1,resources:1,subscriptions:1,inputListeners:7,canvases:1,observers:2,resize:1,density:1});expect(fresh.navigation!.snapshot).toMatchObject({score:0,player:{health:100},enemies:[],projectiles:[],reservations:[],autoSailEnabled:false,cooldownsMs:{front:0,port:0,starboard:0}});
  496 |     await page.getByRole('button',{name:'Pause',exact:true}).click();await page.getByRole('button',{name:'Main Menu',exact:true}).click();await page.getByRole('button',{name:'Abandon',exact:true}).click();
  497 |     const removed=await counts(page);expect(removed).toMatchObject({applications:0,resources:0,subscriptions:0,inputListeners:0,canvases:0,observers:0,resize:0,density:0,frames:0,navigation:null,cache:{leases:0}});expect(removed.nativeInput).toBe(baseline.nativeInput);expect(removed.cache.textures).toBe(baseline.cache.textures);
  498 |     expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('pirate-battle.last-result.v1')!).data.matchId)).toBe(id);cycles.push({cycle,id,completed,fresh,removed});
  499 |   }
  500 |   await info.attach('lifecycle-five-cycles',{body:JSON.stringify({baseline,cycles,limitation:'Headless Chromium counters; not a hardware memory/FPS benchmark.'},null,2),contentType:'application/json'});
  501 | });
  502 | 
```