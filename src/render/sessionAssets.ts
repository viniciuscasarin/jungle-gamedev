import { Assets } from 'pixi.js';
import type { Texture } from 'pixi.js';
import { createAssetCache } from './assetCache';
import { ASSET_URLS } from './assetManifest';
export const sessionAssets = createAssetCache<Texture>(ASSET_URLS, {
  load: url => Assets.load<Texture>(url), unload: url => Assets.unload(url),
});
export function closeSessionAssets(): Promise<void> { return sessionAssets.close(); }
const closeAtSessionEnd = () => { void closeSessionAssets().catch(error => console.error('Asset disposal failed.', error)); };
const pageHide = (event: PageTransitionEvent) => { if (!event.persisted) closeAtSessionEnd(); };
window.addEventListener('pagehide', pageHide);
if (import.meta.hot) import.meta.hot.dispose(() => { window.removeEventListener('pagehide', pageHide); closeAtSessionEnd(); });
