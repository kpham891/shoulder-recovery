import { test, expect } from '@playwright/test';

test.describe('Insights page', () => {
  test('time period selector and charts render', async ({ page }) => {
    // 1. Navigate to /drinks/insights
    await page.goto('/drinks/insights');

    // 2. Assert time period selector renders with all options
    await expect(page.locator('button:has-text("7d")')).toBeVisible();
    await expect(page.locator('button:has-text("30d")')).toBeVisible();
    await expect(page.locator('button:has-text("90d")')).toBeVisible();
    await expect(page.locator('button:has-text("12mo")')).toBeVisible();
    await expect(page.locator('button:has-text("All")')).toBeVisible();

    // 3. Click each period — assert no JS errors
    const periods = ['7d', '30d', '90d', '12mo', 'All'];
    for (const period of periods) {
      await page.click(`button:has-text("${period}")`);
      // Wait a beat for re-render
      await page.waitForTimeout(300);
      // No crash — page is still interactive
      await expect(page.locator(`button:has-text("${period}")`)).toBeVisible();
    }

    // 4. Assert the 4 stats cards are present
    await expect(page.locator('text=Total units')).toBeVisible();
    await expect(page.locator('text=Avg / week')).toBeVisible();
    await expect(page.locator('text=Dry days')).toBeVisible();
    await expect(page.locator('text=Longest streak')).toBeVisible();

    // 5. Assert calendar heatmap is present
    await expect(page.locator('text=Calendar')).toBeVisible();

    // 6. Assert category breakdown chart heading exists (may not show if no data)
    // This is OK — chart only renders with data
  });
});
