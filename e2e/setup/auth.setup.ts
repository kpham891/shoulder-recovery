/**
 * Auth setup for Playwright e2e tests.
 *
 * Prerequisites:
 *   1. Create a test user in your Supabase project (Authentication → Users)
 *   2. Create a `.env.test` file in the project root with:
 *        TEST_USER_EMAIL=your-test-user@example.com
 *        TEST_USER_PASSWORD=your-test-password
 *   3. `.env.test` is git-ignored — never commit credentials
 */
import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.test
function loadEnvTest() {
  const envPath = path.resolve(__dirname, '../../.env.test');
  if (!fs.existsSync(envPath)) {
    throw new Error(
      'Missing .env.test file. Create it with TEST_USER_EMAIL and TEST_USER_PASSWORD.'
    );
  }
  const content = fs.readFileSync(envPath, 'utf-8');
  const vars: Record<string, string> = {};
  content.split('\n').forEach((line) => {
    const match = line.match(/^(\w+)=(.*)$/);
    if (match) vars[match[1]] = match[2].trim();
  });
  return vars;
}

setup('authenticate', async ({ page }) => {
  const env = loadEnvTest();
  const email = env.TEST_USER_EMAIL;
  const password = env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.test');
  }

  await page.goto('/auth/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for redirect to home
  await page.waitForURL('**/', { timeout: 15000 });

  // Save auth state
  const authDir = path.resolve(__dirname, '../.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  await page.context().storageState({ path: path.resolve(authDir, 'user.json') });
});
