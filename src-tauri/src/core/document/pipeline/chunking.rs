//! Identity chunk splitter (step 6): 1 MiB base with tail merge rule.

pub const BASE_CHUNK: usize = 1_048_576;
pub const TAIL_MERGE_THRESHOLD: usize = 716_800; // 700 KiB
pub const SAMPLE_LEN: usize = 100;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct IdentityChunk {
    pub index: u32,
    pub start: usize,
    pub end: usize,
}

/// Split `data` into identity chunks per whiteboard rules.
pub fn split_identity_chunks(data: &[u8]) -> Vec<IdentityChunk> {
    let len = data.len();
    if len == 0 {
        return vec![IdentityChunk {
            index: 0,
            start: 0,
            end: 0,
        }];
    }

    let mut ranges: Vec<(usize, usize)> = Vec::new();
    let mut offset = 0usize;
    while offset < len {
        let end = (offset + BASE_CHUNK).min(len);
        ranges.push((offset, end));
        offset = end;
    }

    if ranges.len() >= 2 {
        let last_len = ranges.last().unwrap().1 - ranges.last().unwrap().0;
        if last_len < TAIL_MERGE_THRESHOLD {
            let prev_start = ranges[ranges.len() - 2].0;
            let last_end = ranges.pop().unwrap().1;
            let last_idx = ranges.len() - 1;
            ranges[last_idx] = (prev_start, last_end);
        }
    }

    ranges
        .into_iter()
        .enumerate()
        .map(|(i, (start, end))| IdentityChunk {
            index: i as u32,
            start,
            end,
        })
        .collect()
}

/// Extract first/middle/last 100-byte windows from chunk bytes (zero-pad short chunks).
pub fn sample_windows(chunk: &[u8]) -> ([u8; SAMPLE_LEN], [u8; SAMPLE_LEN], [u8; SAMPLE_LEN]) {
    let mut first = [0u8; SAMPLE_LEN];
    let mut middle = [0u8; SAMPLE_LEN];
    let mut last = [0u8; SAMPLE_LEN];

    let n = chunk.len();
    if n == 0 {
        return (first, middle, last);
    }

    let copy_len = n.min(SAMPLE_LEN);
    first[..copy_len].copy_from_slice(&chunk[..copy_len]);

    if n <= SAMPLE_LEN {
        middle[..copy_len].copy_from_slice(&chunk[..copy_len]);
        last[..copy_len].copy_from_slice(&chunk[..copy_len]);
    } else {
        let mid_start = n / 2;
        let half = SAMPLE_LEN / 2;
        let start = mid_start.saturating_sub(half);
        let end = (start + SAMPLE_LEN).min(n);
        let actual = end - start;
        middle[..actual].copy_from_slice(&chunk[start..end]);
    }

    let last_start = n.saturating_sub(SAMPLE_LEN);
    let last_len = n - last_start;
    last[SAMPLE_LEN - last_len..].copy_from_slice(&chunk[last_start..]);

    (first, middle, last)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn range_lens(data_len: usize) -> Vec<usize> {
        split_identity_chunks(&vec![0u8; data_len])
            .into_iter()
            .map(|c| c.end - c.start)
            .collect()
    }

    #[test]
    fn empty_file_one_zero_chunk() {
        let chunks = split_identity_chunks(&[]);
        assert_eq!(chunks.len(), 1);
        assert_eq!(chunks[0].start, 0);
        assert_eq!(chunks[0].end, 0);
    }

    #[test]
    fn exactly_one_mib_single_chunk() {
        assert_eq!(range_lens(BASE_CHUNK), vec![BASE_CHUNK]);
    }

    #[test]
    fn one_mib_plus_699k_merges_tail() {
        let total = BASE_CHUNK + TAIL_MERGE_THRESHOLD - 1;
        assert_eq!(range_lens(total), vec![total]);
    }

    #[test]
    fn one_mib_plus_700k_keeps_tail() {
        let tail = TAIL_MERGE_THRESHOLD;
        let total = BASE_CHUNK + tail;
        assert_eq!(range_lens(total), vec![BASE_CHUNK, tail]);
    }

    #[test]
    fn multi_chunk_small_tail_merges() {
        let total = BASE_CHUNK * 2 + 100_000;
        assert_eq!(range_lens(total), vec![BASE_CHUNK, BASE_CHUNK + 100_000]);
    }

    #[test]
    fn sample_short_chunk_zero_pads() {
        let chunk = b"hello";
        let (f, m, l) = sample_windows(chunk);
        assert_eq!(&f[..5], b"hello");
        assert_eq!(&m[..5], b"hello");
        assert_eq!(&l[..5], b"hello");
        assert_eq!(f[5], 0);
    }

    #[test]
    fn different_middle_bytes_different_samples() {
        let mut a = vec![0u8; BASE_CHUNK];
        let mut b = a.clone();
        a[BASE_CHUNK / 2] = 1;
        b[BASE_CHUNK / 2] = 2;
        let (_, ma, _) = sample_windows(&a);
        let (_, mb, _) = sample_windows(&b);
        assert_ne!(ma, mb);
    }
}
