import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Release Package Integrity (dist/)', () => {
  const distDir = path.resolve(__dirname, '../dist');
  const indexHtmlPath = path.join(distDir, 'index.html');
  const mswWorkerPath = path.join(distDir, 'mockServiceWorker.js');
  const assetsDir = path.join(distDir, 'assets');

  it('ensures dist/ directory exists and was built', () => {
    expect(fs.existsSync(distDir), 'dist/ directory must exist. Run npm run build first.').toBe(true);
    const stats = fs.statSync(distDir);
    expect(stats.isDirectory()).toBe(true);
  });

  it('validates presence and structure of dist/index.html', () => {
    expect(fs.existsSync(indexHtmlPath), 'dist/index.html must exist').toBe(true);
    const content = fs.readFileSync(indexHtmlPath, 'utf8');

    // Basic structure checks
    expect(content.length).toBeGreaterThan(100);
    expect(content).toContain('<!doctype html>');
    expect(content).toContain('<meta name="viewport"');
    expect(content).toContain('<title>');

    // Root mount element
    expect(content).toContain('id="root"');

    // Bundled script entry
    expect(content).toMatch(/<script type="module" crossorigin src="\/assets\/index-[^"]+\.js"><\/script>/);

    // CSS bundle link
    expect(content).toMatch(/<link rel="stylesheet" crossorigin href="\/assets\/index-[^"]+\.css">/);

    // No hardcoded secrets or external proprietary endpoints
    expect(content).not.toContain('http://localhost:');
    expect(content).not.toContain('https://api.');
    expect(content).not.toContain('AWS_');
    expect(content).not.toContain('SECRET_');
  });

  it('validates presence, size, and MSW signature of dist/mockServiceWorker.js', () => {
    expect(fs.existsSync(mswWorkerPath), 'dist/mockServiceWorker.js must exist').toBe(true);
    const content = fs.readFileSync(mswWorkerPath, 'utf8');

    // Size check (MSW worker is ~12-13KB)
    expect(content.length).toBeGreaterThan(5000);

    // MSW service worker signature and integrity markers
    expect(content).toContain('Mock Service Worker');
    expect(content).toContain('INTEGRITY_CHECKSUM');
    expect(content).toContain('activeClientIds');
  });

  it('validates bundled assets directory with fingerprinted artifacts', () => {
    expect(fs.existsSync(assetsDir), 'dist/assets directory must exist').toBe(true);
    const assetFiles = fs.readdirSync(assetsDir);

    expect(assetFiles.length).toBeGreaterThan(20);

    // Check for presence of key artifact categories
    const jsBundles = assetFiles.filter(f => f.endsWith('.js'));
    const cssBundles = assetFiles.filter(f => f.endsWith('.css'));
    const pngAssets = assetFiles.filter(f => f.endsWith('.png'));
    const wavAssets = assetFiles.filter(f => f.endsWith('.wav'));

    expect(jsBundles.length).toBeGreaterThan(0);
    expect(cssBundles.length).toBeGreaterThan(0);
    expect(pngAssets.length).toBeGreaterThan(10);
    expect(wavAssets.length).toBeGreaterThan(10);

    // Check that fingerprinted main bundle exists
    const mainJs = jsBundles.find(f => f.startsWith('index-'));
    expect(mainJs).toBeDefined();

    const mainCss = cssBundles.find(f => f.startsWith('index-'));
    expect(mainCss).toBeDefined();

    // Verify non-empty size for bundles
    expect(fs.statSync(path.join(assetsDir, mainJs!)).size).toBeGreaterThan(10000);
    expect(fs.statSync(path.join(assetsDir, mainCss!)).size).toBeGreaterThan(1000);
  });

  it('verifies that entry assets referenced in dist/index.html exist on disk', () => {
    const content = fs.readFileSync(indexHtmlPath, 'utf8');

    const scriptMatch = content.match(/src="\/assets\/([^"]+)"/);
    expect(scriptMatch).not.toBeNull();
    const scriptFileName = scriptMatch?.[1];
    expect(scriptFileName).toBeDefined();
    expect(fs.existsSync(path.join(assetsDir, scriptFileName!))).toBe(true);

    const cssMatch = content.match(/href="\/assets\/([^"]+)"/);
    expect(cssMatch).not.toBeNull();
    const cssFileName = cssMatch?.[1];
    expect(cssFileName).toBeDefined();
    expect(fs.existsSync(path.join(assetsDir, cssFileName!))).toBe(true);
  });
});
