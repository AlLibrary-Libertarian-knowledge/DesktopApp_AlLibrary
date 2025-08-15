use std::fs;
use std::io::{Read, Write};
use std::net::{SocketAddr, TcpListener, TcpStream, ToSocketAddrs};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;

static TOR_RUNTIME: Mutex<Option<TorRuntime>> = Mutex::new(None);

#[derive(Debug)]
pub struct TorRuntime {
    pub data_dir: PathBuf,
    pub torrc_path: PathBuf,
    pub control_port: u16,
    pub socks_port: u16,
    pub child: Option<Child>,
    pub hidden_services: Vec<String>,
}

#[derive(Debug)]
pub struct StartConfig {
    pub bridge_support: bool,
    pub socks_override: Option<String>,
    pub bridges: Option<Vec<String>>, // Optional bridges to configure at launch
}

#[derive(Debug)]
pub struct Status {
    pub bootstrapped: bool,
    pub circuit_established: bool,
    pub bridges_enabled: bool,
    pub socks: Option<String>,
    pub supports_control: bool,
}

fn pick_free_port() -> u16 {
    TcpListener::bind(("127.0.0.1", 0))
        .ok()
        .and_then(|l| l.local_addr().ok().map(|a| a.port()))
        .unwrap_or(0)
}

fn default_tor_path() -> String {
    // Expect tor in PATH by default
    "tor".to_string()
}

#[cfg(target_os = "windows")]
fn bundled_tor_candidate() -> PathBuf {
    // 1) Runtime resources next to the exe (packaged builds)
    let exe_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));
    let packaged = exe_dir.join("resources").join("tor").join("win64").join("tor.exe");
    if packaged.exists() { return packaged; }

    // 2) Dev path: <project>/src-tauri/resources/tor/win64/tor.exe
    if let Some(project_root) = exe_dir.parent().and_then(|p| p.parent()) {
        let dev = project_root.join("src-tauri").join("resources").join("tor").join("win64").join("tor.exe");
        if dev.exists() { return dev; }
    }

    // Fallback non-existing path returned; caller will handle
    exe_dir.join("resources").join("tor").join("win64").join("tor.exe")
}

#[cfg(not(target_os = "windows"))]
fn bundled_tor_candidate() -> PathBuf {
    let exe_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));
    let packaged = exe_dir.join("resources").join("tor").join("linux").join("tor");
    if packaged.exists() { return packaged; }
    if let Some(project_root) = exe_dir.parent().and_then(|p| p.parent()) {
        let dev = project_root.join("src-tauri").join("resources").join("tor").join("linux").join("tor");
        if dev.exists() { return dev; }
    }
    exe_dir.join("resources").join("tor").join("linux").join("tor")
}

fn can_connect(addr: &str, port: u16) -> bool {
    let sock: Vec<SocketAddr> = format!("{}:{}", addr, port)
        .to_socket_addrs()
        .ok()
        .map(|it| it.collect())
        .unwrap_or_default();
    for sa in sock {
        if TcpStream::connect_timeout(&sa, std::time::Duration::from_millis(150)).is_ok() {
            return true;
        }
    }
    false
}

fn app_data_dir() -> PathBuf {
    let mut base = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));
    base.push("tor-data");
    base
}

