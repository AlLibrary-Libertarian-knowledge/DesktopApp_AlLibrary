# Network Services Layer (TypeScript)

Single facade for all screens after POC retirement. **Do not** call tracker/onion commands ad hoc from pages—route through these modules.

---

## Module layout (target)

```
src/services/network/
├── networkFacade.ts      # Primary entry: lobby, peers, presence, sync
├── transferFacade.ts     # Downloads, shares, progress (wraps downloadManager)
├── onionShareService.ts  # Low-level Tauri invoke (keep)
├── downloadManager.ts    # In-memory active + events (keep; backend owns persistence)
├── p2pNetworkService.ts  # Slim adapter → networkFacade (deprecate fat interface)
└── torAdapter.ts         # Thin wrapper over onion presence (keep)
```

---

## `networkFacade.ts` (to create)

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
  listTransfers(): { active: TransferView[]; completed: TransferView[] };
  subscribeTransfers(listener: (active, completed) => void): () => void;
};
```

### Implementation notes

- [x] Wrap `onionShareService` + `downloadManager` + `settingsService.getDownloadFolder`
- [x] Self-download guard from Global Acervo → keep in `downloadLink`
- [ ] `PeerTransfers` and **Home** use only this module
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
| `getNetworkMetrics` | Until backend implements; return from transfer stats |

- [ ] Slim interface documented in this file
- [x] Update `useNetworkSearch`, `useP2PTransfers` to use facades
- [ ] Update `networkStore` to use facades

---

## `networkStore.ts` updates

- [ ] `refreshOnce()` calls `networkFacade.getLobby()` + `transferFacade` metrics
- [ ] `connectedPeers` = lobby `onlineNodes`
- [ ] `transfers` = transferFacade active inbound/outbound
- [ ] `downloadMbps` / `uploadMbps` from backend metrics when available

---

## Hooks mapping

| Hook | Should use |
|------|------------|
| `useNetworkSearch` | `networkFacade.searchFiles` + `transferFacade.downloadLink` |
| `useP2PTransfers` | `transferFacade` |
| `useNetworkPresenceResource` | `networkFacade.getPresence` |
| `useNetworkLobby` (new) | `networkFacade` with Solid resource |

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

- [ ] Track in [04-frontend-screen-tasks.md](./04-frontend-screen-tasks.md) Document Detail section

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
