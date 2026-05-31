//! Document treatment pipeline (steps 0–7).

use std::fs;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};

use lopdf::Document as LoDocument;
use serde::{Deserialize, Serialize};
use zip::read::ZipArchive;
use zip::write::FileOptions;
use zip::ZipWriter;

use super::fingerprint::{compute_fingerprint_from_bytes, ContentFingerprint};

const MAX_FILE_BYTES: u64 = 200 * 1024 * 1024;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipelineProgress {
    pub step: u8,
    pub label: String,
    pub percent: u8,
}

#[derive(Debug, Clone)]
pub struct PipelineOutput {
    pub treated_bytes: Vec<u8>,
    pub fingerprint: ContentFingerprint,
    pub document_type: String,
    pub page_count: u32,
    pub original_filename: String,
    pub javascript_stripped: bool,
    pub malware_scan_status: String,
}

pub type ProgressCallback = Box<dyn Fn(PipelineProgress) + Send + Sync>;

fn emit_progress(cb: &Option<ProgressCallback>, step: u8, label: &str, percent: u8) {
    if let Some(f) = cb {
        f(PipelineProgress {
            step,
            label: label.to_string(),
            percent,
        });
    }
}

/// Run full pipeline on source file; returns treated bytes + fingerprint (steps 0–7).
pub fn run_pipeline(source: &Path, progress: &Option<ProgressCallback>) -> Result<PipelineOutput, String> {
    if !source.exists() || !source.is_file() {
        return Err("Source file not found".into());
    }

    let meta = fs::metadata(source).map_err(|e| e.to_string())?;
    if meta.len() > MAX_FILE_BYTES {
        return Err("File too large (>200MB)".into());
    }

    emit_progress(&progress, 0, "Type validation", 5);
    let ext = source
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    if ext != "pdf" && ext != "epub" {
        return Err("Only PDF and EPUB are allowed".into());
    }
    let document_type = if ext == "pdf" {
        "PDF".to_string()
    } else {
        "EPUB".to_string()
    };

    let original_filename = source
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("document")
        .to_string();

    let mut javascript_stripped = false;

    emit_progress(&progress, 1, "Script cleanup", 15);
    let mut treated = if ext == "pdf" {
        javascript_stripped = true;
        treat_pdf(source)?
    } else {
        treat_epub(source)?
    };

    emit_progress(&progress, 2, "Metadata cleanup", 30);
    if ext == "pdf" {
        treated = strip_pdf_metadata(&treated)?;
    } else {
        treated = normalize_epub_metadata(&treated)?;
    }

    emit_progress(&progress, 3, "Security scan", 45);
    let malware_scan_status = scan_heuristics(&treated, &ext)?;

    emit_progress(&progress, 4, "File reduction", 60);
    if ext == "pdf" {
        treated = compress_pdf_bytes(&treated)?;
    } else {
        treated = repack_epub(&treated)?;
    }

    emit_progress(&progress, 5, "Binary normalization", 75);
    // bytes already normalized in memory

    emit_progress(&progress, 6, "Chunk splitting", 85);
    let page_count = structural_page_count(&treated, &ext)?;

    emit_progress(&progress, 7, "Hash generation", 95);
    let fingerprint = compute_fingerprint_from_bytes(&treated, page_count);

    Ok(PipelineOutput {
        treated_bytes: treated,
        fingerprint,
        document_type,
        page_count,
        original_filename,
        javascript_stripped,
        malware_scan_status,
    })
}

/// Run pipeline and write treated file to `dest`.
pub fn run_pipeline_to_file(
    source: &Path,
    dest: &Path,
    progress: Option<ProgressCallback>,
) -> Result<PipelineOutput, String> {
    let out = run_pipeline(source, &progress)?;
    if let Some(parent) = dest.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    emit_progress(&progress, 7, "Writing to library", 97);
    let tmp = dest.with_extension("tmp-treating");
    fs::write(&tmp, &out.treated_bytes).map_err(|e| e.to_string())?;
    fs::rename(&tmp, dest).map_err(|e| e.to_string())?;
    write_sidecar(dest, &out.fingerprint)?;
    Ok(out)
}

pub fn write_sidecar(file_path: &Path, fp: &ContentFingerprint) -> Result<(), String> {
    let sidecar = sidecar_path(file_path);
    let json = serde_json::to_string_pretty(fp).map_err(|e| e.to_string())?;
    fs::write(&sidecar, json).map_err(|e| e.to_string())
}

pub fn sidecar_path(file_path: &Path) -> PathBuf {
    let stem = file_path.file_stem().and_then(|s| s.to_str()).unwrap_or("doc");
    file_path
        .parent()
        .unwrap_or_else(|| Path::new("."))
        .join(format!("{stem}.allibrary.json"))
}

pub fn read_sidecar(file_path: &Path) -> Option<ContentFingerprint> {
    let path = sidecar_path(file_path);
    let data = fs::read_to_string(&path).ok()?;
    serde_json::from_str(&data).ok()
}

pub fn is_treated_file(file_path: &Path) -> bool {
    read_sidecar(file_path).is_some()
}

