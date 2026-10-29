import { ASSET_MANIFEST, ASSET_URLS, DOM_ASSET_IDS } from '../render/assetManifest';
import { AUDIO_MANIFEST } from '../audio/audioManifest';

export const LOGO_URL = new URL('../../assets/logo_jungle_gaming.svg', import.meta.url).href;
export interface StartupResource { readonly url: string; readonly kind: 'texture' | 'image' | 'audio' }
export const STARTUP_RESOURCES: readonly StartupResource[] = [...new Map([
  ...ASSET_URLS.map(url => ({ url, kind: 'texture' as const })),
  ...DOM_ASSET_IDS.map(id => ({ url: ASSET_MANIFEST[id].url, kind: 'image' as const })),
  { url: LOGO_URL, kind: 'image' as const },
  ...Object.values(AUDIO_MANIFEST).map(({ url }) => ({ url, kind: 'audio' as const })),
].map(resource => [resource.url, resource])).values()];
