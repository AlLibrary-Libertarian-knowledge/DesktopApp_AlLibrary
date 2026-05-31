//! Whiteboard-v2 content fingerprint: two-layer chunk hash + file rollup.

use serde::{Deserialize, Serialize};

use super::chunking::{sample_windows, split_identity_chunks, SAMPLE_LEN};

pub const HASH_SCHEME: &str = "whiteboard-v2";
pub const DOMAIN_CHUNK: &[u8] = b"ALCHUNKv1";
pub const DOMAIN_FILE: &[u8] = b"ALFILEv1";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ContentFingerprint {
    pub content_hash: String,
    pub page_count: u32,
    pub chunk_count: u32,
    pub chunk_sizes: Vec<u64>,
    pub chunk_hashes: Vec<String>,
    pub treated_size: u64,
    pub hash_scheme: String,
}

fn append_u32(buf: &mut Vec<u8>, v: u32) {
    buf.extend_from_slice(&v.to_le_bytes());
}

fn append_u64(buf: &mut Vec<u8>, v: u64) {
    buf.extend_from_slice(&v.to_le_bytes());
}

fn chunk_fingerprint_input(
    page_count: u32,
    chunk_index: u32,
    chunk_size: u64,
    first: &[u8; SAMPLE_LEN],
    middle: &[u8; SAMPLE_LEN],
    last: &[u8; SAMPLE_LEN],
    content_digest: &[u8; 32],
) -> Vec<u8> {
    let mut buf = Vec::with_capacity(
        DOMAIN_CHUNK.len() + 4 + 4 + 8 + SAMPLE_LEN * 3 + 32,
    );
    buf.extend_from_slice(DOMAIN_CHUNK);
    append_u32(&mut buf, page_count);
    append_u32(&mut buf, chunk_index);
    append_u64(&mut buf, chunk_size);
    buf.extend_from_slice(first);
    buf.extend_from_slice(middle);
    buf.extend_from_slice(last);
    buf.extend_from_slice(content_digest);
    buf
}

fn file_fingerprint_input(
    page_count: u32,
    treated_size: u64,
    chunk_hashes_raw: &[[u8; 32]],
) -> Vec<u8> {
    let mut buf =
        Vec::with_capacity(DOMAIN_FILE.len() + 4 + 8 + 4 + chunk_hashes_raw.len() * 32);
    buf.extend_from_slice(DOMAIN_FILE);
    append_u32(&mut buf, page_count);
    append_u64(&mut buf, treated_size);
    append_u32(&mut buf, chunk_hashes_raw.len() as u32);
    for h in chunk_hashes_raw {
        buf.extend_from_slice(h);
    }
    buf
}

fn hash_chunk(
    page_count: u32,
    chunk_index: u32,
    chunk_bytes: &[u8],
) -> ([u8; 32], String) {
    let content_digest = *blake3::hash(chunk_bytes).as_bytes();
    let chunk_size = chunk_bytes.len() as u64;
    let (first, middle, last) = sample_windows(chunk_bytes);
    let input = chunk_fingerprint_input(
        page_count,
        chunk_index,
        chunk_size,
        &first,
        &middle,
        &last,
        &content_digest,
    );
    let raw = *blake3::hash(&input).as_bytes();
    let hex = blake3::Hash::from_bytes(raw).to_hex().to_string();
    (raw, hex)
}

/// Compute whiteboard-v2 fingerprint from treated file bytes.
pub fn compute_fingerprint_from_bytes(treated: &[u8], page_count: u32) -> ContentFingerprint {
    let chunks = split_identity_chunks(treated);
    let mut chunk_sizes = Vec::with_capacity(chunks.len());
    let mut chunk_hashes_hex = Vec::with_capacity(chunks.len());
    let mut chunk_hashes_raw: Vec<[u8; 32]> = Vec::with_capacity(chunks.len());

    for meta in &chunks {
        let bytes = &treated[meta.start..meta.end];
        let (raw, hex) = hash_chunk(page_count, meta.index, bytes);
        chunk_sizes.push(bytes.len() as u64);
        chunk_hashes_hex.push(hex);
        chunk_hashes_raw.push(raw);
    }

    let treated_size = treated.len() as u64;
    let file_input = file_fingerprint_input(page_count, treated_size, &chunk_hashes_raw);
    let content_hash = blake3::hash(&file_input).to_hex().to_string();

    ContentFingerprint {
        content_hash,
        page_count,
        chunk_count: chunks.len() as u32,
        chunk_sizes,
        chunk_hashes: chunk_hashes_hex,
        treated_size,
        hash_scheme: HASH_SCHEME.to_string(),
    }
}

/// Compute fingerprint by reading treated bytes from disk.
pub fn compute_fingerprint(treated: &[u8], page_count: u32) -> ContentFingerprint {
    compute_fingerprint_from_bytes(treated, page_count)
}

/// Legacy full-file BLAKE3 (pre-migration).
pub fn legacy_full_file_hash(bytes: &[u8]) -> String {
    blake3::hash(bytes).to_hex().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::document::pipeline::chunking::BASE_CHUNK;

    #[test]
    fn deterministic_same_input() {
        let data = b"hello treated document bytes";
        let a = compute_fingerprint_from_bytes(data, 3);
        let b = compute_fingerprint_from_bytes(data, 3);
        assert_eq!(a, b);
        assert_eq!(a.content_hash.len(), 64);
        assert_eq!(a.chunk_hashes[0].len(), 64);
    }

    #[test]
    fn different_page_count_different_hash() {
        let data = b"same bytes";
        let a = compute_fingerprint_from_bytes(data, 1);
        let b = compute_fingerprint_from_bytes(data, 2);
        assert_ne!(a.content_hash, b.content_hash);
    }

    #[test]
    fn identical_samples_different_middle_different_chunk_hash() {
        let mut a = vec![0u8; BASE_CHUNK];
        let mut b = a.clone();
        // Keep first/middle/last sample regions identical at edges but differ deep inside
        a[BASE_CHUNK / 2 + 50] = 1;
        b[BASE_CHUNK / 2 + 50] = 2;
        let fa = compute_fingerprint_from_bytes(&a, 1);
        let fb = compute_fingerprint_from_bytes(&b, 1);
        assert_ne!(fa.chunk_hashes[0], fb.chunk_hashes[0]);
        assert_ne!(fa.content_hash, fb.content_hash);
    }

    #[test]
    fn empty_file_single_chunk() {
        let fp = compute_fingerprint_from_bytes(&[], 0);
        assert_eq!(fp.chunk_count, 1);
        assert_eq!(fp.treated_size, 0);
        assert_eq!(fp.hash_scheme, HASH_SCHEME);
    }

    #[test]
    fn chunk_order_affects_file_hash() {
        let chunk_a = vec![1u8; 1000];
        let chunk_b = vec![2u8; 1000];
        let file_ab = [chunk_a.as_slice(), chunk_b.as_slice()].concat();
        let file_ba = [chunk_b.as_slice(), chunk_a.as_slice()].concat();
        let fp_ab = compute_fingerprint_from_bytes(&file_ab, 1);
        let fp_ba = compute_fingerprint_from_bytes(&file_ba, 1);
        assert_ne!(fp_ab.content_hash, fp_ba.content_hash);
    }
}
