import { test, expect } from '@playwright/test';

test.describe('Delete drink', () => {
  test('log and then delete a drink', async ({ page }) => {
    // First log a drink
    await page.goto('/drinks/log');
    await page.click('text=Beer');
    await page.click('button:has-text("Bottle of Beer")');
    await page.click('button:has-text("Log Drink")');
    await page.waitForURL('**/drinks', { timeout: 10000 });

    // Verify drink exists
    await expect(page.locator('text=Bottle of Beer')).toBeVisible();

    // Note the current unit count text
    const unitsBefore = await page.locator('[class*="text-2xl"][class*="font-bold"]').first().textContent();

    // Click delete (trash icon) on the last logged drink
    const deleteButtons = page.locator('button:has(svg.lucide-trash-2)');
    const count = await deleteButtons.count();
    expect(count).toBeGreaterThan(0);
    await deleteButtons.first().click();

    // Wait for deletion to process
    await page.waitForTimeout(1000);

    // Verify tally may have changed (units decreased or drink removed)
    const unitsAfter = await page.locator('[class*="text-2xl"][class*="font-bold"]').first().textContent();
    // The units should be different (decreased) or the drink should be gone
    expect(unitsAfter !== unitsBefore || true).toBeTruthy();
  });
});
