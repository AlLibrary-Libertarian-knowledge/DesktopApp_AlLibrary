import { test, expect } from '@playwright/test';

test.describe('AlLibrary Home Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');

    // Wait for the app to be ready
    await page.waitForLoadState('networkidle');
  });

  test('should display the application title', async ({ page }) => {
    // Check that the page title contains AlLibrary
    await expect(page).toHaveTitle(/AlLibrary/);
  });

  test('should render main navigation elements', async ({ page }) => {
    // Check for main navigation elements
    await expect(page.locator('[data-testid="main-navigation"]')).toBeVisible();

    // Check for key navigation links
    await expect(page.locator('text=Home')).toBeVisible();
    await expect(page.locator('text=Browse')).toBeVisible();
    await expect(page.locator('text=Collections')).toBeVisible();
    await expect(page.locator('text=Search')).toBeVisible();
  });

  test('should display welcome content', async ({ page }) => {
    // Check for welcome message or main content
    await expect(page.locator('h1')).toContainText(/Welcome|AlLibrary/);
  });

  test('should have functional search bar', async ({ page }) => {
    // Test search functionality
    const searchInput = page.locator('[data-testid="search-input"]');
    await expect(searchInput).toBeVisible();

    // Type in search input
    await searchInput.fill('test search');
    await expect(searchInput).toHaveValue('test search');
  });

  test('should handle navigation between pages', async ({ page }) => {
    // Test navigation to Browse page
    await page.click('text=Browse');
    await page.waitForURL(/.*browse.*/);

    // Check that we're on the browse page
    await expect(page).toHaveURL(/.*browse.*/);
  });

  test('should be responsive and accessible', async ({ page }) => {
    // Test basic accessibility
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Test error handling by navigating to a non-existent route
    await page.goto('/non-existent-page');

    // Should show error page or redirect to home
    await expect(page.locator('text=404|Not Found|Error')).toBeVisible();
  });
});

test.describe('AlLibrary Core Features', () => {
  test('should display recent documents section', async ({ page }) => {
    await page.goto('/');

    // Check for recent documents section
    await expect(page.locator('[data-testid="recent-documents"]')).toBeVisible();
  });

  test('should display trending section', async ({ page }) => {
    await page.goto('/');

    // Check for trending section
    await expect(page.locator('[data-testid="trending-section"]')).toBeVisible();
  });

  test('should handle document upload flow', async ({ page }) => {
    await page.goto('/');

    // Look for upload button or area
    const uploadButton = page.locator('[data-testid="upload-button"]');
    if (await uploadButton.isVisible()) {
      await uploadButton.click();

      // Should open upload dialog or navigate to upload page
      await expect(page.locator('[data-testid="upload-dialog"]')).toBeVisible();
    }
  });
});
