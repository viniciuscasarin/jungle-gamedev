import { test, expect } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
const optionsKey='pirate-battle.options.v1';
const resultKey='pirate-battle.last-result.v1';
const evidence='project/automation-reports/08-implement-responsive-hud-and-touch/browser-evidence';
async function shot(page:Page,info:TestInfo,label:string){
  await mkdir(evidence,{recursive:true});const file=path.resolve(evidence,`${info.project.name}-${label}.png`);
  await page.screenshot({path:file,fullPage:true});await info.attach(label,{path:file,contentType:'image/png'});
}
async function layouts(page:Page,info:TestInfo,label:string){
  for(const [width,height,name] of [[1280,900,'desktop'],[320,568,'320'],[844,390,'landscape']] as const){
    await page.setViewportSize({width,height});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
    await shot(page,info,`${label}-${name}`);
  }
}
async function open(page:Page){await page.getByRole('button',{name:'Options',exact:true}).click();await expect(page.getByRole('heading',{name:'Options',exact:true})).toBeFocused();}
async function fields(page:Page,session:string,spawn:string){await page.getByLabel('Game session time').fill(session);await page.getByLabel('Enemy spawn time').fill(spawn);}
async function save(page:Page,session:string,spawn:string){await open(page);await fields(page,session,spawn);await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.getByRole('button',{name:'Options',exact:true})).toBeFocused();}
async function stored(page:Page){return page.evaluate(key=>localStorage.getItem(key),optionsKey);}
async function ready(page:Page){await expect(page.getByRole('heading',{name:'Arena',exact:true})).toBeVisible();}
async function setup(page:Page){return page.evaluate(()=> (window.__arenaDiagnostics().navigation as unknown as {setup: {configuration: {options:{sessionDurationMs:number;enemySpawnIntervalMs:number}};seed:number}}).setup);}
async function startClock(page:Page,button='Play'){
  await page.getByRole('button',{name:button,exact:true}).click();
  await expect(page.getByRole('button',{name:'Options',exact:true})).toHaveCount(0);
  for(let n=0;n<40&&await page.locator('.arena-screen').getAttribute('data-state')!=='ready';n++)await page.clock.runFor(100);
  await ready(page);await page.clock.runFor(80);
}
async function back(page:Page){await page.getByRole('button',{name:'Main Menu',exact:true}).click();if(await page.getByRole('button',{name:'Abandon',exact:true}).isVisible())await page.getByRole('button',{name:'Abandon',exact:true}).click();}

test('options keyboard, validation guard, Save-refresh, Cancel and Escape preserve the last Save',async({page},info)=>{
  const remote:string[]=[];page.on('request',request=>{if(!new URL(request.url()).hostname.match(/^(127\.0\.0\.1|localhost)$/))remote.push(request.url());});
  await page.goto('/');await expect(page.getByRole('button',{name:'Last Result',exact:true})).toHaveCount(0);
  await expect(page.getByRole('tab',{name:'Ranking',exact:true})).toBeVisible();await expect(page.getByRole('tab',{name:'Match History',exact:true})).toBeVisible();
  await layouts(page,info,'menu-empty');await page.setViewportSize({width:1280,height:900});
  await page.getByRole('button',{name:'Play',exact:true}).focus();await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Options',exact:true})).toBeFocused();await page.keyboard.press('Space');
  await expect(page.getByRole('heading',{name:'Options',exact:true})).toBeFocused();await page.keyboard.press('Tab');await expect(page.getByLabel('Game session time')).toBeFocused();
  await page.keyboard.press('Tab');await expect(page.getByLabel('Enemy spawn time')).toBeFocused();await page.keyboard.press('Shift+Tab');await expect(page.getByLabel('Game session time')).toBeFocused();
  await expect(page.getByLabel('Game session time')).toHaveValue('120');await expect(page.getByLabel('Enemy spawn time')).toHaveValue('3');
  await layouts(page,info,'options-valid');await fields(page,'60.5','1.1');
  const session=page.getByLabel('Game session time');await expect(session).toHaveAttribute('aria-invalid','true');await expect(session).toHaveAttribute('aria-describedby',/sessionDurationMs-error/);
  await expect(page.getByRole('button',{name:'Save',exact:true})).toBeDisabled();await session.press('Enter');expect(await stored(page)).toBeNull();
  // Native submit dispatch also hits the React guard, even when the disabled action cannot be clicked.
  await page.locator('form').evaluate(form=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));expect(await stored(page)).toBeNull();
  await layouts(page,info,'options-invalid');
  for(const value of ['', ' ', 'NaN', 'Infinity', 'text','59','181']) {await session.fill(value);await expect(page.getByRole('button',{name:'Save',exact:true})).toBeDisabled();await expect(session).toHaveValue(value);}
  await fields(page,'90','2.5');await page.getByLabel('Enemy spawn time').press('Enter');await expect(page.getByRole('button',{name:'Options',exact:true})).toBeFocused();
  const saved=await stored(page);expect(JSON.parse(saved!).data).toEqual({sessionDurationMs:90000,enemySpawnIntervalMs:2500});
  await page.reload();await open(page);await expect(session).toHaveValue('90');await expect(page.getByLabel('Enemy spawn time')).toHaveValue('2.5');
  await fields(page,'180','10');await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.getByRole('button',{name:'Options',exact:true})).toBeFocused();expect(await stored(page)).toBe(saved);
  await open(page);await expect(session).toHaveValue('90');await session.fill('');await session.press('Escape');await expect(page.getByRole('button',{name:'Options',exact:true})).toBeFocused();expect(await stored(page)).toBe(saved);
  await open(page);await expect(session).toHaveValue('90');await session.press('q');await expect(page.locator('canvas')).toHaveCount(0);
  expect(await page.evaluate(()=>window.__arenaDiagnostics().inputListeners)).toBe(0);expect(remote).toEqual([]);
});