/// Returns true for AlLibrary metadata sidecars (e.g. `doc.allibrary.json`), not user documents.
pub fn is_sidecar_file(file_path: &Path) -> bool {
    file_path
        .file_name()
        .and_then(|name| name.to_str())
        .map(|name| name.ends_with(".allibrary.json"))
        .unwrap_or(false)
}

fn treat_pdf(source: &Path) -> Result<Vec<u8>, String> {
    let mut doc = LoDocument::load(source).map_err(|e| format!("PDF parse failed: {e}"))?;
    if let Some(cat_id) = doc.trailer.get(b"Root").and_then(|r| r.as_reference()).ok() {
        if let Ok(catalog) = doc.get_object_mut(cat_id) {
            if let Ok(dict) = catalog.as_dict_mut() {
                dict.remove(b"OpenAction");
                dict.remove(b"AA");
                dict.remove(b"Names");
            }
        }
    }
    for (_, obj) in doc.objects.iter_mut() {
        if let Ok(dict) = obj.as_dict_mut() {
            dict.remove(b"JS");
            dict.remove(b"JavaScript");
            dict.remove(b"S");
        }
    }
    let tmp = std::env::temp_dir().join(format!("al-pdf-{}.pdf", uuid::Uuid::new_v4()));
    doc.save(&tmp).map_err(|e| format!("PDF save failed: {e}"))?;
    let bytes = fs::read(&tmp).map_err(|e| e.to_string())?;
    let _ = fs::remove_file(&tmp);
    Ok(bytes)
}

fn strip_pdf_metadata(bytes: &[u8]) -> Result<Vec<u8>, String> {
    let mut doc = LoDocument::load_mem(bytes).map_err(|e| format!("PDF reload failed: {e}"))?;
    if let Some(info_ref) = doc.trailer.get(b"Info").and_then(|r| r.as_reference()).ok() {
        if let Ok(info) = doc.get_object_mut(info_ref) {
            if let Ok(dict) = info.as_dict_mut() {
                for key in [
                    &b"Title"[..],
                    b"Author",
                    b"Subject",
                    b"Keywords",
                    b"Creator",
                    b"Producer",
                    b"CreationDate",
                    b"ModDate",
                    b"Trapped",
                ] {
                    dict.remove(key);
                }
            }
        }
    }
    if let Some(cat_id) = doc.trailer.get(b"Root").and_then(|r| r.as_reference()).ok() {
        if let Ok(catalog) = doc.get_object_mut(cat_id) {
            if let Ok(dict) = catalog.as_dict_mut() {
                dict.remove(b"Metadata");
            }
        }
    }
    let tmp = std::env::temp_dir().join(format!("al-pdf-meta-{}.pdf", uuid::Uuid::new_v4()));
    doc.save(&tmp).map_err(|e| format!("PDF metadata strip save failed: {e}"))?;
    let out = fs::read(&tmp).map_err(|e| e.to_string())?;
    let _ = fs::remove_file(&tmp);
    Ok(out)
}

fn treat_epub(source: &Path) -> Result<Vec<u8>, String> {
    let file = fs::File::open(source).map_err(|e| e.to_string())?;
    let mut zip = ZipArchive::new(file).map_err(|e| format!("Invalid EPUB (zip): {e}"))?;
    for i in 0..zip.len() {
        let mut f = zip.by_index(i).map_err(|e| e.to_string())?;
        let name = f.name().to_lowercase();
        if name.ends_with(".js") {
            return Err("EPUB contains JavaScript; rejected".into());
        }
        if name.ends_with(".html") || name.ends_with(".xhtml") || name.ends_with(".opf") {
            let mut buf = String::new();
            f.read_to_string(&mut buf).ok();
            if buf.to_lowercase().contains("<script") {
                return Err("EPUB contains script tags; rejected".into());
            }
        }
    }
    fs::read(source).map_err(|e| e.to_string())
}

fn normalize_epub_metadata(bytes: &[u8]) -> Result<Vec<u8>, String> {
    // Re-pack with stable ordering; strip dc:date/creator/title in OPF where found
    let cursor = std::io::Cursor::new(bytes);
    let mut archive = ZipArchive::new(cursor).map_err(|e| e.to_string())?;
    let mut names: Vec<String> = (0..archive.len())
        .filter_map(|i| archive.by_index(i).ok().map(|f| f.name().to_string()))
        .collect();
    names.sort();

    let out_cursor = std::io::Cursor::new(Vec::new());
    let mut writer = ZipWriter::new(out_cursor);
    let options = FileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    for name in names {
        let mut f = archive.by_name(&name).map_err(|e| e.to_string())?;
        let mut data = Vec::new();
        f.read_to_end(&mut data).map_err(|e| e.to_string())?;
        if name.to_lowercase().ends_with(".opf") {
            if let Ok(text) = String::from_utf8(data.clone()) {
                let cleaned = strip_opf_metadata(&text);
                data = cleaned.into_bytes();
            }
        }
        writer.start_file(&name, options).map_err(|e| e.to_string())?;
        writer.write_all(&data).map_err(|e| e.to_string())?;
    }
    let finished = writer.finish().map_err(|e| e.to_string())?;
    Ok(finished.into_inner())
}

