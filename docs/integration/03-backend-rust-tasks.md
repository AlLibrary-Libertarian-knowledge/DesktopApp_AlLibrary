# Backend (Rust / Tauri) Tasks

Tasks derived from frontend screens and from retiring POC flows. Priority: **P0** blocks UI truthfulness; **P1** enables Discovery/P2P screens; **P2** completeness.

---

## P0 — Correctness & shared infrastructure

### Settings & paths

- [ ] **P0** Align `save_app_settings` payload with frontend `settingsService` (project + download paths, folder creation) — done via `apply_project_paths` (Task 1)
- [ ] **P0** Return resolved paths in `load_app_settings` for UI display (documents, downloads, db file)
- [ ] **P0** Relocate `onion_share/config.rs` `AppConfig` persistence into app settings or SQLite `node_config`

### Tracker integration (improve POC backend)

Existing commands in `onion_bridge.rs` / `tracker_client.rs`:

| Command | Status | Enhancement |
|---------|--------|-------------|
| `tracker_get_config` | Done | — |
| `tracker_set_config` | Done | — |
| `tracker_refresh_lobby` | Done | After success → **write SQLite cache** |
| `tracker_get_cached_lobby_cmd` | Done | Read **memory + SQLite** fallback |
| `tracker_get_last_sync_diag` | Done | Expose in Connection Manager |
| `tracker_start_ws_loop` / `tracker_stop_ws_loop` | Done | Auto-start on boot; idempotent |
| `bootstrap_onion_overlay` | Done | Emit `init-progress` (already) |

- [x] **P0** Migration `002_network_cache` — `network_files`, `network_peers`, `network_file_peers` in `allibrary.db`; runner via `ensure_node_database` at init
- [x] **P0** Implement `sync_lobby_to_db(lobby: NetworkLobby)` in Rust — wired from onion_bridge + WS loop
- [x] **P0** On WS `Lobby` message → update in-memory cache + SQLite
- [x] **P0** Background task: HTTP announce heartbeat persists lobby to SQLite on success
- [x] **P1** `search_network_cached` — SQL `LIKE` on `network_files.name`, order by `peer_count`
- [x] **P1** `list_network_peers` — from `network_peers`

### Onion share

| Command | Status | Enhancement |
|---------|--------|-------------|
| `onion_share_start` / `stop` | Done | — |
| `onion_share_add_file` / `remove_file` | Done | Mirror to `local_shares` table |
| `onion_share_list_local` | Done | Prefer DB read |
| `onion_share_status` | Done | — |
| `onion_share_fetch` | Done | Record row in `transfers`; emit progress events |
| `ensure_tor_for_onion_share` | Done | — |

- [ ] **P0** `onion_share_fetch`: emit granular progress events (not only done/fail) for UI progress bars
- [ ] **P1** Persist completed transfers in SQLite

### Documents (local library)

Already registered: `scan_documents_folder`, `get_document_info`, `open_document`, `import_document`, etc.

- [ ] **P0** Ensure scan results upsert `documents` table (when table exists)
- [x] **P0** Implement missing favorites commands: `is_favorite`, `toggle_favorite`, `list_favorites`
- [x] **P0** `delete_local_document` — permanent file delete under project root + local_shares cleanup
- [x] **P1** DocumentDetail load via frontend `resolveDocumentById` (hash/path; not legacy `get_document` UUID pool)

### Network metrics (Home, Network Health)

Frontend reads `get_network_metrics` / `p2pNetworkService.getNetworkMetrics()` but implementation returns **zeros**.

- [ ] **P1** `get_network_metrics` populated from:
  - active fetch count / bytes moved (transfers table)
  - tracker `online_nodes`
  - onion share running state
- [ ] **P1** Optional: rolling window throughput estimate from transfer timestamps

---

## P1 — Discovery & search (replaces Global Acervo)

New or extended commands (SQLite-backed):

```rust
// Proposed — names for planning
search_network_cached(query: String, limit: u32) -> Vec<NetworkFileDto>
list_network_peers() -> Vec<NetworkPeerDto>
get_swarm(content_hash: String) -> Option<NetworkFileDto>  // HTTP to tracker or cache
```

- [x] **P1** `search_network_cached` — SQL `LIKE` on `network_files.name`, order by `peer_count`
- [x] **P1** `list_network_peers` — from `network_peers`
- [ ] **P1** `get_swarm` — proxy `GET /swarm/:hash` when online; else cache
- [ ] **P1** Wire existing `search_p2p_network` Tauri command either to cached search or deprecate in favor of above

### Tracker HTTP client (already in `tracker_client.rs`)

Ensure these endpoints are used and cached:

| Endpoint | Use |
|----------|-----|
| `POST /announce` | Presence |
| `GET /lobby` | Full cache refresh |
| `GET /swarm/:content_hash` | Parallel download peer list |
| `WS /ws` | Live lobby push |

- [ ] **P1** Expose swarm lookup to frontend: `tracker_get_swarm(content_hash)`

---

## P1 — Collections

Frontend `collectionService` invokes many commands **not** in `lib.rs`. Registered today: `create_collection`, `get_collections`, `get_collection`, `update_collection`, `delete_collection`.

- [ ] **P1** Audit `collectionService.ts` invoke list vs `lib.rs`
- [ ] **P1** Either implement or remove from UI: `add_documents_to_collection`, `enable_p2p_sharing`, `sync_collection`, collaborators, export, etc.
- [ ] **P2** `enable_p2p_sharing` → adds collection manifest files to onion share (design TBD)

---

## P2 — Activity, trending, categories

Browse / Trending / New Arrivals need **time and taxonomy** not present on tracker today.

- [ ] **P2** Extend tracker protocol (optional) with `announced_at` on files — or infer `first_seen_at` locally on cache insert
- [ ] **P2** `list_recent_network_files(since: DateTime)` from SQLite
- [ ] **P2** `list_trending_network_files` — local heuristic: `peer_count` delta + download count from `activity_log`
- [ ] **P2** Categories — map file extensions / user tags on local documents; network files use filename heuristics until metadata protocol exists

---

## P2 — Legacy libp2p stack

Commands exist (`init_p2p_node`, `search_p2p_network`, Kademlia helpers) but UI standardizes on **onion-share**.

- [ ] **P2** Document deprecation in `P2P_INTEGRATION.md`
- [ ] **P2** Do not wire new screens to libp2p unless explicitly revived

---

## Event contract (frontend listens)

| Event | Payload | Consumer screens |
|-------|---------|------------------|
| `init-progress` | phase, message, progress | Loading overlay |
| `onion-share-fetch-done` | ok, path, error, link | downloadManager, Sharing & downloads |
| `tor-setup-progress` | progress, message | First run / Tor bundle |
| **New:** `lobby-updated` | `{ online_nodes, file_count }` | Sidebar, Home, Search Network |
| **New:** `transfer-progress` | id, progress | Sharing & downloads, Home |

- [ ] **P1** Emit `lobby-updated` after DB sync
- [ ] **P0** Emit `transfer-progress` during fetch

---

## Testing checklist (backend)

- [ ] Tracker announce + lobby refresh persists rows in SQLite
- [ ] Restart app → `tracker_get_cached_lobby_cmd` returns last cache when Tor offline
- [ ] Add share → `local_shares` + tracker announce includes file
- [ ] Fetch completes → `transfers` row terminal state + event fired
- [x] Favorites round-trip via Tauri commands

See also: `src-tauri/ONION_SHARE_MANUAL_E2E.md`, `docs/TESTING_P2P.md`.
