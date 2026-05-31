// Derived from onion-poc (MIT): POC-Tracker-Onion-Share/src/server/mod.rs
pub mod routes;
pub mod state;

use std::path::PathBuf;
use std::time::Duration;

use anyhow::Context;
use axum::Router;
use tokio::io::AsyncWriteExt;
use tokio::net::TcpListener;
use tokio::sync::{oneshot, watch};
use tracing::{info, warn};

use super::link::ShareLink;
use super::share::Share;
use super::tor::{TorControl, TorProcess, TorStartOptions};
use state::AppState;

#[derive(Clone, Default)]
pub struct ShareServerStartOptions {
    pub bridges: Vec<String>,
    pub progress_tx: Option<watch::Sender<u8>>,
    /// Reuse a previously successful overlay data dir when set.
    pub preferred_data_dir: Option<PathBuf>,
}

pub struct ShareServerHandle {
    pub state: AppState,
    pub onion_addr: String,
    pub local_port: u16,
    stop_tx: oneshot::Sender<()>,
    server_task: tokio::task::JoinHandle<anyhow::Result<()>>,
    tor_proc: TorProcess,
    tor_ctl: TorControl,
    service_id: String,
}

impl ShareServerHandle {
    pub async fn start(tor_path: &str, opts: ShareServerStartOptions) -> anyhow::Result<Self> {
        let default_dir = TorProcess::default_overlay_dir()?;
        let attempt1_dir = opts
            .preferred_data_dir
            .clone()
            .filter(|p| p.exists())
            .unwrap_or_else(|| default_dir.clone());
        let warm = TorProcess::dir_has_cache(&attempt1_dir);
        let first_timeout = if warm {
            Duration::from_secs(90)
        } else {
            Duration::from_secs(120)
        };
        let attempt1_override = if attempt1_dir != default_dir {
            Some(attempt1_dir)
        } else {
            None
        };

        // Attempt 1: preferred or default dir
        match Self::start_once(tor_path, first_timeout, attempt1_override, opts.clone()).await {
            Ok(handle) => return Ok(handle),
            Err(e) => {
                let msg = e.to_string();
                if !msg.contains("bootstrap timeout") {
                    return Err(e);
                }
                warn!("Tor bootstrap attempt 1 timed out ({first_timeout:?})");
            }
        }

        // Attempt 2: best-effort reset default dir, then retry if reset succeeded
        warn!("Tor bootstrap timed out; resetting overlay data dir and retrying…");
        let reset = TorProcess::reset_data_dir().await;
        if reset.cleared || reset.fallback_renamed {
            match Self::start_once(tor_path, Duration::from_secs(180), None, opts.clone()).await {
                Ok(handle) => return Ok(handle),
                Err(e) => {
                    let msg = e.to_string();
                    if !msg.contains("bootstrap timeout") {
                        return Err(e);
                    }
                    warn!("Tor bootstrap attempt 2 timed out (180s)");
                }
            }
        } else {
            warn!(
                "Skipping attempt 2 — overlay dir locked at {}; using fresh data dir",
                reset.path.display()
            );
        }

        // Attempt 3: fresh UUID data dir
        let fresh = TorProcess::fresh_overlay_dir()?;
        warn!(
            "Tor bootstrap attempt 3 using fresh data dir: {}",
            fresh.display()
        );
        Self::start_once(
            tor_path,
            Duration::from_secs(180),
            Some(fresh),
            opts,
        )
        .await
    }

    pub fn tor_data_dir(&self) -> PathBuf {
        self.tor_proc.data_dir().to_path_buf()
    }

    async fn start_once(
        tor_path: &str,
        bootstrap_timeout: Duration,
        data_dir_override: Option<PathBuf>,
        opts: ShareServerStartOptions,
    ) -> anyhow::Result<Self> {
        let listener = TcpListener::bind("127.0.0.1:0")
            .await
            .context("bind failed")?;
        let local_addr = listener.local_addr()?;
        let local_port = local_addr.port();

        let app_state = AppState::new();
        let app: Router = routes::router(app_state.clone());

        let (shutdown_tx, shutdown_rx) = oneshot::channel::<()>();
        let server_task = tokio::spawn(async move {
            axum::serve(listener, app)
                .with_graceful_shutdown(async move {
                    let _ = shutdown_rx.await;
                })
                .await
                .map_err(|e| anyhow::anyhow!(e))
        });

        let tor_opts = TorStartOptions {
            data_dir_override,
            bridges: opts.bridges,
            progress_tx: opts.progress_tx.clone(),
        };

        let mut tor = match TorProcess::start(tor_path, tor_opts).await {
            Ok(t) => t,
            Err(e) => {
                let _ = shutdown_tx.send(());
                return Err(e);
            }
        };

        if let Err(e) = tor
            .wait_bootstrap(bootstrap_timeout, opts.progress_tx)
            .await
        {
            let _ = tor.kill().await;
            let _ = shutdown_tx.send(());
            let _ = server_task.await;
            return Err(e);
        }

        let mut ctl = match TorControl::connect(tor.control_addr(), tor.cookie_path()).await {
            Ok(c) => c,
            Err(e) => {
                let _ = tor.kill().await;
                let _ = shutdown_tx.send(());
                let _ = server_task.await;
                return Err(e);
            }
        };

        let service_id = match ctl.add_onion(local_port).await {
            Ok(id) => id,
            Err(e) => {
                let _ = tor.kill().await;
                let _ = shutdown_tx.send(());
                let _ = server_task.await;
                return Err(e);
            }
        };
        let onion_addr = format!("{}.onion", service_id);

        info!("Onion service ready: {}", onion_addr);

        Ok(Self {
            state: app_state,
            onion_addr,
            local_port,
            stop_tx: shutdown_tx,
            server_task,
            tor_proc: tor,
            tor_ctl: ctl,
            service_id,
        })
    }

