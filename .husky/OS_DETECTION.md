# OS-aware pre-push

The [`pre-push`](pre-push) hook is a small router: it uses `uname -s` and **`exec`s** one of:

| OS (`uname -s`)             | Script                                       |
| --------------------------- | -------------------------------------------- |
| Linux / Darwin              | [`pre-push.linux.sh`](pre-push.linux.sh)     |
| MINGW\* / MSYS\* / CYGWIN\* | [`pre-push.windows.sh`](pre-push.windows.sh) |
| unknown                     | Falls back to the Linux script               |

## Behaviour differences

- **Linux/macOS**: E2E uses `pnpm exec playwright test --project=chromium` with the default [`playwright.config.ts`](../playwright.config.ts) (Chromium project).
- **Windows**: E2E uses `pnpm run test:e2e:windows` ([`playwright-windows-only.config.ts`](../playwright-windows-only.config.ts)).

## Requirements

- Shell hooks must run under a POSIX shell (e.g. **Git Bash** on Windows, not plain `cmd`).
- **pnpm** on `PATH` (`corepack enable` / install pnpm).

## Testing the router

```sh
sh .husky/pre-push
```

Use `HUSKY_FULL=1 git push` to force the full matrix when experimenting.
