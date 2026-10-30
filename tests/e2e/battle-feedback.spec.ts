import { test, expect, APP_ORIGINS, settleStartup, waitForMockWorker } from './test';
import type { Page } from '@playwright/test';

for (const origin of APP_ORIGINS) test.describe(`Battle feedback, audio and accessibility ${origin}`, () => {
  test.use({ baseURL: origin });
  test('unlocks audio on user gesture, toggles mute in HUD and synchronizes with Options', async ({ page }) => {
    await page.goto('/');

    // Audio starts locked before user gesture
    const initialUnlocked = await page.evaluate(() => {
      return Boolean((window as unknown as { __audioUnlocked?: boolean }).__audioUnlocked);
    });
    expect(initialUnlocked).toBe(false);

    // Click Play to start match (user gesture)
    await page.getByRole('button', { name: 'Play' }).click();

    // Verify arena loaded
    await expect(page.getByRole('heading', { name: 'Arena' })).toBeVisible();

    // Find mute button in HUD
    const muteButton = page.locator('.mute-control');
    await expect(muteButton).toBeVisible();
    await expect(muteButton).toHaveAttribute('aria-label', 'Mute sound');
    await expect(muteButton).toHaveAttribute('aria-pressed', 'false');

    // Click mute button to mute
    await muteButton.click();
    await expect(muteButton).toHaveAttribute('aria-label', 'Unmute sound');
    await expect(muteButton).toHaveAttribute('aria-pressed', 'true');

    // Check LocalStorage persistence
    const savedMute = await page.evaluate(() => {
      const raw = localStorage.getItem('pirate-battle.sound-muted.v1');
      return raw ? JSON.parse(raw).data : null;
    });
    expect(savedMute).toBe(true);

    // Return to menu and open Options
    await page.getByRole('button', { name: 'Main Menu' }).click();
    const abandonBtn = page.getByRole('button', { name: 'Abandon' });
    if (await abandonBtn.isVisible()) {
      await abandonBtn.click();
    }

    await page.getByRole('button', { name: 'Options' }).click();
    await expect(page.getByRole('heading', { name: 'Options' })).toBeVisible();

    // Verify sound button reflects muted state
    const optionsSoundBtn = page.locator('#sound-mute-button');
    await expect(optionsSoundBtn).toBeVisible();
    await expect(optionsSoundBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(optionsSoundBtn).toContainText('Muted');
  });

  test('live region announces pause and resume events politely without frame spam', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Play' }).click();
    await expect(page.getByRole('heading', { name: 'Arena' })).toBeVisible();

    const liveRegion = page.locator('[data-testid="battle-live-region"]');
    await expect(liveRegion).toBeAttached();
    await expect(liveRegion).toHaveAttribute('role', 'status');
    await expect(liveRegion).toHaveAttribute('aria-live', 'polite');

    // Pause the game
    await page.getByRole('button', { name: 'Pause' }).click();
    await expect(liveRegion).toContainText('Game paused.');
    await expect(page.getByRole('status')).toContainText('Game paused.');

    // Resume the game
    await page.getByRole('button', { name: 'Resume' }).click();
    await expect(liveRegion).toContainText('Game resumed.');
  });

  test('confines keyboard focus in modal dialog with focus trap and restores focus', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Play' }).click();
    await expect(page.getByRole('heading', { name: 'Arena' })).toBeVisible();

    // Pause to open modal dialog
    await page.getByRole('button', { name: 'Pause' }).click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    const resumeBtn = page.getByRole('button', { name: 'Resume' });
    const menuBtn = dialog.getByRole('button', { name: 'Main Menu' });

    // Focus is initially inside dialog
    await expect(resumeBtn).toBeFocused();

    // Tab moves focus to Main Menu
    await page.keyboard.press('Tab');
    await expect(menuBtn).toBeFocused();

    // Tab wraps back to Resume
    await page.keyboard.press('Tab');
    await expect(resumeBtn).toBeFocused();

    // Shift+Tab wraps back to Main Menu
    await page.keyboard.press('Shift+Tab');
    await expect(menuBtn).toBeFocused();

    // Escape closes dialog and resumes
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test('respects prefers-reduced-motion media query', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const isReduced = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });
    expect(isReduced).toBe(true);

    await page.getByRole('button', { name: 'Play' }).click();
    await expect(page.getByRole('heading', { name: 'Arena' })).toBeVisible();
  });
});

