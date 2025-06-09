use crate::utils::error::{AlLibraryError, Result};
use tracing::{info, warn, error, debug};
use tracing_subscriber::{fmt, filter::EnvFilter};
use std::path::PathBuf;

pub struct LoggingConfig {
    pub level: String,
    pub log_file: Option<PathBuf>,
    pub console_output: bool,
}

impl Default for LoggingConfig {
    fn default() -> Self {
        Self {
            level: "info".to_string(),
            log_file: None,
            console_output: true,
        }
    }
}

pub fn init_logging(config: LoggingConfig) -> Result<()> {
    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new(&config.level));

    // Simple console-only logging for now
    fmt()
        .with_env_filter(env_filter)
        .with_target(true)
        .with_thread_ids(true)
        .init();

    info!("Logging system initialized");
    Ok(())
}

pub fn log_error(error: &AlLibraryError, context: Option<&str>) {
    match context {
        Some(ctx) => error!("Error in {}: {}", ctx, error),
        None => error!("Error: {}", error),
    }
}

pub fn log_warning(message: &str, context: Option<&str>) {
    match context {
        Some(ctx) => warn!("[{}] {}", ctx, message),
        None => warn!("{}", message),
    }
}

pub fn log_info(message: &str, context: Option<&str>) {
    match context {
        Some(ctx) => info!("[{}] {}", ctx, message),
        None => info!("{}", message),
    }
}

pub fn log_debug(message: &str, context: Option<&str>) {
    match context {
        Some(ctx) => debug!("[{}] {}", ctx, message),
        None => debug!("{}", message),
    }
}

// Structured logging helpers
pub fn log_operation_start(operation: &str, details: Option<&str>) {
    match details {
        Some(d) => info!(operation = operation, details = d, "Operation started"),
        None => info!(operation = operation, "Operation started"),
    }
}

pub fn log_operation_success(operation: &str, duration_ms: u64, details: Option<&str>) {
    match details {
        Some(d) => info!(
            operation = operation,
            duration_ms = duration_ms,
            details = d,
            "Operation completed successfully"
        ),
        None => info!(
            operation = operation,
            duration_ms = duration_ms,
            "Operation completed successfully"
        ),
    }
}

pub fn log_operation_error(operation: &str, error: &AlLibraryError, duration_ms: u64) {
    error!(
        operation = operation,
        error = %error,
        duration_ms = duration_ms,
        "Operation failed"
    );
}

pub fn log_database_operation(operation: &str, table: &str, id: Option<&str>) {
    match id {
        Some(record_id) => info!(
            operation = operation,
            table = table,
            record_id = record_id,
            "Database operation"
        ),
        None => info!(
            operation = operation,
            table = table,
            "Database operation"
        ),
    }
}

pub fn log_file_operation(operation: &str, file_path: &str, file_size: Option<u64>) {
    match file_size {
        Some(size) => info!(
            operation = operation,
            file_path = file_path,
            file_size = size,
            "File operation"
        ),
        None => info!(
            operation = operation,
            file_path = file_path,
            "File operation"
        ),
    }
}

pub fn log_security_event(event_type: &str, details: &str, severity: &str) {
    match severity {
        "critical" => error!(
            event_type = event_type,
            details = details,
            severity = severity,
            "Security event"
        ),
        "warning" => warn!(
            event_type = event_type,
            details = details,
            severity = severity,
            "Security event"
        ),
        _ => info!(
            event_type = event_type,
            details = details,
            severity = severity,
            "Security event"
        ),
    }
}

pub fn log_performance_metric(metric_name: &str, value: f64, unit: &str) {
    info!(
        metric_name = metric_name,
        value = value,
        unit = unit,
        "Performance metric"
    );
}

// Macro for creating timed operations
#[macro_export]
macro_rules! timed_operation {
    ($operation:expr, $code:block) => {{
        let start = std::time::Instant::now();
        $crate::utils::logging::log_operation_start($operation, None);
        
        let result = $code;
        
        let duration = start.elapsed().as_millis() as u64;
        match &result {
            Ok(_) => $crate::utils::logging::log_operation_success($operation, duration, None),
            Err(e) => $crate::utils::logging::log_operation_error($operation, e, duration),
        }
        
        result
    }};
    ($operation:expr, $details:expr, $code:block) => {{
        let start = std::time::Instant::now();
        $crate::utils::logging::log_operation_start($operation, Some($details));
        
        let result = $code;
        
        let duration = start.elapsed().as_millis() as u64;
        match &result {
            Ok(_) => $crate::utils::logging::log_operation_success($operation, duration, Some($details)),
            Err(e) => $crate::utils::logging::log_operation_error($operation, e, duration),
        }
        
        result
    }};
} 