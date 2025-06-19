# End-to-End Testing with Playwright

This directory contains end-to-end tests for the AlLibrary desktop application using **Playwright** instead of Maestro.

## Why Playwright Over Maestro?

**Maestro is designed for mobile applications** (iOS, Android, React Native, Flutter), while AlLibrary is a **Tauri desktop application**. Playwright is the ideal choice because:

- ✅ **Desktop App Support**: Designed for testing web-based desktop applications
- ✅ **Cross-Browser Testing**: Chrome, Firefox, Safari/WebKit support
- ✅ **Built-in Parallelization**: Runs tests concurrently for faster execution
- ✅ **TypeScript Integration**: Perfect match for our SolidJS + TypeScript stack
- ✅ **Tauri Compatibility**: Excellent support for testing Tauri applications
- ✅ **Rich Debugging Tools**: Trace viewer, inspector, and VS Code integration

## Project Structure

```
tests/e2e/
├── README.md                 # This file
├── global-setup.ts          # Global test setup
├── global-teardown.ts       # Global test cleanup
├── home-page.spec.ts        # Home page tests
├── helpers/
│   ├── page-objects.ts      # Page Object Models
│   └── test-utils.ts        # Test utilities and helpers
└── test-results/            # Generated test results and artifacts
    ├── screenshots/
    ├── videos/
    └── traces/
```

## Getting Started

### Prerequisites

1. **Node.js** (v18 or later)
2. **Yarn** package manager
3. **Tauri** development environment

### Installation

Dependencies are already installed via the main package.json. To install browsers:

```bash
cd DesktopApp_AlLibrary
npx playwright install
```

### Running Tests

#### Basic Commands

```bash
# Run all e2e tests
yarn test:e2e

# Run tests with UI (interactive mode)
yarn test:e2e:ui

# Run tests in headed mode (visible browser)
yarn test:e2e:headed

# Debug tests step by step
yarn test:e2e:debug

# Run specific test file
npx playwright test home-page.spec.ts

# Run tests in specific browser
npx playwright test --project=firefox
```

#### Development Workflow

1. **Start the Tauri dev server**:

   ```bash
   yarn tauri:dev
   ```

2. **In another terminal, run tests**:
   ```bash
   yarn test:e2e
   ```

The Playwright configuration automatically starts the Tauri dev server if not running.

## Test Configuration

### Playwright Config (`playwright.config.ts`)

- **Base URL**: `http://localhost:1420` (Tauri dev server)
- **Parallel Execution**: Enabled for faster test runs
- **Cross-Browser**: Chrome, Firefox, Safari/WebKit
- **Retries**: 2 retries on CI, 0 locally
- **Screenshots**: On failure only
- **Videos**: Retained on failure
- **Traces**: On first retry

### Environment-Specific Settings

- **Local Development**: Single worker, headed mode available
- **CI Environment**: Parallel workers, headless mode, GitHub Actions reporter

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should perform specific action', async ({ page }) => {
    // Test implementation
    await expect(page.locator('[data-testid="element"]')).toBeVisible();
  });
});
```

### Using Page Objects

```typescript
import { HomePage } from './helpers/page-objects';

test('should navigate using page objects', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();
  await homePage.navigateTo('browse');
  await expect(page).toHaveURL(/.*browse.*/);
});
```

### Using Test Utilities

```typescript
import { TestUtils, TestDataGenerator } from './helpers/test-utils';

