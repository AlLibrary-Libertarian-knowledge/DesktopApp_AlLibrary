# Servidor tracker — protocolo e deploy

Coordenador de **presença** da rede AlLibrary. Não transfere ficheiros.

Implementação canónica: **`TrackerRust_AlLibrary`** (`allibrary-tracker` **v0.7.4**, Axum + Tokio).

Duplicatas no monorepo (evitar divergência):

- `DesktopApp_AlLibrary/src-tauri/src/bin/tracker.rs` — binário embarcado dev
- `DesktopApp_AlLibrary/deploy/` — Docker legado

---

## Responsabilidade

> Quais nós `.onion` estão online e que ficheiros anunciam?

- Estado **só em RAM** (sem DB no servidor)
- TTL ~30s sem re-announce; remoção imediata ao fechar WebSocket
- GC a cada 5s no loop background

---

## Endpoints

Base: `http://0.0.0.0:8080` (container) / `.onion:80` (hidden service)

| Método | Rota | Uso |
|--------|------|-----|
| `GET` | `/ws` | WebSocket — lobby push + `announce` |
| `POST` | `/announce` | Fallback HTTP (mesmo JSON que WS) |
| `GET` | `/lobby` | Snapshot `NetworkLobby` |
| `GET` | `/swarm/:content_hash` | Peers com esse hash |
| `GET` | `/debug/nodes` | Debug (sem auth — não expor publicamente) |

---

## Tipos JSON (snake_case)

### Cliente → servidor (`WsClientMessage`)

```json
{
  "type": "announce",
  "node_id": "uuid",
  "onion": "http://peer.onion",
  "files": [{
    "file_id": "uuid",
    "name": "doc.pdf",
    "size": 12345,
    "link": "http://peer.onion/...",
    "content_hash": "sha256..."
  }]
}
```

### Servidor → cliente (`WsServerMessage`)

```json
{
  "type": "lobby",
  "lobby": {
    "online_nodes": 2,
    "files": [{
      "name": "doc.pdf",
      "size": 12345,
      "link": "http://peer.onion/...",
      "content_hash": "sha256...",
      "peer_count": 1,
      "peers": [{ "node_id": "...", "onion": "...", "file_id": "...", "link": "..." }]
    }]
  }
}
```

Espelho no cliente: `src-tauri/src/onion_share/tracker_proto.rs`.

---

## WebSocket — comportamento real

1. Cliente conecta (`/ws`); servidor envia lobby actual.
2. Cliente envia `announce` (app re-envia ~5s no loop WS).
3. Qualquer mudança → broadcast `lobby` a todos os WS.
4. Disconnect → remove `node_id` e rebroadcast.

**Correcção vs. docs antigos:** o servidor **não** envia pings periódicos de 30s; liveness = re-announce + TTL + disconnect WS. Responde a `Ping` frames do cliente.

---

## Cliente desktop

| Peça | Ficheiro |
|------|----------|
| HTTP announce + retry | `tracker_client.rs` |
| WS loop | `run_tracker_ws_loop` |
| SOCKS WS para `.onion` | `tokio_socks` + `tokio-tungstenite` |
| Config | `config.rs` — `normalize_tracker_url` remove `:8080` em `.onion` |
| UI config | `/connection-manager` |

Comandos: `tracker_get_config`, `tracker_set_config`, `tracker_refresh_lobby`, `tracker_get_cached_lobby_cmd`, `tracker_start_ws_loop`, `tracker_get_last_sync_diag`.

---

## Deploy Docker

```bash
cd TrackerRust_AlLibrary
docker compose up -d --build
docker compose exec tor_service cat /var/lib/tor/hidden_service/hostname
```

- Serviço `tracker`: porta 8080
- `tor_service`: `network_mode: service:tracker`, `HiddenServicePort 80 → 127.0.0.1:8080`
- Volume **`tor_keys`** — backup obrigatório; sem ele gera novo `.onion`

Documentação interna: `TrackerRust_AlLibrary/docs/FUNCIONAMENTO_INTERNO.md`, `README.md`.

---

## Cache no cliente (planeado)

Tracker permanece efémero; cada **nó** guardará snapshot do lobby em SQLite — ver [integration/01-data-model-and-node-directory.md](./integration/01-data-model-and-node-directory.md).

---

## Debug rápido

```bash
docker compose exec tracker curl -s http://localhost:8080/debug/nodes
docker compose exec tracker curl -s http://localhost:8080/lobby
```
