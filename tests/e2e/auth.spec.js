const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {
  test('should allow a user to navigate to login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Login/i || /AI Clinic/i);
    await expect(page.locator('button', { name: /Login/i })).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button:has-text("Login")');
    
    // Check for toast or error message
    // Note: This assumes the backend is running and returns 401
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });
});
