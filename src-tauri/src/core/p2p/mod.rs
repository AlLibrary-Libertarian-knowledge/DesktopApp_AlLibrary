use anyhow::Result;
use libp2p::{
	core::upgrade,
	gossipsub,
	identity,
	noise,
	swarm::{NetworkBehaviour, Swarm, SwarmEvent, Config as SwarmConfig, Executor},
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
}

pub async fn start_runtime(socks: Option<String>) -> Result<RuntimeHandle> {
	// Identity
	let local_key = identity::Keypair::generate_ed25519();
	let local_peer_id = PeerId::from(local_key.public());

	// Base transport: either SOCKS-dialed TCP or direct TCP
	let socks_addr = socks.ok_or_else(|| anyhow::anyhow!("SOCKS proxy is required for P2P runtime"))?;
	let proxy = SocksProxyTransport::new(socks_addr);
	let base = libp2p::websocket::WsConfig::new(proxy);

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
	gossipsub.subscribe(&topic)?;

	// Request/Response
	let protocols = std::iter::once(("/allibrary/chunk/1".to_string(), rr::ProtocolSupport::Full));
	let rr = rr::Behaviour::<ChunkCodec>::new(protocols, Default::default());

	let behaviour = Behaviour { gossipsub, rr };
	struct TokioExec;
	impl Executor for TokioExec {
		fn exec(&self, fut: std::pin::Pin<Box<dyn futures::Future<Output = ()> + Send + 'static>>) {
			tokio::spawn(fut);
		}
	}
	let mut swarm = Swarm::new(transport, behaviour, local_peer_id, SwarmConfig::with_executor(TokioExec));

	// State
	#[derive(Clone)]
	struct IndexedContent { path: String, title: String, author: Option<String>, tags: Vec<String> }
	let mut content_index: HashMap<String, IndexedContent> = HashMap::new();
	let mut connected: HashSet<PeerId> = HashSet::new();
	const CHUNK_SIZE: usize = 64 * 1024;

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

	let (tx, mut rx) = mpsc::channel::<Command>(64);
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
											// Search request: S|<id>|<query>
											if let Some(rest) = txt.strip_prefix("S|") {
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
			}
		}
	});

	Ok(RuntimeHandle { peer_id: local_peer_id, command_tx: tx, _task: task })
}

pub mod tor_manager;


