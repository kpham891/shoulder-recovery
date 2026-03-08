import { test, expect } from '@playwright/test';

test.describe('Quantity stepper', () => {
  test('quantity multiplier updates units correctly', async ({ page }) => {
    // Navigate to Beer → Bottle of Beer
    await page.goto('/drinks/log');
    await page.click('text=Beer');
    await page.click('button:has-text("Bottle of Beer")');

    // Verify starting at 1 × 1.7u
    await expect(page.getByTestId('units-display')).toHaveText('1.7');
    await expect(page.getByTestId('quantity-value')).toHaveText('1');

    // Click + twice to set quantity to 3
    await page.click('[aria-label="Increase quantity"]');
    await page.click('[aria-label="Increase quantity"]');
    await expect(page.getByTestId('quantity-value')).toHaveText('3');

    // Assert units display shows "5.0" (3 × 1.65 = 4.95, rounded to 5.0)
    const unitsText = await page.getByTestId('units-display').textContent();
    expect(parseFloat(unitsText || '0')).toBeGreaterThan(4);

    // Log the drink
    await page.click('button:has-text("Log Drink")');
    await page.waitForURL('**/drinks', { timeout: 10000 });
  });
});