    pub async fn add_file(
        &self,
        file_path: PathBuf,
        chunk_size: usize,
    ) -> anyhow::Result<Share> {
        let share = Share::new(file_path, chunk_size)?;
        self.state.add_share(share.clone()).await;
        Ok(share)
    }

    pub async fn remove_file(&self, file_id: uuid::Uuid) {
        self.state.remove_share(file_id).await;
    }

    pub fn link_for(&self, share: &Share) -> String {
        ShareLink {
            onion: self.onion_addr.clone(),
            file_id: share.file_id,
            key: share.key,
        }
        .to_string()
    }

    pub fn online_rx(&self) -> watch::Receiver<usize> {
        self.state.online_rx.clone()
    }

    pub fn socks_addr(&self) -> String {
        self.tor_proc.socks_addr()
    }

    pub async fn stop(mut self) {
        let _ = self.tor_ctl.del_onion(&self.service_id).await;
        let _ = self.stop_tx.send(());
        let _ = self.server_task.await;
        let _ = self.tor_proc.kill().await;
    }
}

pub async fn run_join_client(
    link: ShareLink,
    out_dir: PathBuf,
    tor_path: String,
) -> anyhow::Result<()> {
    tokio::fs::create_dir_all(&out_dir)
        .await
        .context("failed to create --out dir")?;

    let mut tor = TorProcess::start(&tor_path, TorStartOptions::default()).await?;
    tor.wait_bootstrap(Duration::from_secs(90), None).await?;

    let socks = tor.socks_addr();
    let proxy =
        reqwest::Proxy::all(format!("socks5h://{}", socks)).context("invalid socks proxy")?;
    let client = reqwest::Client::builder()
        .proxy(proxy)
        .build()
        .context("reqwest build failed")?;

    let base = format!("http://{}/s/{}", link.onion, link.file_id);

    let manifest: routes::Manifest = client
        .get(format!("{}/manifest", base))
        .send()
        .await
        .context("manifest request failed")?
        .error_for_status()?
        .json()
        .await?;

    let reg: routes::RegisterResponse = client
        .post(format!("{}/register", base))
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;

    let session_id = reg.session_id;

    let ping_client = client.clone();
    let ping_url = format!("{}/ping", base);
    let ping_task = tokio::spawn(async move {
        loop {
            let _ = ping_client
                .post(&ping_url)
                .json(&routes::PingRequest { session_id })
                .send()
                .await;
            tokio::time::sleep(Duration::from_secs(2)).await;
        }
    });

    let presence_client = client.clone();
    let presence_url = format!("{}/presence", base);
    let presence_task = tokio::spawn(async move {
        loop {
            if let Ok(r) = presence_client.get(&presence_url).send().await {
                if let Ok(r) = r.error_for_status() {
                    if let Ok(_p) = r.json::<routes::PresenceResponse>().await {
                        // presence count available if needed for logging
                    }
                }
            }
            tokio::time::sleep(Duration::from_secs(1)).await;
        }
    });

    let out_path = out_dir.join(&manifest.file_name);
    let mut out_file = tokio::fs::File::create(&out_path)
        .await
        .context("failed to create output file")?;

    for idx in 0..manifest.total_chunks {
        let ct = client
            .get(format!("{}/chunk/{}", base, idx))
            .send()
            .await
            .with_context(|| format!("chunk {} request failed", idx))?
            .error_for_status()?
            .bytes()
            .await?;

        let pt = super::crypto::decrypt_chunk(&link.key, link.file_id, idx, &ct)?;
        out_file.write_all(&pt).await?;
    }

    out_file.flush().await?;
    ping_task.abort();
    presence_task.abort();
    let _ = tor.kill().await;
    Ok(())
}
