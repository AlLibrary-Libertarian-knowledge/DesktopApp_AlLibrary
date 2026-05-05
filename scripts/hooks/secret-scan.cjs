#!/usr/bin/env node
const { execSync } = require('node:child_process');
const { readFileSync } = require('node:fs');

function getStaged() {
  try {
    const out = execSync('git diff --cached --name-only', {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString();
    return out.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

const patterns = [
  /AKIA[0-9A-Z]{16}/,
  /secret[_-]?key\s*[:=]\s*['"'][A-Za-z0-9_\-+/=]{16,}['"']/i,
  /api[_-]?key\s*[:=]\s*['"'][A-Za-z0-9_\-+/=]{16,}['"']/i,
  /password\s*[:=]\s*['"'][^'"']{6,}['"']/i,
  /NEXT_PUBLIC_[A-Z_]+\s*[:=]\s*['"'][^'"']+['"']/i,
  /VITE_[A-Z0-9_]+\s*[:=]\s*['"'][^'"']{8,}['"']/i,
  /TAURI_[A-Z0-9_]+\s*[:=]\s*['"'][^'"']{8,}['"']/i,
];

const isTestFile = file =>
  /__tests__\/|\.test\.|\.spec\.|testing\//.test(file) ||
  file.endsWith('.test.ts') ||
  file.endsWith('.test.tsx');

const staged = getStaged();
const hits = [];
for (const f of staged) {
  if (isTestFile(f)) continue;
  let content = '';
  try {
    content = readFileSync(f, 'utf8');
  } catch {
    /* skip unreadable */
  }
  patterns.forEach(re => {
    if (re.test(content)) hits.push({ file: f, re: re.toString() });
  });
}

if (hits.length) {
  console.log('\n⚠ Potential secrets detected in staged files:');
  hits.slice(0, 10).forEach(h => console.log(` - ${h.file} matches ${h.re}`));
  console.log('Review before committing. Prefer env vars for secrets.');
  process.exit(1);
}
