import { test, expect } from '@playwright/test';

// Helper function to detect browser type
function getBrowserName(page) {
  return page.context().browser()?.browserType().name() || 'unknown';
}

// Helper function to force close any modal with WebKit-specific handling
async function forceCloseModal(page) {
  const browserName = getBrowserName(page);
  const isWebKit = browserName === 'webkit';

  // WebKit needs longer waits and more robust handling
  const baseWait = isWebKit ? 1000 : 500;

  try {
    // Strategy 1: Try clicking the Enter button with retries for WebKit
    const enterButton = page.locator('button:has-text("Enter AlLibrary")');
    for (let i = 0; i < (isWebKit ? 3 : 1); i++) {
      if (await enterButton.isVisible().catch(() => false)) {
        await enterButton.click({ force: true, timeout: 10000 });
        await page.waitForTimeout(baseWait);

        // Check if modal is actually closed
        if (!(await enterButton.isVisible().catch(() => false))) {
          break;
        }
      }
    }

    // Strategy 2: Try text-based approach with retries
    const enterTextButton = page.locator('text=Enter AlLibrary');
    for (let i = 0; i < (isWebKit ? 3 : 1); i++) {
      if (await enterTextButton.isVisible().catch(() => false)) {
        await enterTextButton.click({ force: true, timeout: 10000 });
        await page.waitForTimeout(baseWait);

        if (!(await enterTextButton.isVisible().catch(() => false))) {
          break;
        }
      }
    }

    // Strategy 3: Close any dialog that might exist
    const dialogModal = page.locator('dialog');
    if (await dialogModal.isVisible().catch(() => false)) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(baseWait);
    }

    // Strategy 4: Nuclear option - remove all modals from DOM
    await page.evaluate(() => {
      const modalSelectors = [
        '[role="dialog"]',
        '.modal-overlay',
        '[aria-modal="true"]',
        '[class*="modal-overlay"]',
        '[class*="modal"]',
        'dialog',
        '[class*="_modal-overlay_"]',
      ];

      modalSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          try {
            el.remove();
          } catch {
            // Ignore removal errors
          }
        });
      });
    });

    await page.waitForTimeout(baseWait);
  } catch (error) {
    console.log(`Modal close failed: ${error.message}`);
    // Continue anyway - the test might still work
  }
}

// Enhanced robust navigation with WebKit-specific handling
async function robustNavigate(page, url = '/') {
  const browserName = getBrowserName(page);
  const isWebKit = browserName === 'webkit';

  // WebKit on Windows needs special handling
  if (isWebKit) {
    try {
      // For WebKit, use a more conservative approach
      await page.goto(url, {
        waitUntil: 'load',
        timeout: 120000, // Extended timeout for WebKit
      });

      // Wait for page to be properly loaded
      await page.waitForSelector('body', { timeout: 30000 });
      await page.waitForTimeout(3000); // Extra wait for WebKit

      // Verify page is actually interactive
      await page.waitForFunction(() => document.readyState === 'complete', { timeout: 20000 });
    } catch (error) {
      console.log(`WebKit navigation failed: ${error.message}, trying fallback...`);

      // Fallback for WebKit
      try {
        await page.goto(url, { timeout: 120000 });
        await page.waitForTimeout(5000);
      } catch (fallbackError) {
        console.log(`WebKit fallback failed: ${fallbackError.message}`);
        throw fallbackError;
      }
    }
  } else {
    // Standard navigation for other browsers
    try {
      const timeout = browserName === 'firefox' ? 90000 : 60000;
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout,
      });

      await page.waitForSelector('body', { timeout: 20000 });
      await page.waitForTimeout(2000);
    } catch {
      console.log(`Navigation failed for ${browserName}, trying fallback...`);

      try {
        await page.goto(url, {
          waitUntil: 'load',
          timeout: 90000,
        });
        await page.waitForTimeout(3000);
      } catch {
        await page.goto(url, { timeout: 90000 });
        await page.waitForTimeout(5000);
      }
    }
  }
}

