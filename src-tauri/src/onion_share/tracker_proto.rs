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
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub swarm_link: Option<String>,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct NetworkLobby {
    pub online_nodes: usize,
    pub files: Vec<NetworkFile>,
}

/// Cheap fingerprint to skip redundant lobby persist / UI events.
pub fn lobby_fingerprint(lobby: &NetworkLobby) -> String {
    let mut parts: Vec<&str> = lobby.files.iter().map(|f| f.content_hash.as_str()).collect();
    parts.sort_unstable();
    format!("{}:{}", lobby.online_nodes, parts.join(","))
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

    #[test]
    fn lobby_fingerprint_stable_for_same_content() {
        let a = NetworkLobby {
            online_nodes: 1,
            files: vec![NetworkFile {
                name: "a".into(),
                size: 1,
                link: "l".into(),
                content_hash: "h1".into(),
                peer_count: 1,
                peers: vec![],
                swarm_link: None,
            }],
        };
        let b = a.clone();
        assert_eq!(super::lobby_fingerprint(&a), super::lobby_fingerprint(&b));
    }
}
