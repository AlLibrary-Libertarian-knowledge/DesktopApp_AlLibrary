use tauri::{AppHandle, Emitter};
use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};
use tracing::{info, warn, error};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityInfo {
    pub public_ip: Option<String>,
    pub local_ip: Option<String>,
    pub country: Option<String>,
    pub region: Option<String>,
    pub city: Option<String>,
    pub isp: Option<String>,
    pub is_vpn: bool,
    pub is_proxy: bool,
    pub is_tor: bool,
    pub connection_type: String,
    pub latency_ms: Option<u64>,
    pub security_score: u32,
    pub warnings: Vec<String>,
    pub ssl_available: bool,
    pub timezone: Option<String>,
}

#[derive(Debug, Deserialize)]
struct IpApiResponse {
    query: Option<String>,
    country: Option<String>,
    #[serde(rename = "regionName")]
    region_name: Option<String>,
    city: Option<String>,
    isp: Option<String>,
    timezone: Option<String>,
}

impl Default for SecurityInfo {
    fn default() -> Self {
        Self {
            public_ip: None,
            local_ip: None,
            country: None,
            region: None,
            city: None,
            isp: None,
            is_vpn: false,
            is_proxy: false,
            is_tor: false,
            connection_type: "Unknown".to_string(),
            latency_ms: None,
            security_score: 50,
            warnings: Vec::new(),
            ssl_available: false,
            timezone: None,
        }
    }
}

#[tauri::command]
pub async fn get_security_info() -> Result<SecurityInfo, String> {
    info!("Starting security analysis...");

    // Hard cap so the UI never spins forever (DNS / flaky endpoints).
    match tokio::time::timeout(Duration::from_secs(12), collect_security_info()).await {
        Ok(Ok(info)) => {
            info!("Security analysis completed with score: {}", info.security_score);
            Ok(info)
        }
        Ok(Err(e)) => {
            error!("Security analysis failed: {}", e);
            Err(e)
        }
        Err(_) => {
            warn!("Security analysis timed out — returning partial local snapshot");
            Ok(partial_security_info("Security analysis timed out; showing local snapshot"))
        }
    }
}

async fn collect_security_info() -> Result<SecurityInfo, String> {
    let mut security_info = SecurityInfo::default();

    if let Ok(local_ip) = local_ip_address::local_ip() {
        security_info.local_ip = Some(local_ip.to_string());
        info!("Local IP detected: {}", local_ip);
    }

    // Run remote checks in parallel instead of ~20s sequential waits.
    let (ip_result, latency_ms, ssl_available) = tokio::join!(
        get_public_ip_info(),
        test_latency(),
        test_ssl_availability(),
    );

    match ip_result {
        Ok(ip_info) => {
            security_info.public_ip = ip_info.query.clone();
            security_info.country = ip_info.country.clone();
            security_info.region = ip_info.region_name.clone();
            security_info.city = ip_info.city.clone();
            security_info.isp = ip_info.isp.clone();
            security_info.timezone = ip_info.timezone.clone();
            analyze_connection_type(&mut security_info, &ip_info);
            info!("IP analysis completed for: {:?}", security_info.public_ip);
        }
        Err(e) => {
            warn!("Failed to get IP info: {}", e);
            security_info.warnings.push("Unable to verify public IP address".to_string());
            if security_info.connection_type == "Unknown" {
                security_info.connection_type = "Direct Connection".to_string();
            }
        }
    }

    security_info.latency_ms = latency_ms;
    security_info.ssl_available = ssl_available;
    security_info.security_score = calculate_security_score(&security_info);
    generate_warnings(&mut security_info);

    Ok(security_info)
}

fn partial_security_info(warning: &str) -> SecurityInfo {
    let mut info = SecurityInfo::default();
    if let Ok(local_ip) = local_ip_address::local_ip() {
        info.local_ip = Some(local_ip.to_string());
    }
    info.connection_type = "Unknown".to_string();
    info.warnings.push(warning.to_string());
    info.security_score = calculate_security_score(&info);
    info
}

#[tauri::command]
pub async fn refresh_security_info(app_handle: AppHandle) -> Result<(), String> {
    info!("Refreshing security information...");

    match get_security_info().await {
        Ok(security_info) => {
            if let Err(e) = app_handle.emit("security-info-updated", &security_info) {
                error!("Failed to emit security update: {}", e);
                return Err(format!("Failed to broadcast security update: {}", e));
            }
            info!("Security information refreshed and broadcasted");
            Ok(())
        }
        Err(e) => {
            error!("Failed to refresh security info: {}", e);
            Err(e)
        }
    }
}

async fn get_public_ip_info() -> Result<IpApiResponse, Box<dyn std::error::Error + Send + Sync>> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(4))
        .connect_timeout(Duration::from_secs(2))
        .build()?;

    // Prefer HTTPS; fall back to HTTP if needed.
    let urls = [
        "https://ipapi.co/json/",
        "http://ip-api.com/json/?fields=status,message,country,countryCode,regionName,city,isp,query,timezone",
    ];

    let mut last_err: Option<Box<dyn std::error::Error + Send + Sync>> = None;

    for url in urls {
        match client.get(url).send().await {
            Ok(response) => {
                if !response.status().is_success() {
                    last_err = Some(format!("IP lookup HTTP {}", response.status()).into());
                    continue;
                }

                let body = response.bytes().await?;
                if let Ok(mapped) = map_ip_payload(&body, url) {
                    return Ok(mapped);
                }
                last_err = Some("Failed to parse IP lookup payload".into());
            }
            Err(e) => {
                last_err = Some(e.into());
            }
        }
    }

    Err(last_err.unwrap_or_else(|| "IP lookup failed".into()))
}