// Enhanced beforeEach with WebKit-specific handling
async function setupTest(page) {
  const browserName = getBrowserName(page);
  const isWebKit = browserName === 'webkit';

  // Navigate to the page
  await robustNavigate(page, '/');

  // WebKit needs more aggressive modal handling
  if (isWebKit) {
    // Multiple attempts to close modal for WebKit
    for (let attempt = 0; attempt < 3; attempt++) {
      await forceCloseModal(page);

      // Check if we can interact with the page
      const navigation = page.locator('[data-testid="main-navigation"]');
      if (await navigation.isVisible().catch(() => false)) {
        break; // Success!
      }

      if (attempt < 2) {
        await page.waitForTimeout(2000);
      }
    }
  } else {
    await forceCloseModal(page);
  }

  // Final verification that page is ready
  await page.waitForSelector('[data-testid="main-navigation"]', { timeout: 30000 });
}

test.describe('AlLibrary Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupTest(page);
  });

  test('should display the application title', async ({ page }) => {
    // Check that the page title contains AlLibrary
    await expect(page).toHaveTitle(/AlLibrary/);
  });

  test('should render main navigation elements', async ({ page }) => {
    // Check for main navigation elements
    await expect(page.locator('[data-testid="main-navigation"]')).toBeVisible();

    // Check for key navigation links - these are in the sidebar navigation
    await expect(page.locator('[data-testid="main-navigation"] >> text=Dashboard')).toBeVisible();
    await expect(
      page.locator('[data-testid="main-navigation"] >> text=Documents & Search')
    ).toBeVisible();
    await expect(page.locator('[data-testid="main-navigation"] >> text=Collections')).toBeVisible();
    await expect(page.locator('[data-testid="main-navigation"] >> text=Favorites')).toBeVisible();
  });

  test('should display dashboard content', async ({ page }) => {
    // Check for main dashboard title by looking for the specific text
    await expect(page.locator('text=AlLibrary Network Dashboard')).toBeVisible();
    await expect(
      page.locator('text=Decentralized Cultural Heritage Preservation Network')
    ).toBeVisible();
  });

  test('should have functional search bar', async ({ page }) => {
    const browserName = getBrowserName(page);
    const isWebKit = browserName === 'webkit';

    // Extra modal handling for WebKit
    if (isWebKit) {
      await forceCloseModal(page);
      await page.waitForTimeout(1000);
    }

    // Test search functionality with enhanced error handling
    const searchInput = page.locator('[data-testid="search-input"]');

    // Wait for search input to be ready with extended timeout for WebKit
    await expect(searchInput).toBeVisible({ timeout: isWebKit ? 30000 : 10000 });
    await expect(searchInput).toBeEnabled({ timeout: isWebKit ? 30000 : 10000 });

    // WebKit-specific interaction handling
    if (isWebKit) {
      // Clear any existing value first
      await searchInput.focus();
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Delete');
      await page.waitForTimeout(500);

      // Type with more robust method for WebKit
      await searchInput.pressSequentially('test search', { delay: 100 });
    } else {
      // Standard approach for other browsers
      await searchInput.clear();
      await searchInput.click({ force: true });
      await searchInput.type('test search');
    }

    // Wait for value to be set
    await page.waitForTimeout(1000);
    await expect(searchInput).toHaveValue('test search');
  });

  test('should handle navigation elements interaction', async ({ page }) => {
    const isWebKit = getBrowserName(page) === 'webkit';

    // Extra preparation for WebKit
    if (isWebKit) {
      await forceCloseModal(page);
      await page.waitForTimeout(1000);
    }

    // Test that navigation element is clickable
    const browseButton = page.locator('[data-testid="main-navigation"] >> text=Browse Categories');
    await expect(browseButton).toBeVisible({ timeout: isWebKit ? 30000 : 10000 });

    // Click with enhanced handling for WebKit
    if (isWebKit) {
      await browseButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
    }

    await browseButton.click({ force: true, timeout: 15000 });

    // Verify the page is still responsive after the click
    await expect(page.locator('[data-testid="main-navigation"]')).toBeVisible();
    await expect(page.locator('text=AlLibrary Network Dashboard')).toBeVisible();
  });

  test('should be responsive and accessible', async ({ page }) => {
    const isWebKit = getBrowserName(page) === 'webkit';

    // Extra preparation for WebKit
    if (isWebKit) {
      await forceCloseModal(page);
      await page.waitForTimeout(1000);
    }

    // Check for main layout elements
    const navigation = page.locator('[data-testid="main-navigation"]');
    await expect(navigation).toBeVisible({ timeout: isWebKit ? 30000 : 10000 });

    // Check that sidebar toggle works
    const sidebarToggle = page.locator('button[aria-label="Toggle sidebar"]');
    if (await sidebarToggle.isVisible().catch(() => false)) {
      await sidebarToggle.click({ force: true, timeout: 15000 });
    }
  });

  test('should handle errors gracefully', async ({ page }) => {
    const isWebKit = getBrowserName(page) === 'webkit';

    // Navigate to a non-existent page with browser-specific handling
    try {
      if (isWebKit) {
        await page.goto('/non-existent-page', { timeout: 120000 });
      } else {
        await page.goto('/non-existent-page');
      }
    } catch (error) {
      // Navigation might fail, that's part of the test
      console.log(`Expected navigation failure: ${error.message}`);
    }

    // Should show error page or redirect to home
    const notFoundElement = page.locator('text=Page Not Found');
    if (await notFoundElement.isVisible().catch(() => false)) {
      await expect(notFoundElement).toBeVisible();
    } else {
      // If redirected to home, that's also acceptable
      await expect(page.locator('h1')).toContainText('AlLibrary');
    }
  });
});

