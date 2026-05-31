# Network Services Layer (TypeScript)

Single facade for all screens after POC retirement. **Do not** call tracker/onion commands ad hoc from pages—route through these modules.

---

## Module layout (target)

```
src/services/network/
├── networkFacade.ts      # Primary entry: lobby, peers, presence, sync
├── transferFacade.ts     # Downloads, shares, progress (wraps downloadManager)
├── onionShareService.ts  # Low-level Tauri invoke (keep)
├── downloadManager.ts    # Active in-memory + events; completed from SQLite via list_recent_transfers
├── p2pNetworkService.ts  # Slim adapter → networkFacade (deprecate fat interface)
└── torAdapter.ts         # Thin wrapper over onion presence (keep)
```

---

## `networkFacade.ts` (created)

### Responsibilities

- Unified lobby read path: memory (Tauri cache) → SQLite fallback → empty
- Trigger refresh: HTTP + optional force
- Map lobby to UI types used by Search Network, Peers, Home
- Subscribe to `lobby-updated` Tauri event

### Proposed API

```typescript
export interface NetworkFileView {
  contentHash: string;
  name: string;
  size: number;
  link: string;
  peerCount: number;
  peers: Array<{ nodeId: string; onion: string; link: string }>;
}

export interface NetworkLobbyView {
  onlineNodes: number;
  files: NetworkFileView[];
  totalBytes: number;
  lastSyncAt: Date | null;
  syncError?: string;
}

export const networkFacade = {
  getLobby(): Promise<NetworkLobbyView>;
  refreshLobby(): Promise<NetworkLobbyView>;
  searchFiles(query: string, options?: { limit?: number; extensions?: string[] }): Promise<NetworkFileView[]>;
  listPeers(): Promise<Array<{ nodeId: string; onion: string }>>;
  getSwarm(contentHash: string): Promise<NetworkFileView | null>;
  getPresence(): Promise<{ onionActive: boolean; running: boolean; onion: string | null }>;
  getSyncDiagnostics(): Promise<TrackerSyncDiagnostics | null>;
  subscribeLobby(listener: (lobby: NetworkLobbyView) => void): () => void;
};
```

### Implementation notes

- [x] Create file; migrate logic from `GlobalAcervo.loadLobby`, Sidebar poll, `p2pNetworkService.searchNetwork`
- [x] `searchFiles('')` returns full lobby — **Global Acervo replacement** path via facade
- [x] When `tracker_refresh_lobby` fails, call `search_network_cached` (SQLite fallback)
- [ ] Re-export types from `src/types/NetworkLobby.ts` aligned with `tracker_proto.rs`

---

## `transferFacade.ts` (created)

### Responsibilities

- Start/stop onion share (user actions)
- Add/remove/list local shares
- Start download from onion link with correct output directory
- Expose unified transfer list (inbound + outbound)

### Proposed API

```typescript
export interface ShareEntryView {
  fileId: string;
  name: string;
  size: number;
  contentHash: string;
  link: string;
  diskPath?: string;
}

export interface TransferView {
  id: string;
  direction: 'inbound' | 'outbound';
  name: string;
  status: 'active' | 'queued' | 'completed' | 'failed' | 'seeding';
  progress: number;
  link?: string;
  localPath?: string;
  error?: string;
}

export const transferFacade = {
  getOnionStatus(): Promise<{ running: boolean; onion: string | null }>;
  startOnionShare(): Promise<{ onion: string }>;
  stopOnionShare(): Promise<void>;
  listShares(): Promise<ShareEntryView[]>;
  addShareFromPicker(): Promise<ShareEntryView[]>;
  addShare(path: string): Promise<ShareEntryView>;
  removeShare(fileId: string): Promise<void>;
  downloadLink(link: string, fileName: string, outDir?: string): Promise<string>;
  downloadAll(items: Array<{ link: string; name: string }>, outDir?: string): Promise<void>;
  listTransfers(): { active: TransferView[]; completed: TransferView[] };
  subscribeTransfers(listener: (active, completed) => void): () => void;
};
```

### Implementation notes

