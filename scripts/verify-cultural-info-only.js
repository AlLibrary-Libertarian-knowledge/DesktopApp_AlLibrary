#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

const patterns = [
  'cultural.*(deny|restrict|approval|permission)',
  'sacred.*(deny|restrict|approval|permission)',
  'guardian.*(deny|restrict|approval|permission)',
  'cultural.*access\s*(denied|restricted)'
];

let failed = false;
for (const pat of patterns) {
  const rg = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['rg', '-n', '-i', pat, 'src'], {
    stdio: 'pipe',
    encoding: 'utf-8',
  });
  if (rg.stdout && rg.stdout.trim().length > 0) {
    console.error(`Forbidden cultural gating pattern found for /${pat}/:\n${rg.stdout}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
} else {
  console.log('Cultural info-only verification passed.');
}