fn map_ip_payload(
    body: &[u8],
    url: &str,
) -> Result<IpApiResponse, Box<dyn std::error::Error + Send + Sync>> {
    if url.contains("ipapi.co") {
        #[derive(Deserialize)]
        struct IpApiCo {
            ip: Option<String>,
            country_name: Option<String>,
            region: Option<String>,
            city: Option<String>,
            org: Option<String>,
            timezone: Option<String>,
        }

        let parsed: IpApiCo = serde_json::from_slice(body)?;
        return Ok(IpApiResponse {
            query: parsed.ip,
            country: parsed.country_name,
            region_name: parsed.region,
            city: parsed.city,
            isp: parsed.org,
            timezone: parsed.timezone,
        });
    }

    Ok(serde_json::from_slice::<IpApiResponse>(body)?)
}

fn analyze_connection_type(security_info: &mut SecurityInfo, ip_info: &IpApiResponse) {
    if let Some(isp) = &ip_info.isp {
        let isp_lower = isp.to_lowercase();

        let vpn_indicators = [
            "vpn", "proxy", "hosting", "datacenter", "cloud", "server",
            "digital ocean", "amazonaws", "linode", "vultr", "ovh",
        ];

        let is_suspicious = vpn_indicators
            .iter()
            .any(|indicator| isp_lower.contains(indicator));

        if is_suspicious {
            security_info.is_vpn = true;
            security_info.connection_type = "VPN/Proxy Detected".to_string();
            info!("Potential VPN/Proxy detected via ISP: {}", isp);
        } else {
            security_info.connection_type = "Direct Connection".to_string();
        }
    } else {
        security_info.connection_type = "Direct Connection".to_string();
    }

    if let Some(ip) = &security_info.public_ip {
        if ip.starts_with("10.") || ip.starts_with("172.") || ip.starts_with("192.168.") {
            security_info.is_proxy = true;
            security_info.connection_type = "Private Network".to_string();
        }
    }
}

async fn test_latency() -> Option<u64> {
    let start = Instant::now();

    match reqwest::Client::builder()
        .timeout(Duration::from_secs(3))
        .connect_timeout(Duration::from_secs(2))
        .build()
        .ok()?
        .get("https://www.cloudflare.com/cdn-cgi/trace")
        .send()
        .await
    {
        Ok(_) => {
            let latency = start.elapsed().as_millis() as u64;
            info!("Network latency: {}ms", latency);
            Some(latency)
        }
        Err(e) => {
            warn!("Latency test failed: {}", e);
            None
        }
    }
}

async fn test_ssl_availability() -> bool {
    match reqwest::Client::builder()
        .timeout(Duration::from_secs(3))
        .connect_timeout(Duration::from_secs(2))
        .build()
    {
        Ok(client) => match client.get("https://www.cloudflare.com/cdn-cgi/trace").send().await {
            Ok(_) => {
                info!("SSL/TLS available");
                true
            }
            Err(e) => {
                warn!("SSL test failed: {}", e);
                false
            }
        },
        Err(e) => {
            warn!("SSL client build failed: {}", e);
            false
        }
    }
}

fn calculate_security_score(security_info: &SecurityInfo) -> u32 {
    let mut score = 100u32;

    if security_info.is_vpn {
        score = score.saturating_sub(20);
    }

    if security_info.is_proxy {
        score = score.saturating_sub(15);
    }

    if security_info.is_tor {
        score = score.saturating_sub(30);
    }

    if let Some(latency) = security_info.latency_ms {
        if latency > 500 {
            score = score.saturating_sub(10);
        } else if latency > 200 {
            score = score.saturating_sub(5);
        }
    }

    if !security_info.ssl_available {
        score = score.saturating_sub(15);
    }

    score
}

fn generate_warnings(security_info: &mut SecurityInfo) {
    if security_info.is_vpn {
        security_info.warnings.push(
            "VPN detected: May affect cultural heritage repository access policies".to_string(),
        );
    }

    if security_info.is_proxy {
        security_info.warnings.push(
            "Proxy connection: Institutional network policies may apply".to_string(),
        );
    }

    if let Some(latency) = security_info.latency_ms {
        if latency > 500 {
            security_info.warnings.push(
                "High network latency: May impact cultural data synchronization".to_string(),
            );
        }
    }

    if !security_info.ssl_available {
        security_info.warnings.push(
            "SSL/TLS unavailable: Secure cultural heritage data transfer at risk".to_string(),
        );
    }

    if security_info.security_score < 50 {
        security_info.warnings.push(
            "Network security concerns detected: Review connection for heritage preservation"
                .to_string(),
        );
    }
}
