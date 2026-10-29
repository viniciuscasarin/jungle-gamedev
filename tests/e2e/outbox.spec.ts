import { test, expect } from '@playwright/test';
import { DETERMINISTIC_FIXTURES } from '../../src/mocks/fixtures';

test.describe('Result Outbox E2E flows', () => {
  test('offline match completion -> Pending — Retry -> restore network -> Retry -> Recorded', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-28T03:00:00Z') });
    await page.clock.pauseAt(new Date('2026-10-28T03:00:01Z'));

    await page.goto('/?seed=0');

    // Save fast enemy spawn so match completes quickly via destruction, and enable mock network outage
    await page.evaluate(data => {
      localStorage.setItem('pirate-battle.options.v1', JSON.stringify({ version: 1, data }));
      sessionStorage.setItem('pirate-battle.mock-network-outage', 'true');
    }, { sessionDurationMs: 60000, enemySpawnIntervalMs: 1000 });

    // Start match
    await page.getByRole('button', { name: 'Play', exact: true }).click();

    // Advance clock to let loading complete (loadingAttempt takes min 300ms)
    for (let n = 0; n < 40 && (await page.locator('.arena-screen').getAttribute('data-state')) !== 'ready'; n++) {
      await page.clock.runFor(100);
    }
    await expect(page.getByRole('heading', { name: 'Arena', exact: true })).toBeVisible();

    // Run clock until session completes (player destroyed by seed=0 enemies) and transitions to Result
    for (let elapsed = 0; elapsed < 125000 && !(await page.getByRole('heading', { name: 'Result', exact: true }).isVisible()); elapsed += 1000) {
      await page.clock.runFor(1000);
    }

    const resultHeading = page.getByRole('heading', { name: 'Result', exact: true });
    await expect(resultHeading).toBeVisible();

    // Since network outage was active, it should show "Pending — Retry" and the Retry button
    const deliveryStatus = page.locator('.delivery-status');
    await expect(deliveryStatus).toHaveText('Pending — Retry');
    const retryButton = page.locator('.retry-button');
    await expect(retryButton).toBeVisible();

    // Check that outbox has this pending match preserved in LocalStorage
    const outboxCountBefore = await page.evaluate(() => {
      const raw = localStorage.getItem('pirate-battle.outbox.v1');
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed.data) ? parsed.data.length : 0;
    });
    expect(outboxCountBefore).toBe(1);

    // 2. Restore network
    await page.evaluate(() => {
      sessionStorage.removeItem('pirate-battle.mock-network-outage');
    });

    // Click Retry
    await retryButton.click();

    // Status should transition to "Recorded"
    await expect(deliveryStatus).toHaveText('Recorded');
    await expect(retryButton).not.toBeVisible();

    // Check that outbox is now empty in LocalStorage
    const outboxCountAfter = await page.evaluate(() => {
      const raw = localStorage.getItem('pirate-battle.outbox.v1');
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed.data) ? parsed.data.length : 0;
    });
    expect(outboxCountAfter).toBe(0);

    // Go to Main Menu
    await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Pirate Battle', exact: true })).toBeVisible();

    // Menu should NOT show any pending notice
    const pendingNotice = page.locator('.outbox-pending-notice');
    await expect(pendingNotice).not.toBeVisible();
  });

  test('Main Menu inspects outbox and synchronizes pending entries via Retry Pending button', async ({ page }) => {
    // Inject a pending entry directly into LocalStorage to simulate previous unconfirmed match
    const validMatch = DETERMINISTIC_FIXTURES[0]!;
    const outboxEntry = {
      matchId: validMatch.matchId,
      result: validMatch,
      status: 'failed',
      attempts: 1,
      lastAttemptAt: new Date().toISOString(),
      error: 'Network disconnected',
      permanentFailure: false,
      createdAt: new Date().toISOString(),
    };

    await page.addInitScript(entry => {
      localStorage.setItem(
        'pirate-battle.outbox.v1',
        JSON.stringify({ version: 1, data: [entry] })
      );
    }, outboxEntry);

    await page.goto('/');

    // Notice should appear in MainMenu
    const pendingNotice = page.locator('.outbox-pending-notice');
    await expect(pendingNotice).toBeVisible();
    await expect(pendingNotice).toContainText('1 pending match record');

    const retryPendingBtn = page.locator('.retry-pending-button');
    await expect(retryPendingBtn).toBeVisible();

    // Click Retry Pending
    await retryPendingBtn.click();

    // Notice should disappear after successful sync
    await expect(pendingNotice).not.toBeVisible({ timeout: 10000 });

    // Check LocalStorage: outbox is empty
    const outboxCount = await page.evaluate(() => {
      const raw = localStorage.getItem('pirate-battle.outbox.v1');
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed.data) ? parsed.data.length : 0;
    });
    expect(outboxCount).toBe(0);
  });

  test('Abandoning a match never saves to outbox or Last Result', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Play', exact: true }).click();

    // Wait for Arena to become ready
    await expect(page.getByRole('heading', { name: 'Arena', exact: true })).toBeVisible();

    // Pause the game
    await page.getByRole('button', { name: 'Pause', exact: true }).click();

    // Click Main Menu in pause dialog
    await page.getByRole('button', { name: 'Main Menu', exact: true }).click();

    // In Abandon confirmation dialog, click Abandon
    const abandonBtn = page.getByRole('button', { name: 'Abandon', exact: true });
    await expect(abandonBtn).toBeVisible();
    await abandonBtn.click();

    // Back to Main Menu
    await expect(page.getByRole('heading', { name: 'Pirate Battle', exact: true })).toBeVisible();

    // Check LocalStorage: neither outbox nor last-result should exist
    const storageState = await page.evaluate(() => {
      return {
        outbox: localStorage.getItem('pirate-battle.outbox.v1'),
        lastResult: localStorage.getItem('pirate-battle.last-result.v1'),
      };
    });

    expect(storageState.outbox).toBeNull();
    expect(storageState.lastResult).toBeNull();
    await expect(page.locator('.outbox-pending-notice')).not.toBeVisible();
  });
});
