export interface AssetDefinition {
  readonly url: string;
  readonly source: string;
  readonly physical: readonly [number, number];
  readonly logical: readonly [number, number];
  readonly originalHeading: 'down' | null;
}
// Default individual PNGs: dimensions are measured, never inferred from retina names.
export const ASSET_MANIFEST = {
  cannonball: { url: new URL('../../assets/png/default/ship_parts/cannon_ball.png', import.meta.url).href, source: 'assets/png/default/ship_parts/cannon_ball.png', physical: [10, 10], logical: [10, 10], originalHeading: null },
  player: { url: new URL('../../assets/png/default/ships/ship_5.png', import.meta.url).href, source: 'assets/png/default/ships/ship_5.png', physical: [66, 113], logical: [66, 113], originalHeading: 'down' },
  chaser: { url: new URL('../../assets/png/default/ships/ship_3.png', import.meta.url).href, source: 'assets/png/default/ships/ship_3.png', physical: [66, 113], logical: [66, 113], originalHeading: 'down' },
  shooter: { url: new URL('../../assets/png/default/ships/ship_8.png', import.meta.url).href, source: 'assets/png/default/ships/ship_8.png', physical: [66, 113], logical: [66, 113], originalHeading: 'down' },
  tile6: { url: new URL('../../assets/png/default/tiles/tile_6.png', import.meta.url).href, source: 'assets/png/default/tiles/tile_6.png', physical: [64, 64], logical: [64, 64], originalHeading: null },
  tile7: { url: new URL('../../assets/png/default/tiles/tile_7.png', import.meta.url).href, source: 'assets/png/default/tiles/tile_7.png', physical: [64, 64], logical: [64, 64], originalHeading: null },
  tile8: { url: new URL('../../assets/png/default/tiles/tile_8.png', import.meta.url).href, source: 'assets/png/default/tiles/tile_8.png', physical: [64, 64], logical: [64, 64], originalHeading: null },
  tile9: { url: new URL('../../assets/png/default/tiles/tile_9.png', import.meta.url).href, source: 'assets/png/default/tiles/tile_9.png', physical: [64, 64], logical: [64, 64], originalHeading: null },
  tile22: { url: new URL('../../assets/png/default/tiles/tile_22.png', import.meta.url).href, source: 'assets/png/default/tiles/tile_22.png', physical: [64, 64], logical: [64, 64], originalHeading: null },
  tile23: { url: new URL('../../assets/png/default/tiles/tile_23.png', import.meta.url).href, source: 'assets/png/default/tiles/tile_23.png', physical: [64, 64], logical: [64, 64], originalHeading: null },
  tile24: { url: new URL('../../assets/png/default/tiles/tile_24.png', import.meta.url).href, source: 'assets/png/default/tiles/tile_24.png', physical: [64, 64], logical: [64, 64], originalHeading: null },
  tile25: { url: new URL('../../assets/png/default/tiles/tile_25.png', import.meta.url).href, source: 'assets/png/default/tiles/tile_25.png', physical: [64, 64], logical: [64, 64], originalHeading: null },
  tile38: { url: new URL('../../assets/png/default/tiles/tile_38.png', import.meta.url).href, source: 'assets/png/default/tiles/tile_38.png', physical: [64, 64], logical: [64, 64], originalHeading: null },
  tile39: { url: new URL('../../assets/png/default/tiles/tile_39.png', import.meta.url).href, source: 'assets/png/default/tiles/tile_39.png', physical: [64, 64], logical: [64, 64], originalHeading: null },
  tile40: { url: new URL('../../assets/png/default/tiles/tile_40.png', import.meta.url).href, source: 'assets/png/default/tiles/tile_40.png', physical: [64, 64], logical: [64, 64], originalHeading: null },
  tile41: { url: new URL('../../assets/png/default/tiles/tile_41.png', import.meta.url).href, source: 'assets/png/default/tiles/tile_41.png', physical: [64, 64], logical: [64, 64], originalHeading: null },
  tile54: { url: new URL('../../assets/png/default/tiles/tile_54.png', import.meta.url).href, source: 'assets/png/default/tiles/tile_54.png', physical: [64, 64], logical: [64, 64], originalHeading: null },
  tile55: { url: new URL('../../assets/png/default/tiles/tile_55.png', import.meta.url).href, source: 'assets/png/default/tiles/tile_55.png', physical: [64, 64], logical: [64, 64], originalHeading: null },
  tile56: { url: new URL('../../assets/png/default/tiles/tile_56.png', import.meta.url).href, source: 'assets/png/default/tiles/tile_56.png', physical: [64, 64], logical: [64, 64], originalHeading: null },
  tile57: { url: new URL('../../assets/png/default/tiles/tile_57.png', import.meta.url).href, source: 'assets/png/default/tiles/tile_57.png', physical: [64, 64], logical: [64, 64], originalHeading: null },
  tile49: { url: new URL('../../assets/png/default/tiles/tile_49.png', import.meta.url).href, source: 'assets/png/default/tiles/tile_49.png', physical: [64, 64], logical: [64, 64], originalHeading: null },
  tile70: { url: new URL('../../assets/png/default/tiles/tile_70.png', import.meta.url).href, source: 'assets/png/default/tiles/tile_70.png', physical: [64, 64], logical: [64, 64], originalHeading: null },
  tile72: { url: new URL('../../assets/png/default/tiles/tile_72.png', import.meta.url).href, source: 'assets/png/default/tiles/tile_72.png', physical: [64, 64], logical: [64, 64], originalHeading: null },
  tile73: { url: new URL('../../assets/png/default/tiles/tile_73.png', import.meta.url).href, source: 'assets/png/default/tiles/tile_73.png', physical: [64, 64], logical: [64, 64], originalHeading: null },
  explosion1: { url: new URL('../../assets/png/default/effects/explosion_1.png', import.meta.url).href, source: 'assets/png/default/effects/explosion_1.png', physical: [74, 75], logical: [74, 75], originalHeading: null },
  explosion2: { url: new URL('../../assets/png/default/effects/explosion_2.png', import.meta.url).href, source: 'assets/png/default/effects/explosion_2.png', physical: [60, 59], logical: [60, 59], originalHeading: null },
  explosion3: { url: new URL('../../assets/png/default/effects/explosion_3.png', import.meta.url).href, source: 'assets/png/default/effects/explosion_3.png', physical: [42, 41], logical: [42, 41], originalHeading: null },
  fire1: { url: new URL('../../assets/png/default/effects/fire_1.png', import.meta.url).href, source: 'assets/png/default/effects/fire_1.png', physical: [18, 39], logical: [18, 39], originalHeading: null },
  fire2: { url: new URL('../../assets/png/default/effects/fire_2.png', import.meta.url).href, source: 'assets/png/default/effects/fire_2.png', physical: [11, 27], logical: [11, 27], originalHeading: null },
  wood1: { url: new URL('../../assets/png/default/ship_parts/wood_1.png', import.meta.url).href, source: 'assets/png/default/ship_parts/wood_1.png', physical: [15, 7], logical: [15, 7], originalHeading: null },
  wood2: { url: new URL('../../assets/png/default/ship_parts/wood_2.png', import.meta.url).href, source: 'assets/png/default/ship_parts/wood_2.png', physical: [26, 10], logical: [26, 10], originalHeading: null },
  wood3: { url: new URL('../../assets/png/default/ship_parts/wood_3.png', import.meta.url).href, source: 'assets/png/default/ship_parts/wood_3.png', physical: [15, 10], logical: [15, 10], originalHeading: null },
  wood4: { url: new URL('../../assets/png/default/ship_parts/wood_4.png', import.meta.url).href, source: 'assets/png/default/ship_parts/wood_4.png', physical: [26, 7], logical: [26, 7], originalHeading: null },
  menuPanel: { url: new URL('../../assets/png/default/ui/menu/panel_menu.png', import.meta.url).href, source: 'assets/png/default/ui/menu/panel_menu.png', physical: [384, 480], logical: [384, 480], originalHeading: null },
  menuTitle: { url: new URL('../../assets/png/default/ui/menu/title_pirate_battle.png', import.meta.url).href, source: 'assets/png/default/ui/menu/title_pirate_battle.png', physical: [384, 128], logical: [384, 128], originalHeading: null },
  primaryButton: { url: new URL('../../assets/png/default/ui/menu/button_primary_normal.png', import.meta.url).href, source: 'assets/png/default/ui/menu/button_primary_normal.png', physical: [256, 88], logical: [256, 88], originalHeading: null },
  primaryHover: { url: new URL('../../assets/png/default/ui/menu/button_primary_hover.png', import.meta.url).href, source: 'assets/png/default/ui/menu/button_primary_hover.png', physical: [256, 88], logical: [256, 88], originalHeading: null },
  primaryPressed: { url: new URL('../../assets/png/default/ui/menu/button_primary_pressed.png', import.meta.url).href, source: 'assets/png/default/ui/menu/button_primary_pressed.png', physical: [256, 88], logical: [256, 88], originalHeading: null },
  primaryDisabled: { url: new URL('../../assets/png/default/ui/menu/button_primary_disabled.png', import.meta.url).href, source: 'assets/png/default/ui/menu/button_primary_disabled.png', physical: [256, 88], logical: [256, 88], originalHeading: null },
  secondaryButton: { url: new URL('../../assets/png/default/ui/menu/button_secondary_normal.png', import.meta.url).href, source: 'assets/png/default/ui/menu/button_secondary_normal.png', physical: [256, 88], logical: [256, 88], originalHeading: null },
  secondaryPressed: { url: new URL('../../assets/png/default/ui/menu/button_secondary_pressed.png', import.meta.url).href, source: 'assets/png/default/ui/menu/button_secondary_pressed.png', physical: [256, 88], logical: [256, 88], originalHeading: null },
  menuBackdrop: { url: new URL('../../assets/ui_scene_background.png', import.meta.url).href, source: 'assets/ui_scene_background.png', physical: [918, 515], logical: [918, 515], originalHeading: null },
  frontReference: { url: new URL('../../assets/png/default/ui/controls/icon_fire_front.png', import.meta.url).href, source: 'assets/png/default/ui/controls/icon_fire_front.png', physical: [48, 48], logical: [48, 48], originalHeading: null },
  portIcon: { url: new URL('../../assets/png/default/ui/controls/icon_fire_left.png', import.meta.url).href, source: 'assets/png/default/ui/controls/icon_fire_left.png', physical: [48, 48], logical: [48, 48], originalHeading: null },
  starboardIcon: { url: new URL('../../assets/png/default/ui/controls/icon_fire_right.png', import.meta.url).href, source: 'assets/png/default/ui/controls/icon_fire_right.png', physical: [48, 48], logical: [48, 48], originalHeading: null },
  sailIcon: { url: new URL('../../assets/png/default/ui/controls/icon_forward.png', import.meta.url).href, source: 'assets/png/default/ui/controls/icon_forward.png', physical: [48, 48], logical: [48, 48], originalHeading: null },
  pauseIcon: { url: new URL('../../assets/png/default/ui/controls/icon_pause.png', import.meta.url).href, source: 'assets/png/default/ui/controls/icon_pause.png', physical: [48, 48], logical: [48, 48], originalHeading: null },
  roundButton: { url: new URL('../../assets/png/default/ui/controls/button_round_normal.png', import.meta.url).href, source: 'assets/png/default/ui/controls/button_round_normal.png', physical: [64, 64], logical: [64, 64], originalHeading: null },
  roundHover: { url: new URL('../../assets/png/default/ui/controls/button_round_hover.png', import.meta.url).href, source: 'assets/png/default/ui/controls/button_round_hover.png', physical: [64, 64], logical: [64, 64], originalHeading: null },
  roundPressed: { url: new URL('../../assets/png/default/ui/controls/button_round_pressed.png', import.meta.url).href, source: 'assets/png/default/ui/controls/button_round_pressed.png', physical: [64, 64], logical: [64, 64], originalHeading: null },
  healthFrame: { url: new URL('../../assets/png/default/ui/hud/health_frame.png', import.meta.url).href, source: 'assets/png/default/ui/hud/health_frame.png', physical: [256, 48], logical: [256, 48], originalHeading: null },
  healthFill: { url: new URL('../../assets/png/default/ui/hud/health_fill_green.png', import.meta.url).href, source: 'assets/png/default/ui/hud/health_fill_green.png', physical: [256, 48], logical: [256, 48], originalHeading: null },
} as const satisfies Record<string, AssetDefinition>;
export type AssetId = keyof typeof ASSET_MANIFEST;
export const DOM_ASSET_IDS = ['menuPanel', 'menuTitle', 'primaryButton', 'primaryHover', 'primaryPressed', 'primaryDisabled', 'secondaryButton', 'secondaryPressed', 'menuBackdrop', 'frontReference', 'portIcon', 'starboardIcon', 'sailIcon', 'pauseIcon', 'roundButton', 'roundHover', 'roundPressed', 'healthFrame', 'healthFill'] as const;
// Pixi only borrows gameplay textures; DOM resources have a separate startup owner.
export const ASSET_URLS = Object.entries(ASSET_MANIFEST).filter(([id]) => !(DOM_ASSET_IDS as readonly string[]).includes(id)).map(([, asset]) => asset.url);
export const UI_LAYOUT = {
  round: {size: {width: 64, height: 64}, outer: {x: 4, y: 4, width: 56, height: 56}, center: {x: 32, y: 32}, icon: {width: 32, height: 32}, anchor: {x: 0.5, y: 0.5}},
  health: {size: {width: 256, height: 48}, fill: {x: 30, y: 15, width: 196, height: 20}, anchor: {x: 0, y: 0}, drawOrder: ['frame', 'fill']},
  panel: { size: { width: 384, height: 480 }, anchor: { x: 0.5, y: 0.5 }, content: { x: 26, y: 30, width: 332, height: 420 }, borders: { left: 32, top: 40, right: 32, bottom: 40 } },
  button: { size: { width: 256, height: 88 }, anchor: { x: 0.5, y: 0.5 }, outer: { x: 8, y: 4, width: 240, height: 80 }, label: { x: 32.5, y: 19.5, width: 191, height: 46.5 } },
} as const;
