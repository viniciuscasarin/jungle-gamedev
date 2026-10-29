export type SoundCategory =
  | 'ambience'
  | 'navigation'
  | 'fire'
  | 'impact'
  | 'destruction'
  | 'threshold'
  | 'ui'
  | 'session';

export type SoundPriority = 'normal' | 'high' | 'critical';

export interface SoundDefinition {
  readonly id: string;
  readonly category: SoundCategory;
  readonly priority: SoundPriority;
  readonly source: string;
  readonly url: string;
  readonly loop?: boolean;
}

export const AUDIO_MANIFEST = {
  oceanAmbience: {
    id: 'oceanAmbience',
    category: 'ambience',
    priority: 'normal',
    source: 'assets/sounds/ocean_ambience_loop.wav',
    url: new URL('../../assets/sounds/ocean_ambience_loop.wav', import.meta.url).href,
    loop: true,
  },
  shipSailing: {
    id: 'shipSailing',
    category: 'navigation',
    priority: 'normal',
    source: 'assets/sounds/ship_sailing_loop.wav',
    url: new URL('../../assets/sounds/ship_sailing_loop.wav', import.meta.url).href,
    loop: true,
  },
  cannonFire1: {
    id: 'cannonFire1',
    category: 'fire',
    priority: 'normal',
    source: 'assets/sounds/cannon_fire_1.wav',
    url: new URL('../../assets/sounds/cannon_fire_1.wav', import.meta.url).href,
  },
  cannonFire2: {
    id: 'cannonFire2',
    category: 'fire',
    priority: 'normal',
    source: 'assets/sounds/cannon_fire_2.wav',
    url: new URL('../../assets/sounds/cannon_fire_2.wav', import.meta.url).href,
  },
  cannonFire3: {
    id: 'cannonFire3',
    category: 'fire',
    priority: 'normal',
    source: 'assets/sounds/cannon_fire_3.wav',
    url: new URL('../../assets/sounds/cannon_fire_3.wav', import.meta.url).href,
  },
  cannonBroadside: {
    id: 'cannonBroadside',
    category: 'fire',
    priority: 'normal',
    source: 'assets/sounds/cannon_broadside.wav',
    url: new URL('../../assets/sounds/cannon_broadside.wav', import.meta.url).href,
  },
  shipWoodHit1: {
    id: 'shipWoodHit1',
    category: 'impact',
    priority: 'normal',
    source: 'assets/sounds/ship_wood_hit_1.wav',
    url: new URL('../../assets/sounds/ship_wood_hit_1.wav', import.meta.url).href,
  },
  shipWoodHit2: {
    id: 'shipWoodHit2',
    category: 'impact',
    priority: 'normal',
    source: 'assets/sounds/ship_wood_hit_2.wav',
    url: new URL('../../assets/sounds/ship_wood_hit_2.wav', import.meta.url).href,
  },
  cannonballWaterHit1: {
    id: 'cannonballWaterHit1',
    category: 'impact',
    priority: 'normal',
    source: 'assets/sounds/cannonball_water_hit_1.wav',
    url: new URL('../../assets/sounds/cannonball_water_hit_1.wav', import.meta.url).href,
  },
  cannonballWaterHit2: {
    id: 'cannonballWaterHit2',
    category: 'impact',
    priority: 'normal',
    source: 'assets/sounds/cannonball_water_hit_2.wav',
    url: new URL('../../assets/sounds/cannonball_water_hit_2.wav', import.meta.url).href,
  },
  shipCollision: {
    id: 'shipCollision',
    category: 'impact',
    priority: 'normal',
    source: 'assets/sounds/ship_collision.wav',
    url: new URL('../../assets/sounds/ship_collision.wav', import.meta.url).href,
  },
  shipExplosion1: {
    id: 'shipExplosion1',
    category: 'destruction',
    priority: 'high',
    source: 'assets/sounds/ship_explosion_1.wav',
    url: new URL('../../assets/sounds/ship_explosion_1.wav', import.meta.url).href,
  },
  shipExplosion2: {
    id: 'shipExplosion2',
    category: 'destruction',
    priority: 'high',
    source: 'assets/sounds/ship_explosion_2.wav',
    url: new URL('../../assets/sounds/ship_explosion_2.wav', import.meta.url).href,
  },
  shipSinking: {
    id: 'shipSinking',
    category: 'destruction',
    priority: 'high',
    source: 'assets/sounds/ship_sinking.wav',
    url: new URL('../../assets/sounds/ship_sinking.wav', import.meta.url).href,
  },
  scorePoint: {
    id: 'scorePoint',
    category: 'destruction',
    priority: 'high',
    source: 'assets/sounds/score_point.wav',
    url: new URL('../../assets/sounds/score_point.wav', import.meta.url).href,
  },
  healthLow: {
    id: 'healthLow',
    category: 'threshold',
    priority: 'critical',
    source: 'assets/sounds/health_low.wav',
    url: new URL('../../assets/sounds/health_low.wav', import.meta.url).href,
  },
  timeWarning: {
    id: 'timeWarning',
    category: 'threshold',
    priority: 'critical',
    source: 'assets/sounds/time_warning.wav',
    url: new URL('../../assets/sounds/time_warning.wav', import.meta.url).href,
  },
  uiHover: {
    id: 'uiHover',
    category: 'ui',
    priority: 'normal',
    source: 'assets/sounds/ui_hover.wav',
    url: new URL('../../assets/sounds/ui_hover.wav', import.meta.url).href,
  },
  uiClick: {
    id: 'uiClick',
    category: 'ui',
    priority: 'normal',
    source: 'assets/sounds/ui_click.wav',
    url: new URL('../../assets/sounds/ui_click.wav', import.meta.url).href,
  },
  uiOpen: {
    id: 'uiOpen',
    category: 'ui',
    priority: 'normal',
    source: 'assets/sounds/ui_open.wav',
    url: new URL('../../assets/sounds/ui_open.wav', import.meta.url).href,
  },
  uiClose: {
    id: 'uiClose',
    category: 'ui',
    priority: 'normal',
    source: 'assets/sounds/ui_close.wav',
    url: new URL('../../assets/sounds/ui_close.wav', import.meta.url).href,
  },
  uiBack: {
    id: 'uiBack',
    category: 'ui',
    priority: 'normal',
    source: 'assets/sounds/ui_back.wav',
    url: new URL('../../assets/sounds/ui_back.wav', import.meta.url).href,
  },
  gameStart: {
    id: 'gameStart',
    category: 'session',
    priority: 'critical',
    source: 'assets/sounds/game_start.wav',
    url: new URL('../../assets/sounds/game_start.wav', import.meta.url).href,
  },
  gamePause: {
    id: 'gamePause',
    category: 'session',
    priority: 'critical',
    source: 'assets/sounds/game_pause.wav',
    url: new URL('../../assets/sounds/game_pause.wav', import.meta.url).href,
  },
  gameResume: {
    id: 'gameResume',
    category: 'session',
    priority: 'critical',
    source: 'assets/sounds/game_resume.wav',
    url: new URL('../../assets/sounds/game_resume.wav', import.meta.url).href,
  },
  gameComplete: {
    id: 'gameComplete',
    category: 'session',
    priority: 'critical',
    source: 'assets/sounds/game_complete.wav',
    url: new URL('../../assets/sounds/game_complete.wav', import.meta.url).href,
  },
  gameOver: {
    id: 'gameOver',
    category: 'session',
    priority: 'critical',
    source: 'assets/sounds/game_over.wav',
    url: new URL('../../assets/sounds/game_over.wav', import.meta.url).href,
  },
} as const satisfies Record<string, SoundDefinition>;

export type SoundId = keyof typeof AUDIO_MANIFEST;
export const ALL_SOUND_IDS = Object.keys(AUDIO_MANIFEST) as readonly SoundId[];