test('options corruption defaults, repair resolves only options warning, real touch and button states',async({page},info)=>{
  await page.addInitScript(()=>{localStorage.setItem('pirate-battle.options.v1','{');localStorage.setItem('pirate-battle.last-result.v1','{');localStorage.setItem('pirate-battle.identity.v1','{');});
  await page.goto('/?combatScenario=empty');await expect(page.getByRole('status')).toContainText('Default settings');
  await page.getByRole('button',{name:'Options',exact:true}).tap();await expect(page.getByLabel('Game session time')).toHaveValue('120');expect(await stored(page)).toBe('{');
  await layouts(page,info,'options-recovery');await page.getByRole('button',{name:'Cancel',exact:true}).tap();expect(await stored(page)).toBe('{');
  await open(page);await fields(page,'90','2.5');
  const saveButton=page.getByRole('button',{name:'Save',exact:true}),cancel=page.getByRole('button',{name:'Cancel',exact:true});
  await page.setViewportSize({width:1280,height:900});await saveButton.hover();await expect(saveButton).toHaveCSS('background-image',/button_primary_hover/);await shot(page,info,'primary-hover');
  await saveButton.focus();await page.keyboard.down('Space');await expect(saveButton).toHaveCSS('background-image',/button_primary_pressed/);await shot(page,info,'primary-pressed');await page.keyboard.press('Escape');await page.keyboard.up('Space');
  await open(page);await cancel.hover();await expect(cancel).toHaveCSS('background-image',/button_secondary_normal/);
  await cancel.focus();await shot(page,info,'secondary-focus');await page.keyboard.down('Space');await expect(cancel).toHaveCSS('background-image',/button_secondary_pressed/);await shot(page,info,'secondary-pressed');await page.keyboard.up('Space');
  await open(page);await page.getByLabel('Game session time').fill('');await expect(saveButton).toHaveCSS('background-image',/button_primary_disabled/);await shot(page,info,'primary-disabled');
  await fields(page,'90','2.5');await saveButton.tap();await expect(page.getByRole('status')).not.toContainText('Default settings');await expect(page.getByRole('status')).toContainText('Last Result could not be recovered');await expect(page.getByRole('status')).toContainText('Local identity could not be read');
  await page.getByRole('button',{name:'Play',exact:true}).tap();await ready(page);await expect(page.getByRole('button',{name:'Options',exact:true})).toHaveCount(0);await page.getByRole('button',{name:'Pause',exact:true}).tap();await expect(page.getByRole('button',{name:'Options',exact:true})).toHaveCount(0);await back(page);
  await expect(page.getByRole('status')).not.toContainText('Default settings');await expect(page.getByRole('status')).toContainText('Last Result could not be recovered');
});