pub fn start(config: StartConfig) -> anyhow::Result<Status> {
    let mut guard = TOR_RUNTIME.lock().unwrap();
    if guard.is_some() {
        return Ok(status());
    }

    let data_dir = app_data_dir();
    fs::create_dir_all(&data_dir)?;

    // 1) If user gave an external SOCKS, use it and don't spawn Tor
    if let Some(s) = &config.socks_override {
        *guard = Some(TorRuntime {
            data_dir: data_dir.clone(),
            torrc_path: PathBuf::new(),
            control_port: 0,
            socks_port: s.split(':').last().and_then(|p| p.parse::<u16>().ok()).unwrap_or(9150),
            child: None,
            hidden_services: Vec::new(),
        });
        return Ok(Status { bootstrapped: true, circuit_established: true, bridges_enabled: false, socks: Some(s.clone()), supports_control: false });
    }

    // 2) Zero-install fallback: use Tor Browser SOCKS if available
    if can_connect("127.0.0.1", 9150) {
        *guard = Some(TorRuntime {
            data_dir: data_dir.clone(),
            torrc_path: PathBuf::new(),
            control_port: 0,
            socks_port: 9150,
            child: None,
            hidden_services: Vec::new(),
        });
        return Ok(Status { bootstrapped: true, circuit_established: true, bridges_enabled: false, socks: Some("127.0.0.1:9150".to_string()), supports_control: false });
    }

    // 3) Spawn bundled Tor (or PATH fallback)
    let control_port = pick_free_port();
    let socks_port = pick_free_port();
    let torrc_path = data_dir.join("torrc");
    let mut torrc = String::new();
    // Quote file system paths to safely handle spaces
    torrc.push_str(&format!("DataDirectory \"{}\"\n", data_dir.display()));
    torrc.push_str(&format!("ControlPort {}\n", control_port));
    torrc.push_str("CookieAuthentication 1\n");
    torrc.push_str(&format!("SocksPort {}\n", socks_port));
    if config.bridge_support {
        torrc.push_str("UseBridges 1\n");
        if let Some(list) = config.bridges.as_ref() {
            for b in list {
                if !b.trim().is_empty() {
                    torrc.push_str(&format!("Bridge {}\n", b.trim()));
                }
            }
        }
    }
    // Always enable notice-level logging to tor-data/tor.log for in-app viewer
    let log_path = data_dir.join("tor.log");
    torrc.push_str(&format!("Log notice file \"{}\"\n", log_path.display()));
    fs::write(&torrc_path, torrc)?;

    let tor_bin = std::env::var("TOR_BIN_PATH").ok().map(PathBuf::from).filter(|p| p.exists())
        .or_else(|| {
            let p = bundled_tor_candidate();
            if p.exists() { Some(p) } else { None }
        })
        .unwrap_or_else(|| PathBuf::from(default_tor_path()));

    let child = Command::new(&tor_bin)
        .arg("-f")
        .arg(&torrc_path)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| anyhow::anyhow!("failed to spawn tor at {}: {}", tor_bin.to_string_lossy(), e))?;

    *guard = Some(TorRuntime {
        data_dir: data_dir.clone(),
        torrc_path: torrc_path.clone(),
        control_port,
        socks_port,
        child: Some(child),
        hidden_services: Vec::new(),
    });

    // Attempt to verify bootstrap and circuit readiness via control port
    let (bootstrapped, circuit_ready) = match wait_for_bootstrap(&data_dir, control_port) {
        Ok(state) => state,
        Err(_) => (false, false),
    };

    // Determine if bridges are actually enabled via control when possible
    let bridges_enabled = if bootstrapped {
        probe_use_bridges(control_port, &data_dir).unwrap_or(config.bridge_support)
    } else {
        config.bridge_support
    };

    Ok(Status { bootstrapped, circuit_established: circuit_ready, bridges_enabled, socks: Some(format!("127.0.0.1:{}", socks_port)), supports_control: true })
}

pub fn status() -> Status {
    let guard = TOR_RUNTIME.lock().unwrap();
    if let Some(rt) = guard.as_ref() {
        // Try to get a realistic state when we manage Tor (control_port > 0)
        if rt.control_port > 0 {
            match probe_bootstrap(rt.control_port, &rt.data_dir) {
                Ok((boot, circ)) => {
                    let bridges = probe_use_bridges(rt.control_port, &rt.data_dir).unwrap_or(false);
                    Status { bootstrapped: boot, circuit_established: circ, bridges_enabled: bridges, socks: Some(format!("127.0.0.1:{}", rt.socks_port)), supports_control: true }
                }
                Err(_) => Status { bootstrapped: false, circuit_established: false, bridges_enabled: false, socks: Some(format!("127.0.0.1:{}", rt.socks_port)), supports_control: true },
            }
        } else {
            Status { bootstrapped: true, circuit_established: true, bridges_enabled: false, socks: Some(format!("127.0.0.1:{}", rt.socks_port)), supports_control: false }
        }
    } else {
        Status { bootstrapped: false, circuit_established: false, bridges_enabled: false, socks: None, supports_control: false }
    }
}

