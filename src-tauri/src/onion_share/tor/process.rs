// Derived from onion-poc (MIT): POC-Tracker-Onion-Share/src/tor/process.rs
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use anyhow::Context;
use directories::ProjectDirs;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::watch;
use tracing::{info, warn};

use super::TorControl;
use super::super::platform::hide_console_async;

#[derive(Debug, Clone, Default)]
pub struct TorStartOptions {
    pub data_dir_override: Option<PathBuf>,
    pub bridges: Vec<String>,
    pub progress_tx: Option<watch::Sender<u8>>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ResetOutcome {
    pub path: PathBuf,
    pub cleared: bool,
    pub fallback_renamed: bool,
}

#[derive(Debug)]
pub struct TorProcess {
    data_dir: PathBuf,
    socks_port: u16,
    control_port: u16,
    child: Child,
    boot_rx: watch::Receiver<bool>,
}

const TOR_PID_FILE: &str = "allibrary-tor.pid";

impl TorProcess {
    pub fn pid_file_path(dir: &Path) -> PathBuf {
        dir.join(TOR_PID_FILE)
    }

    async fn write_pid_file(dir: &Path, pid: u32) {
        let _ = tokio::fs::write(Self::pid_file_path(dir), pid.to_string()).await;
    }

    async fn remove_pid_file(dir: &Path) {
        let _ = tokio::fs::remove_file(Self::pid_file_path(dir)).await;
    }

    /// Kill stale Tor from a prior crashed session and release overlay locks (Windows-safe).
    pub async fn cleanup_stale_tor_for_dir(dir: &Path) {
        Self::preflight_cleanup_for(dir).await;
        if let Ok(content) = tokio::fs::read_to_string(Self::pid_file_path(dir)).await {
            if let Ok(pid) = content.trim().parse::<u32>() {
                if pid > 0 {
                    info!("Cleaning stale Tor process (pid={pid}) for {}", dir.display());
                    #[cfg(windows)]
                    Self::force_kill_windows(pid).await;
                    #[cfg(not(windows))]
                    {
                        let _ = Command::new("kill")
                            .args(["-9", &pid.to_string()])
                            .status()
                            .await;
                    }
                }
            }
        }
        Self::release_data_dir(dir).await;
        Self::remove_pid_file(dir).await;
    }

    /// Called before bootstrap: release default + persisted overlay dirs.
    pub async fn cleanup_stale_tor_on_startup() {
        if let Ok(dir) = tor_overlay_dir() {
            Self::cleanup_stale_tor_for_dir(&dir).await;
        }
        let cfg = super::super::config::AppConfig::load();
        if let Some(ref saved) = cfg.tor_overlay_data_dir {
            let path = PathBuf::from(saved);
            if path.exists() {
                if let Ok(default) = tor_overlay_dir() {
                    if path != default {
                        Self::cleanup_stale_tor_for_dir(&path).await;
                    }
                } else {
                    Self::cleanup_stale_tor_for_dir(&path).await;
                }
            }
        }
    }

    /// Default overlay data dir: `%LOCALAPPDATA%/tcc/onion_poc/data/tor-overlay-data`.
    pub fn default_overlay_dir() -> anyhow::Result<PathBuf> {
        tor_overlay_dir()
    }

    /// Fresh UUID-based dir when default cannot be cleared.
    pub fn fresh_overlay_dir() -> anyhow::Result<PathBuf> {
        let base = tor_overlay_base()?;
        Ok(base.join(format!("tor-overlay-data-{}", uuid::Uuid::new_v4())))
    }

    pub fn resolve_data_dir(override_dir: Option<PathBuf>) -> anyhow::Result<PathBuf> {
        override_dir.map(Ok).unwrap_or_else(TorProcess::default_overlay_dir)
    }

    /// True when dir exists and has Tor cache artifacts (warm start).
    pub fn dir_has_cache(dir: &Path) -> bool {
        dir.join("cached-microdesc-consensus").exists()
            || dir.join("cached-certs").exists()
            || dir.join("state").exists()
    }

