//! Local Axum share server + Tor onion mapping (uses existing `tor_manager`).

use std::path::PathBuf;

use anyhow::Context;
use tokio::net::TcpListener;
use tokio::sync::oneshot;
use uuid::Uuid;

use crate::core::p2p::tor_manager;

use super::http_routes;
use super::share::Share;
use super::share_state::OnionShareHostState;

pub const DEFAULT_CHUNK_SIZE: usize = 256 * 1024;

pub struct ShareHostHandle {
    pub state: OnionShareHostState,
    pub onion_addr: String,
    pub local_port: u16,
    stop_tx: oneshot::Sender<()>,
    server_task: tokio::task::JoinHandle<anyhow::Result<()>>,
}

impl ShareHostHandle {
    pub async fn start() -> anyhow::Result<Self> {
        tor_manager::start(tor_manager::StartConfig {
            bridge_support: true,
            socks_override: None,
            bridges: None,
        })
        .context("failed to start Tor for onion share")?;

        let listener = TcpListener::bind("127.0.0.1:0").await.context("bind failed")?;
        let local_addr = listener.local_addr()?;
        let local_port = local_addr.port();

        let app_state = OnionShareHostState::new();
        let router = http_routes::router(app_state.clone());

        let (shutdown_tx, shutdown_rx) = oneshot::channel::<()>();
        let server_task = tokio::spawn(async move {
            axum::serve(listener, router)
                .with_graceful_shutdown(async move {
                    let _ = shutdown_rx.await;
                })
                .await
                .map_err(|e| anyhow::anyhow!(e))
        });

        let onion_addr = tor_manager::create_hidden_service(local_port)
            .context("create_hidden_service failed — is Tor running?")?;

        Ok(Self {
            state: app_state,
            onion_addr,
            local_port,
            stop_tx: shutdown_tx,
            server_task,
        })
    }

    pub async fn add_file(&self, file_path: PathBuf) -> anyhow::Result<Share> {
        let share = Share::new(file_path, DEFAULT_CHUNK_SIZE)?;
        self.state.add_share(share.clone()).await;
        Ok(share)
    }

    pub async fn remove_file(&self, file_id: Uuid) {
        self.state.remove_share(file_id).await;
    }

    pub fn link_for(&self, share: &Share) -> super::link::ShareLink {
        super::link::ShareLink {
            onion: self.onion_addr.clone(),
            file_id: share.file_id,
            key: share.key,
        }
    }

    pub async fn stop(self) {
        let _ = self.stop_tx.send(());
        let _ = self.server_task.await;
    }
}
