# Manual E2E: M5 onion share + POC tracker

1. Run the POC tracker (Docker in `POC-Tracker-Onion-Share/deploy` or `cargo run --bin tracker` on `:8080`).
2. Set the tracker URL in the app: Network panel → Onion share (M5) → save (e.g. `http://127.0.0.1:8080` for local, or your `.onion` URL over Tor).
3. **Start share host** — wait for Tor; note the `.onion` shown.
4. **Add file** — pick a file; copy the `opoc://` link.
5. **Start tracker WS** (optional) or **Refresh lobby** — confirm the file appears in the lobby summary.
6. On a second machine (or second profile), paste the link into **Download** with an output directory, or use a swarm link after lobby lists multiple peers.

Interop: links and tracker JSON match `POC-Tracker-Onion-Share` (BLAKE3 + XChaCha chunk layout).
