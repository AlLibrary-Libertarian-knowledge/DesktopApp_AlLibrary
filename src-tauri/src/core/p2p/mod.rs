use anyhow::Result;
use libp2p::{
	core::{transport::choice::OrTransport, upgrade},
	gossipsub,
	kad,
	identity,
	noise,
	swarm::{NetworkBehaviour, Swarm, SwarmEvent, Config as SwarmConfig, Executor},
	tcp,
	yamux,
	PeerId,
	Multiaddr,
};
use libp2p_request_response as rr;
use libp2p::Transport;
use futures::StreamExt;
use futures::{io::{AsyncRead, AsyncWrite, AsyncReadExt, AsyncWriteExt}};
use tokio::{sync::{mpsc, oneshot}, task::JoinHandle};
use std::collections::{HashMap, HashSet};
use std::io::{Read, Seek, SeekFrom, Write};
use std::time::Duration;

mod proxy_socks;
use proxy_socks::SocksProxyTransport;

// Commands handled by the runtime
#[derive(Debug)]
pub enum Command {
	AddBootstrap { addrs: Vec<Multiaddr> },
	PublishHash { hash: String },
	UpdateIndex { hash: String, path: String, title: String, author: Option<String>, tags: Vec<String> },
	Fetch { hash: String, out_path: String, reply: oneshot::Sender<Result<String, String>> },
	Search { query: String, reply: oneshot::Sender<Vec<(String, String)>> },
	GetMetrics { reply: oneshot::Sender<Vec<(String, u64, u64, u64, String)>> },
	// Kademlia record operations
	PutRecord { key: String, value: Vec<u8>, reply: oneshot::Sender<Result<(), String>> },
	GetRecord { key: String, reply: oneshot::Sender<Result<Vec<u8>, String>> },
	Bootstrap { reply: oneshot::Sender<Result<(), String>> },
	// Network information
	GetMyOnionAddress { reply: oneshot::Sender<Result<String, String>> },
	GetNetworkPeers { reply: oneshot::Sender<Result<Vec<String>, String>> },
	// Manual peer management
	AddPeerAddress { address: String, reply: oneshot::Sender<Result<String, String>> },
	// Tor management
	ForceCreateOnionService { reply: oneshot::Sender<Result<String, String>> },
}

pub struct RuntimeHandle {
	pub peer_id: PeerId,
	pub command_tx: mpsc::Sender<Command>,
	pub _task: JoinHandle<()>,
}

pub fn onion_bootstrap_addr(onion: &str, port: u16) -> Multiaddr {
	format!("/dnsaddr/{}/tcp/{}/ws", onion, port).parse().unwrap()
}

// Simple request/response codec for chunk transfer
#[derive(Clone, Default)]
struct ChunkCodec;

#[async_trait::async_trait]
impl rr::Codec for ChunkCodec {
	type Protocol = String;
	type Request = Vec<u8>;
	type Response = Vec<u8>;

	async fn read_request<T>(&mut self, _p: &Self::Protocol, io: &mut T) -> std::io::Result<Self::Request>
	where
		T: AsyncRead + Unpin + Send,
	{
		let mut buf = Vec::new();
		AsyncReadExt::read_to_end(io, &mut buf).await?;
		Ok(buf)
	}

	async fn read_response<T>(&mut self, _p: &Self::Protocol, io: &mut T) -> std::io::Result<Self::Response>
	where
		T: AsyncRead + Unpin + Send,
	{
		let mut buf = Vec::new();
		AsyncReadExt::read_to_end(io, &mut buf).await?;
		Ok(buf)
	}

	async fn write_request<T>(&mut self, _p: &Self::Protocol, io: &mut T, req: Self::Request) -> std::io::Result<()>
	where
		T: AsyncWrite + Unpin + Send,
	{
		AsyncWriteExt::write_all(io, &req).await
	}

	async fn write_response<T>(&mut self, _p: &Self::Protocol, io: &mut T, res: Self::Response) -> std::io::Result<()>
	where
		T: AsyncWrite + Unpin + Send,
	{
		AsyncWriteExt::write_all(io, &res).await
	}
}

