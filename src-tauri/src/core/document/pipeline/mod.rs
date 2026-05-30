pub mod chunking;
pub mod fingerprint;
pub mod runner;

pub use chunking::{split_identity_chunks, IdentityChunk};
pub use fingerprint::{
    compute_fingerprint, compute_fingerprint_from_bytes, legacy_full_file_hash, ContentFingerprint,
    HASH_SCHEME,
};
pub use runner::{
    run_pipeline, run_pipeline_to_file, fingerprint_for_treated_bytes, fingerprint_for_treated_path,
    is_treated_file, read_sidecar, sidecar_path, write_sidecar, PipelineOutput, PipelineProgress,
};
