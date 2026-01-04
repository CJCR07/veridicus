import { test, expect } from '@playwright/test';

test.describe('Investigator Authentication Portal', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
  });

  test('should redirect unauthenticated investigator to login', async ({ page }) => {
    // Attempt to access protected dashboard
    await page.goto('/cases');
    
    // Should be redirected to /login
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('h2')).toContainText('Welcome Back');
    await expect(page.locator('text=investigator access portal')).toBeVisible();
  });

  test('should show registration portal from login page', async ({ page }) => {
    await page.goto('/login');
    
    // Click on "Initialize Account"
    await page.click('text=Initialize Account');
    
    // Should be on /signup
    await expect(page).toHaveURL(/.*signup/);
    await expect(page.locator('h2')).toContainText('Initialize Credentials');
    await expect(page.locator('text=Register Investigator')).toBeVisible();
  });

  test('should allow navigation back to login from signup', async ({ page }) => {
    await page.goto('/signup');
    await page.click('text=investigator portal');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should verify the sleek forensic workstation theme on login', async ({ page }) => {
    await page.goto('/login');
    
    // Check for "Veridicus" title with serif font
    const title = page.locator('h1');
    await expect(title).toContainText('Veridicus');
    
    // Check for dark theme background (slate-950/900 classes usually present in dark theme)
    // We can also check for the version footer
    await expect(page.locator('text=SECURE FORENSIC WORKSTATION')).toBeVisible();
  });
});
