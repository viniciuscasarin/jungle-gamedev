import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { ASSET_MANIFEST } from '../src/render/assetManifest';
import { AUDIO_MANIFEST } from '../src/audio/audioManifest';
import { LOGO_URL, STARTUP_RESOURCES } from '../src/startup/manifest';

it('prepares exactly the used catalog, CSS images, logo and sounds once', () => {
  const urls = STARTUP_RESOURCES.map(resource => resource.url);
  expect(new Set(urls).size).toBe(urls.length);
  expect(new Set(urls)).toEqual(new Set([
    ...Object.values(ASSET_MANIFEST).map(asset => asset.url), LOGO_URL,
    ...Object.values(AUDIO_MANIFEST).map(asset => asset.url),
  ]));
  const sources = Object.values(ASSET_MANIFEST).map(asset => asset.source);
  const css = readFileSync('src/ui/styles.css', 'utf8');
  for (const match of css.matchAll(/url\(['"]\.\.\/\.\.\/(assets\/[^'"]+)['"]\)/g)) {
    expect(sources).toContain(match[1]);
  }
  expect(urls.some(url => url.includes('retina') || url.includes('spritesheet'))).toBe(false);
});
