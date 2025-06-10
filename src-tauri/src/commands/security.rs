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
    #[serde(rename = "countryCode")]
    country_code: Option<String>,
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
    
    let mut security_info = SecurityInfo::default();
    
    // Get local IP
    if let Ok(local_ip) = local_ip_address::local_ip() {
        security_info.local_ip = Some(local_ip.to_string());
        info!("Local IP detected: {}", local_ip);
    }
    
    // Get public IP and geolocation
    match get_public_ip_info().await {
        Ok(ip_info) => {
            security_info.public_ip = ip_info.query.clone();
            security_info.country = ip_info.country.clone();
            security_info.region = ip_info.region_name.clone();
            security_info.city = ip_info.city.clone();
            security_info.isp = ip_info.isp.clone();
            security_info.timezone = ip_info.timezone.clone();
            
            // Analyze for VPN/Proxy
            analyze_connection_type(&mut security_info, &ip_info).await;
            
            info!("IP analysis completed for: {:?}", security_info.public_ip);
        }
        Err(e) => {
            warn!("Failed to get IP info: {}", e);
            security_info.warnings.push("Unable to verify public IP address".to_string());
        }
    }
    
    // Test latency
    security_info.latency_ms = test_latency().await;
    
    // Test SSL availability
    security_info.ssl_available = test_ssl_availability().await;
    
    // Calculate security score
    security_info.security_score = calculate_security_score(&security_info);
    
    // Generate cultural heritage specific warnings
    generate_warnings(&mut security_info);
    
    info!("Security analysis completed with score: {}", security_info.security_score);
    
    Ok(security_info)
}

#[tauri::command]
pub async fn refresh_security_info(app_handle: AppHandle) -> Result<(), String> {
    info!("Refreshing security information...");
    
    match get_security_info().await {
        Ok(security_info) => {
            // Emit event to frontend
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
        .timeout(Duration::from_secs(10))
        .build()?;
    
    let response = client
        .get("http://ip-api.com/json/?fields=status,message,country,countryCode,regionName,city,isp,query,timezone")
        .send()
        .await?;
    
    let ip_info: IpApiResponse = response.json().await?;
    Ok(ip_info)
}

async fn analyze_connection_type(security_info: &mut SecurityInfo, ip_info: &IpApiResponse) {
    // Basic VPN/Proxy detection heuristics
    if let Some(isp) = &ip_info.isp {
        let isp_lower = isp.to_lowercase();
        
        // Common VPN/Proxy indicators
        let vpn_indicators = [
            "vpn", "proxy", "hosting", "datacenter", "cloud", "server",
            "digital ocean", "amazonaws", "linode", "vultr", "ovh"
        ];
        
        let is_suspicious = vpn_indicators.iter().any(|indicator| isp_lower.contains(indicator));
        
        if is_suspicious {
            security_info.is_vpn = true;
            security_info.connection_type = "VPN/Proxy Detected".to_string();
            info!("Potential VPN/Proxy detected via ISP: {}", isp);
        } else {
            security_info.connection_type = "Direct Connection".to_string();
        }
    }
    
    // Additional Tor detection (simplified)
    if let Some(ip) = &security_info.public_ip {
        if ip.starts_with("10.") || ip.starts_with("172.") || ip.starts_with("192.168.") {
            security_info.is_proxy = true;
            security_info.connection_type = "Private Network".to_string();
        }
    }
}

async fn test_latency() -> Option<u64> {
    let start = Instant::now();
    
    match reqwest::Client::new()
        .get("https://www.google.com")
        .timeout(Duration::from_secs(5))
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
    match reqwest::Client::new()
        .get("https://httpbin.org/get")
        .timeout(Duration::from_secs(5))
        .send()
        .await
    {
        Ok(_) => {
            info!("SSL/TLS available");
            true
        }
        Err(e) => {
            warn!("SSL test failed: {}", e);
            false
        }
    }
}

fn calculate_security_score(security_info: &SecurityInfo) -> u32 {
    let mut score = 100u32;
    
    // VPN/Proxy penalties for cultural heritage networks
    if security_info.is_vpn {
        score = score.saturating_sub(20);
    }
    
    if security_info.is_proxy {
        score = score.saturating_sub(15);
    }
    
    if security_info.is_tor {
        score = score.saturating_sub(30);
    }
    
    // Latency penalties
    if let Some(latency) = security_info.latency_ms {
        if latency > 500 {
            score = score.saturating_sub(10);
        } else if latency > 200 {
            score = score.saturating_sub(5);
        }
    }
    
    // SSL availability
    if !security_info.ssl_available {
        score = score.saturating_sub(15);
    }
    
    // Ensure minimum score
    score.max(0)
}

fn generate_warnings(security_info: &mut SecurityInfo) {
    if security_info.is_vpn {
        security_info.warnings.push(
            "VPN detected: May affect cultural heritage repository access policies".to_string()
        );
    }
    
    if security_info.is_proxy {
        security_info.warnings.push(
            "Proxy connection: Institutional network policies may apply".to_string()
        );
    }
    
    if let Some(latency) = security_info.latency_ms {
        if latency > 500 {
            security_info.warnings.push(
                "High network latency: May impact cultural data synchronization".to_string()
            );
        }
    }
    
    if !security_info.ssl_available {
        security_info.warnings.push(
            "SSL/TLS unavailable: Secure cultural heritage data transfer at risk".to_string()
        );
    }
    
    if security_info.security_score < 50 {
        security_info.warnings.push(
            "Network security concerns detected: Review connection for heritage preservation".to_string()
        );
    }
} 