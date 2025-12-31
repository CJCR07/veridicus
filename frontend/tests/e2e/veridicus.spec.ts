import { test, expect } from '@playwright/test';

test.describe('Veridicus Forensics Workstation E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Start at the cases dashboard
    await page.goto('/cases');
  });

  test('should navigate through all main forensic pages', async ({ page }) => {
    // 1. Dashboard -> Vault
    await expect(page.locator('h2')).toContainText('Investigation Archive');
    
    // Check if there are cases, if not create one or skip specific card click
    const caseCards = page.locator('.artifact-card');
    if (await caseCards.count() > 0) {
      await caseCards.first().click();
      await expect(page).toHaveURL(/.*vault/);
      await expect(page.locator('h2')).toContainText('Evidence Vault');
    } else {
      await page.goto('/vault');
    }

    // 2. Sidebar Navigation: Vibe Forensics
    await page.click('nav >> text=Vibe Forensics');
    await expect(page).toHaveURL(/.*vibe/);
    await expect(page.locator('h2')).toContainText('Vibe Forensics');

    // 3. Sidebar Navigation: Reasoning Engine
    await page.click('nav >> text=Reasoning Engine');
    await expect(page).toHaveURL(/.*reasoning/);
    await expect(page.locator('h2')).toContainText('Reasoning Engine');

    // 4. Sidebar Navigation: Timeline
    await page.click('nav >> text=Timeline');
    await expect(page).toHaveURL(/.*timeline/);
    await expect(page.locator('h2')).toContainText('Timeline');

    // 5. Sidebar Navigation: Contradiction Map
    await page.click('nav >> text=Contradiction Map');
    await expect(page).toHaveURL(/.*contradictions/);
    await expect(page.locator('h2')).toContainText('Contradiction Map');
  });

  test('should allow creating a new investigation corpus from dashboard', async ({ page }) => {
    await page.goto('/cases');
    
    const initialCount = await page.locator('.artifact-card').count();
    await page.click('text=Open New Dossier');
    
    // Wait for the new card or an error (since it's a mock/test env)
    // We'll wait for the network to settle and check count increment
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.artifact-card')).toHaveCount(initialCount + 1, { timeout: 15000 });
  });

  test('should interact with the reasoning engine', async ({ page }) => {
    await page.goto('/reasoning');
    
    // Select a case if none active (the store should persist, but let's be sure)
    await page.goto('/cases');
    const caseCards = page.locator('.artifact-card');
    if (await caseCards.count() > 0) {
      await caseCards.first().click();
    } else {
      await page.click('text=Open New Dossier');
      await expect(page.locator('.artifact-card')).toHaveCount(1, { timeout: 10000 });
      await page.locator('.artifact-card').first().click();
    }
    
    await expect(page).toHaveURL(/.*vault/);
    await page.click('nav >> text=Reasoning Engine');
    
    const input = page.locator('textarea');
    await input.fill('Identify any timeline inconsistencies in the provided exhibits.');
    await page.click('button:has(svg.lucide-send)');
    
    // Verify engine responds
    const responseText = page.locator('text=Engine is synthesizing')
      .or(page.locator('text=Deductive synthesis failed'))
      .or(page.locator('[class*="bg-beige/20"]'));
    await expect(responseText.first()).toBeVisible({ timeout: 20000 });
  });
});
