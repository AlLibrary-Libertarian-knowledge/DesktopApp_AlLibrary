# Frontend Screen Integration Tasks

Each section lists **UI intent** (from existing design), **current state**, and **tasks** to reach production wiring. Assume POC pages **Global Acervo** and **Onion mesh (live)** are removed per [02-poc-retirement-and-capability-migration.md](./02-poc-retirement-and-capability-migration.md).

> **May 2026 — Search Network polish + mock cleanup:** Discovery Search Network slice complete (offline cache, extension filters, Download All, stats). Mock cleanup complete (`Browse.tsx`, `documentApi`, simulation UI). Completed downloads from SQLite. See mock checklist at bottom.

---

## Global shell

### Sidebar + Footer + Top bar

| Element | Current | Task |
|---------|---------|------|
| Storage bar | ✅ `get_disk_space_info` | [ ] Show download folder free space optional |
| Network Online / Onion pill | ✅ `useNetworkPresenceResource` | — |
| Nodes online count | ✅ `useNetworkLobby` + `lobby-updated` | [x] Subscribe to `lobby-updated` event instead of 15s poll |
| Nav badges (Trending 12, Peers 8) | ✅ Live from lobby/peers | [x] Live counts from SQLite cache or remove badges |
| Top search bar | ❌ Not wired globally | [ ] Navigate to `/search-network?q=` or local document search |

### App bootstrap (`App.tsx`)

| Step | Current | Task |
|------|---------|------|
| First-run wizard | ✅ Project folder | [ ] Also set download folder + trigger Rust subfolder creation |
| `bootstrapOnionOverlay` | ✅ | [x] Start `tracker_start_ws_loop` after success |
| Restore shares | ✅ SQLite `local_shares` | [x] Restore from SQLite `local_shares` |
| Legacy `init_tor_node` | ⚠️ Optional | [ ] Remove call when confirmed unused |

### Routes

| Route | Status | Task |
|-------|--------|------|
| `/settings` | ✅ Registered | [x] Register `SettingsPage`; link project/download folders |
| `/new-arrivals` | ✅ Registered | [x] Register `NewArrivalsPage` when data wired |
| `/acervo` | Removed | [x] **Remove** after Search Network default browse works |

---

## Library section

### Home `/`

| Block | Current | Task |
|-------|---------|------|
| Peers / health / Mbps | ✅ Peers + Mbps from `get_network_metrics` | [x] Mbps from `get_network_metrics` when backend ready |
| NetworkGraph | ❌ Mock data | [ ] Nodes from cached peers or simplified peer count viz |
| Activity lists | ⚠️ downloadManager + activity_log | [x] `activity_log` + active transfers |
| DownloadManager tab | ✅ `downloadManager` subscribe | [x] Bind to shared `downloadManager` + outbound shares |
| Quick action Share | ✅ `pickAnyFiles` + `shareWithToast` | [x] Pick file → `transferFacade.addShare` with toast (May 2026) |

### Documents & Search `/documents`, `/search`

| Feature | Current | Task |
|---------|---------|------|
| Scan / list / search local | ✅ `documentService`, `searchService` | [x] Scan upserts `documents` table; list UI sync still optional polish |
| Upload + validation | ✅ | — |
| Share action | ✅ `transferFacade.addShare` + toast | [x] `onionShareAddFile(doc.filePath)` + toast with onion link |
| Download action | ✅ Opens unified document page | [x] Open local file or network fetch if remote |
| Delete | ✅ `delete_local_document` | [x] Tauri delete + DB row remove |
| Network results tab (optional) | ❌ | [ ] Embed `useNetworkLobby` search results alongside local library |

### Document Detail `/document/:id` (unified reader + HUD)

| Feature | Current | Task |
|---------|---------|------|
| Load by id | ✅ `documentService.resolveDocumentById` | [x] `documentService` hash/path resolver (not legacy DB UUID) |
| Download / share / favorites | ✅ Real services | [x] Real services |
| Focus vs HUD toggle | ✅ Default focus; `?hud=1` for details sidebar | [x] Single page replaces separate reader route |
| Local PDF/EPUB bytes | ✅ `openDocument` → `DocumentViewer` | [x] Port byte loading from legacy reader |

### Document Reader `/reader` (legacy redirect)

