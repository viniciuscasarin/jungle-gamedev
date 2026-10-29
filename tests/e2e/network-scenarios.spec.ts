import { test, expect, playableSize } from './test';

test.describe('Network Scenarios Diagnostics and Controls E2E', () => {
  test('diagnostic panel opens, selects scenario, and reflects empty list immediately', async ({ page }) => {
    await page.goto('/');

    const details = page.locator('.network-scenario-panel');
    const summary = page.locator('.network-scenario-summary');
    await expect(summary).toBeVisible();

    // 1. Expand panel
    await summary.click();
    await expect(details).toHaveAttribute('open', '');

    // 2. Default state
    const select = page.locator('#network-scenario-select');
    await expect(select).toBeVisible();
    await expect(select).toHaveValue('default');

    const badge = page.locator('.network-scenario-badge');
    await expect(badge).toHaveText('default');

    // 3. Select "empty" scenario
    await select.selectOption('empty');
    await expect(badge).toHaveText('empty');

    const statusMsg = page.locator('.network-scenario-status');
    await expect(statusMsg).toContainText('Active network scenario set to: Empty Lists.');

    // Restore Default Scenario button must now be visible
    const restoreBtn = page.locator('.restore-default-button');
    await expect(restoreBtn).toBeVisible();

    // 4. Click Restore Default Scenario
    await restoreBtn.click();
    await expect(select).toHaveValue('default');
    await expect(badge).toHaveText('default');
    await expect(restoreBtn).not.toBeVisible();
    await expect(statusMsg).toContainText('Restored default network scenario.');
  });

  test('URL query parameter (?networkScenario=empty) takes precedence and renders empty list', async ({ page }) => {
    await page.goto('/?networkScenario=empty');

    const emptyMessage = page.locator('#panel-ranking .tab-empty-message');
    await expect(emptyMessage).toBeVisible();
    await expect(emptyMessage).toContainText('No matches for these settings yet.');
  });

  test('URL query parameter (?networkScenario=multi-page) renders expanded 4-page dataset', async ({ page }) => {
    await page.goto('/?networkScenario=multi-page');

    const pageInfo = page.locator('.pagination-info');
    await expect(pageInfo).toBeVisible();
    await expect(pageInfo).toContainText('Page 1 of 4');

    const nextBtn = page.getByRole('button', { name: 'Next page' });
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();

    await expect(pageInfo).toContainText('Page 2 of 4');
  });

  test('Reset Mock Data action triggers feedback announcement and restores canonical data', async ({ page }) => {
    await page.goto('/');

    const summary = page.locator('.network-scenario-summary');
    await summary.click();

    const resetBtn = page.locator('.reset-mock-button');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    const statusMsg = page.locator('.network-scenario-status');
    await expect(statusMsg).toHaveText('Mock data reset to canonical fixtures.');
  });

  test('Mobile viewport (320px) preserves 44px touch targets without horizontal overflow', async ({ page }) => {
    await page.setViewportSize(playableSize(320, 640));
    await page.goto('/');

    const summary = page.locator('.network-scenario-summary');
    await summary.click();

    const select = page.locator('#network-scenario-select');
    const resetBtn = page.locator('.reset-mock-button');

    const summaryBox = await summary.boundingBox();
    const selectBox = await select.boundingBox();
    const resetBox = await resetBtn.boundingBox();

    expect(summaryBox?.height).toBeGreaterThanOrEqual(44);
    expect(selectBox?.height).toBeGreaterThanOrEqual(44);
    expect(resetBox?.height).toBeGreaterThanOrEqual(44);

    // Verify horizontal containment (no body overflow > 320px)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(playableSize(320, 640).width);
  });
});
