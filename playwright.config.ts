import { defineConfig } from '@playwright/test';

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const devPort = Number(process.env.PLAYWRIGHT_DEV_PORT ?? 5173), previewPort = Number(process.env.PLAYWRIGHT_PREVIEW_PORT ?? 4173);
// An uncapped reference run measures rendering capacity independently of the
// desktop's refresh rate. This applies only to explicitly requested GPU profiling.
const gpuMode = process.env.PLAYWRIGHT_HARDWARE_GPU;
const gpuArgs = gpuMode === '1' || gpuMode === 'capped' ? ['--enable-gpu', '--use-angle=d3d11', ...(gpuMode === '1' ? ['--disable-frame-rate-limit', '--disable-gpu-vsync'] : [])] : [];

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 180000,
  expect: {
    timeout: 15000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,
      threshold: 0.2,
      animations: 'disabled',
    },
  },
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'project/automation-reports/14-validate-game-end-to-end/playwright-report', open: 'never' }],
  ],
  outputDir: 'project/automation-reports/14-validate-game-end-to-end/test-results',
  use: {
    browserName: 'chromium',
    headless: true,
    hasTouch: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    baseURL: `http://127.0.0.1:${previewPort}`,
    launchOptions: { ...(executablePath ? { executablePath } : {}), args: gpuArgs },
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: {
        viewport: { width: 1280, height: 900 },
        isMobile: false,
      },
    },
    {
      name: 'mobile-chrome',
      use: {
        viewport: { width: 844, height: 390 },
        isMobile: true,
      },
    },
  ],
  webServer: [
    { command: `npm run dev -- --port ${devPort} --strictPort`, url: `http://127.0.0.1:${devPort}`, reuseExistingServer: true },
    { command: `npm run preview -- --port ${previewPort} --strictPort`, url: `http://127.0.0.1:${previewPort}`, reuseExistingServer: true },
  ],
});