    /// Remove stale lock files before spawning Tor.
    pub async fn preflight_cleanup_for(dir: &Path) {
        let lock_file = dir.join("lock");
        if lock_file.exists() {
            let _ = tokio::fs::remove_file(&lock_file).await;
        }
    }

    pub async fn preflight_cleanup() {
        if let Ok(dir) = tor_overlay_dir() {
            Self::preflight_cleanup_for(&dir).await;
        }
    }

    /// Wipe overlay data dir (best-effort; rename fallback on Windows lock failures).
    pub async fn reset_data_dir() -> ResetOutcome {
        let dir = match tor_overlay_dir() {
            Ok(d) => d,
            Err(e) => {
                warn!("reset_data_dir: no overlay path: {e}");
                return ResetOutcome {
                    path: PathBuf::new(),
                    cleared: false,
                    fallback_renamed: false,
                };
            }
        };
        Self::reset_dir_at(&dir).await
    }

    pub async fn reset_dir_at(dir: &Path) -> ResetOutcome {
        if !dir.exists() {
            if let Err(e) = tokio::fs::create_dir_all(dir).await {
                warn!("reset_dir_at: create failed {}: {e}", dir.display());
            }
            return ResetOutcome {
                path: dir.to_path_buf(),
                cleared: true,
                fallback_renamed: false,
            };
        }

        Self::release_data_dir(dir).await;

        const RESET_BACKOFF_MS: [u64; 4] = [500, 1000, 2000, 3000];

        for attempt in 0..5u32 {
            match tokio::fs::remove_dir_all(dir).await {
                Ok(()) => {
                    if let Err(e) = tokio::fs::create_dir_all(dir).await {
                        warn!("reset_dir_at: recreate failed {}: {e}", dir.display());
                    } else {
                        info!("Tor overlay data directory reset: {}", dir.display());
                    }
                    return ResetOutcome {
                        path: dir.to_path_buf(),
                        cleared: true,
                        fallback_renamed: false,
                    };
                }
                Err(e) if attempt < 4 => {
                    tracing::debug!(
                        "reset_dir_at attempt {} failed for {}: {e}",
                        attempt + 1,
                        dir.display()
                    );
                    let ms = RESET_BACKOFF_MS
                        .get(attempt as usize)
                        .copied()
                        .unwrap_or(5000);
                    tokio::time::sleep(Duration::from_millis(ms)).await;
                }
                Err(e) => {
                    warn!(
                        "reset_dir_at: delete failed after retries for {}: {e}; renaming",
                        dir.display()
                    );
                    break;
                }
            }
        }

        let epoch = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);
        let bak = dir.with_file_name(format!(
            "{}.bak.{}",
            dir.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("tor-overlay-data"),
            epoch
        ));
        match tokio::fs::rename(dir, &bak).await {
            Ok(()) => {
                info!(
                    "Tor overlay dir renamed to {} (original locked)",
                    bak.display()
                );
                let _ = tokio::fs::create_dir_all(dir).await;
                ResetOutcome {
                    path: dir.to_path_buf(),
                    cleared: false,
                    fallback_renamed: true,
                }
            }
            Err(e) => {
                warn!(
                    "reset_dir_at: rename fallback failed for {}: {e}",
                    dir.display()
                );
                ResetOutcome {
                    path: dir.to_path_buf(),
                    cleared: false,
                    fallback_renamed: false,
                }
            }
        }
    }

