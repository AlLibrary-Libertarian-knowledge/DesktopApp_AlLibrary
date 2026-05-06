# Husky hooks — AlLibrary

Git hooks for the **desktopapp-allibrary** repo (SolidJS, Vite, Tauri v2, pnpm).

## Hooks overview

| Hook                   | Purpose                                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **pre-commit**         | Block secrets; run **lint-staged** (Biome on staged files)                                                                                                        |
| **prepare-commit-msg** | Comment hints for conventional commit format                                                                                                                       |
| **commit-msg**         | Validate branch name + conventional commit header                                                                                                                  |
| **pre-push**           | Router → [`pre-push.linux.sh`](pre-push.linux.sh) or [`pre-push.windows.sh`](pre-push.windows.sh) — tiered quality, audit, cultural policy, Playwright, Vite build |
| **post-merge**         | Advisory notes after merge (lockfile, Tauri, Playwright, hooks)                                                                                                    |
| **post-checkout**      | Clear `dist` / `.vite` on branch switch; `pnpm install` if package/lock changed                                                                                    |
| **post-commit**        | Informative tips after commit                                                                                                                                      |

See **[OS_DETECTION.md](OS_DETECTION.md)** for Windows vs Linux/macOS pre-push behaviour.

## Configuration

- **`package.json`**
  - `"prepare": "husky"`
  - `"lint-staged"` — staged Biome (no Vitest in pre-commit; tests run in CI/pre-push)
  - `"quality"`, `"quality:ci"`, `"husky:analyze:changes"`
- **`scripts/hooks/`** — `secret-scan.cjs`, `changed-files.cjs`
- **[`../HUSKY_QUALITY_GATES.md`](../HUSKY_QUALITY_GATES.md)** — full gate documentation

## Commands

```bash
pnpm run husky:check             # sanity-check hook files
pnpm run husky:analyze:changes   # show diff scope for pre-push matrix
pnpm run quality:ci              # same family of checks as Tier 1 pre-push
```

## Skip hooks

```bash
git commit --no-verify
git push --no-verify
```

Use sparingly; automation may still run the same checks.
