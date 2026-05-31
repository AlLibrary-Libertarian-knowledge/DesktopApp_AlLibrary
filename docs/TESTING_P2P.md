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

1. Com ficheiro no lobby, clicar **Download** (Global Acervo) ou corrigir fluxo em Search Network
2. Pasta destino: first-run / `settingsService.getDownloadFolder()`
3. Progresso: `downloadManager` (percentagem simulada até evento final)
4. Sucesso: evento `onion-share-fetch-done`, badge “Saved”

**Mesma máquina:** evitar descarregar link do **próprio** `.onion` (guard no Global Acervo).

**Dois PCs:** dois clientes, tracker acessível (localhost ou `.onion`), cada um partilha ficheiros diferentes.

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
