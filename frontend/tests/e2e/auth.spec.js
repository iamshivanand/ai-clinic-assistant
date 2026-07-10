import { test, expect } from '@playwright/test';

test.describe('Authentication & Authorization Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('E2E-AUTH-01: Doctor Login Flow', async ({ page }) => {
    await page.goto('/login');
    
    // Check page title
    await expect(page.locator('h2')).toContainText('AI Clinic Portal');
    
    // Click prefill button to load Doctor credentials and then Sign In
    await page.click('button:has-text("Prefill Doctor")');
    await page.click('button:has-text("Sign In")');
    
    // Verify redirection to Dashboard
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Doctor Dashboard');
    await expect(page.locator('header p')).toContainText("Welcome back, Dr. Admin.");
  });

  test('E2E-AUTH-02: Super Admin Login Flow', async ({ page, request }) => {
    // 1. Programmatic login as Super Admin
    const response = await request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: 'admin@test.com',
        password: 'password123'
      }
    });
    const json = await response.json();
    const { token, data: { user } } = json;

    await page.goto('/login');

    // 2. Inject real Super Admin token
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          user,
          token
        }
      }));
    }, { token, user });
    
    // 3. Navigate directly to Super Admin Analytics page
    await page.goto('/super-admin');
    await expect(page).toHaveURL('/super-admin');
    await expect(page.locator('h1')).toContainText('System Analytics');
  });

  test('E2E-AUTH-03: Unauthorized Access Redirect (Unauthenticated)', async ({ page }) => {
    // Try to access protected route without logging in
    await page.goto('/');
    
    // Should be redirected back to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('E2E-AUTH-04: Role-Based Boundary Check (Doctor to Super Admin)', async ({ page, request }) => {
    // 1. Programmatic login as Doctor to get real token
    const response = await request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: 'doctor@test.com',
        password: 'password123'
      }
    });
    const json = await response.json();
    const { token, data: { user } } = json;

    await page.goto('/login');

    // 2. Inject authenticated Doctor state
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          user,
          token
        }
      }));
    }, { token, user });
    
    // 3. Try to access the Super Admin section
    await page.goto('/super-admin');
    
    // 4. Should redirect to unauthorized page
    await expect(page).toHaveURL('/unauthorized');
  });
});
