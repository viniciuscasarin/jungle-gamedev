import { test, expect } from '@playwright/test';

test.describe('Ranking and Match History Tabs E2E', () => {
  test('displays ranking by default, allows pagination, and switches tabs via click and keyboard', async ({
    page,
  }) => {
    await page.goto('/');

    // 1. Ranking tab is selected by default
    const rankingTab = page.getByRole('tab', { name: 'Ranking', exact: true });
    const historyTab = page.getByRole('tab', { name: 'Match History', exact: true });

    await expect(rankingTab).toBeVisible();
    await expect(historyTab).toBeVisible();
    await expect(rankingTab).toHaveAttribute('aria-selected', 'true');
    await expect(historyTab).toHaveAttribute('aria-selected', 'false');

    // 2. Active configuration filter is visible
    const configFilter = page.locator('.tab-header-filter');
    await expect(configFilter).toContainText('Configuration: 120s session · 3.0s enemy spawn');

    // 3. Ranking table shows fixtures
    const rankingTable = page.locator('.leaderboard-table');
    await expect(rankingTable).toBeVisible();
    await expect(rankingTable).toContainText('Captain Anne Bonny');
    await expect(rankingTable).toContainText('42');

    // Check pagination
    const pageInfo = page.locator('.pagination-info');
    await expect(pageInfo).toContainText('Page 1 of 2');

    const nextButton = page.getByRole('button', { name: 'Next page' });
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    await expect(pageInfo).toContainText('Page 2 of 2');
    await expect(rankingTable).toContainText('#11');

    const prevButton = page.getByRole('button', { name: 'Previous page' });
    await expect(prevButton).toBeEnabled();
    await prevButton.click();
    await expect(pageInfo).toContainText('Page 1 of 2');

    // 4. Switch to Match History tab
    await historyTab.click();
    await expect(rankingTab).toHaveAttribute('aria-selected', 'false');
    await expect(historyTab).toHaveAttribute('aria-selected', 'true');

    // A fresh browser session with no completed matches shows canonical empty message
    const historyEmpty = page.locator('#panel-history .tab-empty-message');
    await expect(historyEmpty).toContainText('No completed matches yet.');

    // 5. Test keyboard navigation across tabs
    await historyTab.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(rankingTab).toBeFocused();
    await expect(rankingTab).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('ArrowRight');
    await expect(historyTab).toBeFocused();
    await expect(historyTab).toHaveAttribute('aria-selected', 'true');

    // 6. Ensure Play and Options remain fully interactive
    const playButton = page.getByRole('button', { name: 'Play', exact: true });
    const optionsButton = page.getByRole('button', { name: 'Options', exact: true });
    await expect(playButton).toBeEnabled();
    await expect(optionsButton).toBeEnabled();

    // Open options
    await optionsButton.click();
    await expect(page.getByRole('heading', { name: 'Options', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(playButton).toBeVisible();
  });

  test('responsive viewport 320px width without horizontal body overflow', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 600 });
    await page.goto('/');

    const rankingTab = page.getByRole('tab', { name: 'Ranking', exact: true });
    await expect(rankingTab).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(320);

    const tableContainer = page.locator('.table-responsive-container');
    await expect(tableContainer).toBeVisible();
  });
});
