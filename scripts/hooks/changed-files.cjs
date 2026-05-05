#!/usr/bin/env node
const { execSync } = require('node:child_process');

function safeExec(cmd) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return '';
  }
}

function getBaseRef() {
  const envBase = process.env.BASE_REF?.trim();
  if (envBase) return envBase;
  const upstream = safeExec('git rev-parse --abbrev-ref --symbolic-full-name @{u}');
  if (upstream) return upstream;
  const originMain = safeExec('git rev-parse --verify origin/main && echo origin/main');
  if (originMain) return 'origin/main';
  const prev = safeExec('git rev-parse HEAD~1');
  return prev || 'HEAD';
}

function getChangedFiles(base) {
  const dots = base.startsWith('origin/') || base.includes('/') ? '...' : ' ';
  const out = safeExec(`git diff --name-only ${base}${dots}HEAD`);
  return out.split('\n').filter(Boolean);
}

const base = getBaseRef();
const files = getChangedFiles(base);

function matchesAll(regex) {
  return files.length > 0 && files.every(f => regex.test(f));
}
function matchesAny(regex) {
  return files.some(f => regex.test(f));
}

const DOCS_ONLY =
  files.length > 0 &&
  matchesAll(/^(docs\/|progress\/|.*\.md$|COMPREHENSIVE_PROJECT_ANALYSIS\.md)/);

/** Every changed path is under tests/ (including e2e). */
const TESTS_TREE_ONLY = files.length > 0 && matchesAll(/^tests\//);

const AFFECTS_SRC = matchesAny(/^src\//);
const AFFECTS_RUST = matchesAny(/^src-tauri\//);
const AFFECTS_E2E = matchesAny(
  /^(tests\/e2e\/|playwright\.config\.|playwright-windows-only\.config\.)/
);

const AFFECTS_CONFIG = matchesAny(
  /^(vite\.config\.|vitest\.config\.|tsconfig.*\.json|package\.json|pnpm-lock\.yaml|eslint\.config\.|postcss\.config\.|\.prettierrc|\.husky\/|\.github\/)/
);

const AFFECTS_AUDIT =
  matchesAny(/^package\.json$/) ||
  matchesAny(/^pnpm-lock\.yaml$/) ||
  AFFECTS_SRC ||
  AFFECTS_RUST;

const AFFECTS_CULTURAL = matchesAny(
  /^(docs\/|progress\/|COMPREHENSIVE_PROJECT_ANALYSIS\.md|scripts\/verify-cultural)/
);

const AFFECTS_BUILD = AFFECTS_SRC || AFFECTS_CONFIG || AFFECTS_RUST;

const CONFIG_ONLY =
  files.length > 0 &&
  matchesAll(
    /^(package\.json|pnpm-lock\.yaml|tsconfig.*\.json|vite\.config\.|vitest\.config\.|eslint\.config\.|postcss\.config\.|\.prettierrc|\.husky\/|\.github\/)/
  ) &&
  !AFFECTS_SRC &&
  !AFFECTS_RUST;

const changeImpact = {
  LOW: DOCS_ONLY || TESTS_TREE_ONLY,
  MEDIUM: matchesAny(/\.(css|scss|less)$/) && !AFFECTS_SRC,
  HIGH: AFFECTS_SRC,
  CRITICAL: AFFECTS_CONFIG || AFFECTS_E2E,
};

const impact =
  Object.entries(changeImpact).find(([, value]) => value)?.[0] || 'LOW';

const fileCounts = {
  total: files.length,
  src: files.filter(f => f.startsWith('src/')).length,
  tests: files.filter(f => f.startsWith('tests/')).length,
  rust: files.filter(f => f.startsWith('src-tauri/')).length,
  docs: files.filter(
    f => f.startsWith('docs/') || f.endsWith('.md') || f.startsWith('progress/')
  ).length,
};

const flags = {
  DOCS_ONLY,
  TESTS_TREE_ONLY,
  AFFECTS_SRC,
  AFFECTS_RUST,
  AFFECTS_E2E,
  AFFECTS_CONFIG,
  AFFECTS_AUDIT,
  AFFECTS_CULTURAL,
  AFFECTS_BUILD,
  CONFIG_ONLY,
  IMPACT_LEVEL: impact,
  FILE_COUNTS: JSON.stringify(fileCounts),
};

if (process.argv.includes('--format=compact')) {
  const n = b => (b ? 1 : 0);
  process.stdout.write(
    `${n(DOCS_ONLY)} ${n(TESTS_TREE_ONLY)} ${n(AFFECTS_SRC)} ${n(AFFECTS_E2E)}\n`
  );
} else if (process.argv.includes('--format=run')) {
  const n = b => (b ? 1 : 0);
  const forceFull =
    process.env.HUSKY_FULL === '1' || process.env.HUSKY_FULL === 'true';

  let t1_quality,
    t1_coverage,
    t2_audit,
    t2_cultural,
    t3_e2e,
    t3_build,
    t3_budget,
    t3_lh,
    scope;

  if (forceFull) {
    t1_quality = 1;
    t1_coverage = 1;
    t2_audit = 1;
    t2_cultural = 1;
    t3_e2e = 1;
    t3_build = 1;
    t3_budget = 0;
    t3_lh = 0;
    scope = 5;
  } else if (DOCS_ONLY) {
    t1_quality =
      t1_coverage =
      t2_audit =
      t2_cultural =
      t3_e2e =
      t3_build =
      t3_budget =
      t3_lh =
        0;
    scope = 1;
  } else if (TESTS_TREE_ONLY && !matchesAny(/^src\//)) {
    t1_quality = 1;
    t1_coverage = 0;
    t2_audit = 0;
    t2_cultural = 0;
    t3_e2e = 1;
    t3_build = 0;
    t3_budget = 0;
    t3_lh = 0;
    scope = 2;
  } else if (CONFIG_ONLY && !AFFECTS_SRC && !AFFECTS_RUST) {
    t1_quality = 1;
    t1_coverage = 0;
    t2_audit = n(AFFECTS_AUDIT);
    t2_cultural = 0;
    t3_e2e = 0;
    t3_build = 1;
    t3_budget = 0;
    t3_lh = 0;
    scope = 3;
  } else {
    t1_quality = 1;
    t1_coverage = n(AFFECTS_SRC);
    t2_audit = n(AFFECTS_AUDIT);
    t2_cultural = n(AFFECTS_CULTURAL);
    t3_e2e = AFFECTS_E2E ? 1 : AFFECTS_SRC ? 1 : 0;
    t3_build = n(AFFECTS_BUILD);
    t3_budget = 0;
    t3_lh = 0;
    scope = 4;
  }

  process.stdout.write(
    `${t1_quality} ${t1_coverage} ${t2_audit} ${t2_cultural} ${t3_e2e} ${t3_build} ${t3_budget} ${t3_lh} ${scope}\n`
  );
} else {
  Object.entries(flags).forEach(([k, v]) => {
    if (v) process.stdout.write(`${k}\n`);
  });
}

if (process.argv.includes('--detailed')) {
  console.log('\n=== Change Analysis (AlLibrary) ===');
  console.log(`Base ref: ${base}`);
  console.log(`Files changed: ${files.length}`);
  console.log(`Impact level: ${impact}`);
  console.log('File counts:', fileCounts);
  console.log('\nChanged files:');
  files.forEach(f => console.log(`  ${f}`));
}
