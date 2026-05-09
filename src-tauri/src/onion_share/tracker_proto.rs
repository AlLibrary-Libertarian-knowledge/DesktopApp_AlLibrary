// Derived from onion-poc (MIT): POC-Tracker-Onion-Share/src/tracker_proto.rs
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnnouncedFile {
    pub file_id: Uuid,
    pub name: String,
    pub size: u64,
    pub link: String,
    pub content_hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeerLocation {
    pub node_id: String,
    pub onion: String,
    pub file_id: Uuid,
    pub link: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkFile {
    pub name: String,
    pub size: u64,
    pub link: String,
    pub content_hash: String,
    pub peer_count: usize,
    pub peers: Vec<PeerLocation>,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct NetworkLobby {
    pub online_nodes: usize,
    pub files: Vec<NetworkFile>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum WsClientMessage {
    Announce {
        node_id: String,
        onion: String,
        files: Vec<AnnouncedFile>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum WsServerMessage {
    Lobby { lobby: NetworkLobby },
}

#[cfg(test)]
mod serde_tests {
    use super::*;

    #[test]
    fn announce_http_json_matches_tracker_axum() {
        let m = WsClientMessage::Announce {
            node_id: "n1".into(),
            onion: "z.onion".into(),
            files: vec![],
        };
        let s = serde_json::to_string(&m).expect("serialize");
        assert!(s.contains("\"type\":\"announce\""), "got: {s}");
        let back: WsClientMessage = serde_json::from_str(&s).expect("deserialize");
        match back {
            WsClientMessage::Announce { node_id, onion, files } => {
                assert_eq!(node_id, "n1");
                assert_eq!(onion, "z.onion");
                assert!(files.is_empty());
            }
        }
    }
}
