import { test, expect, Page } from '@playwright/test';

// Mock data
const mockUser = {
  id: 'test-user-id',
  email: 'test@veridicus.com',
  role: 'authenticated',
  aud: 'authenticated',
  created_at: new Date().toISOString()
};

const mockSession = {
  access_token: 'test-token-12345',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'test-refresh-token',
  user: mockUser
};

let mockCases: any[] = [];

// Setup all mocks for the page
async function setupMocks(page: Page, options: { withCases?: boolean } = { withCases: true }) {
  // Inject DEV_BYPASS_AUTH header for the duration of the test
  await page.setExtraHTTPHeaders({
    'x-dev-bypass-auth': 'true'
  });

  // Small init script to also set it on window for client-side logic
  await page.addInitScript(() => {
    (window as any).__DEV_BYPASS_AUTH__ = true;
  });

  // Reset mock cases
  mockCases = options.withCases ? [
    {
      id: 'case-001-test',
      name: 'Test Investigation Alpha',
      description: 'A test forensic investigation for E2E testing.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'test-user-id'
    }
  ] : [];

  // Mock backend API at localhost:3001
  await page.route('**/localhost:3001/api/**', async (route, request) => {
    const url = route.request().url();
    const method = request.method();
    
    if (url.includes('/api/cases') && method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockCases) });
      return;
    }
    
    if (url.includes('/api/cases') && method === 'POST') {
      const newCase = { id: `case-${Date.now()}`, name: `Case-${Math.floor(Math.random() * 10000)}`, description: 'New forensic investigation.', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: 'test-user-id' };
      mockCases.push(newCase);
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(newCase) });
      return;
    }
    
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  // Small delay to ensure state is settled
  await page.waitForTimeout(50);
}

test.describe('Veridicus Forensics Workstation E2E', () => {
  test('should navigate through all main forensic pages', async ({ page }) => {
    await setupMocks(page, { withCases: true });
    
    await page.goto('/cases');
    await page.waitForLoadState('networkidle');
    
    // 1. Dashboard should show Investigation Archive
    const heading = page.locator('h2');
    await expect(heading.first()).toContainText('Investigation Archive');
    
    // Verify sidebar exists
    await expect(page.locator('aside')).toBeVisible();

    // 2. Sidebar Navigation: Vibe Forensics
    await page.click('nav a:has-text("Vibe Forensics")');
    await expect(page).toHaveURL(/.*vibe/);

    // 3. Sidebar Navigation: Reasoning Engine
    await page.click('nav a:has-text("Reasoning Engine")');
    await expect(page).toHaveURL(/.*reasoning/);

    // 4. Sidebar Navigation: Timeline
    await page.click('nav a:has-text("Timeline")');
    await expect(page).toHaveURL(/.*timeline/);

    // 5. Sidebar Navigation: Contradiction Map
    await page.click('nav a:has-text("Contradiction Map")');
    await expect(page).toHaveURL(/.*contradictions/);
  });

  test('should display sidebar navigation correctly with new forensic terms', async ({ page }) => {
    await setupMocks(page);
    await page.goto('/cases');
    
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
  });

  test('should show empty state when no cases exist', async ({ page }) => {
    await setupMocks(page, { withCases: false });
    
    await page.goto('/cases');
    await page.waitForLoadState('networkidle');
    
    // Should show the new dossier button even when empty
    await expect(page.locator('text=Open New Dossier')).toBeVisible();
  });
});
