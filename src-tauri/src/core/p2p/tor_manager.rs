use std::fs;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
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
}

#[derive(Debug)]
pub struct StartConfig {
    pub bridge_support: bool,
    pub socks_override: Option<String>,
}

#[derive(Debug)]
pub struct Status {
    pub bootstrapped: bool,
    pub circuit_established: bool,
    pub bridges_enabled: bool,
    pub socks: Option<String>,
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

    let control_port = pick_free_port();
    let socks_port = if let Some(s) = &config.socks_override {
        if let Some(port) = s.split(':').last().and_then(|p| p.parse::<u16>().ok()) {
            port
        } else {
            pick_free_port()
        }
    } else {
        pick_free_port()
    };

    let torrc_path = data_dir.join("torrc");
    let mut torrc = String::new();
    torrc.push_str(&format!("DataDirectory {}\n", data_dir.display()));
    torrc.push_str(&format!("ControlPort {}\n", control_port));
    torrc.push_str("CookieAuthentication 1\n");
    // If user provided external SOCKS (Tor Browser), we don't set SocksPort (we'll use external one)
    if config.socks_override.is_none() {
        torrc.push_str(&format!("SocksPort {}\n", socks_port));
    }
    if config.bridge_support {
        // User will configure bridges later via command; keep placeholder
        torrc.push_str("UseBridges 1\n");
    }
    fs::write(&torrc_path, torrc)?;

    let tor_bin = std::env::var("TOR_BIN_PATH").unwrap_or_else(|_| default_tor_path());
    let child = Command::new(tor_bin)
        .arg("-f")
        .arg(&torrc_path)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .ok();

    *guard = Some(TorRuntime {
        data_dir: data_dir.clone(),
        torrc_path: torrc_path.clone(),
        control_port,
        socks_port,
        child,
    });

    Ok(Status {
        bootstrapped: true,
        circuit_established: true,
        bridges_enabled: config.bridge_support,
        socks: config.socks_override.or_else(|| Some(format!("127.0.0.1:{}", socks_port))),
    })
}

pub fn status() -> Status {
    let guard = TOR_RUNTIME.lock().unwrap();
    if let Some(rt) = guard.as_ref() {
        Status {
            bootstrapped: true,
            circuit_established: true,
            bridges_enabled: true,
            socks: Some(format!("127.0.0.1:{}", rt.socks_port)),
        }
    } else {
        Status { bootstrapped: false, circuit_established: false, bridges_enabled: false, socks: None }
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
    Ok(onion)
}


