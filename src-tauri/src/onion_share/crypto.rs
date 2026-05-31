// Derived from onion-poc (MIT): POC-Tracker-Onion-Share/src/crypto.rs
use anyhow::Context;
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use blake3::Hasher;
use chacha20poly1305::aead::{Aead, Payload};
use chacha20poly1305::{KeyInit, XChaCha20Poly1305, XNonce};
use rand::RngCore;
use std::path::Path;
use uuid::Uuid;

use crate::core::document::pipeline::fingerprint_for_treated_bytes;

pub type FileKey = [u8; 32];

pub fn random_key() -> FileKey {
    let mut k = [0u8; 32];
    rand::rngs::OsRng.fill_bytes(&mut k);
    k
}

pub fn key_to_b64url(key: &FileKey) -> String {
    URL_SAFE_NO_PAD.encode(key)
}

pub fn key_from_b64url(s: &str) -> anyhow::Result<FileKey> {
    let raw = URL_SAFE_NO_PAD.decode(s).context("invalid base64url key")?;
    anyhow::ensure!(raw.len() == 32, "key must be 32 bytes");
    let mut k = [0u8; 32];
    k.copy_from_slice(&raw);
    Ok(k)
}

pub fn nonce_for_chunk(key: &FileKey, chunk_index: u64) -> XNonce {
    let mut hasher = Hasher::new_keyed(key);
    hasher.update(&chunk_index.to_le_bytes());
    let out = hasher.finalize();
    let mut nonce = [0u8; 24];
    nonce.copy_from_slice(&out.as_bytes()[0..24]);
    XNonce::from_slice(&nonce).to_owned()
}

fn aad(file_id: Uuid, chunk_index: u64) -> [u8; 24] {
    let mut out = [0u8; 24];
    out[..16].copy_from_slice(file_id.as_bytes());
    out[16..].copy_from_slice(&chunk_index.to_le_bytes());
    out
}

pub fn encrypt_chunk(
    key: &FileKey,
    file_id: Uuid,
    chunk_index: u64,
    plaintext: &[u8],
) -> anyhow::Result<Vec<u8>> {
    let cipher = XChaCha20Poly1305::new_from_slice(key).expect("32 bytes");
    let nonce = nonce_for_chunk(key, chunk_index);
    let aad = aad(file_id, chunk_index);

    let ct = cipher
        .encrypt(&nonce, Payload {
            msg: plaintext,
            aad: &aad,
        })
        .map_err(|_| anyhow::anyhow!("encrypt failed"))?;
    Ok(ct)
}

pub fn decrypt_chunk(
    key: &FileKey,
    file_id: Uuid,
    chunk_index: u64,
    ciphertext: &[u8],
) -> anyhow::Result<Vec<u8>> {
    let cipher = XChaCha20Poly1305::new_from_slice(key).expect("32 bytes");
    let nonce = nonce_for_chunk(key, chunk_index);
    let aad = aad(file_id, chunk_index);

    let pt = cipher
        .decrypt(&nonce, Payload {
            msg: ciphertext,
            aad: &aad,
        })
        .map_err(|_| anyhow::anyhow!("decrypt failed (wrong key or corrupted data)"))?;
    Ok(pt)
}

pub fn content_hash_hex(bytes: &[u8]) -> String {
    // Default ext unknown — page_count 0; prefer content_hash_for_file for treated docs.
    fingerprint_for_treated_bytes(bytes, "")
        .map(|fp| fp.content_hash)
        .unwrap_or_else(|_| blake3::hash(bytes).to_hex().to_string())
}

pub fn content_hash_for_file(path: &Path, bytes: &[u8]) -> anyhow::Result<String> {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    Ok(fingerprint_for_treated_bytes(bytes, &ext)
        .map_err(|e| anyhow::anyhow!(e))?
        .content_hash)
}

pub fn key_from_content_hash(hash_hex: &str) -> anyhow::Result<FileKey> {
    let raw = hex::decode(hash_hex).context("invalid content hash hex")?;
    anyhow::ensure!(raw.len() >= 32, "content hash must be at least 32 bytes");
    let mut key = [0u8; 32];
    key.copy_from_slice(&raw[..32]);
    Ok(key)
}
