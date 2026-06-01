# Build & desenvolvimento

Projeto **Tauri 2 + SolidJS + Rust**. Gerenciador de pacotes: **pnpm** (`packageManager` em `package.json`).

---

## Pré-requisitos

- Node.js (LTS)
- pnpm 9.x
- Rust toolchain (stable)
- Windows: WebView2 (runtime usualmente já instalado)

---

## Comandos principais

```bash
pnpm install

# App completo (frontend + Tauri + Rust)
pnpm dev              # alias: pnpm tauri:dev → npx tauri dev

# Apenas frontend (sem Tauri)
pnpm dev:frontend     # vite

# Produção
pnpm build            # npx tauri build (instaladores)
pnpm build:frontend   # vite build → dist/
```

---

## Qualidade

```bash
pnpm lint             # biome check src tests
pnpm lint:fix         # biome --write
pnpm format           # biome format --write
pnpm typecheck        # tsc --noEmit
pnpm test             # vitest (watch)
pnpm test:ci          # vitest run
pnpm quality          # lint + typecheck + test
pnpm validate         # typecheck + lint + test:ci + build:frontend
```

---

## E2E (Playwright)

```bash
pnpm test:e2e:windows   # recomendado no Windows (Chromium / WebView2)
pnpm test:e2e           # Chromium + WebKit
pnpm test:e2e:debug
```

Ver [E2E_TESTING_STRATEGY.md](./E2E_TESTING_STRATEGY.md).

---

## Tracker (servidor separado)

Para testes P2P com lobby real:

```bash
cd ../TrackerRust_AlLibrary   # ou clone allibrary-tracker
docker compose up -d --build
```

Legado local (cópia no monorepo): `DesktopApp_AlLibrary/deploy/` — preferir **`TrackerRust_AlLibrary`**.

---

## Artefatos

| Saída | Local |
|-------|--------|
| Frontend build | `dist/` |
| Binário Rust | `src-tauri/target/release/` |
| Instaladores Windows | `src-tauri/target/release/bundle/` (MSI/NSIS conforme `tauri.conf.json`) |
| Config Tauri | `src-tauri/tauri.conf.json` |
| Dependências Rust | `src-tauri/Cargo.toml` |

---

## Versão

Versão do app: **`APP_VERSION` em `.env`** (copie de `.env.example`). Esse valor é propagado automaticamente para `package.json`, `src-tauri/Cargo.toml` e `src-tauri/tauri.conf.json` via `pnpm run sync:version` (executado antes de `dev`/`build`).

Notas de release no GitHub: edite `.github/RELEASE_NOTES.template.md` e pré-visualize com `pnpm run release:notes`. O workflow `release.yml` usa esse template + changelog automático do GitHub.

Tracker standalone: `allibrary-tracker` **0.7.4** em `TrackerRust_AlLibrary/Cargo.toml`.

---

## Notas

- Primeira execução: **FirstRunWizard** pede pasta do projeto (ex.: `D:\AlLibrary`); Tor/onion sobem no overlay de loading (`bootstrap_onion_overlay`).
- Build CI: ver workflows em `.github/` se presentes no repositório remoto.
