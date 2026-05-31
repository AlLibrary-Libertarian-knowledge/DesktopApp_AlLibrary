# AlLibrary Integration Plan

Frontend-driven integration tasks to connect the designed UI to a **per-node SQLite database** and the **onion-share + tracker** network stack. Each desktop installation is one **node** in the distributed application; its data lives under a **project directory** chosen at first run and adjustable in **Configurations**.

## Principles

1. **UI is the spec** — Screens in `src/pages/` and domain components define required data, actions, and states. Backend work closes gaps those screens already expose.
2. **One node, one database root** — SQLite and on-disk folders under `{projectFolder}` (e.g. `D:\AlLibrary`). App config in Tauri `app_data_dir` + `settings.json` points at that root.
3. **Network metadata is cached locally** — Tracker lobby snapshots, transfer history, and peer presence are persisted in SQLite so Discovery and P2P screens work offline and after restart.
4. **POC screens are retired, not duplicated** — `Global Acervo` and the **Onion mesh (live)** panel in `PeerTransfers` proved the stack; their behavior moves into production screens, then those POC UIs are removed.
5. **Single download/share path** — All network downloads use `downloadManager` + `onion_share_fetch`. All local→network publishing uses `onion_share_add_file`.

## Document map

| File | Scope |
|------|--------|
| [01-data-model-and-node-directory.md](./01-data-model-and-node-directory.md) | Folder layout, SQLite schemas, config, first-run |
| [02-poc-retirement-and-capability-migration.md](./02-poc-retirement-and-capability-migration.md) | What to extract from Global Acervo & Onion mesh before deletion |
| [03-backend-rust-tasks.md](./03-backend-rust-tasks.md) | Tauri commands, tracker cache, metrics, missing invoke handlers |
| [04-frontend-screen-tasks.md](./04-frontend-screen-tasks.md) | Per-screen wiring, mocks to replace, routes to add |
| [05-network-services-layer.md](./05-network-services-layer.md) | TypeScript service contracts shared by all screens |

## Phased delivery

### Phase A — Foundation (blocking)

- [x] Unify project path: first-run wizard → Rust `save_app_settings` → SQLite path `{documentsFolder}/allibrary.db`
- [x] Persist tracker lobby cache + sync diagnostics in SQLite (not only in-memory `RwLock`)
- [x] Expose one TS module `networkFacade` (see doc 05) used by Search Network, Peers, Home, Sidebar
- [x] Fix broken paths: `/settings` route, Search Network download, `documentApi` mock removed — **May 2026**

### Phase B — Screen integration

- [x] Wire Discovery screens to **cached lobby + local library** (Search Network, Browse, Trending, New Arrivals) — **done** (May 2026): offline cache search, extension filters, Download All, stats ribbon
- [~] Wire P2P screens to **real transfers + tracker peers** (Peer Network, Network Health, Sharing & downloads tables) — **Network Health + transfers/peers done** (May 2026); latency/upload backend still P2
- [~] Wire Library actions (share/download/delete) to Tauri + onion share — **Home quick-share done** (May 2026); documents table list sync remain

### Phase C — POC removal

- [x] Delete route `/acervo` and `GlobalAcervo` page
- [x] Remove **Onion mesh (live)** card from `PeerTransfers`; keep polished transfer UI only
- [x] Remove duplicate tracker debug controls from UI (manual sync in Connection Manager Advanced; retry only on sync error in Peer Network)

### Phase D — Depth

- [x] Collections — minimal CRUD + document membership (`add_documents_to_collection`, etc.) — **May 2026**
- [x] Cultural sensitivity UI removed from product (components/hooks deleted; copy neutralized)
- [~] Network metrics (throughput, active transfers) from Rust → `networkStore` — **basic `get_network_metrics` done**; rolling window / facade consolidation remain
- [ ] Optional: tracker timestamps for Trending / New Arrivals (history-based charts)

## Related existing docs

- [TRACKER_SERVER.md](../TRACKER_SERVER.md) — Tracker protocol
- [P2P_INTEGRATION.md](../P2P_INTEGRATION.md) — Legacy P2P notes (libp2p); superseded by onion-share path for UI work
- [progress/Implementation_Gaps_Tasks.md](../../progress/Implementation_Gaps_Tasks.md) — Broader product gaps (i18n, design tokens)

## Status legend (used in task lists)

- `[ ]` Not started
- `[~]` Partial (POC or mock in place)
- `[x]` Done

---

## Recently completed — Collections + cultural removal (May 2026)

| Area | Done |
|------|------|
| Collections backend | Real update/delete; `document_collections` junction ops; `add_documents_to_collection`, `remove_documents_from_collection`, `get_collection_documents` |
| Collections UI | Minimal list/create/edit/detail; add/remove docs from library scan |
| `collectionService` | Slim CRUD + membership only; tests rewritten |
| Cultural removal | Deleted `src/components/cultural/`, `hooks/cultural/`; neutral branding; footer/shell copy updated |

---

## Recently completed — Network Health + Home quick-share (May 2026)

| Area | Done |
|------|------|
| Home quick-share | `pickAnyFiles` + `shareWithToast`; no navigate-only stub |
| Network Health | `networkStore.metricsHistory`; real peer/download/transfer cards; rolling charts; mock topology/latency/storage removed |
| Dashboard | `NetworkHealthDashboard` reads store; performance-over-time chart with series toggles |

---

## Recently completed — Search Network polish + mock cleanup (May 2026)

| Area | Done |
|------|------|
| Mock cleanup | Removed `Browse.tsx`, `documentApi.ts`, `NetworkSettingsPanel.tsx`; trimmed Connection Manager simulation UI |
| Transfers persistence | `list_recent_transfers` Tauri command; `downloadManager` hydrates completed from SQLite (no localStorage) |
| Search Network | Tor gate via `networkFacade.getPresence`; cache-only search offline; extension filters; Download All; lobby vs results stats |
| Tracker sync UX | Manual refresh in Connection Manager **Advanced**; Peer Network retry only when `syncError` |

See [04-frontend-screen-tasks.md](./04-frontend-screen-tasks.md) mock checklist and Search Network table for detail.

---

## Recommended next steps

Priority order for the next integration slice(s):

1. **Consolidation (lower risk, improves maintainability)**
   - Shared `NetworkFileCard`, `useTransferState`, `OnionStatusBar` — [04 § Components to consolidate](./04-frontend-screen-tasks.md)
   - Slim `p2pNetworkService` + finish `networkStore` facade consolidation — [05](./05-network-services-layer.md)

2. **Phase B — remaining polish**
   - Documents list UI sync after scan (optional)
   - Home NetworkGraph mock → cached peer viz

3. **P2 / optional**
   - Collection P2P sharing / export (cancelled for minimal scope)
   - `get_swarm` / parallel download peer list
   - Trending charts (cache history / `first_seen_at` deltas)
   - Settings theme/i18n → `save_app_settings`
   - Global top search bar → `/search-network?q=`
