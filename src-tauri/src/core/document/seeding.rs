use std::fs;
use std::path::Path;

use crate::core::document::pipeline::{
    compute_fingerprint_from_bytes, fingerprint_for_treated_path, is_treated_file,
};

pub async fn ensure_seeding_allowed(path: &Path) -> Result<(), String> {
    if !is_treated_file(path) {
        return Err(
            "File is untreated. It must pass the 0–7 treatment pipeline before seeding."
                .into(),
        );
    }
    let fp = fingerprint_for_treated_path(path)?;
    let bytes = fs::read(path).map_err(|e| e.to_string())?;
    let verify = compute_fingerprint_from_bytes(&bytes, fp.page_count);
    if verify.content_hash != fp.content_hash {
        return Err("Content hash verification failed for treated file".into());
    }
    Ok(())
}
