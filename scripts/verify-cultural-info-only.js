#!/usr/bin/env node
/**
 * CI helper: run the cultural info-only policy unit test file.
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const testFile = join('src', 'services', '__tests__', 'culturalInfoPolicy.test.ts');
const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const r = spawnSync(cmd, ['vitest', 'run', testFile], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
process.exit(r.status === 0 ? 0 : 1);