pub fn stop() -> bool {
    let mut guard = TOR_RUNTIME.lock().unwrap();
    if let Some(mut rt) = guard.take() {
        if let Some(child) = rt.child.as_mut() {
            let _ = child.kill();
        }
        return true;
    }
    false
}

fn to_hex(bytes: &[u8]) -> String {
    let mut s = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        use std::fmt::Write as _;
        let _ = write!(&mut s, "{:02x}", b);
    }
    s
}

fn read_cookie_hex(data_dir: &Path) -> anyhow::Result<String> {
    let cookie_path = data_dir.join("control_auth_cookie");
    let mut f = fs::File::open(cookie_path)?;
    let mut buf = Vec::new();
    f.read_to_end(&mut buf)?;
    Ok(to_hex(&buf))
}

fn ctl_send_recv(stream: &mut TcpStream, cmd: &str) -> anyhow::Result<String> {
    let line = format!("{}\r\n", cmd);
    stream.write_all(line.as_bytes())?;
    let mut resp = String::new();
    let mut buf = [0u8; 1024];
    loop {
        let n = stream.read(&mut buf)?;
        if n == 0 { break; }
        resp.push_str(&String::from_utf8_lossy(&buf[..n]));
        if resp.contains("\r\n250 ") || resp.contains("\r\n250-OK\r\n") || resp.ends_with("\r\n") { break; }
        if resp.contains("250 OK") { break; }
    }
    Ok(resp)
}

pub fn create_hidden_service(local_port: u16) -> anyhow::Result<String> {
    let guard = TOR_RUNTIME.lock().unwrap();
    let rt = guard.as_ref().ok_or_else(|| anyhow::anyhow!("tor not started"))?;
    let cookie_hex = read_cookie_hex(&rt.data_dir)?;
    let mut stream = TcpStream::connect(("127.0.0.1", rt.control_port))?;
    let auth = format!("AUTHENTICATE {}", cookie_hex);
    let resp = ctl_send_recv(&mut stream, &auth)?;
    if !resp.contains("250") { return Err(anyhow::anyhow!("AUTHENTICATE failed: {}", resp)); }

    // ADD_ONION NEW:ED25519-V3 Port=LOCALPORT,127.0.0.1:LOCALPORT
    let cmd = format!("ADD_ONION NEW:ED25519-V3 Port={},127.0.0.1:{}", local_port, local_port);
    let resp = ctl_send_recv(&mut stream, &cmd)?;
    // Expect lines like: 250-ServiceID=xxxxxxxxxxxxxxxx.onion (tor may return without suffix)
    let mut service_id = None;
    for line in resp.lines() {
        if let Some(rest) = line.strip_prefix("250-ServiceID=") {
            service_id = Some(rest.trim().to_string());
            break;
        }
    }
    let sid = service_id.ok_or_else(|| anyhow::anyhow!("missing ServiceID in response: {}", resp))?;
    let onion = if sid.ends_with(".onion") { sid } else { format!("{}.onion", sid) };
    drop(rt);
    let mut guard = TOR_RUNTIME.lock().unwrap();
    if let Some(rt_mut) = guard.as_mut() {
        rt_mut.hidden_services.push(onion.clone());
    }
    Ok(onion)
}

