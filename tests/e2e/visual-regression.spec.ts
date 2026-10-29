import { test, expect } from '@playwright/test';
import {
  disableAnimations,
  buildDeterministicUrl,
  DETERMINISTIC_SEED,
} from './helpers';
import { DETERMINISTIC_FIXTURES } from '../../src/mocks/fixtures';

test.describe('Deterministic Visual Regression Baselines', () => {
  test.beforeEach(async ({ page }) => {
    // Reset local/session storage before each visual baseline test
    await page.addInitScript(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // ignore
      }
    });
  });

  // 2.1 Main Menu Visual Baseline - Desktop & Mobile
  test('main-menu-desktop baseline', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Desktop only');

    await page.goto(buildDeterministicUrl('/', { seed: DETERMINISTIC_SEED }));
    await expect(page.getByRole('heading', { name: 'Pirate Battle', exact: true })).toBeVisible();
    await expect(page.locator('.leaderboard-table')).toBeVisible();
    await disableAnimations(page);

    await expect(page).toHaveScreenshot('main-menu-desktop.png');
  });

  test('main-menu-mobile baseline', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'Mobile only');

    await page.goto(buildDeterministicUrl('/', { seed: DETERMINISTIC_SEED }));
    await expect(page.getByRole('heading', { name: 'Pirate Battle', exact: true })).toBeVisible();
    await expect(page.locator('.leaderboard-table')).toBeVisible();
    await disableAnimations(page);

    await expect(page).toHaveScreenshot('main-menu-mobile.png');
  });

  // 2.2 Main Menu Keyboard Focus Baseline
  test('main-menu-focused baseline', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Desktop only');

    await page.goto(buildDeterministicUrl('/', { seed: DETERMINISTIC_SEED }));
    await expect(page.getByRole('heading', { name: 'Pirate Battle', exact: true })).toBeVisible();
    await expect(page.locator('.leaderboard-table')).toBeVisible();

    const playButton = page.getByRole('button', { name: 'Play', exact: true });
    await playButton.focus();
    await expect(playButton).toBeFocused();
    await disableAnimations(page);

    await expect(page).toHaveScreenshot('main-menu-focused.png');
  });

  // 2.3 Battle Desktop Paused Baseline
  test('battle-desktop-paused baseline', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Desktop only');

    await page.goto(
      buildDeterministicUrl('/', {
        seed: DETERMINISTIC_SEED,
        combatScenario: 'island',
      })
    );
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Arena', exact: true })).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(1);

    // Pause the arena
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Paused', exact: true })).toBeVisible();
    await disableAnimations(page);

    await expect(page).toHaveScreenshot('battle-desktop-paused.png');
  });

  // 2.4 Mobile Battle HUD Baseline
  test('battle-mobile-hud baseline', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'Mobile only');

    await page.goto(
      buildDeterministicUrl('/', {
        seed: DETERMINISTIC_SEED,
        combatScenario: 'island',
      })
    );
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Arena', exact: true })).toBeVisible();
    await expect(page.locator('.joypad')).toBeVisible();
    await expect(page.locator('.skills')).toBeVisible();

    // Pause to stabilize graphics before capturing mobile HUD
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Paused', exact: true })).toBeVisible();
    await disableAnimations(page);

    await expect(page).toHaveScreenshot('battle-mobile-hud.png');
  });

  // 2.5 Options Modal Baselines - Desktop & Mobile
  test('options-modal-desktop baseline', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Desktop only');

    await page.goto(buildDeterministicUrl('/', { seed: DETERMINISTIC_SEED }));
    await page.getByRole('button', { name: 'Options', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Options', exact: true })).toBeVisible();
    await disableAnimations(page);

    await expect(page).toHaveScreenshot('options-modal-desktop.png');
  });

  test('options-modal-mobile baseline', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'Mobile only');

    await page.goto(buildDeterministicUrl('/', { seed: DETERMINISTIC_SEED }));
    await page.getByRole('button', { name: 'Options', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Options', exact: true })).toBeVisible();
    await disableAnimations(page);

    await expect(page).toHaveScreenshot('options-modal-mobile.png');
  });

  // 2.6 Result Screen Baseline - Desktop
  test('result-screen-desktop baseline', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Desktop only');

    const canonicalResult = {
      version: 1,
      data: DETERMINISTIC_FIXTURES[0]!,
    };

    await page.addInitScript(resultData => {
      localStorage.setItem('pirate-battle.last-result.v1', JSON.stringify(resultData));
    }, canonicalResult);

    await page.goto(buildDeterministicUrl('/', { seed: DETERMINISTIC_SEED }));
    const lastResultBtn = page.getByRole('button', { name: 'Last Result', exact: true });
    await expect(lastResultBtn).toBeVisible();
    await lastResultBtn.click();

    await expect(page.getByRole('heading', { name: 'Result', exact: true })).toBeVisible();
    await expect(page.locator('.delivery-status')).toHaveText('Recorded');
    await disableAnimations(page);

    await expect(page).toHaveScreenshot('result-screen-desktop.png');
  });
});
