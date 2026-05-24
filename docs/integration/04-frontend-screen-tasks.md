# Frontend Screen Integration Tasks

Each section lists **UI intent** (from existing design), **current state**, and **tasks** to reach production wiring. Assume POC pages **Global Acervo** and **Onion mesh (live)** are removed per [02-poc-retirement-and-capability-migration.md](./02-poc-retirement-and-capability-migration.md).

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
| `/new-arrivals` | ❌ Placeholder div | [ ] Register `NewArrivalsPage` when data wired |
| `/acervo` | Removed | [x] **Remove** after Search Network default browse works |

---

## Library section

### Home `/`

| Block | Current | Task |
|-------|---------|------|
| Peers / health / Mbps | ⚠️ Peers OK; Mbps 0 | [ ] Mbps from `get_network_metrics` when backend ready |
| NetworkGraph | ❌ Mock data | [ ] Nodes from cached peers or simplified peer count viz |
| Activity lists | ❌ Hardcoded | [ ] `activity_log` + active transfers |
| DownloadManager tab | ⚠️ Empty transfers | [ ] Bind to shared `downloadManager` + outbound shares |
| Quick action Share | ⚠️ Navigates only | [ ] Pick file → `onionShareAddFile` or open Documents upload |

### Documents & Search `/documents`, `/search`

| Feature | Current | Task |
|---------|---------|------|
| Scan / list / search local | ✅ `documentService`, `searchService` | [ ] Sync list with `documents` table |
| Upload + validation | ✅ | — |
| Share action | ❌ `alert()` | [ ] `onionShareAddFile(doc.filePath)` + toast with onion link |
| Download action | ❌ `alert()` | [ ] Open local file or network fetch if remote |
| Delete | ❌ `alert()` | [ ] Tauri delete + DB row remove |
| Network results tab (optional) | ❌ | [ ] Embed `useNetworkLobby` search results alongside local library |

### Document Detail `/document/:id`

| Feature | Current | Task |
|---------|---------|------|
| Load by id | ❌ `documentApi` mock | [ ] `documentService` / `get_document` Tauri |
| Download / share / favorites | ❌ Mock API | [ ] Real services |
| Open in reader | ⚠️ | [ ] Link `/reader?path=` with encoded path |

### Document Reader `/reader`

| Feature | Current | Task |
|---------|---------|------|
| View PDF/EPUB | ✅ | — |
| Annotations persist | ❌ | [ ] SQLite or metadata sidecar (P2) |

### Collections `/collections`

| Feature | Current | Task |
|---------|---------|------|
| CRUD | ⚠️ Basic Tauri only | [ ] Match service surface to registered commands |
| Add documents | ❌ Unimplemented backend | [ ] P1 backend or hide UI |
| P2P share collection | ❌ | [ ] P2 design |

### Favorites `/favorites`

| Feature | Current | Task |
|---------|---------|------|
| List | ❌ Mock data in page | [ ] `favoriteService.listFavorites` + resolve document metadata |
| Toggle from other pages | ⚠️ Service exists | [ ] Wire DocumentCard heart icon |

### Recent `/recent`

| Feature | Current | Task |
|---------|---------|------|
| Timeline | ❌ Mock | [ ] `activity_log` query by date |
| Filters | UI only | [ ] Pass filters to query |

---

## Discovery section

### Search Network `/search-network` (primary network library UI)

| Feature | Current | Task |
|---------|---------|------|
| Title search | ✅ Tracker lobby filter | [ ] Also query SQLite cache when offline |
| Empty query = all files | ✅ | [x] Auto-run on mount when Tor ready (replaces Global Acervo) |
| Tor gate | ⚠️ `torAdapter` | [ ] Gate on `onionShareStatus` + tracker reachability |
| Download result | ✅ `transferFacade.downloadLink` | [x] Onion link via transferFacade + hash resolution |
| Open result | ❌ `/document/:hash` | [ ] Download-first or open network link; local docs → reader |
| Download All | ❌ No handler | [ ] Queue all result links |
| Scope / type filters | ❌ UI only | [ ] Apply to search query (extension filter minimum) |
| Stats ribbon | ✅ Partial | [ ] Add total size from lobby |