    pub async fn start(tor_path: &str, opts: TorStartOptions) -> anyhow::Result<Self> {
        let data_dir = Self::resolve_data_dir(opts.data_dir_override)?;
        Self::preflight_cleanup_for(&data_dir).await;

        let (socks_port, control_port) = (free_port().await?, free_port().await?);

        tokio::fs::create_dir_all(&data_dir)
            .await
            .context("create tor data_dir failed")?;

        let mut cmd = Command::new(tor_path);
        hide_console_async(&mut cmd);
        cmd.arg("--SocksPort")
            .arg(format!("127.0.0.1:{}", socks_port))
            .arg("--ControlPort")
            .arg(format!("127.0.0.1:{}", control_port))
            .arg("--CookieAuthentication")
            .arg("1")
            .arg("--DataDirectory")
            .arg(&data_dir)
            .arg("--Log")
            .arg("info stdout")
            .arg("--ConnectionPadding")
            .arg("1")
            .arg("--ReducedConnectionPadding")
            .arg("0")
            .arg("--CircuitBuildTimeout")
            .arg("120")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        if !opts.bridges.is_empty() {
            cmd.arg("--UseBridges").arg("1");
            for bridge in &opts.bridges {
                let b = bridge.trim();
                if !b.is_empty() {
                    cmd.arg("--Bridge").arg(b);
                }
            }
        }

        let mut child = cmd
            .spawn()
            .with_context(|| format!("failed to spawn tor: {}", tor_path))?;

        if let Some(pid) = child.id() {
            Self::write_pid_file(&data_dir, pid).await;
        }

        let stdout = child.stdout.take().context("tor stdout unavailable")?;
        let stderr = child.stderr.take().context("tor stderr unavailable")?;

        let (boot_tx, boot_rx) = watch::channel(false);

        let boot_tx2 = boot_tx.clone();
        tokio::spawn(async move {
            let mut lines = BufReader::new(stdout).lines();
            while let Ok(Some(line)) = lines.next_line().await {
                if line.contains("Bootstrapped 100%") {
                    let _ = boot_tx2.send(true);
                }
            }
        });

        let boot_tx3 = boot_tx.clone();
        tokio::spawn(async move {
            let mut lines = BufReader::new(stderr).lines();
            while let Ok(Some(line)) = lines.next_line().await {
                if line.contains("Bootstrapped 100%") {
                    let _ = boot_tx3.send(true);
                } else if !line.trim().is_empty() {
                    warn!("tor: {}", line);
                }
            }
        });

        Ok(Self {
            data_dir,
            socks_port,
            control_port,
            child,
            boot_rx,
        })
    }

    pub fn socks_addr(&self) -> String {
        format!("127.0.0.1:{}", self.socks_port)
    }

    pub fn control_addr(&self) -> String {
        format!("127.0.0.1:{}", self.control_port)
    }

    pub fn cookie_path(&self) -> PathBuf {
        self.data_dir.join("control_auth_cookie")
    }

    pub fn data_dir(&self) -> &Path {
        &self.data_dir
    }

    /// Best-effort wait for overlay dir handles to release (after kill or before reset).
    pub async fn release_data_dir(dir: &Path) {
        Self::preflight_cleanup_for(dir).await;
        let delay = if cfg!(windows) {
            Duration::from_millis(4000)
        } else {
            Duration::from_millis(800)
        };
        tokio::time::sleep(delay).await;
    }

    async fn terminate_child(child: &mut Child) {
        let pid = child.id();
        let _ = child.kill().await;
        match tokio::time::timeout(Duration::from_secs(5), child.wait()).await {
            Ok(Ok(_)) => {}
            Ok(Err(e)) => warn!("tor wait after kill: {e}"),
            Err(_) => warn!("tor wait after kill timed out (5s)"),
        }
        #[cfg(windows)]
        if let Some(pid) = pid {
            Self::force_kill_windows(pid).await;
        }
    }

    #[cfg(windows)]
    async fn force_kill_windows(pid: u32) {
        let mut cmd = Command::new("taskkill");
        hide_console_async(&mut cmd);
        match cmd
            .args(["/F", "/PID", &pid.to_string()])
            .status()
            .await
        {
            Ok(status) if status.success() => {
                info!("Force-terminated tor process (pid={pid})");
            }
            Ok(status) => {
                warn!("taskkill /F /PID {pid} exited with {status}");
            }
            Err(e) => warn!("taskkill /F /PID {pid} failed: {e}"),
        }
    }