test('options denied Save keeps draft and earlier data; retry succeeds and Cancel discards',async({page},info)=>{
  await page.goto('/');await save(page,'90','2.5');const before=await stored(page);
  await page.evaluate(()=>{const write=Storage.prototype.setItem;Reflect.set(window,'denyOptions',true);Storage.prototype.setItem=function(key,value){if(key==='pirate-battle.options.v1'&&Reflect.get(window,'denyOptions'))throw new Error('quota');write.call(this,key,value);};});
  await open(page);await fields(page,'180','10');await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Could not save settings');await expect(page.getByLabel('Game session time')).toHaveValue('180');expect(await stored(page)).toBe(before);
  await layouts(page,info,'options-write-failure');await page.getByRole('button',{name:'Cancel',exact:true}).click();await open(page);await expect(page.getByLabel('Game session time')).toHaveValue('90');await fields(page,'180','10');await page.getByRole('button',{name:'Save',exact:true}).click();
  await page.evaluate(()=>Reflect.set(window,'denyOptions',false));await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.getByRole('button',{name:'Options',exact:true})).toBeFocused();expect(JSON.parse((await stored(page))!).data.sessionDurationMs).toBe(180000);
});

test('options DOM image failure keeps semantic fallback and never blocks Pixi Play',async({page},info)=>{
  await page.route(/(?:ui_scene_background|title_pirate_battle|panel_menu|button_primary|button_secondary).*\.png/,route=>route.abort());
  await page.goto('/?combatScenario=empty');await expect(page.getByRole('heading',{name:'Pirate Battle',exact:true})).toBeVisible();await shot(page,info,'menu-image-fallback');
  await open(page);await expect(page.getByRole('button',{name:'Save',exact:true})).toBeEnabled();await shot(page,info,'options-image-fallback');await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.getByRole('button',{name:'Play',exact:true}).click();await ready(page);expect((await setup(page)).configuration.options.sessionDurationMs).toBe(120000);
});

test('options UI Save captures immutable active setup and Last Result replay uses last confirmed Save',async({page},info)=>{
  test.setTimeout(180000);await page.clock.install({time:new Date('2026-10-28T03:00:00Z')});await page.clock.pauseAt(new Date('2026-10-28T03:00:01Z'));
  await page.goto('/?combatScenario=empty&seed=123');await save(page,'60','1.5');await startClock(page);
  const firstId=await page.locator('.arena-screen').getAttribute('data-match-id'),captured=await setup(page);expect(captured.configuration.options).toEqual({sessionDurationMs:60000,enemySpawnIntervalMs:1500});
  await page.evaluate(key=>localStorage.setItem(key,JSON.stringify({version:1,data:{sessionDurationMs:180000,enemySpawnIntervalMs:10000}})),optionsKey);expect(await setup(page)).toEqual(captured);
  for(let n=0;n<65&&!await page.getByRole('heading',{name:'Result',exact:true}).isVisible();n++)await page.clock.runFor(1000);
  await expect(page.getByText('Time expired',{exact:true})).toBeVisible();const historical=await page.evaluate(key=>localStorage.getItem(key),resultKey);expect(JSON.parse(historical!).data.configuration.options).toEqual(captured.configuration.options);
  await back(page);await layouts(page,info,'menu-last-result-options');await save(page,'90','2.5');
  await open(page);await fields(page,'120','3');await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.evaluate(()=>{const write=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='pirate-battle.options.v1')throw new Error('quota');write.call(this,key,value);};});
  await open(page);await fields(page,'180','10');await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.getByRole('alert')).toBeVisible();await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.getByRole('button',{name:'Last Result',exact:true}).click();expect(await page.locator('.result-screen').getAttribute('data-match-id')).toBe(firstId);await startClock(page,'Play Again');
  expect(await page.locator('.arena-screen').getAttribute('data-match-id')).not.toBe(firstId);expect((await setup(page)).configuration.options).toEqual({sessionDurationMs:90000,enemySpawnIntervalMs:2500});expect(await page.evaluate(key=>localStorage.getItem(key),resultKey)).toBe(historical);
  await info.attach('options-snapshot-replay',{body:JSON.stringify({firstId,captured,replay:await setup(page),historical:JSON.parse(historical!)},null,2),contentType:'application/json'});
});


