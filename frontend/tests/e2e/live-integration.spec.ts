import { test, expect, Page } from '@playwright/test';

/**
 * End-to-End Live Integration Suite
 * Verified with real investigator credentials against the active workstation.
 */

const INVESTIGATOR_EMAIL = 'test-investigator-123@veridicus.dev';
const INVESTIGATOR_PASSWORD = 'Password123!';

// Disable parallel execution for live tests to avoid session conflicts
test.describe.configure({ mode: 'serial' });

async function performRealLogin(page: Page) {
  console.log('[E2E] Initializing Investigator Session...');
  await page.goto('/login');
  
  await page.fill('input[type="email"]', INVESTIGATOR_EMAIL);
  await page.fill('input[type="password"]', INVESTIGATOR_PASSWORD);
  
  await page.click('button[type="submit"]');
  
  // Wait for redirect to cases
  await expect(page).toHaveURL(/\/cases/, { timeout: 10000 });
  console.log('[E2E] Session Established Successfully.');
}

test.describe('Veridicus Forensic Workstation - Live Integration', () => {
  
  test.beforeEach(async ({ page }) => {
    // Perform real login before each test to ensure fresh session
    await performRealLogin(page);
  });

  test('should verify full workstation navigation and forensic terminology', async ({ page }) => {
    // 1. Investigation Archive (Dashboard)
    await expect(page.locator('h2:has-text("Investigation Archive")')).toBeVisible();
    
    // 2. Sidebar Terminology Check
    const navLinks = [
      'Investigation Archive',
      'Evidence Vault', 
      'Reasoning Engine',
      'Vibe Forensics',
      'Timeline',
      'Contradiction Map'
    ];
    
    for (const linkText of navLinks) {
      await expect(page.locator(`nav a:has-text("${linkText}")`)).toBeVisible();
    }

    // 3. Navigation: Evidence Vault
    await page.click('nav a:has-text("Evidence Vault")');
    await expect(page).toHaveURL(/.*vault/);
    await expect(page.locator('h1:has-text("Evidence Vault")')).toBeVisible();

    // 4. Navigation: Reasoning Engine
    await page.click('nav a:has-text("Reasoning Engine")');
    await expect(page).toHaveURL(/.*reasoning/);

    // 5. Navigation: Vibe Forensics
    await page.click('nav a:has-text("Vibe Forensics")');
    await expect(page).toHaveURL(/.*vibe/);
  });

  test('should perform real dossier creation and archival', async ({ page }) => {
    await page.goto('/cases');
    
    // Create new case using the dashboard button
    console.log('[E2E] Initializing New Dossier...');
    await page.click('button:has-text("Open New Dossier")');
    
    // Wait for the archive to refresh (it auto-generates a name like Case-XXXX)
    await page.waitForTimeout(2000); 
    
    // Verify at least one case exists
    const cases = page.locator('h3');
    const count = await cases.count();
    expect(count).toBeGreaterThan(0);
    
    console.log(`[E2E] Verified ${count} dossier(s) in archival.`);
    
    // Navigate to Vault and try to create a named corpus to verify mutation
    await page.click('nav a:has-text("Evidence Vault")');
    await expect(page.locator('h1:has-text("Evidence Vault")')).toBeVisible();
    
    // Open the creation modal using ARIA label
    await page.click('button[aria-label="Create new case"]');
    
    const dossierName = `Live-Archive-Test-${Math.floor(Math.random() * 10000)}`;
    const nameInput = page.locator('#case-name');
    await expect(nameInput).toBeVisible();
    await nameInput.fill(dossierName);
    
    await page.click('button:has-text("Create Corpus")');
    
    // Final verification in Archive
    await page.goto('/cases');
    await expect(page.locator(`text=${dossierName}`)).toBeVisible({ timeout: 10000 });
  });

  test('should securely terminate investigative session', async ({ page }) => {
    await page.goto('/cases');
    
    console.log('[E2E] Terminating Session...');
    await page.click('button:has-text("Terminate Session")');
    
    // Should be back at login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h2:has-text("Welcome Back")')).toBeVisible();
  });
});
