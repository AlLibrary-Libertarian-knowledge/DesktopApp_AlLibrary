import { test, expect } from '@playwright/test';

test.describe('AlLibrary Home Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');

    // Wait for the app to be ready
    await page.waitForLoadState('networkidle');

    // Close welcome modal if it appears
    const welcomeModal = page.locator('dialog');
    if (await welcomeModal.isVisible()) {
      await page.click('text=Enter AlLibrary');
      // Wait for modal to close
      await page.waitForTimeout(500);
    }
  });

  test('should display the application title', async ({ page }) => {
    // Check that the page title contains AlLibrary
    await expect(page).toHaveTitle(/AlLibrary/);
  });

  test('should render main navigation elements', async ({ page }) => {
    // Check for main navigation elements
    await expect(page.locator('[data-testid="main-navigation"]')).toBeVisible();

    // Check for key navigation links - these are in the sidebar
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Documents & Search')).toBeVisible();
    await expect(page.locator('text=Collections')).toBeVisible();
    await expect(page.locator('text=Favorites')).toBeVisible();
  });

  test('should display dashboard content', async ({ page }) => {
    // Check for main dashboard title
    await expect(page.locator('h1')).toContainText('AlLibrary Network Dashboard');
    await expect(
      page.locator('text=Decentralized Cultural Heritage Preservation Network')
    ).toBeVisible();
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
    // Test navigation to Browse page using the sidebar
    await page.click('text=Browse Categories');
    await page.waitForURL(/.*browse.*/);

    // Check that we're on the browse page
    await expect(page.locator('h1')).toContainText('Browse');
  });

  test('should be responsive and accessible', async ({ page }) => {
    // Check for main layout elements
    const navigation = page.locator('[data-testid="main-navigation"]');
    await expect(navigation).toBeVisible();

    // Check that sidebar toggle works
    const sidebarToggle = page.locator('button[aria-label="Toggle sidebar"]');
    if (await sidebarToggle.isVisible()) {
      await sidebarToggle.click();
    }
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Navigate to a non-existent page
    await page.goto('/non-existent-page');

    // Should show error page or redirect to home with a "Page Not Found" message
    const notFoundElement = page.locator('text=Page Not Found');
    if (await notFoundElement.isVisible()) {
      await expect(notFoundElement).toBeVisible();
    } else {
      // If redirected to home, that's also acceptable
      await expect(page.locator('h1')).toContainText('AlLibrary');
    }
  });
});

test.describe('AlLibrary Core Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Close welcome modal if it appears
    const welcomeModal = page.locator('dialog');
    if (await welcomeModal.isVisible()) {
      await page.click('text=Enter AlLibrary');
      await page.waitForTimeout(500);
    }
  });

  test('should display recent documents section', async ({ page }) => {
    // Check for recent documents section
    await expect(page.locator('[data-testid="recent-documents"]')).toBeVisible();

    // Check that it has the correct title
    await expect(page.locator('text=Recent Downloads')).toBeVisible();
  });

  test('should display trending section', async ({ page }) => {
    // Check for trending section (stats cards)
    await expect(page.locator('[data-testid="trending-section"]')).toBeVisible();

    // Check for stat cards
    await expect(page.locator('text=Documents Shared')).toBeVisible();
    await expect(page.locator('text=Connected Peers')).toBeVisible();
  });

  test('should handle document upload flow', async ({ page }) => {
    // Look for upload button (Share Document button)
    const uploadButton = page.locator('[data-testid="upload-button"]');
    await expect(uploadButton).toBeVisible();

    // Check that it contains the correct text
    await expect(uploadButton).toContainText('Share Document');

    // Click upload button (should be clickable)
    await uploadButton.click();
  });
});