- [x] Wrap `onionShareService` + `downloadManager` + `settingsService.getDownloadFolder`
- [x] Self-download guard from Global Acervo → keep in `downloadLink`
- [x] `PeerTransfers` uses `useTransferState` → `transferFacade`
- [x] **Home** downloads tab uses `downloadManager` subscribe (same data as `useTransferState` target)
- [x] `downloadAll` — sequential queue for Search Network Results tab (May 2026)
- [x] Completed transfers loaded from SQLite on `downloadManager` init (not localStorage)
- [ ] Remove direct `onionShare.*` imports from pages except Connection Manager config

---

## Refactor `p2pNetworkService.ts`

Today implements 20+ methods; most are no-ops. Target:

| Keep | Delegate to |
|------|-------------|
| `searchNetwork` | `networkFacade.searchFiles` |
| `discoverPeers` / `getConnectedPeers` | `networkFacade.listPeers` |
| `getNodeStatus` | `networkFacade.getPresence` + lobby counts |
| `publishContent` | `transferFacade.addShare` |
| `startNode` | `transferFacade.startOnionShare` |

| Remove or stub with log | Reason |
|-------------------------|--------|
| `discoverCommunityNetworks`, `joinCommunityNetwork`, … | No UI contract |
| `requestContent` | Use `transferFacade.downloadLink` |
| `getNetworkMetrics` | [x] Implemented via `get_network_metrics` Tauri command |

- [ ] Slim interface documented in this file
- [x] Update `useNetworkSearch`, `useP2PTransfers` to use facades
- [ ] Update `networkStore` to use facades

---

## `networkStore.ts` updates

- [x] `downloadMbps` / `uploadMbps` from backend metrics — wired via `p2pNetworkService.getNetworkMetrics` → `get_network_metrics`
- [x] `metricsHistory` rolling buffer — append on poll; `historyForRange` / `historySparkline` for Network Health charts (May 2026)
- [ ] `refreshOnce()` calls `networkFacade.getLobby()` + `transferFacade` metrics (still uses `p2pNetworkService` today)

---

## Hooks mapping

| Hook | Should use |
|------|------------|
| `useNetworkSearch` | `networkFacade.searchFiles` + `transferFacade.downloadLink` / `downloadAll`; presence via `networkFacade.getPresence` (cache-only search when offline) |
| `useP2PTransfers` | `transferFacade` |
| `useNetworkPresenceResource` | `networkFacade.getPresence` |
| `useNetworkLobby` | `networkFacade` with Solid resource |
| `useTransferState` | `transferFacade` subscribe + shares |

### Fix `useNetworkSearch.downloadFromPeer`

Replace mock:

```typescript
// Before: setTimeout mock
// After:
await transferFacade.downloadLink(
  result.document.filePath, // onion link stored here by searchNetwork mapping
  result.document.title,
);
```

- [x] Remove mock delay block in `useNetworkSearch.ts`

---

## `documentApi.ts` decision

| Option | Action |
|--------|--------|
| A (recommended) | Delete mock; DocumentDetail uses `documentService` only |
| B | Make `documentApi` thin re-export of `documentService` + Tauri invoke |

- [x] **Option A applied** — `documentApi.ts` deleted (May 2026); DocumentDetail uses `documentService` only

---

## Config: tracker + node (existing)

Keep in `onionShareService.ts`:

- `trackerGetConfig` / `trackerSetConfig`
- Used by **Connection Manager** only at UI layer

Ensure saved config duplicates into SQLite `node_config` when backend ready.

---

## Testing (Vitest)

- [ ] `networkFacade.searchFiles` filters correctly (mock Tauri invoke)
- [x] `transferFacade.downloadLink` rejects self-onion URL
- [x] `useNetworkSearch` download calls transferFacade

Existing: `tracker_proto` serde test in Rust; add TS JSON fixture test matching `announce` / `lobby` wire format.

---

## Type alignment checklist

| Field | Rust `tracker_proto` | TS |
|-------|---------------------|-----|
| `online_nodes` | snake_case JSON | `NetworkLobby.online_nodes` |
| `content_hash` | snake_case | same |
| `peer_count` | snake_case | same |
| `WsClientMessage::Announce` | `type: "announce"` | same |

- [ ] Single `src/types/tracker.ts` generated or copied from Rust doc comments
- [ ] Remove duplicate inline types in `onionShareService.ts` once centralized