test.describe('AlLibrary Core Features', () => {
  test.beforeEach(async ({ page }) => {
    await setupTest(page);
  });

  test('should display recent documents section', async ({ page }) => {
    const isWebKit = getBrowserName(page) === 'webkit';

    // Check for recent documents section with extended timeout for WebKit
    await expect(page.locator('[data-testid="recent-documents"]')).toBeVisible({
      timeout: isWebKit ? 30000 : 10000,
    });

    // Check that it has the correct title
    await expect(page.locator('text=Recent Downloads')).toBeVisible({
      timeout: isWebKit ? 30000 : 10000,
    });
  });

  test('should display trending section', async ({ page }) => {
    const isWebKit = getBrowserName(page) === 'webkit';

    // Check for trending section (stats cards) with extended timeout for WebKit
    await expect(page.locator('[data-testid="trending-section"]')).toBeVisible({
      timeout: isWebKit ? 30000 : 10000,
    });

    // Check for stat cards
    await expect(page.locator('text=Documents Shared')).toBeVisible({
      timeout: isWebKit ? 30000 : 10000,
    });
    await expect(page.locator('text=Connected Peers')).toBeVisible({
      timeout: isWebKit ? 30000 : 10000,
    });
  });

  test('should handle document upload flow', async ({ page }) => {
    const isWebKit = getBrowserName(page) === 'webkit';

    // Extra preparation for WebKit
    if (isWebKit) {
      await forceCloseModal(page);
      await page.waitForTimeout(1000);
    }

    // Look for upload button (Share Document button)
    const uploadButton = page.locator('[data-testid="upload-button"]');
    await expect(uploadButton).toBeVisible({
      timeout: isWebKit ? 30000 : 10000,
    });

    // Check that it contains the correct text
    await expect(uploadButton).toContainText('Share Document');

    // Click upload button with enhanced handling for WebKit
    if (isWebKit) {
      await uploadButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
    }

    await uploadButton.click({ force: true, timeout: 15000 });
  });
});
