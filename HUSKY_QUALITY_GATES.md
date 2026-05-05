# Husky quality gates (AlLibrary)

This project uses [Husky](https://typicode.github.io/husky/) for Git hooks: **SolidJS + Vite** frontend, **Tauri v2** desktop shell, **pnpm** as the recommended package manager.

## Quick start

```bash
pnpm install
# Hooks install via the "prepare" script
```

## Hooks

### Pre-commit

- Secret scan on staged files (`scripts/hooks/secret-scan.cjs`)
- **lint-staged**: Biome `check --write` on staged files (see `package.json` → `lint-staged`)

### Commit message

- Branch name must match allowed patterns (see `.husky/commit-msg`)
- [Conventional Commits](https://www.conventionalcommits.org/) header: `type(scope?): subject`

### Pre-push (tiered)

Matrix from `node scripts/hooks/changed-files.cjs --format=run` (override with `HUSKY_FULL=1`):

| Tier  | Typical contents                                                                                                                                                                                       |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1** | `pnpm run quality:ci` (lint + `tsc` + `vitest run`); optional `pnpm run test:coverage` when `src/` is in scope                                                                                         |
| **2** | `pnpm audit --audit-level=high`; `pnpm run verify:cultural` when docs/progress/cultural paths change                                                                                                   |
| **3** | Playwright: **Windows** → `pnpm run test:e2e:windows`; **Linux/macOS** → `pnpm exec playwright test --project=chromium`; **build** → `pnpm run build:frontend` (use full Tauri build only when needed) |

Set **`HUSKY_TAURI_BUILD=1`** to run `pnpm run build` (full Tauri) instead of Vite-only `build:frontend` in Tier 3.

**Docs-only** changes skip all tiers. See `scripts/hooks/changed-files.cjs` for path rules.

### Post-merge / post-checkout

Advisory reminders (pnpm install, Playwright browsers, caches). Post-checkout runs **`pnpm install`** when `package.json` / `pnpm-lock.yaml` changed across the checkout.

## Commands

```bash
pnpm run quality          # lint + typecheck + vitest (watch default for test)
pnpm run quality:ci       # lint + typecheck + vitest run
pnpm run husky:analyze:changes   # diff-scoping debug
pnpm run validate         # typecheck + lint + test:ci + build:frontend
```

## Bypass (emergency only)

```bash
git commit --no-verify -m "chore: message"
git push --no-verify
```

CI should still enforce checks.

## Troubleshooting

| Issue                       | Suggestion                              |
| --------------------------- | --------------------------------------- |
| Playwright missing browsers | `pnpm exec playwright install chromium` |
| Hooks not running           | `pnpm install` (runs `prepare` / husky) |
| Windows shell               | Use Git Bash for shell hooks            |

## Coverage

Vitest coverage thresholds are defined in `vitest.config.ts` (currently 80% lines/functions/branches/statements where enabled).

## Related files

- `.husky/` — hook scripts
- `scripts/hooks/` — `secret-scan.cjs`, `changed-files.cjs`
- `package.json` — `lint-staged`, `quality` scripts
