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
use futures::{future::BoxFuture, io::{AsyncRead, AsyncWrite, AsyncReadExt, AsyncWriteExt}};
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
	UpdateIndex { hash: String, path: String },
	Fetch { hash: String, out_path: String, reply: oneshot::Sender<Result<String, String>> },
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
	let mut content_index: HashMap<String, String> = HashMap::new();
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
						Command::UpdateIndex { hash, path } => {
							content_index.insert(hash, path);
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
													if let Some(path) = content_index.get(&hash) {
														if let Ok(mut file) = std::fs::File::open(path) {
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
								BehaviourEvent::Gossipsub(_ev) => {}
							}
						}
						_ => {}
					}
				}
			}
		}
	});

	Ok(RuntimeHandle { peer_id: local_peer_id, command_tx: tx, _task: task })
}

pub mod tor_manager;


