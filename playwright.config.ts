import { defineConfig } from '@playwright/test';

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;

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
    baseURL: 'http://127.0.0.1:4173',
    launchOptions: executablePath ? { executablePath } : {},
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
    { command: 'npm run dev -- --port 5173 --strictPort', url: 'http://127.0.0.1:5173', reuseExistingServer: true },
    { command: 'npm run preview -- --port 4173 --strictPort', url: 'http://127.0.0.1:4173', reuseExistingServer: true },
  ],
});