async function frozenPlay(page: Page, origin: string, scenario = 'empty') {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.clock.install({ time: new Date('2026-10-30T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-30T12:00:01Z'));
  await page.goto(`${origin}/?combatScenario=${scenario}&geometry=1&seed=0`);
  await waitForMockWorker(page);
  await settleStartup(page);
  await page.evaluate(() => localStorage.setItem('pirate-battle.options.v1', JSON.stringify({ version: 1, data: { sessionDurationMs: 60000, enemySpawnIntervalMs: 3000 } })));
  await startAgain(page);
}
async function startAgain(page: Page) {
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  for (let n = 0; n < 40 && await page.locator('.arena-screen').getAttribute('data-state') !== 'ready'; n++) await page.clock.runFor(100);
  await expect(page.locator('.arena-screen')).toHaveAttribute('data-state', 'ready');
  await page.locator('.arena-host').tap({ position: { x: 300, y: 150 } }); await page.clock.runFor(40);
  await expect(page.locator('.arena-screen')).toHaveAttribute('data-input-mode', 'touch');
}
async function abandon(page: Page) {
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Abandon', exact: true }).click();
}
const snapshot = (page: Page) => page.evaluate(() => window.__arenaDiagnostics().navigation!.snapshot);

for (const origin of APP_ORIGINS) {
  for (const activation of ['touch', 'Enter', 'Space'] as const) test(`dismiss tips by ${activation} preserves game, description and accessible announcements ${origin}`, async ({ page }) => {
    await frozenPlay(page, origin);
    const button = page.getByRole('button', { name: 'Dismiss control tips' });
    await expect(button).toBeVisible();
    const before = await snapshot(page);
    if (activation === 'touch') await button.tap();
    else { await button.focus(); await button.press(activation); }
    await expect(button).toHaveCount(0); await expect(page.locator('.control-guide')).toHaveCount(0);
    expect(await snapshot(page)).toEqual(before);
    await expect(page.getByRole('region', { name: 'Sailing controls' })).toBeFocused();
    await expect(page.getByRole('region', { name: 'Sailing controls' })).toHaveAccessibleDescription(/Drag joypad/);
    const live = page.getByRole('status'); await expect(live).toHaveText('');
    await page.clock.runFor(1000); await expect(live).toHaveText('');
    await page.locator('[data-control=R]').tap(); await page.clock.runFor(40); await expect(live).toHaveText('');
    await page.locator('[data-control=R]').tap(); await page.clock.runFor(40);
    await page.getByRole('button', { name: 'Pause', exact: true }).click(); await expect(live).toHaveText('Game paused.');
    await page.getByRole('button', { name: 'Resume', exact: true }).click(); await expect(live).toHaveText('Game resumed.');
    if (activation === 'touch') {
      test.setTimeout(300000);
      for (let n = 0; n < 60 && (await snapshot(page)).activeTimeMs < 50000; n++) await page.clock.runFor(1000);
      await expect(live).toHaveText('Warning: 10 seconds remaining.');
    }
    await expect(live).not.toContainText('Drag joypad');
  });

  for (const storage of ['normal', 'getter-error', 'write-error'] as const) test(`dismissed session survives remount, modes, pause, rotation and reload with ${storage} ${origin}`, async ({ page }, info) => {
    if (storage !== 'normal') await page.addInitScript(storage => {
      if (storage === 'getter-error') Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('Denied session getter'); } });
      else Object.defineProperty(window.sessionStorage, 'setItem', { value() { throw new Error('Denied session write'); } });
    }, storage);
    await frozenPlay(page, origin);
    await page.getByRole('button', { name: 'Dismiss control tips' }).tap();
    await abandon(page); await startAgain(page); await expect(page.locator('.control-guide')).toHaveCount(0);
    await page.mouse.move(350, 140); await page.clock.runFor(40); await expect(page.locator('.control-guide')).toContainText('Mouse to steer');
    await page.locator('.arena-host').tap({ position: { x: 300, y: 150 } }); await page.clock.runFor(40); await expect(page.locator('.control-guide')).toHaveCount(0);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Dismiss control tips' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Resume', exact: true }).click();
    if (info.project.name === 'mobile-chrome') {
      await page.setViewportSize({ width: 390, height: 844 }); await page.clock.runFor(40);
      await expect(page.getByRole('main', { name: 'Landscape required' })).toBeVisible();
      await expect(page.getByRole('region', { name: 'Sailing controls' })).toHaveCount(0);
      await expect(page.getByRole('status')).toHaveCount(0);
      await page.setViewportSize({ width: 844, height: 390 }); await page.clock.runFor(40);
      await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeFocused();
      await page.getByRole('button', { name: 'Resume', exact: true }).click();
    }
    await expect(page.locator('.control-guide')).toHaveCount(0);
    await page.reload(); await waitForMockWorker(page); await settleStartup(page); await startAgain(page);
    await expect(page.getByRole('button', { name: 'Dismiss control tips' })).toHaveCount(storage === 'normal' ? 0 : 1);
  });

  test(`score and critical-health announcements remain exposed with tips closed ${origin}`, async ({ page, context }) => {
    await frozenPlay(page, origin, 'targets');
    await page.getByRole('button', { name: 'Dismiss control tips' }).tap();
    const session = await context.newCDPSession(page), front = (await page.locator('[data-control=front]').boundingBox())!;
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 1, x: front.x + front.width / 2, y: front.y + front.height / 2 }] });
    await page.clock.runFor(800);
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await session.detach();
    await expect(page.getByRole('status')).toContainText('Enemy destroyed!');
    await abandon(page);
    await page.evaluate(() => history.replaceState(null, '', '/?geometry=1&seed=0'));
    await startAgain(page); await expect(page.locator('.control-guide')).toHaveCount(0);
    for (let n = 0; n < 600 && (await snapshot(page)).player.health > 25; n++) await page.clock.runFor(100);
    const health = (await snapshot(page)).player.health;
    expect(health).toBeGreaterThan(0); expect(health).toBeLessThanOrEqual(25);
    await expect(page.getByRole('status')).toHaveText('Critical damage! Hull integrity below 25 percent.');
  });
}