### Browse Categories `/browse`

| Feature | Current | Task |
|---------|---------|------|
| Categories | ❌ Mock setTimeout data | [ ] Derive from local `documents.categories` + network filename clustering |
| Subcategory counts | ❌ | [ ] SQL `GROUP BY` |
| Open category | ❌ | [ ] Navigate to Search Network with prefilled filter |

### Trending `/trending`

| Feature | Current | Task |
|---------|---------|------|
| All data | ❌ `generateMockData()` | [ ] `list_trending_network_files` + local popularity |
| Charts / growth | ❌ | [ ] Requires cache history (P2) |

### New Arrivals `/new-arrivals`

| Feature | Current | Task |
|---------|---------|------|
| Route | ❌ Not registered | [ ] Add route |
| Documents | ❌ `useDocuments()` stub | [ ] `list_recent_network_files` + recent local imports |
| Time filters | UI ready | [ ] Wire to query `first_seen_at` / `created_at` |

---

## P2P Network section

### Peer Network `/peers`

| Feature | Current | Task |
|---------|---------|------|
| Stats cards | ✅ Tracker + cache | [x] `network_peers` count, cache file count, onion status |
| Peer list | ✅ `useNetworkPeers` | [x] Map `networkFacade.listPeers()` / SQLite peers |
| Trust / capabilities | ❌ Mock fields | [ ] P2: reputation table; hide until real |

### Network Health `/network-health`

| Feature | Current | Task |
|---------|---------|------|
| Peer count | ✅ Tracker | — |
| Throughput / latency | ❌ Zeros | [ ] Backend metrics |
| Map / history | ❌ Fabricated | [ ] Hide or feed real samples |
| NetworkHealthDashboard | ⚠️ | [ ] Same metrics source as page |

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
| Project / download folder | ❌ Not on page | [ ] Add paths section (or Settings page) |
| Bandwidth / peer sliders | ❌ Simulation | [ ] Hide or wire P2 |
| Sync diagnostics | ⚠️ | [ ] Show `trackerGetLastSyncDiag` |

### Settings `/settings` (page exists)

| Feature | Current | Task |
|---------|---------|------|
| Route | ✅ | [x] Add to `App.tsx` |
| Theme / i18n | UI | [ ] `save_app_settings` |
| Library paths | ✅ | [x] Full folder picker integration |

---

## Components to consolidate

| New shared piece | Replaces |
|------------------|----------|
| `useNetworkLobby()` | Duplicate lobby fetch in Sidebar, Search Network, POC |
| `useTransferState()` | downloadManager subscribe in multiple pages |
| `NetworkFileCard` | Global Acervo card, Search Network result row |
| `OnionStatusBar` | Repeated pills on many pages |

---

## Mock removal checklist

- [x] `PeerTransfers`: `MOCK_OUTBOUND`, `MOCK_INBOUND`, `MOCK_COMPLETED`, `THROUGHPUT_SAMPLES`
- [x] `PeerNetworkPage`: `mockConnectedPeers`, fake `networkStats`
- [ ] `Browse.tsx`: mock categories `createEffect`
- [ ] `Trending.tsx`: `generateMockData`
- [ ] `Favorites.tsx`: inline mock array
- [ ] `Recent.tsx`: `mockDocuments`
- [ ] `Home.tsx`: `recentDownloads`, `networkActivity` arrays
- [ ] `useDocuments.ts`: hardcoded two documents
- [ ] `documentApi.ts`: mock invoke — delete or make dev-only
- [x] `useNetworkSearch.downloadFromPeer`: timeout mock
- [ ] `ConnectionManager`: `MockUsageMetric` static values (or label “preview”)

---

## Suggested implementation order

1. `networkFacade` + fix Search Network download + `/settings` route  
2. Sharing & downloads real tables only; remove Onion mesh panel  
3. Peer Network + Sidebar live counts — **done**
4. DocumentDetail → real document load; Library share action  
5. Favorites + Recent from SQLite  
6. Browse / Trending / New Arrivals from cache  
7. Remove Global Acervo route and page  
