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

- Unify project path: first-run wizard → Rust `save_app_settings` → SQLite path `{documentsFolder}/allibrary.db`
- Persist tracker lobby cache + sync diagnostics in SQLite (not only in-memory `RwLock`)
- Expose one TS module `networkFacade` (see doc 05) used by Search Network, Peers, Home, Sidebar
- Fix broken paths: `documentApi` mock, `/settings` route, Search Network download

### Phase B — Screen integration

- Wire Discovery screens to **cached lobby + local library** (Search Network, Browse, Trending, New Arrivals)
- Wire P2P screens to **real transfers + tracker peers** (Peer Network, Network Health, Sharing & downloads tables)
- Wire Library actions (share/download/delete) to Tauri + onion share

### Phase C — POC removal

- Delete route `/acervo` and `GlobalAcervo` page
- Remove **Onion mesh (live)** card from `PeerTransfers`; keep polished transfer UI only
- Remove duplicate tracker debug controls from UI (keep in dev tools or Connection Manager advanced section)

### Phase D — Depth

- Collection/favorites Tauri commands matching `collectionService` surface
- Network metrics (throughput, active transfers) from Rust → `networkStore`
- Optional: tracker timestamps for Trending / New Arrivals

## Related existing docs

- [TRACKER_SERVER.md](../TRACKER_SERVER.md) — Tracker protocol
- [P2P_INTEGRATION.md](../P2P_INTEGRATION.md) — Legacy P2P notes (libp2p); superseded by onion-share path for UI work
- [progress/Implementation_Gaps_Tasks.md](../../progress/Implementation_Gaps_Tasks.md) — Broader product gaps (i18n, design tokens)

## Status legend (used in task lists)

- `[ ]` Not started
- `[~]` Partial (POC or mock in place)
- `[x]` Done
