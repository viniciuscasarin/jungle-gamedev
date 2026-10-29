import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ASSET_MANIFEST, ASSET_URLS, DOM_ASSET_IDS, UI_LAYOUT } from '../src/render/assetManifest';
it('matches every catalog PNG header and keeps logical UI metadata in supplied units',()=>{
  for(const asset of Object.values(ASSET_MANIFEST)) {
    const bytes=readFileSync(resolve(asset.source));
    expect(bytes.subarray(1,4).toString()).toBe('PNG');
    expect([bytes.readUInt32BE(16),bytes.readUInt32BE(20)]).toEqual(asset.physical);
    expect(asset.logical).toEqual(asset.physical);expect(asset.url).toContain('.png');
  }
  expect([ASSET_MANIFEST.player.originalHeading,ASSET_MANIFEST.chaser.originalHeading,ASSET_MANIFEST.shooter.originalHeading]).toEqual(['down','down','down']);
  const atlas=JSON.parse(readFileSync(resolve('assets/spritesheet/ui_sheet.json'),'utf8'));
  const retina=JSON.parse(readFileSync(resolve('assets/spritesheet/ui_sheet_retina.json'),'utf8'));
  expect(atlas.frames.panel_menu.ui.layout.content_rect).toEqual({x:26,y:30,w:332,h:420});
  expect(retina.frames.panel_menu.ui.layout.content_rect).toEqual(atlas.frames.panel_menu.ui.layout.content_rect);
  expect(UI_LAYOUT.panel.borders).toEqual(atlas.frames.panel_menu.borders);
  expect(UI_LAYOUT.panel.anchor).toEqual(atlas.frames.panel_menu.anchor);
  for (const name of ['button_primary_normal','button_primary_hover','button_primary_pressed','button_primary_disabled','button_secondary_normal','button_secondary_pressed']) {
    const normal=atlas.frames[name], dense=retina.frames[name];
    expect(normal.anchor).toEqual(UI_LAYOUT.button.anchor);
    expect(dense.ui.layout).toEqual(normal.ui.layout);
    expect(dense.frame.w).toBe(normal.frame.w*2); expect(dense.frame.h).toBe(normal.frame.h*2);
    expect(normal.ui.layout.label_rect).toEqual({x:UI_LAYOUT.button.label.x,y:UI_LAYOUT.button.label.y,w:UI_LAYOUT.button.label.width,h:UI_LAYOUT.button.label.height});
    expect(normal.ui.layout.outer_rect).toEqual({x:UI_LAYOUT.button.outer.x,y:UI_LAYOUT.button.outer.y,w:UI_LAYOUT.button.outer.width,h:UI_LAYOUT.button.outer.height});
  }
  for(const id of DOM_ASSET_IDS) expect(ASSET_URLS).not.toContain(ASSET_MANIFEST[id].url);
  for(const name of ['button_round_normal','button_round_hover','button_round_pressed']) {
    expect(atlas.frames[name].anchor).toEqual(UI_LAYOUT.round.anchor);
    expect(atlas.frames[name].ui.layout.outer_rect).toEqual({x:4,y:4,w:56,h:56});
    expect(retina.frames[name].ui.layout).toEqual(atlas.frames[name].ui.layout);
  }
  expect(atlas.frames.health_fill_green.ui.layout.fill_rect).toEqual({x:30,y:15,w:196,h:20});
  expect(UI_LAYOUT.health.fill).toEqual({x:30,y:15,width:196,height:20});
  expect(UI_LAYOUT.health.drawOrder).toEqual(['frame','fill']);
  for(const id of ['player','chaser','shooter','cannonball','tile6'] as const) expect(ASSET_URLS).toContain(ASSET_MANIFEST[id].url);
});
