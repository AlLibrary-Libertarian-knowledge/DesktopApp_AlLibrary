# Mapeamento de ficheiros — rede P2P (estado atual)

Onde vive cada peça do stack **onion-share + tracker**, e o que ainda é POC ou mock.

---

## Repositórios

| Repo / pasta | Conteúdo |
|--------------|----------|
| `DesktopApp_AlLibrary/` | Cliente Tauri + UI |
| `TrackerRust_AlLibrary/` | Servidor tracker (`allibrary-tracker` 0.7.4) — **canónico** |
| `DesktopApp_AlLibrary/deploy/` | Docker tracker **legado** (duplicata); preferir repo standalone |

---

## Rust — cliente (`src-tauri/`)

| Caminho | Função |
|---------|--------|
| `src/onion_share/mod.rs` | Módulo onion-share |
| `src/onion_share/server.rs` | Servidor HTTP de ficheiros + hidden service |
| `src/onion_share/tracker_client.rs` | HTTP announce, WS loop, pull `/lobby` |
| `src/onion_share/tracker_proto.rs` | `AnnouncedFile`, `NetworkLobby`, mensagens WS |
| `src/onion_share/config.rs` | `tracker_url`, `node_id`, `share_publicly` |
| `src/onion_share/fetch.rs` | Download via SOCKS para peer `.onion` |
| `src/commands/onion_bridge.rs` | Comandos Tauri expostos à UI |
| `src/bin/tracker.rs` | Servidor tracker embarcado (dev/duplicata) |
| `src/commands/collections.rs` | SQLite coleções em `{documents}/allibrary.db` |
| `src/commands/network_shell.rs` | Kademlia/libp2p — **legado**, fora da UI principal |

Comandos onion registrados em `lib.rs`: `bootstrap_onion_overlay`, `onion_share_*`, `tracker_*`, `onion_share_fetch`.

---

## TypeScript — serviços (`src/services/network/`)

| Ficheiro | Função | Notas |
|----------|--------|-------|
| `onionShareService.ts` | `invoke` + tipos `NetworkLobby` | Ponte oficial |
| `downloadManager.ts` | Fila downloads, progresso simulado 10–90%, evento `onion-share-fetch-done` | Histórico em `localStorage` (migrar SQLite) |
| `p2pNetworkService.ts` | Facade: `searchNetwork` = filtrar lobby; `discoverPeers` = peers do lobby | Muitos métodos no-op |
| `torAdapter.ts` | Status = onion share a correr | Não control plane Tor completo |
| `bootstrap.ts` | `enableTorAndP2P` para algumas páginas | |

Persistência projeto: `src/services/storage/settingsService.ts` (localStorage + `save_app_settings`).

---

## UI — telas

| Rota | Ficheiro | Integração real |
|------|----------|-----------------|
| `/transfers` | `pages/PeerTransfers/` | Shares + downloads **sim**; gráficos **mock**; painel **Onion mesh (live)** POC |
| `/acervo` | `pages/GlobalAcervo/` | Lobby + download **sim** — **POC a apagar** |
| `/search-network` | `pages/SearchNetwork/` | Busca lobby **sim**; download resultado **quebrado** |
| `/connection-manager` | `pages/ConnectionManager/` | `tracker_url` **sim** |
| `/peers` | `pages/Peers/PeerNetworkPage.tsx` | Lista **mock** |
| `/` | `pages/Home/` | Stats parciais; atividades **mock** |

Componentes transversais:

| Ficheiro | Função |
|----------|--------|
| `components/layout/Sidebar.tsx` | Poll lobby 15s, disco via `get_disk_space_info` |
| `components/composite/FirstRunWizard/` | Pasta projeto |
| `App.tsx` | Bootstrap onion + restore shares (`localStorage`) |

---

## Protocolo (espelho tracker ↔ cliente)

Definido em:

- `TrackerRust_AlLibrary/src/protocol.rs`
- `src-tauri/src/onion_share/tracker_proto.rs`

Documentação: [TRACKER_SERVER.md](./TRACKER_SERVER.md), `TrackerRust_AlLibrary/docs/FUNCIONAMENTO_INTERNO.md`.

---

## Plano de consolidação

[integration/](./integration/) — facades, SQLite cache, remoção Global Acervo / Onion mesh panel.

Não duplicar lógica de lobby em novas páginas; consumir serviço unificado quando existir.
