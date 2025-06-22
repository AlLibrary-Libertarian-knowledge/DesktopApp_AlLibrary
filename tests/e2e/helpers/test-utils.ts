import { Page, BrowserContext } from '@playwright/test';
import { Buffer } from 'buffer';

/**
 * Test data generators
 */
export class TestDataGenerator {
  static generateRandomString(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
  }

  static generateTestEmail(): string {
    return `test-${this.generateRandomString(8)}@example.com`;
  }

  static generateTestDocument() {
    return {
      title: `Test Document ${this.generateRandomString(5)}`,
      description: `This is a test document created at ${new Date().toISOString()}`,
      category: 'Test Category',
      tags: ['test', 'automated', 'e2e'],
    };
  }

  static generateTestCollection() {
    return {
      name: `Test Collection ${this.generateRandomString(5)}`,
      description: `Test collection created for e2e testing at ${new Date().toISOString()}`,
      isPublic: false,
    };
  }
}

/**
 * Common test actions and utilities
 */
export class TestUtils {
  /**
   * Wait for an element to be visible with custom timeout
   */
  static async waitForElement(page: Page, selector: string, timeout: number = 10000) {
    await page.locator(selector).waitFor({ state: 'visible', timeout });
  }

  /**
   * Clear and fill an input field
   */
  static async clearAndFill(page: Page, selector: string, value: string) {
    const input = page.locator(selector);
    await input.clear();
    await input.fill(value);
  }

  /**
   * Upload a test file
   */
  static async uploadTestFile(
    page: Page,
    fileInputSelector: string,
    fileName: string,
    content: string
  ) {
    // Create a test file
    const fileBuffer = Buffer.from(content, 'utf-8');

    // Set up file chooser
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator(fileInputSelector).click();
    const fileChooser = await fileChooserPromise;

    // Upload the file
    await fileChooser.setFiles({
      name: fileName,
      mimeType: 'text/plain',
      buffer: fileBuffer,
    });
  }

  /**
   * Take a screenshot with timestamp
   */
  static async takeTimestampedScreenshot(page: Page, baseName: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await page.screenshot({
      path: `test-results/screenshots/${baseName}-${timestamp}.png`,
      fullPage: true,
    });
  }

  /**
   * Simulate user typing with realistic delays
   */
  static async typeWithDelay(page: Page, selector: string, text: string, delay: number = 100) {
    const input = page.locator(selector);
    await input.focus();

    for (const char of text) {
      await input.type(char);
      await page.waitForTimeout(delay);
    }
  }

  /**
   * Check if element contains any of the expected texts
   */
  static async elementContainsAnyText(
    page: Page,
    selector: string,
    texts: string[]
  ): Promise<boolean> {
    const element = page.locator(selector);
    const textContent = await element.textContent();

    if (!textContent) return false;

    return texts.some(text => textContent.toLowerCase().includes(text.toLowerCase()));
  }

  /**
   * Wait for network to be idle
   */
  static async waitForNetworkIdle(page: Page, timeout: number = 5000) {
    await page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Simulate mobile viewport
   */
  static async setMobileViewport(page: Page) {
    await page.setViewportSize({ width: 375, height: 667 });
  }

  /**
   * Simulate tablet viewport
   */
  static async setTabletViewport(page: Page) {
    await page.setViewportSize({ width: 768, height: 1024 });
  }

  /**
   * Simulate desktop viewport
   */
  static async setDesktopViewport(page: Page) {
    await page.setViewportSize({ width: 1920, height: 1080 });
  }

  /**
   * Check accessibility features
   */
  static async checkAccessibility(page: Page) {
    // Check for proper heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
    if (headings === 0) {
      throw new Error('Page should have at least one heading for accessibility');
    }

    // Check for alt text on images
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    if (imagesWithoutAlt > 0) {
      console.warn(`Found ${imagesWithoutAlt} images without alt text`);
    }

    // Check for form labels
    const inputsWithoutLabels = await page
      .locator('input:not([aria-label]):not([aria-labelledby])')
      .count();
    if (inputsWithoutLabels > 0) {
      console.warn(`Found ${inputsWithoutLabels} inputs without proper labels`);
    }
  }

  /**
   * Mock network requests for testing
   */
  static async mockApiResponse(page: Page, url: string | RegExp, response: any) {
    await page.route(url, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });
  }

  /**
   * Simulate network failure
   */
  static async simulateNetworkFailure(page: Page, url: string | RegExp) {
    await page.route(url, async route => {
      await route.abort('failed');
    });
  }

  /**
   * Clean up test data
   */
  static async cleanupTestData(context: BrowserContext) {
    // Clear localStorage
    await context.clearPermissions();

    // Clear cookies
    await context.clearCookies();
  }
}

/**
 * Test constants
 */
export const TEST_CONSTANTS = {
  TIMEOUTS: {
    SHORT: 2000,
    MEDIUM: 5000,
    LONG: 10000,
    EXTRA_LONG: 30000,
  },

  SELECTORS: {
    LOADING_SPINNER: '[data-testid="loading"]',
    ERROR_MESSAGE: '[data-testid="error-message"]',
    SUCCESS_MESSAGE: '[data-testid="success-message"]',
    MODAL_OVERLAY: '[data-testid="modal-overlay"]',
    CONFIRM_BUTTON: '[data-testid="confirm-button"]',
    CANCEL_BUTTON: '[data-testid="cancel-button"]',
  },

  SAMPLE_FILES: {
    TEXT_FILE: {
      name: 'test-document.txt',
      content: 'This is a test document for e2e testing.\nIt contains multiple lines of text.',
      mimeType: 'text/plain',
    },
    PDF_NAME: 'test-document.pdf',
    IMAGE_NAME: 'test-image.png',
  },
};
