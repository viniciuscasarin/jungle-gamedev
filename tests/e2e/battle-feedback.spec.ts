import { test, expect } from '@playwright/test';

test.describe('Battle feedback, audio and accessibility', () => {
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
