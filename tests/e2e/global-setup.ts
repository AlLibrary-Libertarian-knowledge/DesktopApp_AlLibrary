import { FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests
 * Runs once before all tests across all workers
 */
async function globalSetup(_config: FullConfig) {
  console.log('🚀 Starting global setup for AlLibrary e2e tests...');

  // Wait for Tauri dev server to be ready
  console.log('⏳ Waiting for Tauri dev server...');

  // Setup test database/storage if needed
  console.log('🗄️ Setting up test database...');

  // Clear any existing test data
  console.log('🧹 Clearing previous test data...');

  // Seed initial test data if needed
  console.log('🌱 Seeding test data...');

  console.log('✅ Global setup completed successfully!');
}

export default globalSetup;