test('should use test utilities', async ({ page }) => {
  await page.goto('/');

  // Generate test data
  const testDoc = TestDataGenerator.generateTestDocument();

  // Use utility functions
  await TestUtils.clearAndFill(page, '[data-testid="search"]', testDoc.title);
  await TestUtils.takeTimestampedScreenshot(page, 'search-test');
});
```

## Test Data Management

### Test Data Generators

The `TestDataGenerator` class provides methods to create consistent test data:

- `generateRandomString(length)`: Random strings for unique identifiers
- `generateTestEmail()`: Valid email addresses for testing
- `generateTestDocument()`: Document objects with realistic data
- `generateTestCollection()`: Collection objects for testing

### Sample Usage

```typescript
const testData = {
  document: TestDataGenerator.generateTestDocument(),
  collection: TestDataGenerator.generateTestCollection(),
  searchQuery: TestDataGenerator.generateRandomString(8),
};
```

## Best Practices

### 1. Use Data Test IDs

Always prefer `data-testid` attributes for stable element selection:

```html
<!-- Good -->
<button data-testid="upload-button">Upload</button>

<!-- Avoid -->
<button class="btn btn-primary">Upload</button>
```

### 2. Page Object Pattern

Organize tests using Page Objects for maintainability:

```typescript
export class SearchPage extends BasePage {
  readonly searchInput = this.page.locator('[data-testid="search-input"]');

  async performSearch(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
  }
}
```

### 3. Async/Await Best Practices

- Always `await` Playwright actions
- Use `page.waitForLoadState('networkidle')` after navigation
- Prefer built-in waiting over manual `setTimeout`

### 4. Error Handling

```typescript
test('should handle errors gracefully', async ({ page }) => {
  // Test error scenarios
  await TestUtils.simulateNetworkFailure(page, '**/api/documents');
  await page.goto('/');
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
});
```

## Debugging Tests

### 1. Interactive Mode

```bash
yarn test:e2e:ui
```

Opens Playwright's test UI for interactive test running and debugging.

### 2. Debug Mode

```bash
yarn test:e2e:debug
```

Runs tests with debugger, pausing at `await page.pause()` statements.

### 3. Trace Viewer

After test failures, traces are automatically captured. View them with:

```bash
npx playwright show-trace test-results/trace.zip
```

### 4. Screenshots and Videos

- Screenshots: `test-results/screenshots/`
- Videos: `test-results/videos/`
- Generated automatically on test failures

## CI/CD Integration

### Husky Integration

E2E tests are integrated into the pre-push hook (`/.husky/pre-push`):

```bash
echo "🎭 Running end-to-end tests..."
yarn test:e2e
```

### GitHub Actions

Example workflow for CI:

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run e2e tests
  run: yarn test:e2e

- name: Upload test results
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-results
    path: test-results/
```

## Performance Considerations

- **Parallel Execution**: Tests run in parallel by default
- **Browser Reuse**: Playwright reuses browser instances for efficiency
- **Resource Cleanup**: Global teardown ensures proper cleanup
- **CI Optimization**: Single worker on CI to avoid resource conflicts

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure Tauri dev server runs on port 1420
2. **Timeout Issues**: Increase timeout in `playwright.config.ts` if needed
3. **Element Not Found**: Verify `data-testid` attributes exist
4. **Flaky Tests**: Add proper waits and use Playwright's auto-waiting

### Debug Commands

```bash
# Check Playwright installation
npx playwright --version

# Test browser installation
npx playwright test --list

# Validate configuration
npx playwright test --dry-run
```

## Migration from Maestro

If you were previously considering Maestro:

- **Remove**: Any `maestro/` directories and mobile-specific tests
- **Replace**: Mobile test flows with web-based Playwright tests
- **Update**: CI pipelines to use `yarn test:e2e` instead of Maestro commands
- **Adapt**: Test scenarios to focus on web interactions rather than mobile gestures

## Contributing

When adding new tests:

1. Follow the Page Object pattern
2. Add appropriate `data-testid` attributes to components
3. Include both positive and negative test cases
4. Update this README for significant changes
5. Ensure tests pass both locally and in CI

---

**Remember**: Playwright is specifically designed for web-based applications like our Tauri desktop app, making it far superior to Maestro for our use case. This setup provides robust, fast, and maintainable e2e testing that integrates seamlessly with our development workflow.
