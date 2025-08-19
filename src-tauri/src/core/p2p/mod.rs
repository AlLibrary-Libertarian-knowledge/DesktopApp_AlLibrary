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
	let dial_ws = libp2p::websocket::WsConfig::new(SocksProxyTransport::new(socks_addr));
	let tcp_transport = tcp::tokio::Transport::new(tcp::Config::new().nodelay(true));
	let listen_ws = libp2p::websocket::WsConfig::new(tcp_transport);
	let base = OrTransport::new(dial_ws, listen_ws);

	let transport = base
		.upgrade(upgrade::Version::V1)
		.authenticate(noise::Config::new(&local_key)?)
		.multiplex(yamux::Config::default())
		.timeout(Duration::from_secs(20))
		.boxed();

	// Gossipsub
	let gossipsub_config = gossipsub::ConfigBuilder::default()
		.validation_mode(gossipsub::ValidationMode::None)
		.message_id_fn(|m| gossipsub::MessageId::from(&m.data[..]))
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

	// Kademlia for presence shared via Tor
	let store = kad::store::MemoryStore::new(local_peer_id);
	let kad_cfg = kad::Config::default();
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
	let onion_addr = crate::core::p2p::tor_manager::create_hidden_service(listen_port).unwrap_or_default();

	// Optional bootstrap onions (comma-separated list of host:port), e.g.,
	// ALLIB_BOOTSTRAP_ONIONS="abc123.onion:443,def456.onion:443"
	if let Ok(list) = std::env::var("ALLIB_BOOTSTRAP_ONIONS") {
		for item in list.split(',').map(|s| s.trim()).filter(|s| !s.is_empty()) {
			let mut parts = item.split(':');
			if let (Some(host), Some(port_str)) = (parts.next(), parts.next()) {
				if let Ok(port) = port_str.parse::<u16>() {
					let ma: Multiaddr = format!("/dnsaddr/{}/tcp/{}/ws", host, port).parse().unwrap_or_else(|_| "/ip4/127.0.0.1/tcp/9".parse().unwrap());
					let _ = Swarm::dial(&mut swarm, ma);
				}
			}
		}
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
	let mut ticker = tokio::time::interval(Duration::from_millis(200));
	let mut announce_tick = tokio::time::interval(Duration::from_secs(10));

	let (tx, mut rx) = mpsc::channel::<Command>(64);
	let topic_peers_clone = topic_peers.clone();
	let peer_announce = if !onion_addr.is_empty() { format!("/dnsaddr/{}/tcp/{}/ws/p2p/{}", onion_addr, listen_port, local_peer_id) } else { String::new() };
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
							content_index.insert(hash, IndexedContent { path, title, author, tags });
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
							// Broadcast a simple search request via gossipsub
							let id = uuid::Uuid::new_v4().to_string();
							let msg = format!("S|{}|{}", id, query);
							let _ = swarm.behaviour_mut().gossipsub.publish(topic.clone(), msg.into_bytes());
							// Collect local matches immediately
							let mut buf: Vec<(String, String)> = Vec::new();
							for (h, c) in content_index.iter() {
								let mut name = c.title.clone();
								if name.is_empty() { name = std::path::Path::new(&c.path).file_name().and_then(|s| s.to_str()).unwrap_or("").to_string(); }
								let ql = query.to_lowercase();
								let author_hit = c.author.as_ref().map(|a| a.to_lowercase().contains(&ql)).unwrap_or(false);
								let tags_hit = c.tags.iter().any(|t| t.to_lowercase().contains(&ql));
								if name.to_lowercase().contains(&ql) || author_hit || tags_hit { buf.push((h.clone(), name)); }
							}
							current_search = Some((id, std::time::Instant::now(), reply, buf));
						}
					}
				}
				event = swarm.select_next_some() => {
					match event {
						SwarmEvent::ConnectionEstablished { peer_id, .. } => { connected.insert(peer_id); }
						SwarmEvent::ConnectionClosed { peer_id, .. } => { connected.remove(&peer_id); }
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
											// Peer announcement via multiaddr
											if let Ok(ma) = txt.parse::<Multiaddr>() {
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
									BehaviourEvent::Kad(kad_ev) => {
										match kad_ev {
											kad::Event::InboundRequest { .. } => {}
											kad::Event::RoutingUpdated { .. } => {}
											kad::Event::OutboundQueryProgressed { id: _, result, .. } => {
												if let kad::QueryResult::GetRecord(Ok(ok)) = result {
													for rec in ok.records {
														if let Ok(txt) = String::from_utf8(rec.record.value.clone()) {
															if let Ok(ma) = txt.parse::<Multiaddr>() { let _ = Swarm::dial(&mut swarm, ma); }
														}
													}
												}
											}
										}
								}
							}
						}
						_ => {}
					}
				}
				_ = ticker.tick() => {
					// End search after ~1.2s window
					if let Some((id, started, reply, results)) = current_search.take() {
						if started.elapsed() >= Duration::from_millis(1200) {
							let _ = reply.send(results);
						} else {
							current_search = Some((id, started, reply, results));
						}
					}
				}
				_ = announce_tick.tick() => {
					if !peer_announce.is_empty() {
						let _ = swarm.behaviour_mut().gossipsub.publish(topic_peers_clone.clone(), peer_announce.clone().into_bytes());
						// Publish and query presence via Kademlia
						use libp2p::kad::record::{Key, Record};
						let key = Key::new(&"allibrary:presence");
						let rec = Record { key: key.clone(), value: peer_announce.clone().into_bytes(), publisher: None, expires: None };
						let _ = swarm.behaviour_mut().kad.put_record(rec, kad::Quorum::One);
						let _ = swarm.behaviour_mut().kad.get_record(key);
					}
				}
			}
		}
	});

	Ok(RuntimeHandle { peer_id: local_peer_id, command_tx: tx, _task: task })
}

pub mod tor_manager;


