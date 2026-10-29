# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: arena.spec.ts >> native independent releases, drag-out, foreign joypad ID, R cancel/up and pause with contacts
- Location: tests\e2e\arena.spec.ts:558:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: false
Received: true
```

# Page snapshot

```yaml
- main [ref=e3]:
  - region "Sailing controls" [active] [ref=e4]
  - generic:
    - generic [ref=e6]:
      - generic "Health 100/100" [ref=e7]:
        - meter "Player health" [ref=e8]
      - generic [ref=e12]:
        - heading "Arena" [level=1] [ref=e13]
        - generic "Combat status" [ref=e14]: Score 0
        - generic "Match status" [ref=e15]: Time 120s · Playing
        - button "Pause" [ref=e16] [cursor=pointer]
        - button "Main Menu" [ref=e18] [cursor=pointer]
    - generic [ref=e19]:
      - status [ref=e20]: Drag joypad to steer and sail · Hold skills to fire · Auto-sail Off
      - generic [ref=e21]:
        - group "Sailing joypad" [ref=e22]:
          - generic [ref=e24]: Steer / sail
        - generic "Ship skills" [ref=e25]:
          - 'button "Front cannon Q: 0.4s" [ref=e26] [cursor=pointer]':
            - generic [ref=e27]: Q
            - generic [ref=e28]: 0.4s
          - 'button "Port broadside W: Ready" [ref=e29] [cursor=pointer]':
            - generic [ref=e30]: W
            - generic [ref=e31]: Ready
          - 'button "Starboard broadside E: Ready" [ref=e32] [cursor=pointer]':
            - generic [ref=e33]: E
            - generic [ref=e34]: Ready
          - 'button "Auto-sail R: Off" [ref=e35] [cursor=pointer]':
            - generic [ref=e36]: R
            - generic [ref=e37]: "Off"
