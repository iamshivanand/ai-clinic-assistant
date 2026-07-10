import { test, expect } from '@playwright/test';

test.describe('Visual Regression Testing', () => {

  test('Visual-01: Login Page Screenshot', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h2')).toContainText('AI Clinic Portal');
    
    // Validate visual screenshot
    await expect(page).toHaveScreenshot('login-page.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  test('Visual-02: Doctor Dashboard Screenshot', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Sign in as Doctor")');
    await expect(page).toHaveURL('/');
    
    await expect(page.locator('h1')).toContainText('Doctor Dashboard');
    
    // Validate visual screenshot
    await expect(page).toHaveScreenshot('doctor-dashboard.png', {
      maxDiffPixelRatio: 0.05,
    });
  });
});
