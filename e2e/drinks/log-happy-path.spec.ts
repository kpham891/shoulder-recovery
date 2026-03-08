import { test, expect } from '@playwright/test';

test.describe('Log drink — happy path', () => {
  test('log a Bottle of Beer end-to-end', async ({ page }) => {
    // 1. Navigate to /drinks/log
    await page.goto('/drinks/log');

    // 2. Select "Beer" category
    await page.click('text=Beer');

    // 3. Assert "Bottle of Beer" is the first item
    const firstDrink = page.locator('button:has-text("Bottle of Beer")').first();
    await expect(firstDrink).toBeVisible();

    // 4. Click "Bottle of Beer"
    await firstDrink.click();

    // 5. Assert confirm screen shows correct details
    await expect(page.locator('input#drink-name')).toHaveValue('Bottle of Beer');
    await expect(page.getByTestId('volume-chip-330')).toHaveClass(/bg-blue-600/);
    await expect(page.locator('input#abv')).toHaveValue('5');

    // 6. Assert units display shows "1.7"
    await expect(page.getByTestId('units-display')).toHaveText('1.7');

    // 7. Click "Now" time chip
    await page.getByTestId('time-chip-now').click();
    await expect(page.getByTestId('time-chip-now')).toHaveClass(/bg-blue-600/);

    // 8. Click "Log Drink"
    await page.click('button:has-text("Log Drink")');

    // 9. Assert redirect to /drinks
    await page.waitForURL('**/drinks', { timeout: 10000 });
    await expect(page).toHaveURL(/\/drinks$/);

    // 10. Assert today's list contains "Bottle of Beer"
    await expect(page.locator('text=Bottle of Beer')).toBeVisible();
  });
});
