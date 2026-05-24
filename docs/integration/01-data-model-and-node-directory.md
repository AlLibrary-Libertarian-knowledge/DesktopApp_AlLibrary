# Data Model & Node Directory

Each AlLibrary installation is a **node**. Its local state is the node's contribution to the distributed app: documents, collections, favorites, transfer history, and a **cache** of network-wide metadata from the tracker.

## Project directory (first run)

**Source of truth (frontend):** `FirstRunWizard` + `settingsService.saveProjectSetup` → `apply_project_paths`  
**Source of truth (backend):** `load_app_settings` / `apply_project_paths` → `settings.json` in Tauri app data dir, plus subfolders under `project.projectFolderPath`.

### Required layout

After first run (auto-created when `autoCreateSubfolders` is true):

```
{projectFolder}/                    # e.g. D:\AlLibrary
├── documents/                      # User library files
│   └── allibrary.db                # Primary SQLite (collections today; extend)
├── index/                          # Full-text / search index
├── metadata/                       # Sidecar metadata exports
├── cache/                          # Thumbnails, previews
├── backup/                         # Backup targets
├── cultural_contexts/
├── educational_resources/
├── community_content/
└── downloads/                      # Default network download target (configurable)
```

**Configuration folder (app-level, not project):**

```
{app_data_dir}/                     # Tauri app_data_dir
├── settings.json                   # Project path, theme, search, cultural prefs
└── tor_bundle/                     # Bundled Tor data (onion share)
```

**Onion-share config (today, separate from project DB):**

```
{config_dir}/onion_poc/config.json  # tracker_url, node_id, share_publicly (Rust AppConfig)
```

### Integration tasks — directory & config

- [x] **Unify path writes** — `settingsService` persists via `apply_project_paths` on first run and on folder change; localStorage is a read cache only.
- [x] **Single download folder** — Store `downloadFolderPath` in `settings.json`; default `{projectFolder}/downloads`. All network downloads use this unless overridden per transfer.
- [ ] **Move onion `AppConfig` under project or app_data** — Stop using orphan `onion_poc` namespace; store `tracker_url`, `node_id`, `share_publicly`, `try_local_tracker_fallback` next to `settings.json` or in SQLite `node_config` table.
- [x] **First-run creates downloads subfolder** — Rust `apply_project_paths` bootstraps `FolderStructure` plus `{project}/downloads`.
- [ ] **Expose folder paths in Configurations** — Project folder, download folder, read-only display of DB path (`documents/allibrary.db`).

## SQLite: one database per node

**Current:** `allibrary.db` under `{documentsFolder}` — collections CRUD only (`commands/collections.rs`).

**Target:** Same file becomes the node's operational database. Network cache tables are **replicas**, not authoritative over the tracker (tracker remains ephemeral in RAM on server).

### Proposed tables ( additions )

```sql
-- Node identity (one row)
CREATE TABLE node_config (
  node_id TEXT PRIMARY KEY,
  tracker_url TEXT NOT NULL,
  share_publicly INTEGER NOT NULL DEFAULT 1,
  try_local_tracker_fallback INTEGER NOT NULL DEFAULT 1,
  onion_address TEXT,
  updated_at TEXT NOT NULL
);

-- Cached tracker lobby (refreshed via HTTP/WS)
CREATE TABLE network_files (
  content_hash TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  size INTEGER NOT NULL,
  canonical_link TEXT,
  peer_count INTEGER NOT NULL DEFAULT 0,
  first_seen_at TEXT,
  last_seen_at TEXT NOT NULL
);

CREATE TABLE network_peers (
  node_id TEXT PRIMARY KEY,
  onion TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE TABLE network_file_peers (
  content_hash TEXT NOT NULL,
  node_id TEXT NOT NULL,
  file_id TEXT NOT NULL,
  link TEXT NOT NULL,
  PRIMARY KEY (content_hash, node_id, file_id),
  FOREIGN KEY (content_hash) REFERENCES network_files(content_hash),
  FOREIGN KEY (node_id) REFERENCES network_peers(node_id)
);

-- Transfers (replace localStorage in downloadManager)
CREATE TABLE transfers (
  id TEXT PRIMARY KEY,
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  link TEXT,
  local_path TEXT,
  name TEXT NOT NULL,
  size_bytes INTEGER,
  status TEXT NOT NULL,
  progress REAL NOT NULL DEFAULT 0,
  error TEXT,
  started_at TEXT NOT NULL,
  completed_at TEXT
);

-- Local shares (mirror onion share state)
CREATE TABLE local_shares (
  file_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  content_hash TEXT NOT NULL,
  link TEXT NOT NULL,
  disk_path TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Documents registry (link filesystem to app ids — future)
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL UNIQUE,
  content_hash TEXT,
  title TEXT,
  -- ... align with DocumentManagement / documentService
);

CREATE TABLE favorites (
  document_id TEXT PRIMARY KEY,
  favorited_at TEXT NOT NULL,
  FOREIGN KEY (document_id) REFERENCES documents(id)
);

CREATE TABLE activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  document_id TEXT,
  payload_json TEXT,
  created_at TEXT NOT NULL
);
```

### Sync rules

| Data | Authority | Node DB role |
|------|-----------|--------------|
| Files on disk | User filesystem | Index in `documents`, paths in `local_shares` |
| Who is online | Tracker (ephemeral) | Cache in `network_*`; TTL 30s aligned with tracker |
| Collections | Node | Already in SQLite |
| Transfer history | Node | `transfers` table |
| Favorites | Node | `favorites` (+ file reference) |

### Integration tasks — SQLite

- [ ] **Migration runner** — Extend `core/database/migrations.rs` for new tables; versioned migrations on app start.
- [ ] **Lobby sync command** — On `tracker_refresh_lobby` / WS lobby message: upsert `network_files`, `network_peers`, `network_file_peers`; prune stale by `last_seen_at`.
- [ ] **Query commands for UI** — `search_network_cached`, `list_network_files`, `get_network_file_by_hash`, `list_network_peers` reading SQLite (fast, works when Tor blips).
- [ ] **Persist transfers** — Rust owns transfer rows; emit events to frontend; remove `localStorage` `allibrary_completed_downloads`.
- [ ] **Mirror local shares** — On `onion_share_add_file` / `remove`, upsert/delete `local_shares`.
- [ ] **Favorites commands** — Implement `list_favorites`, `toggle_favorite`, `is_favorite` against SQLite (frontend already calls them).
- [ ] **Activity log** — Record view/download/share for Recent page.

## Mapping UI metrics to data

| UI (example: sidebar, Home) | Query |
|------------------------------|--------|
| Nodes online | `COUNT(*) FROM network_peers WHERE last_seen_at > cutoff` or live lobby |
| Documents on network | `COUNT(*) FROM network_files` |
| Storage bar | `get_disk_space_info` (already live) |
| Peers connected | Same as nodes online (tracker peers ≠ libp2p peers) |

## Anti-goals

- Do **not** treat node SQLite as a global source of truth for the whole network — tracker remains the live lobby; DB is cache + local library.
- Do **not** store file bytes in SQLite — only paths, hashes, metadata.