fn strip_opf_metadata(opf: &str) -> String {
    let mut out = opf.to_string();
    for tag in ["dc:title", "dc:creator", "dc:date", "dc:identifier"] {
        while let Some(start) = out.to_lowercase().find(&format!("<{tag}")) {
            if out[start..].contains('>') {
                let close = format!("</{tag}>");
                if let Some(close_start) = out[start..].to_lowercase().find(&close) {
                    let abs_end = start + close_start + close.len();
                    out.replace_range(start..abs_end, "");
                } else {
                    break;
                }
            } else {
                break;
            }
        }
    }
    out
}

fn repack_epub(bytes: &[u8]) -> Result<Vec<u8>, String> {
    normalize_epub_metadata(bytes)
}

fn compress_pdf_bytes(bytes: &[u8]) -> Result<Vec<u8>, String> {
    let mut doc = LoDocument::load_mem(bytes).map_err(|e| format!("PDF compress load failed: {e}"))?;
    doc.compress();
    let tmp = std::env::temp_dir().join(format!("al-pdf-comp-{}.pdf", uuid::Uuid::new_v4()));
    doc.save(&tmp).map_err(|e| format!("PDF compress save failed: {e}"))?;
    let out = fs::read(&tmp).map_err(|e| e.to_string())?;
    let _ = fs::remove_file(&tmp);
    Ok(out)
}

fn scan_heuristics(bytes: &[u8], ext: &str) -> Result<String, String> {
    if bytes.len() > MAX_FILE_BYTES as usize {
        return Err("File exceeds size limit during scan".into());
    }
    if ext == "pdf" {
        let lower = String::from_utf8_lossy(bytes).to_lowercase();
        if lower.contains("/launch") || lower.contains("/embeddedfile") {
            return Err("PDF contains suspicious launch/embedded actions".into());
        }
    }
    if ext == "epub" {
        let cursor = std::io::Cursor::new(bytes);
        let zip = ZipArchive::new(cursor).map_err(|e| e.to_string())?;
        if zip.len() > 10_000 {
            return Err("EPUB archive too large (zip bomb heuristic)".into());
        }
    }
    Ok("clean".to_string())
}

fn structural_page_count(bytes: &[u8], ext: &str) -> Result<u32, String> {
    match ext {
        "pdf" => pdf_page_count_lopdf(bytes),
        "epub" => epub_spine_count(bytes),
        _ => Ok(0),
    }
}

fn pdf_page_count_lopdf(bytes: &[u8]) -> Result<u32, String> {
    let doc = LoDocument::load_mem(bytes).map_err(|e| format!("PDF page count failed: {e}"))?;
    if let Ok(pages_id) = doc.trailer.get(b"Root").and_then(|r| r.as_reference()) {
        if let Ok(root) = doc.get_dictionary(pages_id) {
            if let Ok(count) = root.get(b"Pages").and_then(|p| p.as_reference()) {
                if let Ok(pages) = doc.get_dictionary(count) {
                    if let Ok(n) = pages.get(b"Count") {
                        if let Ok(num) = n.as_i64() {
                            return Ok(num.max(0) as u32);
                        }
                    }
                }
            }
        }
    }
    Ok(0)
}

fn epub_spine_count(bytes: &[u8]) -> Result<u32, String> {
    let cursor = std::io::Cursor::new(bytes);
    let mut zip = ZipArchive::new(cursor).map_err(|e| e.to_string())?;
    for i in 0..zip.len() {
        let mut f = zip.by_index(i).map_err(|e| e.to_string())?;
        if f.name().to_lowercase().ends_with(".opf") {
            let mut buf = String::new();
            f.read_to_string(&mut buf).map_err(|e| e.to_string())?;
            let count = buf.matches("<itemref").count();
            return Ok(count.max(1) as u32);
        }
    }
    Ok(0)
}

pub fn fingerprint_for_treated_bytes(bytes: &[u8], ext: &str) -> Result<ContentFingerprint, String> {
    let page_count = structural_page_count(bytes, ext)?;
    Ok(compute_fingerprint_from_bytes(bytes, page_count))
}

pub fn fingerprint_for_treated_path(path: &Path) -> Result<ContentFingerprint, String> {
    if let Some(fp) = read_sidecar(path) {
        return Ok(fp);
    }
    let bytes = fs::read(path).map_err(|e| e.to_string())?;
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    fingerprint_for_treated_bytes(&bytes, &ext)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sidecar_file_detection() {
        assert!(is_sidecar_file(Path::new("TCC WORD_rev2.allibrary.json")));
        assert!(!is_sidecar_file(Path::new("TCC WORD_rev2.pdf")));
        assert!(!is_sidecar_file(Path::new("notes.json")));
    }

    #[test]
    fn pipeline_rejects_non_pdf_epub() {
        let dir = std::env::temp_dir();
        let txt = dir.join(format!("al-test-{}.txt", uuid::Uuid::new_v4()));
        fs::write(&txt, b"hello").unwrap();
        assert!(run_pipeline(&txt, &None).is_err());
        let _ = fs::remove_file(&txt);
    }
}
