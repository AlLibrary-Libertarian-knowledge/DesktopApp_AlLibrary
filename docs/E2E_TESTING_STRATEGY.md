# E2E testing strategy

Estratégia Playwright para app **Tauri 2** (WebView2 no Windows).

---

## Comandos (pnpm)

```bash
pnpm test:e2e:windows    # Chromium — recomendado no Windows
pnpm test:e2e              # Chromium + WebKit
pnpm test:e2e:debug
pnpm test:e2e:ui
pnpm test:e2e:ci           # JUnit reporter
```

Unitários: `pnpm test:ci` (Vitest).

> Documentos antigos referiam `yarn`; o projeto usa **pnpm** (`package.json`).

---

## Motores

| Plataforma | WebView | Playwright |
|------------|---------|------------|
| Windows | WebView2 (Chromium) | `chromium` — estável |
| macOS / Linux | WebKit | `webkit` — pode falhar no Windows host |

Config: `playwright.config.ts`, `playwright-windows-only.config.ts`.

---

## Cobertura E2E vs. produto real

Os testes E2E cobrem **navegação e UI shell** (Home, documentos, modais). **Não** validam de forma confiável:

- Tor bootstrap completo (~90s no loading)
- Announce ao tracker `.onion`
- Download P2P real

Para rede: [TESTING_P2P.md](./TESTING_P2P.md) e `src-tauri/ONION_SHARE_MANUAL_E2E.md`.

---

## Problemas conhecidos (WebKit no Windows)

- Timeouts de navegação / modal de boas-vindas
- Mitigação: `test:e2e:windows` no CI/dev Windows

---

## Matriz de intenção (não garantia de CI verde)

| Área | Chromium | WebKit |
|------|----------|--------|
| Rotas principais | Alvo | Instável |
| Upload documentos | Parcial | Parcial |
| P2P / tracker | Manual | Manual |

Atualize contagens após `pnpm test:e2e:windows` no seu ambiente — números fixos envelhecem rápido.

---

## Boas práticas

1. Preferir seletores `data-testid` já usados (ex.: sidebar navigation).
2. Evitar depender de lobby com nós online nos E2E.
3. Mock Tauri: testes unitários Vitest; E2E assume app dev real quando possível.