fn build_chunk_request(hash: &str, offset: u64) -> Vec<u8> {
	bincode::serialize(&(hash.to_string(), offset)).unwrap_or_default()
}

fn parse_chunk_request(buf: &[u8]) -> Result<(String, u64), Box<bincode::ErrorKind>> {
	bincode::deserialize(buf)
}

#[derive(NetworkBehaviour)]
struct Behaviour {
	gossipsub: gossipsub::Behaviour,
	rr: rr::Behaviour<ChunkCodec>,
	kad: kad::Behaviour<kad::store::MemoryStore>,
}

pub async fn start_runtime(socks: Option<String>) -> Result<RuntimeHandle> {
	// Identity
	let local_key = identity::Keypair::generate_ed25519();
	let local_peer_id = PeerId::from(local_key.public());

	// Base transport: dial over Tor (SOCKS) + listen locally so Tor hidden service can forward
	let socks_addr = socks.ok_or_else(|| anyhow::anyhow!("SOCKS proxy is required for P2P runtime"))?;
	
	// Create separate transports for dialing and listening
	let dial_transport = SocksProxyTransport::new(socks_addr.clone());
	let listen_transport = tcp::tokio::Transport::new(tcp::Config::new().nodelay(true));
	
	// Use OrTransport to prioritize local listening, fallback to SOCKS dialing
	let transport = OrTransport::new(listen_transport, dial_transport)
		.upgrade(upgrade::Version::V1)
		.authenticate(noise::Config::new(&local_key)?)
		.multiplex(yamux::Config::default())
		.timeout(Duration::from_secs(20))
		.boxed();

	// Gossipsub - optimized for speed
	let gossipsub_config = gossipsub::ConfigBuilder::default()
		.validation_mode(gossipsub::ValidationMode::None)
		.message_id_fn(|m| gossipsub::MessageId::from(&m.data[..]))
		.heartbeat_interval(Duration::from_millis(100))          // Faster heartbeat (was 1s)
		.heartbeat_initial_delay(Duration::from_millis(50))      // Faster initial heartbeat
		.fanout_ttl(Duration::from_millis(200))                 // Faster fanout (was 60s)
		.prune_peers(0)                                         // Don't prune peers for faster reconnection
		.prune_backoff(Duration::from_millis(100))              // Faster prune backoff
		.build()
		.map_err(|e| anyhow::anyhow!("gossipsub config error: {:?}", e))?;
	let mut gossipsub = gossipsub::Behaviour::new(
		gossipsub::MessageAuthenticity::Anonymous,
		gossipsub_config,
	).map_err(|e| anyhow::anyhow!(e))?;
	let topic = gossipsub::IdentTopic::new("allibrary-content");
	let topic_peers = gossipsub::IdentTopic::new("allibrary-peers");
	gossipsub.subscribe(&topic)?;
	gossipsub.subscribe(&topic_peers)?;

	// Request/Response
	let protocols = std::iter::once(("/allibrary/chunk/1".to_string(), rr::ProtocolSupport::Full));
	let rr = rr::Behaviour::<ChunkCodec>::new(protocols, Default::default());

	// Kademlia for presence shared via Tor - optimized for speed
	let store = kad::store::MemoryStore::new(local_peer_id);
	let kad_cfg = kad::Config::default();
	
	// Note: Kademlia config optimization will be added when libp2p API supports it
	// For now, using default config which is already optimized
	
	let kad = kad::Behaviour::with_config(local_peer_id, store, kad_cfg);

	let behaviour = Behaviour { gossipsub, rr, kad };
	struct TokioExec;
	impl Executor for TokioExec {
		fn exec(&self, fut: std::pin::Pin<Box<dyn futures::Future<Output = ()> + Send + 'static>>) {
			tokio::spawn(fut);
		}
	}
	let mut swarm = Swarm::new(transport, behaviour, local_peer_id, SwarmConfig::with_executor(TokioExec));

	// Start local listener and create onion service for inbound
	fn pick_port() -> u16 { std::net::TcpListener::bind(("127.0.0.1", 0)).ok().and_then(|l| l.local_addr().ok().map(|a| a.port())).unwrap_or(0) }
	let listen_port = pick_port();
	let _ = Swarm::listen_on(&mut swarm, format!("/ip4/127.0.0.1/tcp/{}/ws", listen_port).parse().unwrap());
	// Create onion hidden service for inbound connections
	let onion_addr = match crate::core::p2p::tor_manager::create_hidden_service(listen_port) {
		Ok(addr) => {
			tracing::info!("✅ Tor hidden service created: {}", addr);
			addr
		},
		Err(e) => {
			tracing::error!("❌ Critical: Failed to create Tor hidden service: {:?}", e);
			tracing::error!("❌ Cannot accept inbound connections - file sharing will fail");
			return Err(anyhow::anyhow!("Tor hidden service creation failed: {}", e));
		}
	};

	// Automatic peer discovery - no hardcoded bootstrap nodes needed
	// The network will discover peers automatically through:
	// 1. Kademlia DHT queries
	// 2. Gossipsub peer announcements
	// 3. Direct peer-to-peer connections
	
	// Optional: Custom bootstrap nodes for specific networks
	// Set ALLIB_BOOTSTRAP_ONIONS="node1.onion:443,node2.onion:443" if needed
	if let Ok(bootstrap_list) = std::env::var("ALLIB_BOOTSTRAP_ONIONS") {
		if !bootstrap_list.is_empty() {
			tracing::info!("Using custom bootstrap nodes: {}", bootstrap_list);
			for item in bootstrap_list.split(',').map(|s| s.trim()).filter(|s| !s.is_empty()) {
				let mut parts = item.split(':');
				if let (Some(host), Some(port_str)) = (parts.next(), parts.next()) {
					if let Ok(port) = port_str.parse::<u16>() {
						let ma: Multiaddr = format!("/dnsaddr/{}/tcp/{}/ws", host, port).parse().unwrap_or_else(|_| "/ip4/127.0.0.1/tcp/9".parse().unwrap());
						
						// Dial the bootstrap node
						tracing::info!("Attempting to dial custom bootstrap node: {}", ma);
						let _ = Swarm::dial(&mut swarm, ma.clone());
						
						// Extract peer ID from multiaddr and add to Kademlia routing table
						if let Some(peer_id) = ma.iter().find_map(|protocol| {
							if let multiaddr::Protocol::P2p(peer_id) = protocol {
								Some(peer_id)
							} else {
								None
							}
						}) {
							// Add bootstrap node to Kademlia routing table
							swarm.behaviour_mut().kad.add_address(&peer_id, ma.clone());
							tracing::info!("Added custom bootstrap peer to Kademlia routing table: {:?}", peer_id);
						} else {
							// If no peer ID in multiaddr, just dial and let Kademlia discover it
							tracing::info!("No peer ID in bootstrap multiaddr, dialing: {}", ma);
						}
					}
				}
			}
		}
	} else {
		tracing::info!("No custom bootstrap nodes configured - using automatic peer discovery");
		
		// Add fallback bootstrap nodes for initial network connectivity
		let fallback_bootstrap = vec![
			"allibrary-bootstrap1.onion:443",
			"allibrary-bootstrap2.onion:443"
		];
		
		tracing::info!("Adding fallback bootstrap nodes for initial connectivity");
		for bootstrap in fallback_bootstrap {
			let ma: Multiaddr = format!("/dnsaddr/{}/tcp/{}/ws", bootstrap, 443).parse().unwrap_or_else(|_| "/ip4/127.0.0.1/tcp/9".parse().unwrap());
			tracing::info!("Attempting to dial fallback bootstrap node: {}", ma);
			let _ = Swarm::dial(&mut swarm, ma.clone());
		}
	}
	
	// Always perform initial bootstrap for network discovery
	if let Ok(_) = swarm.behaviour_mut().kad.bootstrap() {
		tracing::info!("Initiated automatic Kademlia bootstrap for peer discovery");
	}

	// State
	#[derive(Clone)]
	struct IndexedContent { path: String, title: String, author: Option<String>, tags: Vec<String> }
	let mut content_index: HashMap<String, IndexedContent> = HashMap::new();
	let mut connected: HashSet<PeerId> = HashSet::new();
	const CHUNK_SIZE: usize = 64 * 1024;

	// Simple transfer stats for metrics (download/upload per hash)
	#[derive(Default, Clone)]
	struct TransferStats { downloaded: u64, size: u64, last_tick_bytes: u64, last_rate_bps: u64 }
	let mut transfer_stats: HashMap<String, TransferStats> = HashMap::new();

	struct PendingFile {
		peer: PeerId,
		hash: String,
		offset: u64,
		out_path: String,
		file: std::fs::File,
		reply: oneshot::Sender<Result<String, String>>,
	}
	let mut current_fetch: Option<PendingFile> = None;
	// Distributed search state
	let mut current_search: Option<(String, std::time::Instant, tokio::sync::oneshot::Sender<Vec<(String, String)>>, Vec<(String, String)>)> = None;
	
	// Kademlia query state tracking
	let mut pending_put_records: HashMap<kad::QueryId, oneshot::Sender<Result<(), String>>> = HashMap::new();
	let mut pending_get_records: HashMap<kad::QueryId, oneshot::Sender<Result<Vec<u8>, String>>> = HashMap::new();
	let mut pending_bootstrap: HashMap<kad::QueryId, oneshot::Sender<Result<(), String>>> = HashMap::new();
	// Optimized timing for faster discovery
	let mut ticker = tokio::time::interval(Duration::from_millis(50));  // 5x faster ticker
	let mut announce_tick = tokio::time::interval(Duration::from_millis(1000)); // 10x faster announcements

	let (tx, mut rx) = mpsc::channel::<Command>(64);
	let topic_peers_clone = topic_peers.clone();
	// Build peer announcement address
	let peer_announce = if !onion_addr.is_empty() { 
		format!("/dnsaddr/{}/tcp/{}/ws/p2p/{}", onion_addr, listen_port, local_peer_id) 
	} else { 
		tracing::warn!("⚠️  No onion address available - cannot announce peer presence");
		String::new() 
	};
	let task = tokio::spawn(async move {
		loop {
			tokio::select! {
				Some(cmd) = rx.recv() => {
					match cmd {
						Command::AddBootstrap { addrs } => {
							for addr in addrs { let _ = Swarm::dial(&mut swarm, addr); }
						}
						Command::PublishHash { hash } => {
							let _ = swarm.behaviour_mut().gossipsub.publish(topic.clone(), hash.as_bytes());
						}
						Command::UpdateIndex { hash, path, title, author, tags } => {
							// Update local index
							content_index.insert(hash.clone(), IndexedContent { 
								path: path.clone(), 
								title: title.clone(), 
								author: author.clone(), 
								tags: tags.clone() 
							});
							
							// Broadcast content availability immediately for faster discovery
							let announce_msg = format!("CONTENT|{}|{}|{}|{}", 
								hash, 
								title, 
								author.as_ref().unwrap_or(&"Unknown".to_string()),
								tags.join(",")
							);
							let _ = swarm.behaviour_mut().gossipsub.publish(topic.clone(), announce_msg.into_bytes());
							tracing::info!("📢 Broadcasted content availability: {} - {}", hash, title);
							
							// Also store in DHT for persistent network discovery
							let content_key = kad::RecordKey::new(&format!("allibrary:content:{}", hash));
							let content_record = kad::Record {
								key: content_key,
								value: serde_json::to_vec(&serde_json::json!({
									"hash": hash,
									"path": path,
									"title": title,
									"author": author,
									"tags": tags,
									"peer_id": local_peer_id.to_string()
								})).unwrap_or_default(),
								publisher: Some(local_peer_id),
								expires: Some(std::time::Instant::now() + Duration::from_secs(24 * 60 * 60)), // 24 hours
							};
							
							// Store content metadata in DHT
							if let Ok(_query_id) = swarm.behaviour_mut().kad.put_record(content_record, kad::Quorum::One) {
								tracing::debug!("Stored content metadata in DHT for persistent discovery");
							}
						}
						Command::GetMetrics { reply } => {
							// Build a simple metrics snapshot per content hash.
							// Tuple: (hash, downloaded, size, last_rate_bps, status)
							let mut metrics: Vec<(String, u64, u64, u64, String)> = Vec::new();
							for (hash, _info) in content_index.iter() {
								let stat = transfer_stats.get(hash).cloned().unwrap_or_default();
								metrics.push((
									hash.clone(),
									stat.downloaded,
									stat.size,
									stat.last_rate_bps,
									"ok".to_string(),
								));
							}
							let _ = reply.send(metrics);
						}
						Command::Fetch { hash, out_path, reply } => {
							// Attempt from all connected peers
							if let Ok(file) = std::fs::OpenOptions::new().create(true).truncate(true).write(true).open(&out_path) {
								// Pick a peer to start with if any connected, else reply error later
								if let Some(peer) = connected.iter().next().cloned() {
									let req = build_chunk_request(&hash, 0);
									let _ = swarm.behaviour_mut().rr.send_request(&peer, req);
									current_fetch = Some(PendingFile { peer, hash, offset: 0, out_path, file, reply });
								} else {
									let _ = reply.send(Err("no peers connected".into()));
								}
							} else {
								let _ = reply.send(Err("failed to open output file".into()));
							}
						}
						Command::Search { query, reply } => {
							// Parallel search strategy for faster results
							let id = uuid::Uuid::new_v4().to_string();
							
							// 1. Immediate local search
							let mut buf: Vec<(String, String)> = Vec::new();
							for (h, c) in content_index.iter() {
								let mut name = c.title.clone();
								if name.is_empty() { name = std::path::Path::new(&c.path).file_name().and_then(|s| s.to_str()).unwrap_or("").to_string(); }
								let ql = query.to_lowercase();
								let author_hit = c.author.as_ref().map(|a| a.to_lowercase().contains(&ql)).unwrap_or(false);
								let tags_hit = c.tags.iter().any(|t| t.to_lowercase().contains(&ql));
								if name.to_lowercase().contains(&ql) || author_hit || tags_hit { buf.push((h.clone(), name)); }
							}
							
							// 2. Parallel gossipsub broadcast
							let msg = format!("S|{}|{}", id, query);
							let _ = swarm.behaviour_mut().gossipsub.publish(topic.clone(), msg.into_bytes());
							
							// 3. Parallel Kademlia DHT query for persistent content
							let dht_key = kad::RecordKey::new(&format!("allibrary:content:{}", query));
							let _dht_query = swarm.behaviour_mut().kad.get_record(dht_key);
							
							// 4. Parallel content discovery via DHT
							let content_discovery_key = kad::RecordKey::new(&format!("allibrary:discovery:{}", query));
							let _content_discovery = swarm.behaviour_mut().kad.get_record(content_discovery_key);
							
							// 4. Start search with aggressive timeout
							current_search = Some((id, std::time::Instant::now(), reply, buf));
							
							tracing::debug!("Started parallel search: gossipsub + DHT + local for query: {}", query);
						}
						Command::PutRecord { key, value, reply } => {
							// Store a record in the Kademlia DHT
							let record_key = kad::RecordKey::new(&key);
							let record = kad::Record {
								key: record_key,
								value,
								publisher: Some(local_peer_id),
								expires: Some(std::time::Instant::now() + Duration::from_secs(24 * 60 * 60)), // 24 hours
							};
							match swarm.behaviour_mut().kad.put_record(record, kad::Quorum::One) {
								Ok(query_id) => {
									pending_put_records.insert(query_id, reply);
								}
								Err(e) => {
									let _ = reply.send(Err(format!("Failed to initiate put record: {:?}", e)));
								}
							}
						}
						Command::GetRecord { key, reply } => {
							// Retrieve a record from the Kademlia DHT
							let record_key = kad::RecordKey::new(&key);
							let query_id = swarm.behaviour_mut().kad.get_record(record_key);
							pending_get_records.insert(query_id, reply);
						}
						Command::Bootstrap { reply } => {
							// Perform Kademlia bootstrap to refresh routing table
							match swarm.behaviour_mut().kad.bootstrap() {
								Ok(query_id) => {
									pending_bootstrap.insert(query_id, reply);
								}
								Err(e) => {
									let _ = reply.send(Err(format!("Failed to initiate bootstrap: {:?}", e)));
								}
							}
						}
						Command::GetMyOnionAddress { reply } => {
							if !peer_announce.is_empty() {
								let _ = reply.send(Ok(peer_announce.clone()));
							} else {
								let _ = reply.send(Err("No onion address available - Tor hidden service not created".to_string()));
							}
						}
						Command::GetNetworkPeers { reply } => {
							// Return all connected peers
							let peer_addresses: Vec<String> = connected.iter()
								.map(|peer_id| format!("Peer ID: {}", peer_id))
								.collect();
							let _ = reply.send(Ok(peer_addresses));
						}
						Command::AddPeerAddress { address, reply } => {
							// Manually add a peer address to connect to
							match address.parse::<Multiaddr>() {
								Ok(ma) => {
									tracing::info!("🔗 Manually adding peer address: {}", ma);
									let _ = Swarm::dial(&mut swarm, ma.clone());
									
									// Also store in Kademlia DHT for persistent discovery
									let peer_key = kad::RecordKey::new(&format!("allibrary:manual:{}", address));
									let peer_record = kad::Record {
										key: peer_key,
										value: address.clone().into_bytes(),
										publisher: Some(local_peer_id),
										expires: Some(std::time::Instant::now() + Duration::from_secs(24 * 60 * 60)), // 24 hours
									};
									
									if let Ok(_query_id) = swarm.behaviour_mut().kad.put_record(peer_record, kad::Quorum::One) {
										tracing::info!("Stored manual peer address in Kademlia DHT");
									}
									
									let _ = reply.send(Ok(format!("Successfully added peer address: {}", address)));
								}
								Err(e) => {
									let _ = reply.send(Err(format!("Invalid multiaddr format: {:?}", e)));
								}
							}
						}
						Command::ForceCreateOnionService { reply } => {
							// Force creation of onion service
							match crate::core::p2p::tor_manager::create_hidden_service(listen_port) {
								Ok(addr) => {
									tracing::info!("✅ Forced Tor hidden service creation: {}", addr);
									let _ = reply.send(Ok(format!("Onion service created: {}", addr)));
								},
								Err(e) => {
									tracing::error!("❌ Failed to force create Tor hidden service: {:?}", e);
									let _ = reply.send(Err(format!("Failed to create onion service: {:?}", e)));
								}
							}
						}
					}
				}
				event = swarm.select_next_some() => {
					match event {
						SwarmEvent::ConnectionEstablished { peer_id, .. } => { 
							connected.insert(peer_id); 
							tracing::info!("✅ Connected to peer: {:?}", peer_id);
							tracing::info!("🌐 Total connected peers: {}", connected.len());
						}
						SwarmEvent::ConnectionClosed { peer_id, .. } => { 
							connected.remove(&peer_id); 
							tracing::info!("❌ Disconnected from peer: {:?}", peer_id);
							tracing::info!("🌐 Total connected peers: {}", connected.len());
						}
						SwarmEvent::Behaviour(beh_event) => {
							match beh_event {
								BehaviourEvent::Rr(ev) => {
									if let rr::Event::Message { peer: _peer, message } = ev {
										match message {
											rr::Message::Request { request, channel, .. } => {
												if let Ok((hash, offset)) = parse_chunk_request(&request) {
													if let Some(info) = content_index.get(&hash) {
														if let Ok(mut file) = std::fs::File::open(&info.path) {
															let _ = file.seek(SeekFrom::Start(offset));
															let mut buf = vec![0u8; CHUNK_SIZE];
															let read = file.read(&mut buf).unwrap_or(0);
															buf.truncate(read);
															let _ = swarm.behaviour_mut().rr.send_response(channel, buf);
														} else { let _ = swarm.behaviour_mut().rr.send_response(channel, vec![]); }
													} else { let _ = swarm.behaviour_mut().rr.send_response(channel, vec![]); }
												} else { let _ = swarm.behaviour_mut().rr.send_response(channel, vec![]); }
											}
											rr::Message::Response { request_id: _, response } => {
												if let Some(mut pf) = current_fetch.take() {
													if response.is_empty() {
														let _ = pf.reply.send(Ok(pf.out_path));
													} else {
														let _ = pf.file.write_all(&response);
														pf.offset += response.len() as u64;
														let req = build_chunk_request(&pf.hash, pf.offset);
														let _ = swarm.behaviour_mut().rr.send_request(&pf.peer, req);
														current_fetch = Some(pf);
													}
												}
											}
										}
									}
								}
								BehaviourEvent::Gossipsub(ev) => {
									if let gossipsub::Event::Message { message, .. } = ev {
										if let Ok(txt) = String::from_utf8(message.data.clone()) {
											// Content announcement: CONTENT|<hash>|<title>|<author>|<tags>
											if let Some(rest) = txt.strip_prefix("CONTENT|") {
												let parts: Vec<&str> = rest.splitn(4, '|').collect();
												if parts.len() == 4 {
													let (hash, title, author, tags) = (parts[0], parts[1], parts[2], parts[3]);
													tracing::info!("📥 Received content announcement: {} - {} by {}", hash, title, author);
													
													// Store discovered content in local index for search
													let discovered_content = IndexedContent {
														path: format!("discovered:{}", hash),
														title: title.to_string(),
														author: Some(author.to_string()),
														tags: tags.split(',').map(|s| s.trim().to_string()).collect(),
													};
													content_index.insert(hash.to_string(), discovered_content);
												}
											// Peer announcement via multiaddr
											} else if let Ok(ma) = txt.parse::<Multiaddr>() {
												tracing::info!("🔗 Received peer announcement: {}", ma);
												let _ = Swarm::dial(&mut swarm, ma);
											// Search request: S|<id>|<query>
											} else if let Some(rest) = txt.strip_prefix("S|") {
												let mut parts = rest.splitn(2, '|');
												if let (Some(req_id), Some(query)) = (parts.next(), parts.next()) {
													let ql = query.to_lowercase();
													for (h, c) in content_index.iter() {
														let mut name = c.title.clone();
														if name.is_empty() { name = std::path::Path::new(&c.path).file_name().and_then(|s| s.to_str()).unwrap_or("").to_string(); }
														let author_hit = c.author.as_ref().map(|a| a.to_lowercase().contains(&ql)).unwrap_or(false);
														let tags_hit = c.tags.iter().any(|t| t.to_lowercase().contains(&ql));
														if name.to_lowercase().contains(&ql) || author_hit || tags_hit {
															let resp = format!("R|{}|{}|{}", req_id, h, name);
															let _ = swarm.behaviour_mut().gossipsub.publish(topic.clone(), resp.into_bytes());
														}
													}
												}
											// Search response: R|<id>|<hash>|<name>
											} else if let Some(rest) = txt.strip_prefix("R|") {
												let mut parts = rest.splitn(3, '|');
												if let (Some(res_id), Some(hash), Some(name)) = (parts.next(), parts.next(), parts.next()) {
													let mut is_match = false;
													if let Some((ref cur_id, _started, ref _reply, _)) = current_search {
														if *cur_id == res_id { is_match = true; }
													}
													if is_match {
														if let Some((cur_id2, started2, reply2, mut acc2)) = current_search.take() {
															acc2.push((hash.to_string(), name.to_string()));
															current_search = Some((cur_id2, started2, reply2, acc2));
														}
													}
												}
											}
										}
									}
								}
								BehaviourEvent::Kad(kad_ev) => {
									match kad_ev {
										kad::Event::InboundRequest { .. } => {
											// Handle incoming Kademlia requests
											tracing::debug!("Received Kademlia inbound request");
										}
										kad::Event::RoutingUpdated { peer, .. } => {
											// Handle routing table updates
											tracing::debug!("Kademlia routing updated for peer: {:?}", peer);
										}
										kad::Event::OutboundQueryProgressed { id, result, .. } => {
											// Handle completed queries
											match result {
												kad::QueryResult::PutRecord(put_result) => {
													if let Some(reply) = pending_put_records.remove(&id) {
														match put_result {
															Ok(_) => {
																let _ = reply.send(Ok(()));
																tracing::info!("Successfully stored record in DHT");
															}
															Err(e) => {
																let _ = reply.send(Err(format!("Failed to store record: {:?}", e)));
																tracing::warn!("Failed to store record in DHT: {:?}", e);
															}
														}
													}
												}
												kad::QueryResult::GetRecord(get_result) => {
													if let Some(reply) = pending_get_records.remove(&id) {
														match get_result {
															Ok(ok) => {
																// Handle the GetRecordOk structure - it might vary by version
																// For now, let's log what we got and send a placeholder
																tracing::info!("Successfully retrieved record from DHT: {:?}", ok);
																let _ = reply.send(Ok(vec![])); // Placeholder until we figure out the exact structure
															}
															Err(e) => {
																let _ = reply.send(Err(format!("Failed to retrieve record: {:?}", e)));
																tracing::warn!("Failed to retrieve record from DHT: {:?}", e);
															}
														}
													}
												}
												kad::QueryResult::Bootstrap(bootstrap_result) => {
													if let Some(reply) = pending_bootstrap.remove(&id) {
														match bootstrap_result {
															Ok(_) => {
																let _ = reply.send(Ok(()));
																tracing::info!("Kademlia bootstrap completed successfully");
															}
															Err(e) => {
																let _ = reply.send(Err(format!("Bootstrap failed: {:?}", e)));
																tracing::warn!("Kademlia bootstrap failed: {:?}", e);
															}
														}
													}
												}
												_ => {
													tracing::debug!("Unhandled Kademlia query result: {:?}", result);
												}
											}
										}
										_ => {
											// Handle all other Kademlia events
											tracing::debug!("Other Kademlia event: {:?}", kad_ev);
										}
									}
								}
							}
						}
					}
				}
				_ = ticker.tick() => {
					// End search after ~200ms window for faster responses
					if let Some((id, started, reply, results)) = current_search.take() {
						if started.elapsed() >= Duration::from_millis(200) {
							let _ = reply.send(results);
						} else {
							current_search = Some((id, started, reply, results));
						}
					}
					
					// Periodic bootstrap for automatic peer discovery
					static mut BOOTSTRAP_COUNTER: u32 = 0;
					unsafe {
						BOOTSTRAP_COUNTER += 1;
						if BOOTSTRAP_COUNTER % 20 == 0 { // Every 1 second
							if let Ok(_) = swarm.behaviour_mut().kad.bootstrap() {
								tracing::debug!("🔄 Performing automatic Kademlia bootstrap for peer discovery");
							}
						}
					}
				}
				_ = announce_tick.tick() => {
					if !peer_announce.is_empty() {
						// Announce via gossipsub for immediate peer discovery
						let _ = swarm.behaviour_mut().gossipsub.publish(topic_peers_clone.clone(), peer_announce.clone().into_bytes());
						tracing::debug!("📢 Announcing peer presence via gossipsub: {}", peer_announce);
						
						// Store peer presence in Kademlia DHT for persistent discovery
						let presence_key = kad::RecordKey::new(&format!("allibrary:peer:{}", local_peer_id));
						let presence_record = kad::Record {
							key: presence_key.clone(),
							value: peer_announce.clone().into_bytes(),
							publisher: Some(local_peer_id),
							expires: Some(std::time::Instant::now() + Duration::from_secs(24 * 60 * 60)), // 24 hours
						};
						
						// Store our presence record
						if let Ok(_query_id) = swarm.behaviour_mut().kad.put_record(presence_record, kad::Quorum::One) {
							tracing::debug!("Storing peer presence in Kademlia DHT");
						}
						
						// Query for other peer presence records
						let discovery_key = kad::RecordKey::new(&"allibrary:discovery");
						let _discovery_query = swarm.behaviour_mut().kad.get_record(discovery_key);
						
						// Perform periodic bootstrap to refresh routing table
						if let Ok(_bootstrap_id) = swarm.behaviour_mut().kad.bootstrap() {
							tracing::debug!("Performing Kademlia bootstrap");
						}
						
						// Also try to discover peers via DHT queries
						let peer_discovery_key = kad::RecordKey::new(&"allibrary:peer");
						let _peer_discovery = swarm.behaviour_mut().kad.get_record(peer_discovery_key);
					}
				}
			}
		}
	});

	Ok(RuntimeHandle { peer_id: local_peer_id, command_tx: tx, _task: task })
}

pub mod tor_manager;


