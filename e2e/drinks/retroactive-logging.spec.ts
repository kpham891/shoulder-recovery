import { test, expect } from '@playwright/test';

test.describe('Retroactive logging', () => {
  test('logging with "1h ago" time chip', async ({ page }) => {
    // Navigate to Beer → Can of Beer
    await page.goto('/drinks/log');
    await page.click('text=Beer');
    await page.click('button:has-text("Can of Beer")');

    // Click "1h ago" time chip
    await page.getByTestId('time-chip-1h').click();
    await expect(page.getByTestId('time-chip-1h')).toHaveClass(/bg-blue-600/);

    // Custom input should not be visible
    await expect(page.getByTestId('custom-time-input')).not.toBeVisible();

    // Log the drink
    await page.click('button:has-text("Log Drink")');
    await page.waitForURL('**/drinks', { timeout: 10000 });

    // Verify drink appears on the today page
    await expect(page.locator('text=Can of Beer')).toBeVisible();
  });
});