fn auth_control() -> anyhow::Result<TcpStream> {
    let (cookie_hex, control_port) = {
        let guard = TOR_RUNTIME.lock().unwrap();
        let rt = guard.as_ref().ok_or_else(|| anyhow::anyhow!("tor not started"))?;
        (read_cookie_hex(&rt.data_dir)?, rt.control_port)
    };
    let mut stream = TcpStream::connect(("127.0.0.1", control_port))?;
    let auth = format!("AUTHENTICATE {}", cookie_hex);
    let resp = ctl_send_recv(&mut stream, &auth)?;
    if !resp.contains("250") { return Err(anyhow::anyhow!("AUTHENTICATE failed: {}", resp)); }
    Ok(stream)
}

pub fn rotate_circuit() -> bool {
    match auth_control() {
        Ok(mut stream) => {
            if let Ok(resp) = ctl_send_recv(&mut stream, "SIGNAL NEWNYM") {
                return resp.contains("250");
            }
            false
        }
        Err(_) => false,
    }
}

pub fn enable_bridges(bridges: &[String]) -> bool {
    match auth_control() {
        Ok(mut stream) => {
            let _ = ctl_send_recv(&mut stream, "RESETCONF Bridge");
            let _ = ctl_send_recv(&mut stream, "SETCONF UseBridges=1");
            let mut ok = true;
            for b in bridges {
                let cmd = format!("SETCONF Bridge={}", b);
                if let Ok(resp) = ctl_send_recv(&mut stream, &cmd) {
                    ok = ok && resp.contains("250");
                } else {
                    ok = false;
                }
            }
            ok
        }
        Err(_) => false,
    }
}

pub fn list_hidden() -> Vec<String> {
    let guard = TOR_RUNTIME.lock().unwrap();
    if let Some(rt) = guard.as_ref() {
        return rt.hidden_services.clone();
    }
    Vec::new()
}


// --- internal helpers ---

fn wait_for_bootstrap(data_dir: &Path, control_port: u16) -> anyhow::Result<(bool, bool)> {
    // Wait for cookie to exist
    let deadline = std::time::Instant::now() + std::time::Duration::from_secs(30);
    while std::time::Instant::now() < deadline {
        if data_dir.join("control_auth_cookie").exists() {
            break;
        }
        std::thread::sleep(std::time::Duration::from_millis(200));
    }
    probe_bootstrap(control_port, data_dir)
}

fn probe_bootstrap(control_port: u16, data_dir: &Path) -> anyhow::Result<(bool, bool)> {
    // Authenticate
    let cookie_hex = read_cookie_hex(data_dir)?;
    let mut stream = TcpStream::connect(("127.0.0.1", control_port))?;
    let auth = format!("AUTHENTICATE {}", cookie_hex);
    let _ = ctl_send_recv(&mut stream, &auth)?;
    // Query bootstrap phase
    let resp = ctl_send_recv(&mut stream, "GETINFO status/bootstrap-phase")?;
    // Parse PROGRESS=xx
    let mut progress: u32 = 0;
    for line in resp.lines() {
        if let Some(p) = line.split_whitespace().find(|s| s.starts_with("PROGRESS=")) {
            if let Some(val) = p.split('=').nth(1) { progress = val.parse::<u32>().unwrap_or(0); }
            break;
        }
    }
    let boot = progress >= 5; // any non-zero indicates tor started
    let circuit = progress >= 100;
    Ok((boot, circuit))
}

fn probe_use_bridges(control_port: u16, data_dir: &Path) -> anyhow::Result<bool> {
    let cookie_hex = read_cookie_hex(data_dir)?;
    let mut stream = TcpStream::connect(("127.0.0.1", control_port))?;
    let auth = format!("AUTHENTICATE {}", cookie_hex);
    let _ = ctl_send_recv(&mut stream, &auth)?;
    let resp = ctl_send_recv(&mut stream, "GETCONF UseBridges")?;
    // Response like: 250-UseBridges=1 \n 250 OK
    Ok(resp.contains("UseBridges=1") || resp.contains("UseBridges=auto") )
}

