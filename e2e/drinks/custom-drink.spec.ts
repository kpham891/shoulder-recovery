import { test, expect } from '@playwright/test';

test.describe('Custom drink', () => {
  test('log a custom drink with manual details', async ({ page }) => {
    // Navigate to Beer → Custom drink
    await page.goto('/drinks/log');
    await page.click('text=Beer');
    await page.click('text=Custom drink');

    // Clear and enter custom name
    await page.fill('input#drink-name', 'Mystery Lager');

    // Set volume to 500
    await page.getByTestId('volume-manual-input').fill('500');

    // Set ABV to 4.8
    await page.fill('input#abv', '4.8');

    // Assert units shows 2.4 (500 * 4.8 / 1000 = 2.4)
    await expect(page.getByTestId('units-display')).toHaveText('2.4');

    // Log it
    await page.click('button:has-text("Log Drink")');
    await page.waitForURL('**/drinks', { timeout: 10000 });

    // Assert it appears on /drinks
    await expect(page.locator('text=Mystery Lager')).toBeVisible();
  });
});