| Feature | Current | Task |
|---------|---------|------|
| Route | ✅ Redirects to `/document/:id` | [x] Resolve path → content hash id |
| View PDF/EPUB | ✅ Via unified document page | — |
| Annotations persist | ❌ | [ ] SQLite or metadata sidecar (P2) |

### Collections `/collections`

| Feature | Current | Task |
|---------|---------|------|
| CRUD | ✅ Minimal Tauri + SQLite | [x] create/get/update/delete with real DB writes |
| Add/remove documents | ✅ Junction table | [x] `add_documents_to_collection`, `remove_documents_from_collection`, `get_collection_documents` |
| UI | ✅ Minimal page | [x] List, create/edit modals, detail with library picker — no analytics/P2P/cultural filters |
| P2P share collection | Removed from UI | [ ] P2 design (out of scope for minimal slice) |

### Favorites `/favorites`

| Feature | Current | Task |
|---------|---------|------|
| List | ✅ `favoriteService.listFavorites` + resolve | [x] `favoriteService.listFavorites` + resolve document metadata |
| Toggle from other pages | ✅ DocumentDetail + Documents grid | [x] Wire DocumentCard heart icon (Detail page; card TBD) |

### Recent `/recent`

| Feature | Current | Task |
|---------|---------|------|
| Timeline | ✅ `activityService` + SQLite | [x] `activity_log` query by date |
| Filters | ✅ Server + client filters | [x] Pass filters to query |

---

## Discovery section

### Search Network `/search-network` (primary network library UI)

| Feature | Current | Task |
|---------|---------|------|
| Title search | ✅ Tracker lobby filter | [x] Also query SQLite cache when offline (`networkFacade.searchFiles`) |
| Empty query = all files | ✅ | [x] Auto-run on mount when Tor ready (replaces Global Acervo) |
| Tor gate | ✅ `networkFacade.getPresence` | [x] Search allows cache-only offline; downloads require onion running |
| Download result | ✅ `transferFacade.downloadLink` | [x] Onion link via transferFacade + hash resolution |
| Open result | ✅ `/document/:hash` unified page | [x] Single document page with focus/HUD toggle |
| Download All | ✅ `transferFacade.downloadAll` | [x] Queue all result links (sequential) |
| Scope / type filters | ✅ Extension filter | [x] `fileTypes` → `networkFacade.searchFiles` extensions; scope toggles disabled (P2) |
| Stats ribbon | ✅ | [x] Lobby total vs Results total size labels |

### Browse Categories `/browse`

| Feature | Current | Task |
|---------|---------|------|
| Categories | ✅ `list_browse_categories` | [x] Derive from local `documents.file_type` + network extension counts |
| Subcategory counts | — | [x] SQL `GROUP BY` (single-level categories) |
| Open category | ✅ | [x] Navigate to Search Network with prefilled filter |

### Trending `/trending`

| Feature | Current | Task |
|---------|---------|------|
| All data | ✅ `list_trending_network_files` | [x] `list_trending_network_files` + local popularity |
| Charts / growth | ❌ | [ ] Requires cache history (P2) |

### New Arrivals `/new-arrivals`

| Feature | Current | Task |
|---------|---------|------|
| Route | ✅ Registered | [x] Add route |
| Documents | ✅ `discoveryService` | [x] `list_recent_network_files` + recent local imports |
| Time filters | ✅ Wired | [x] Wire to query `first_seen_at` / `created_at` |

---

## P2P Network section

### Peer Network `/peers`

| Feature | Current | Task |
|---------|---------|------|
| Stats cards | ✅ Tracker + cache | [x] `network_peers` count, cache file count, onion status |
| Peer list | ✅ `useNetworkPeers` | [x] Map `networkFacade.listPeers()` / SQLite peers |
| Manual tracker sync | ✅ Deduped | [x] No routine “Sync tracker now”; retry only when `lobby.syncError()` (manual sync → Configurations Advanced) |
| Trust / capabilities | ❌ Mock fields | [ ] P2: reputation table; hide until real |

### Network Health `/network-health`

| Feature | Current | Task |
|---------|---------|------|
| Peer count | ✅ `networkStore` | — |
| Throughput / latency | ✅ Download rate from store; latency hidden | [x] Real download Mbps + rolling history charts (May 2026) |
| Map / history | ✅ Client-side history | [x] `metricsHistory` buffer + sparklines; mock map/topology removed |
| NetworkHealthDashboard | ✅ `networkStore` | [x] Same metrics source; performance chart with series toggles |

