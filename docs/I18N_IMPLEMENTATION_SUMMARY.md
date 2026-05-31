# i18n — resumo e estado atual

SolidJS + `@solid-primitives/i18n` (ver `src/i18n/`).

---

## Estado atual (realista)

| Área | Situação |
|------|----------|
| Infraestrutura i18n | Implementada (`initializeI18n`, hooks `useTranslation`) |
| Idiomas com ficheiros | `en`, `pt`, `es`, `fr`, `de`, `it`, `ja`, `zh` em `src/i18n/locales/` |
| Cobertura **completa** | **Não** — `en`/`pt` mais completos; outros parciais |
| Home, componentes base | Chaves extensas em `pages.json` / `components.json` |
| Telas P2P / Discovery novas | Misto: strings hardcoded em inglês/português em várias páginas |
| RTL / línguas indígenas | Planejado em docs antigos — **não** concluído |

Tratar claims de “100% coverage” em documentação legada como **meta**, não facto.

---

## Estrutura de ficheiros

```
src/i18n/
├── locales/{lang}/
│   ├── common.json
│   ├── pages.json
│   ├── components.json
│   ├── cultural.json
│   ├── errors.json
│   └── validation.json
├── service.ts
└── hooks/
```

---

## Uso no código

```tsx
const { t } = useTranslation('pages');
t('home.title');
```

Fallback tipicamente para `en` quando chave ausente (comportamento definido em `service.ts`).

---

## Prioridades de integração

1. Externalizar strings em **Search Network**, **PeerTransfers**, **Connection Manager**.
2. Unificar PT/EN no footer (“Buscar documentos…” vs resto EN).
3. Traduções de estados de rede: “No Onion”, “Nodes online”, erros de tracker.

---

## Testes

- `src/test-i18n.tsx` — helpers
- Testes unitários podem mockar i18n; E2E não validam todos os idiomas.

Para gaps de produto gerais: [progress/Implementation_Gaps_Tasks.md](../progress/Implementation_Gaps_Tasks.md) (Task 0.1 i18n).

---

## Documento histórico

Secções abaixo descrevem **intenção de design** (listas de chaves Home, StatCard, etc.). Consulte os JSON reais para a lista autoritativa de chaves existentes.

### Home (exemplos de namespaces)

- `home.networkStatus`, `home.quickActions`, `home.welcomeModal`
- Ver `src/i18n/locales/en/pages.json`

### Componentes

- `activityList`, `statCard`, `documentCard`
- Ver `src/i18n/locales/en/components.json`
