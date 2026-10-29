import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Deployment Configuration & Package Integrity (netlify.toml)', () => {
  const rootDir = path.resolve(__dirname, '..');
  const netlifyTomlPath = path.join(rootDir, 'netlify.toml');
  const mswPublicPath = path.join(rootDir, 'public/mockServiceWorker.js');

  it('ensures netlify.toml exists in repository root', () => {
    expect(fs.existsSync(netlifyTomlPath), 'netlify.toml must exist in repo root').toBe(true);
    const stats = fs.statSync(netlifyTomlPath);
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBeGreaterThan(100);
  });

  it('validates [build] configuration in netlify.toml', () => {
    const content = fs.readFileSync(netlifyTomlPath, 'utf8');

    // Section [build]
    expect(content).toMatch(/\[build\]/);
    expect(content).toMatch(/command\s*=\s*"npm run build"/);
    expect(content).toMatch(/publish\s*=\s*"dist"/);
  });

  it('validates SPA fallback redirect rule in netlify.toml', () => {
    const content = fs.readFileSync(netlifyTomlPath, 'utf8');

    // Section [[redirects]]
    expect(content).toMatch(/\[\[redirects\]\]/);
    expect(content).toMatch(/from\s*=\s*"\/\*"/);
    expect(content).toMatch(/to\s*=\s*"\/index\.html"/);
    expect(content).toMatch(/status\s*=\s*200/);
  });

  it('validates global security headers in netlify.toml', () => {
    const content = fs.readFileSync(netlifyTomlPath, 'utf8');

    expect(content).toContain('for = "/*"');
    expect(content).toMatch(/X-Frame-Options\s*=\s*"DENY"/);
    expect(content).toMatch(/X-Content-Type-Options\s*=\s*"nosniff"/);
    expect(content).toMatch(/Referrer-Policy\s*=\s*"strict-origin-when-cross-origin"/);
  });

  it('validates dedicated headers for mockServiceWorker.js in netlify.toml', () => {
    const content = fs.readFileSync(netlifyTomlPath, 'utf8');

    expect(content).toContain('for = "/mockServiceWorker.js"');
    expect(content).toMatch(/Content-Type\s*=\s*"application\/javascript;\s*charset=utf-8"/);
    expect(content).toMatch(/Service-Worker-Allowed\s*=\s*"\/"/);
    expect(content).toMatch(/Cache-Control\s*=\s*"no-cache,\s*no-store,\s*must-revalidate"/);
  });

  it('validates cache policies for assets and index.html in netlify.toml', () => {
    const content = fs.readFileSync(netlifyTomlPath, 'utf8');

    // Long-lived immutable cache for assets
    expect(content).toContain('for = "/assets/*"');
    expect(content).toMatch(/Cache-Control\s*=\s*"public,\s*max-age=31536000,\s*immutable"/);

    // Revalidation for index.html
    expect(content).toContain('for = "/index.html"');
    expect(content).toMatch(/Cache-Control\s*=\s*"public,\s*max-age=0,\s*must-revalidate"/);
  });

  it('confirms source mockServiceWorker.js exists in public/ to be copied on build', () => {
    expect(fs.existsSync(mswPublicPath), 'public/mockServiceWorker.js must exist').toBe(true);
    const content = fs.readFileSync(mswPublicPath, 'utf8');
    expect(content).toContain('Mock Service Worker');
    expect(content).toContain('INTEGRITY_CHECKSUM');
  });
});