    pub async fn wait_bootstrap(
        &mut self,
        timeout: Duration,
        progress_tx: Option<watch::Sender<u8>>,
    ) -> anyhow::Result<()> {
        let cookie = self.cookie_path();
        let control_addr = self.control_addr();

        let t0 = tokio::time::Instant::now();
        let mut last_reported: u8 = 0;
        loop {
            if cookie.exists() {
                if *self.boot_rx.borrow() {
                    if let Some(ref tx) = progress_tx {
                        let _ = tx.send(100);
                    }
                    info!(
                        "Tor ready (socks={}, control={})",
                        self.socks_port, self.control_port
                    );
                    return Ok(());
                }
                if let Ok(mut ctl) =
                    TorControl::connect(control_addr.clone(), cookie.clone()).await
                {
                    let pct = ctl.bootstrap_progress().await.unwrap_or(0).min(100) as u8;
                    if pct >= 100 {
                        if let Some(ref tx) = progress_tx {
                            let _ = tx.send(100);
                        }
                        info!(
                            "Tor ready via control port (socks={}, control={})",
                            self.socks_port, self.control_port
                        );
                        return Ok(());
                    }
                    if pct > last_reported {
                        last_reported = pct;
                        if let Some(ref tx) = progress_tx {
                            let _ = tx.send(pct);
                        }
                    }
                }
            }
            if t0.elapsed() > timeout {
                let _ = self.kill().await;
                anyhow::bail!(
                    "Tor bootstrap timeout ({}s). The system will attempt a deep reset on next retry.",
                    timeout.as_secs()
                );
            }
            tokio::time::sleep(Duration::from_millis(250)).await;
        }
    }

    #[allow(dead_code)]
    pub async fn wait(&mut self) -> anyhow::Result<std::process::ExitStatus> {
        let status = self.child.wait().await.context("wait tor failed")?;
        Ok(status)
    }

    pub async fn kill(&mut self) -> anyhow::Result<()> {
        Self::terminate_child(&mut self.child).await;
        Self::remove_pid_file(&self.data_dir).await;
        Self::release_data_dir(&self.data_dir).await;
        Ok(())
    }
}

fn tor_overlay_base() -> anyhow::Result<PathBuf> {
    let proj = ProjectDirs::from("br", "tcc", "onion_poc").context("ProjectDirs unavailable")?;
    Ok(proj.data_local_dir().to_path_buf())
}

fn tor_overlay_dir() -> anyhow::Result<PathBuf> {
    Ok(tor_overlay_base()?.join("tor-overlay-data"))
}

async fn free_port() -> anyhow::Result<u16> {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await?;
    Ok(listener.local_addr()?.port())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolve_data_dir_uses_override() {
        let custom = PathBuf::from("/tmp/custom-tor");
        let resolved = TorProcess::resolve_data_dir(Some(custom.clone())).unwrap();
        assert_eq!(resolved, custom);
    }

    #[tokio::test]
    async fn reset_dir_at_creates_missing_dir() {
        let base = std::env::temp_dir().join(format!("tor-reset-test-{}", uuid::Uuid::new_v4()));
        let outcome = TorProcess::reset_dir_at(&base).await;
        assert!(outcome.cleared);
        assert!(base.exists());
        let _ = tokio::fs::remove_dir_all(&base).await;
    }

    #[tokio::test]
    async fn reset_dir_at_clears_existing() {
        let base = std::env::temp_dir().join(format!("tor-reset-test-{}", uuid::Uuid::new_v4()));
        tokio::fs::create_dir_all(&base).await.unwrap();
        tokio::fs::write(base.join("lock"), b"x").await.unwrap();
        let outcome = TorProcess::reset_dir_at(&base).await;
        assert!(outcome.cleared);
        assert!(!base.join("lock").exists());
        let _ = tokio::fs::remove_dir_all(&base).await;
    }
}
