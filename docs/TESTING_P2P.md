# Testar P2P localmente

Procedimento manual antes de push/release. Requer **Docker** para o tracker.

---

## 1. Subir o tracker

**Recomendado** (repo standalone):

```bash
cd TrackerRust_AlLibrary
docker compose up -d --build
curl -s http://127.0.0.1:8080/debug/nodes
```

Alternativa legada: `DesktopApp_AlLibrary/deploy/` (mesmos comandos).

---

## 2. Configurar o cliente

1. Abrir app: `pnpm dev`
2. **Configurations** → `/connection-manager`
3. **Tracker URL:** `http://127.0.0.1:8080`
4. Guardar ( `tracker_set_config` )
5. Opcional: `try_local_tracker_fallback` já ajuda quando `.onion` falha no mesmo PC

Para Tor real: usar hostname `.onion` do passo abaixo e Tor activo no cliente.

```bash
docker compose exec tor_service cat /var/lib/tor/hidden_service/hostname
# URL: http://{hostname}.onion  (sem :8080)
```

---

## 3. Partilhar ficheiros

**Sharing & downloads** (`/transfers`):

1. Confirmar onion activo (sidebar: “Onion” / status no header da página)
2. **Share Multiple** ou painel POC “Onion mesh” → pick files → `onion_share_add_file`
3. Tabela outbound deve listar shares reais (`onionShareListLocal`)

Persistência actual: `localStorage` `allibrary_shared_paths` + re-announce no boot (`App.tsx`).

---

## 4. Ver lobby

Qualquer um:

```bash
curl -s http://127.0.0.1:8080/lobby | jq
```

UI:

- **Global Acervo** `/acervo` (POC) — lista automática
- **Search Network** `/search-network` — pesquisa / query vazia

Alvo pós-integração: só Search Network + cache SQLite.

---

## 5. Testar download

### Fluxo UI unificado (Search Network + Sharing & downloads)

**Golden path (optimistic queue):**

1. **Seeder (PC A):** Sharing & downloads → **Sharing** tab → Add files → confirm outbound table + lobby com `peer_count ≥ 1`
2. **Downloader (PC B):** Search Network → **Download** num resultado
   - Dentro de **1 s**: toast *Added to downloads* com acção **View queue**
   - Fila compacta visível na própria página Search Network (status **Queued** / **Connecting…**)
   - Pill no header: `↓ N downloading` → clique abre `/transfers`
   - Badge no sidebar em **Sharing & downloads** enquanto houver downloads activos
3. Em **Sharing & downloads** → tab **Downloads**: progresso actualiza; ao concluir: **Open** e **Folder** (Windows)
4. Falha: motivo visível + botão **Retry**
5. **Home → Downloads tab**: fila compacta (últimos 5 activos + 5 concluídos) + **Open full queue**
6. Downloads usam **swarm-first** (`opocswarm://` via `resolve_download_link`) quando há vários peers
7. **Download All** não bloqueia a UI — cada ficheiro entra na fila imediatamente

### Comportamento esperado

- Pasta destino: first-run / `settingsService.getDownloadFolder()`
- Progresso: `downloadManager` (queued → resolving → active) + eventos `transfer-progress` / `onion-share-fetch-done`
- Sem peers online: botão Download desactivado ou erro imediato *No online peers are seeding this file* (não hang silencioso)
- Colar hash/link: modal **Add download** em `/transfers` (tab Downloads) mostra peer count antes de **Add to queue**

**Mesma máquina:** evitar descarregar link do **próprio** `.onion` (guard em `transferFacade.downloadLink`).

**Dois PCs:** dois clientes, tracker acessível (localhost ou `.onion`), cada um partilha ficheiros diferentes — o downloader deve resolver swarm link, não só o primeiro peer directo.

### Checklist dois nós

| Passo | PC A (seeder) | PC B (downloader) |
|-------|---------------|-------------------|
| Onion activo | ✓ | ✓ |
| Ficheiro no lobby | ✓ | — |
| Search Network vê ficheiro | — | ✓ |
| Download + toast | — | ✓ |
| Progresso em `/transfers` | — | ✓ |
| Parar seeder | peer_count → 0 | Download desactivado / erro rápido |

---

## 6. Diagnóstico

| Sintoma | Verificar |
|---------|-----------|
| 0 nodes online | Tracker up? URL correcta? WS/announce nos logs Rust |
| Download falha | `onion_share_status`, pasta downloads existe, logs `onion_share_fetch` |
| Lobby vazio | `share_publicly` true? ficheiros em `onion_share_list_local`? |
| `.onion` tracker falha | Fallback `127.0.0.1:8080` ou Tor bootstrap completo |

Logs: terminal `pnpm dev` + `RUST_LOG=info`.

Sync diagnostics: `tracker_get_last_sync_diag` (UI futura em Configurations).

---

## 7. E2E automatizado

Playwright **não** substitui este guia. Ver [E2E_TESTING_STRATEGY.md](./E2E_TESTING_STRATEGY.md) e `src-tauri/ONION_SHARE_MANUAL_E2E.md`.

---

## Dois nós no mesmo PC (smoke test)

1. Tracker Docker :8080
2. Uma instância dev do app (partilha ficheiro)
3. Segunda instância **não** é suportada out-of-box (mesmo `node_id`/Tor) — use outro PC ou VM para teste real de peer distinto.

Para smoke local basta: partilhar + ver lobby + download **de outro link** (outro ficheiro simulado noutro cliente quando disponível).