### Sharing & downloads `/transfers`

| Feature | Current | Task |
|---------|---------|------|
| Outbound real shares | ✅ | [x] Remove MOCK fallback rows |
| Inbound downloads | ✅ `downloadManager` | [x] Remove MOCK inbound/completed |
| Charts | Placeholder | [x] Real throughput or remove charts until metrics exist |
| Onion mesh panel | Removed | [x] **Delete**; retain compact status + actions in header |
| Add files | ✅ Pickers | — |
| Download by link | ✅ | [x] Move to modal |

### Configurations `/connection-manager`

| Feature | Current | Task |
|---------|---------|------|
| Tracker URL / node id | ✅ | — |
| Project / download folder | ✅ Resolved paths + DB path | [x] `resolvedPaths` from Rust; sync diag below tracker save |
| Bandwidth / peer sliders | ❌ Removed with simulation UI | [ ] Hide or wire P2 if reintroduced |
| Sync diagnostics | ✅ | [x] Show `trackerGetLastSyncDiag` |
| Advanced: manual lobby refresh | ✅ | [x] Collapsible Advanced → `networkFacade.refreshLobby()` (May 2026) |
| Simulation UI (RAM/Mbps bars) | ✅ Removed | [x] No `MockUsageMetric` in production build (May 2026) |

### Settings `/settings` (page exists)

| Feature | Current | Task |
|---------|---------|------|
| Route | ✅ | [x] Add to `App.tsx` |
| Theme / i18n | UI | [ ] `save_app_settings` |
| Library paths | ✅ | [x] Full folder picker + `resolvedPaths.databaseFile` display |

---

## Components to consolidate

| New shared piece | Replaces | Status |
|------------------|----------|--------|
| `useNetworkLobby()` | Duplicate lobby fetch in Sidebar, Search Network, POC | [x] Done |
| `useTransferState()` | downloadManager subscribe in multiple pages | [x] PeerTransfers + Home |
| `NetworkFileCard` | Global Acervo card, Search Network result row | [x] May 2026 |
| `OnionStatusBar` | Repeated pills on many pages | [x] May 2026 |

---

## Mock removal checklist

- [x] `PeerTransfers`: `MOCK_OUTBOUND`, `MOCK_INBOUND`, `MOCK_COMPLETED`, `THROUGHPUT_SAMPLES`
- [x] `PeerNetworkPage`: `mockConnectedPeers`, fake `networkStats`
- [x] `BrowsePage.tsx`: mock categories removed → `list_browse_categories`
- [x] `Trending.tsx`: `generateMockData` removed → `list_trending_network_files`
- [x] `Favorites.tsx`: inline mock array
- [x] `Recent.tsx`: `mockDocuments`
- [x] `Home.tsx`: `recentDownloads`, `networkActivity` arrays
- [x] `NewArrivalsPage.tsx`: `useDocuments` stub replaced with `discoveryService`
- [x] `Browse.tsx`: duplicate page removed (routing uses `BrowsePage`)
- [x] `documentApi.ts`: mock invoke deleted
- [x] `useNetworkSearch.downloadFromPeer`: timeout mock
- [x] `ConnectionManager`: simulation UI removed; Advanced section with manual lobby refresh
- [x] `NetworkSettingsPanel.tsx`: unused duplicate removed
- [x] Completed downloads: SQLite via `list_recent_transfers` (not localStorage)

---

## Suggested implementation order

### Completed

1. [x] `networkFacade` + Search Network download + `/settings` route  
2. [x] Sharing & downloads real tables; Onion mesh panel removed  
3. [x] Peer Network + Sidebar live counts  
4. [x] DocumentDetail real load; Library share/delete wired  
5. [x] Favorites + Recent from SQLite  
6. [x] Browse / Trending / New Arrivals from cache  
7. [x] Global Acervo route removed  
8. [x] Search Network polish + mock cleanup (May 2026): offline cache, filters, Download All, SQLite transfers, Connection Manager Advanced  

### Next

1. Home NetworkGraph → cached peer viz
2. `get_swarm` + optional parallel download UX
3. `LobbyStatsRibbon` (shared lobby stats for Search Network + Peer Network)