```

# Test source

```ts
  465 |   for(const key of ['q','w','e'])await page.keyboard.up(key);
  466 |   await page.getByRole('button',{name:'Resume',exact:true}).click();await expect(page.getByRole('region',{name:'Sailing controls'})).toBeFocused();await page.clock.runFor(50);expect((await observe(page)).snapshot.autoSailEnabled).toBe(false);
  467 |   await page.keyboard.press('p');const p=await observe(page);expect(p.snapshot.state).toBe('paused');await page.clock.runFor(5000);expect(await observe(page)).toEqual(p);
  468 |   await page.getByRole('button',{name:'Resume',exact:true}).click();await page.clock.runFor(50);await page.getByRole('button',{name:'Pause',exact:true}).click();expect((await observe(page)).snapshot.state).toBe('paused');
  469 |   await page.getByRole('button',{name:'Resume',exact:true}).click();await runToResult(page);
  470 |   await expect(page.getByText('Ship destroyed',{exact:true})).toBeVisible();const dead=await observe(page);expect(dead.snapshot.player.health).toBe(0);expect(dead.snapshot.state).toBe('completed');expect(dead.snapshot.activeTimeMs).toBeLessThan(120000);
  471 |   for(const [width,height,label] of [[1280,900,'desktop'],[320,568,'320'],[844,390,'landscape']] as const){await page.setViewportSize({width,height});await page.clock.runFor(40);await screenshot(page,info,`result-death-${label}`);}
  472 |   await info.attach('lifecycle-ai-death',{body:JSON.stringify({paused,p,dead},null,2),contentType:'application/json'});await menu(page);
  473 | });
  474 | 
  475 | test('lifecycle denied storage keeps play and memory result available with honest status',async({page},info)=>{
  476 |   test.setTimeout(180000);
  477 |   await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('Access denied','SecurityError');}});});
  478 |   await clockArena(page,'?seed=0');await runToResult(page);
  479 |   await expect(page.getByText('Ship destroyed',{exact:true})).toBeVisible();await expect(page.getByRole('status')).toContainText('Could not save on this device');
  480 |   await screenshot(page,info,'result-storage-denied');const id=await page.locator('.result-screen').getAttribute('data-match-id');await menu(page);
  481 |   await expect(page.getByRole('status')).toContainText('could not be read');await page.getByRole('button',{name:'Last Result',exact:true}).click();expect(await page.locator('.result-screen').getAttribute('data-match-id')).toBe(id);expect((await counts(page)).navigation).toBeNull();
  482 |   await page.getByRole('button',{name:'Play Again',exact:true}).click();for(let n=0;n<40&&await page.locator('.arena-screen').getAttribute('data-state')!=='ready';n++)await page.clock.runFor(100);await arena(page,false);await menu(page);
  483 | });
  484 | 
  485 | test('lifecycle captured custom renderer geometry and pointer world clamp survive resize',async({page},info)=>{
  486 |   await clockArena(page,'?combatScenario=empty&configScenario=custom&geometry=1&seed=23');const setup=await currentSetup(page);expect(setup.configuration.world).toMatchObject({widthUnits:1200,heightUnits:600,playerStart:{xUnits:600,yUnits:300}});
  487 |   expect((await observe(page)).snapshot.player.position).toEqual({xUnits:600,yUnits:300});expect(setup.configuration.ships.player.hullRadiusUnits).toBe(22);
  488 |   // Use the actual letterbox below the measured HUD.
  489 |   await pointWorld(page,600,-1);expect((await observe(page)).target).toEqual({xUnits:600,yUnits:0});
  490 |   await page.getByRole('button',{name:'Pause',exact:true}).click();const paused=await observe(page);
  491 |   for(const [width,height] of [[320,568],[844,390]]){await page.setViewportSize({width:width!,height:height!});await page.clock.runFor(40);expect(await observe(page)).toEqual(paused);const v=await page.locator('.arena-host').evaluate(h=>JSON.parse((h as HTMLElement).dataset.viewport!));expect(v.offsetX+1200*v.scale).toBeLessThanOrEqual(width!+1e-6);expect(v.offsetY+600*v.scale).toBeLessThanOrEqual(height!-88+1e-6);}
  492 |   await screenshot(page,info,'captured-custom-map');await menu(page);
  493 | });
  494 | 
  495 | test('lifecycle five completed replay abandon cycles have no stale native resources under Strict Mode',async({page},info)=>{
  496 |   test.setTimeout(240000);
  497 |   await clockArena(page,'?seed=0');await menu(page);const baseline=await counts(page), cycles=[];
  498 |   for(let cycle=0;cycle<5;cycle++){
  499 |     await startClockPlay(page);const id=await page.locator('.arena-screen').getAttribute('data-match-id');await runToResult(page);const completed=await counts(page);expect(completed.frames).toBe(0);expect(completed.navigation!.snapshot.state).toBe('completed');
  500 |     await page.getByRole('button',{name:'Play Again',exact:true}).click();for(let n=0;n<40&&await page.locator('.arena-screen').getAttribute('data-state')!=='ready';n++)await page.clock.runFor(100);await arena(page,false);
  501 |     const fresh=await counts(page);expect(await page.locator('.arena-screen').getAttribute('data-match-id')).not.toBe(id);expect(fresh).toMatchObject({applications:1,resources:1,subscriptions:1,inputListeners:13,canvases:1,observers:2,resize:1,density:1});expect(fresh.navigation!.snapshot).toMatchObject({score:0,player:{health:100},enemies:[],projectiles:[],reservations:[],autoSailEnabled:false,cooldownsMs:{front:0,port:0,starboard:0}});
  502 |     await page.getByRole('button',{name:'Pause',exact:true}).click();await page.getByRole('button',{name:'Main Menu',exact:true}).click();await page.getByRole('button',{name:'Abandon',exact:true}).click();
  503 |     const removed=await counts(page);expect(removed).toMatchObject({applications:0,resources:0,subscriptions:0,inputListeners:0,canvases:0,observers:0,resize:0,density:0,frames:0,navigation:null,cache:{leases:0}});expect(removed.nativeInput).toBe(baseline.nativeInput);expect(removed.cache.textures).toBe(baseline.cache.textures);
  504 |     expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('pirate-battle.last-result.v1')!).data.matchId)).toBe(id);cycles.push({cycle,id,completed,fresh,removed});
  505 |   }
  506 |   await info.attach('lifecycle-five-cycles',{body:JSON.stringify({baseline,cycles,limitation:'Headless Chromium counters; not a hardware memory/FPS benchmark.'},null,2),contentType:'application/json'});
  507 | });
  508 | 
  509 | interface TouchNavigation {
  510 |   mode: string; contacts: {id:number;control:string;captured:boolean}[];
  511 |   sources: {joypad:number|null;moving:boolean;direction:unknown;fire:Record<string,string[]>};
  512 |   healthBarGraphics:number; healthBars:{id:string;health:number;maxHealth:number;x:number;y:number;width:number;height:number;fraction:number;rotation:number}[];
  513 | }
  514 | async function touchNavigation(page:Page) { return page.evaluate(()=>window.__arenaDiagnostics().navigation as unknown as TouchNavigation); }
  515 | type Contact = {id:number;x:number;y:number};
  516 | const activeContacts = new WeakMap<CDPSession,Contact[]>();
  517 | async function touch(session:CDPSession,type:'touchStart'|'touchMove'|'touchEnd'|'touchCancel',points:Contact[]) {
  518 |   // Chromium's nonempty touchEnd list identifies the contacts being released.
  519 |   // Callers pass the remaining contacts; retain protocol IDs across the sequence.
  520 |   const emitted = type === 'touchEnd' && points.length ? (activeContacts.get(session) ?? []).filter(p=>!points.some(next=>next.id===p.id)) : points;
  521 |   await session.send('Input.dispatchTouchEvent',{type,touchPoints:emitted.map(p=>({...p,radiusX:2,radiusY:2,force:1}))});
  522 |   activeContacts.set(session,type==='touchCancel'?[]:points);
  523 | }
  524 | async function center(page:Page,selector:string,id:number):Promise<Contact> {
  525 |   const b=await page.locator(selector).boundingBox();if(!b)throw new Error(`Missing ${selector}`);return {id,x:b.x+b.width/2,y:b.y+b.height/2};
  526 | }
  527 | async function useTouch(page:Page,session:CDPSession) {
  528 |   const h=await page.locator('.arena-host').boundingBox();
  529 |   await touch(session,'touchStart',[{id:91,x:h!.width/2,y:h!.height/2}]);await touch(session,'touchEnd',[]);await page.clock.runFor(20);
  530 |   await expect(page.locator('.arena-screen')).toHaveAttribute('data-input-mode','touch');
  531 | }
  532 | async function tracePointers(page:Page) {
  533 |   await page.evaluate(()=>{
  534 |     const events:unknown[]=[];Reflect.set(window,'nativePointers',events);
  535 |     const targets=new Map<number,Element>();Reflect.set(window,'nativePointerTargets',targets);
  536 |     for(const type of ['pointerdown','pointerup','pointercancel','gotpointercapture','lostpointercapture']) document.addEventListener(type,e=>{
  537 |       const p=e as PointerEvent;if(type==='pointerdown')targets.set(p.pointerId,p.target as Element);events.push({type,id:p.pointerId,pointerType:p.pointerType,trusted:p.isTrusted,control:(p.target as HTMLElement).closest<HTMLElement>('[data-control]')?.dataset.control ?? null});
  538 |     });
  539 |   });
  540 | }
  541 | test('native multitouch joypad plus QWE uses capture, real projectiles and damage/score',async({page,context},info)=>{
  542 |   await clockArena(page,'?combatScenario=targets&geometry=1');await page.setViewportSize({width:390,height:844});
  543 |   const session=await context.newCDPSession(page);await tracePointers(page);await useTouch(page,session);
  544 |   const joy=await center(page,'.joypad',10);joy.y-=24;
  545 |   const q=await center(page,'[data-control=front]',20),w=await center(page,'[data-control=port]',30),e=await center(page,'[data-control=starboard]',40);
  546 |   await touch(session,'touchStart',[joy]);await touch(session,'touchStart',[joy,q]);await touch(session,'touchStart',[joy,q,w]);await touch(session,'touchStart',[joy,q,w,e]);
  547 |   const captured=await touchNavigation(page);expect(captured.contacts).toHaveLength(4);expect(captured.contacts.every(c=>c.captured)).toBe(true);expect(new Set(captured.contacts.map(c=>c.id)).size).toBe(4);
  548 |   await page.clock.runFor(40);const simultaneous=await observe(page);expect(simultaneous.snapshot.projectiles).toHaveLength(7);expect(simultaneous.snapshot.player.position.yUnits).toBeLessThan(270);
  549 |   await screenshot(page,info,'touch-four-native-contacts-cooldown');
  550 |   await touch(session,'touchEnd',[q,w,e]);await page.clock.runFor(210);
  551 |   const damaged=await touchNavigation(page);expect(damaged.healthBars.find(b=>b.id==='front-target')!.health).toBe(20);await screenshot(page,info,'touch-chaser-damaged-real-projectile');
  552 |   await page.clock.runFor(1000);expect((await observe(page)).snapshot.score).toBe(3);expect((await touchNavigation(page)).healthBarGraphics).toBe(1);
  553 |   await touch(session,'touchEnd',[]);await page.clock.runFor(1400);expect((await observe(page)).snapshot.projectiles).toHaveLength(0);expect((await touchNavigation(page)).contacts).toEqual([]);
  554 |   const native=await page.evaluate(()=>Reflect.get(window,'nativePointers')) as {trusted:boolean;pointerType:string;type:string}[];expect(native.length).toBeGreaterThan(10);expect(native.every(e=>e.trusted&&e.pointerType==='touch')).toBe(true);expect(native.some(e=>e.type==='gotpointercapture')).toBe(true);
  555 |   await info.attach('native-multitouch-proof',{body:JSON.stringify({captured,simultaneous,damaged,native},null,2),contentType:'application/json'});await session.detach();await menu(page);
  556 | });
  557 | 
  558 | test('native independent releases, drag-out, foreign joypad ID, R cancel/up and pause with contacts',async({page,context},info)=>{
  559 |   await clockArena(page,'?combatScenario=empty');await page.setViewportSize({width:320,height:568});const session=await context.newCDPSession(page);await tracePointers(page);await useTouch(page,session);
  560 |   const joy=await center(page,'.joypad',1);joy.x+=28;
  561 |   const q=await center(page,'[data-control=front]',2),q2={...q,id:3,x:q.x+5},foreign={...joy,id:4,x:joy.x-40};
  562 |   await touch(session,'touchStart',[joy]);await touch(session,'touchStart',[joy,q]);await touch(session,'touchStart',[joy,q,q2]);await touch(session,'touchStart',[joy,q,q2,foreign]);await page.clock.runFor(40);
  563 |   let n=await touchNavigation(page);expect(n.contacts).toHaveLength(3);expect(n.sources.fire.front).toHaveLength(2);const owner=n.sources.joypad;
  564 |   const foreignId=await page.evaluate(owner=>{const events=Reflect.get(window,'nativePointers') as {type:string;id:number;control:string}[];return events.find(e=>e.type==='pointerdown'&&e.control==='joypad'&&e.id!==owner)!.id;},owner);
> 565 |   expect(await page.evaluate(id=>(Reflect.get(window,'nativePointerTargets') as Map<number,Element>).get(id)!.hasPointerCapture(id),foreignId)).toBe(false);
      |                                                                                                                                                 ^ Error: expect(received).toBe(expected) // Object.is equality
  566 |   await page.locator('[data-control=port]').focus();expect((await touchNavigation(page)).sources.joypad).toBe(owner);
  567 |   const dragged={...q,x:5,y:150};await touch(session,'touchMove',[joy,dragged,q2,foreign]);await touch(session,'touchEnd',[joy,q2,foreign]);
  568 |   n=await touchNavigation(page);expect(n.sources.fire.front).toHaveLength(1);expect(n.sources.moving, JSON.stringify(n)).toBe(true);
  569 |   await touch(session,'touchEnd',[joy,q2]);expect((await touchNavigation(page)).sources.joypad).toBe(owner);
  570 |   await touch(session,'touchCancel',[]);expect((await touchNavigation(page)).contacts).toEqual([]);expect((await touchNavigation(page)).sources.moving).toBe(false);
  571 |   await page.clock.runFor(1400);expect((await observe(page)).snapshot.projectiles).toHaveLength(0);
  572 |   const r=await center(page,'[data-control=R]',10);const before=(await observe(page)).snapshot;
  573 |   await touch(session,'touchStart',[r]);await touch(session,'touchCancel',[]);await page.clock.runFor(40);expect((await observe(page)).snapshot.autoSailEnabled).toBe(false);
  574 |   await touch(session,'touchStart',[r]);await touch(session,'touchMove',[{...r,x:5,y:150}]);await touch(session,'touchEnd',[]);await page.clock.runFor(40);expect((await observe(page)).snapshot.autoSailEnabled).toBe(false);
  575 |   await touch(session,'touchStart',[r]);await touch(session,'touchEnd',[]);expect((await observe(page)).snapshot.autoSailEnabled).toBe(false);await page.clock.runFor(40);expect((await observe(page)).snapshot.autoSailEnabled).toBe(true);
  576 |   await page.clock.runFor(40);expect((await observe(page)).snapshot.autoSailEnabled).toBe(true); // automatic lostcapture/click did not toggle again
  577 |   await touch(session,'touchStart',[joy,q]);await page.clock.runFor(40);await page.getByRole('button',{name:'Pause',exact:true}).evaluate((b:HTMLButtonElement)=>b.click());
  578 |   const paused=(await observe(page)).snapshot, cooldown=await page.locator('.skills').innerHTML();expect(paused.autoSailEnabled).toBe(false);expect((await touchNavigation(page)).contacts).toEqual([]);
  579 |   const dialogBox=await page.getByRole('dialog',{name:'Paused',exact:true}).boundingBox();expect(dialogBox!.x).toBeGreaterThanOrEqual(0);expect(dialogBox!.x+dialogBox!.width).toBeLessThanOrEqual(320);
  580 |   await page.clock.runFor(30000);expect((await observe(page)).snapshot).toEqual(paused);expect(await page.locator('.skills').innerHTML()).toBe(cooldown);
  581 |   await screenshot(page,info,'touch-paused-cooldown-exact');await touch(session,'touchEnd',[]);await page.getByRole('button',{name:'Resume',exact:true}).click();await page.clock.runFor(1400);
  582 |   expect((await observe(page)).snapshot.player.position).toEqual(paused.player.position);expect((await observe(page)).snapshot.projectiles).toHaveLength(0);expect((await touchNavigation(page)).sources.moving).toBe(false);
  583 |   // A native lost-capture event before up cancels the pending R intention.
  584 |   await touch(session,'touchStart',[r]);await touch(session,'touchMove',[{...r,x:r.x+1}]);const pending=(await touchNavigation(page)).contacts[0]!;
  585 |   await page.locator('[data-control=R]').evaluate((b,id)=>b.releasePointerCapture(id),pending.id);await touch(session,'touchMove',[{...r,x:r.x+2}]);await touch(session,'touchEnd',[]);await page.clock.runFor(40);expect((await observe(page)).snapshot.autoSailEnabled).toBe(false);
  586 |   await info.attach('release-cancel-R-proof',{body:JSON.stringify({before,paused,native:await page.evaluate(()=>Reflect.get(window,'nativePointers'))},null,2),contentType:'application/json'});await session.detach();await menu(page);
  587 | });
  588 | 
  589 | test('native mode switches neutralize without stepping; resize and DPR retain the same match and logical command',async({page,context},info)=>{
  590 |   await clockArena(page,'?combatScenario=empty&seed=12');const session=await context.newCDPSession(page);
  591 |   expect((await touchNavigation(page)).mode).toBe(await page.evaluate(()=>matchMedia('(pointer: coarse)').matches ? 'touch' : 'desktop')); // primary capability selects initial mode
  592 |   await pointWorld(page,900,270);await page.clock.runFor(600);await page.keyboard.press('r');await page.clock.runFor(40);
  593 |   const before=(await observe(page)).snapshot,id=await page.locator('.arena-screen').getAttribute('data-match-id'),setup=await currentSetup(page);
  594 |   const h=await page.locator('.arena-host').boundingBox();await touch(session,'touchStart',[{id:1,x:h!.width/2,y:h!.height/2}]);await touch(session,'touchEnd',[]);
  595 |   expect((await observe(page)).snapshot).toEqual({...before,autoSailEnabled:false});expect((await observe(page)).target).toBeNull();await page.clock.runFor(20);
  596 |   const joy=await center(page,'.joypad',2);joy.y-=30;await touch(session,'touchStart',[joy]);await page.clock.runFor(40);await touch(session,'touchEnd',[]);
  597 |   const r=await center(page,'[data-control=R]',3);await touch(session,'touchStart',[r]);await touch(session,'touchEnd',[]);await page.clock.runFor(40);
  598 |   const stable=(await observe(page)).snapshot,logical=(await touchNavigation(page)).sources;
  599 |   for(const [width,height] of [[320,568],[844,390],[568,320]]) {await page.setViewportSize({width:width!,height:height!});expect((await observe(page)).snapshot).toEqual(stable);expect((await touchNavigation(page)).sources).toEqual(logical);expect((await touchNavigation(page)).mode).toBe('touch');}
  600 |   await session.send('Emulation.setDeviceMetricsOverride',{width:568,height:320,deviceScaleFactor:2,mobile:false});await session.send('Emulation.setEmulatedMedia',{media:'screen'});
  601 |   expect((await observe(page)).snapshot).toEqual(stable);expect((await touchNavigation(page)).sources).toEqual(logical);expect(await page.locator('.arena-screen').getAttribute('data-match-id')).toBe(id);expect(await currentSetup(page)).toEqual(setup);
  602 |   await page.mouse.move(200,160);expect((await observe(page)).snapshot).toEqual({...stable,autoSailEnabled:false});expect((await touchNavigation(page)).mode).toBe('desktop');expect((await touchNavigation(page)).sources.direction).toBeNull();
  603 |   await info.attach('same-match-modes-resize-dpr',{body:JSON.stringify({before,stable,final:await observe(page),id,setup},null,2),contentType:'application/json'});await session.detach();await menu(page);
  604 | });
  605 | 
  606 | async function hudGeometry(page:Page,width:number,height:number) {
  607 |   const result=await page.evaluate(()=>{
  608 |     const box=(e:Element)=>{const r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
  609 |     const host=document.querySelector<HTMLElement>('.arena-host')!;
  610 |     return {scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,viewport:JSON.parse(host.dataset.viewport!),insets:JSON.parse(host.dataset.insets!),top:box(document.querySelector('[data-hud-band=top]')!),bottom:box(document.querySelector('[data-hud-band=bottom]')!),controls:[...document.querySelectorAll('.skill,.joypad,.pause-control,.menu-control')].map(box)};
  611 |   });
  612 |   expect(result.scrollWidth).toBe(width);expect(result.scrollHeight).toBe(height);expect(result.viewport.renderable).toBe(true);
  613 |   expect(result.viewport.offsetY).toBeGreaterThanOrEqual(result.top.bottom-0.1);
  614 |   expect(result.viewport.offsetY+540*result.viewport.scale).toBeLessThanOrEqual(result.bottom.top+0.1);
  615 |   expect(result.viewport.offsetX).toBeGreaterThanOrEqual(result.insets.left-0.1);expect(result.viewport.offsetX+960*result.viewport.scale).toBeLessThanOrEqual(width-result.insets.right+0.1);
  616 |   for(const b of result.controls){expect(b.width).toBeGreaterThanOrEqual(48);expect(b.height).toBeGreaterThanOrEqual(48);expect(b.left).toBeGreaterThanOrEqual(0);expect(b.right).toBeLessThanOrEqual(width);expect(b.top).toBeGreaterThanOrEqual(0);expect(b.bottom).toBeLessThanOrEqual(height);}
  617 |   for(let i=0;i<result.controls.length;i++)for(let j=i+1;j<result.controls.length;j++){
  618 |     const a=result.controls[i]!,b=result.controls[j]!;expect(a.right<=b.left+.1||b.right<=a.left+.1||a.bottom<=b.top+.1||b.bottom<=a.top+.1).toBe(true);
  619 |   }
  620 |   const n=await touchNavigation(page);expect(n.healthBarGraphics).toBe((await observe(page)).snapshot.enemies.length+1);
  621 |   for(const bar of n.healthBars){expect(bar.rotation).toBe(0);expect(bar.width*result.viewport.scale).toBeGreaterThanOrEqual(24-1e-6);expect(bar.height*result.viewport.scale).toBeGreaterThanOrEqual(4-1e-6);expect(bar.x).toBeGreaterThanOrEqual(0);expect(bar.x+bar.width).toBeLessThanOrEqual(960);expect(bar.y).toBeGreaterThanOrEqual(0);expect(bar.y+bar.height).toBeLessThanOrEqual(540);}
  622 |   return result;
  623 | }
  624 | test('HUD measured bands, safe areas, all five layouts and horizontal bars from real damage',async({page,context},info)=>{
  625 |   await clockArena(page,'?combatScenario=targets&geometry=1');const session=await context.newCDPSession(page);
  626 |   await pointWorld(page,480,0);await page.clock.runFor(40);await screenshot(page,info,'hud-desktop-1280x900-ready');
  627 |   await page.keyboard.down('q');await page.clock.runFor(40);await page.keyboard.up('q');await page.clock.runFor(230);
  628 |   const chaser=await touchNavigation(page);expect(chaser.healthBars.find(b=>b.id==='front-target')!.fraction).toBe(.5);await screenshot(page,info,'hud-desktop-chaser-half-health');
  629 |   await pointWorld(page,350,270);await page.clock.runFor(650);await page.keyboard.down('q');await page.clock.runFor(30);await page.keyboard.up('q');await page.clock.runFor(300);
  630 |   const shooter=await touchNavigation(page);expect(shooter.healthBars.find(b=>b.id==='port-target')!.health).toBe(40);await screenshot(page,info,'hud-desktop-rotated-shooter-damaged');
  631 |   await page.keyboard.press('r');for(const key of ['q','w','e'])await page.keyboard.down(key);await page.clock.runFor(40);for(const key of ['q','w','e'])await page.keyboard.up(key);
  632 |   await expect(page.locator('[data-control=R]')).toHaveAttribute('data-state','On');await screenshot(page,info,'hud-desktop-1280x900-cooldown-Ron');await hudGeometry(page,1280,900);
  633 |   await useTouch(page,session);const measurements=[];
  634 |   for(const [width,height] of [[320,568],[390,844],[844,390],[568,320]]) {
  635 |     await page.setViewportSize({width:width!,height:height!});await page.clock.runFor(40);
  636 |     await page.locator('.arena-screen').evaluate(e=>{const s=(e as HTMLElement).style;s.setProperty('--safe-top','7px');s.setProperty('--safe-bottom','9px');s.setProperty('--safe-left','5px');s.setProperty('--safe-right','6px');});
  637 |     await page.clock.runFor(40);await expect.poll(()=>page.locator('.arena-host').evaluate(h=>{const i=JSON.parse((h as HTMLElement).dataset.insets!);return Math.abs(i.top-document.querySelector('[data-hud-band=top]')!.getBoundingClientRect().bottom)<.1&&i.left===5;})).toBe(true);const measured=await hudGeometry(page,width!,height!);measurements.push({width,height,measured});
  638 |     expect(measured.insets.top).toBeCloseTo(measured.top.bottom);expect(measured.insets.bottom).toBeCloseTo(height!-measured.bottom.top);expect(measured.insets.left).toBe(5);expect(measured.insets.right).toBe(6);
  639 |     await screenshot(page,info,`hud-touch-${width}x${height}-safe-ready`);
  640 |     if(!(await observe(page)).snapshot.autoSailEnabled) {const r=await center(page,'[data-control=R]',80);await touch(session,'touchStart',[r]);await touch(session,'touchEnd',[]);}
  641 |     const q=await center(page,'[data-control=front]',81),w=await center(page,'[data-control=port]',82),e=await center(page,'[data-control=starboard]',83);
  642 |     await touch(session,'touchStart',[q,w,e]);await page.clock.runFor(40);await touch(session,'touchEnd',[]);await screenshot(page,info,`hud-touch-${width}x${height}-cooldown-Ron`);
  643 |   }
  644 |   await menu(page);await page.evaluate(()=>history.replaceState(null,'','/?seed=0&geometry=1'));await startClockPlay(page);
  645 |   while((await observe(page)).snapshot.player.health===100)await page.clock.runFor(100);
  646 |   const playerDamage=(await observe(page)).snapshot;expect(playerDamage.player.health).toBeLessThan(100);expect(playerDamage.player.health).toBeGreaterThan(0);
  647 |   await page.setViewportSize({width:390,height:844});await screenshot(page,info,'hud-player-real-contact-damage-390x844');await page.getByRole('button',{name:'Pause',exact:true}).click();const damagedBars=await touchNavigation(page);expect(damagedBars.healthBars.find(b=>b.id==='player')!.fraction).toBe(playerDamage.player.health/100);
  648 |   await screenshot(page,info,'hud-player-real-contact-damage-paused-390x844');await page.clock.runFor(10000);expect((await touchNavigation(page)).healthBars).toEqual(damagedBars.healthBars);
  649 |   await info.attach('hud-geometry-real-damage',{body:JSON.stringify({chaser,shooter,playerDamage,damagedBars,measurements,safeAreas:'Controlled CSS insets, not physical notch hardware.'},null,2),contentType:'application/json'});await session.detach();await menu(page);
  650 | });
  651 | 
  652 | test('native contacts are cleared across five Pause Menu Play cycles and active-pointer teardown',async({page,context},info)=>{
  653 |   await clockArena(page,'?combatScenario=empty');await menu(page);const baseline=await counts(page),session=await context.newCDPSession(page),cycles=[];
  654 |   for(let cycle=0;cycle<5;cycle++) {
  655 |     await startClockPlay(page);await useTouch(page,session);const joy=await center(page,'.joypad',10);joy.x+=24;const q=await center(page,'[data-control=front]',20);
  656 |     await touch(session,'touchStart',[joy,q]);await page.clock.runFor(40);const active=await counts(page);expect((await touchNavigation(page)).contacts).toHaveLength(2);
  657 |     if(cycle%2===0){await page.getByRole('button',{name:'Pause',exact:true}).evaluate((b:HTMLButtonElement)=>b.click());expect((await touchNavigation(page)).contacts).toEqual([]);await screenshot(page,info,`touch-cycle-${cycle}-paused`);}
  658 |     // Main Menu synchronously freezes and clears active contacts before abandonment.
  659 |     await menu(page);await touch(session,'touchEnd',[]);const removed=await counts(page);expect(removed).toMatchObject({applications:0,resources:0,subscriptions:0,inputListeners:0,canvases:0,observers:0,resize:0,density:0,frames:0,navigation:null,cache:{leases:0}});expect(removed.nativeInput).toBe(baseline.nativeInput);expect(removed.orphanBattleInput).toBe(0);expect(removed.captures).toBe(0);cycles.push({active,removed});
  660 |   }
  661 |   await startClockPlay(page);await page.clock.runFor(1400);expect((await observe(page)).snapshot).toMatchObject({autoSailEnabled:false,player:{position:{xUnits:480,yUnits:270}},projectiles:[]});expect((await touchNavigation(page)).contacts).toEqual([]);
  662 |   await info.attach('native-five-cycles',{body:JSON.stringify(cycles,null,2),contentType:'application/json'});await session.detach();await menu(page);
  663 | });
  664 | 
  665 | 
```