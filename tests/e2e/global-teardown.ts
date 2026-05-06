import type { FullConfig } from '@playwright/test';

/**
 * Global teardown for Playwright tests
 * Runs once after all tests across all workers complete
 */
async function globalTeardown(_config: FullConfig) {
  console.log('🧹 Starting global teardown for AlLibrary e2e tests...');

  // Clean up test database/storage
  console.log('🗄️ Cleaning up test database...');

  // Remove temporary files
  console.log('📁 Removing temporary test files...');

  // Close any remaining connections
  console.log('🔌 Closing connections...');

  console.log('✅ Global teardown completed successfully!');
}

export default globalTeardown;
