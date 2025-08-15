use async_socks5::{connect as socks_connect, AddrKind};
use futures::prelude::*;
use libp2p::{core::multiaddr::Protocol, Transport};
use multiaddr::Multiaddr;
use std::pin::Pin;
use tokio::net::TcpStream;
use tokio_util::compat::{TokioAsyncReadCompatExt, Compat};
use std::io;

// A minimal SOCKS5 transport that dials target addresses through a SOCKS proxy,
// then defers the rest of the stack to libp2p upgrades (noise/yamux).
#[derive(Clone)]
pub struct SocksProxyTransport {
	pub socks_addr: String,
}

impl SocksProxyTransport {
	pub fn new(socks_addr: String) -> Self { Self { socks_addr } }
}

impl Transport for SocksProxyTransport {
	type Output = Compat<TcpStream>;
	type Error = io::Error;
	type ListenerUpgrade = futures::future::Pending<Result<Self::Output, Self::Error>>;
	type Dial = Pin<Box<dyn Future<Output = Result<Self::Output, Self::Error>> + Send>>;

	fn listen_on(&mut self, _id: libp2p::core::transport::ListenerId, _addr: Multiaddr) -> std::result::Result<(), libp2p::core::transport::TransportError<Self::Error>> {
		Err(libp2p::core::transport::TransportError::Other(io::Error::new(io::ErrorKind::Other, "no listen")))
	}

	fn dial(&mut self, addr: Multiaddr) -> std::result::Result<Self::Dial, libp2p::core::transport::TransportError<Self::Error>> {
		// Extract host:port from multiaddr
		let mut host: Option<String> = None;
		let mut port: Option<u16> = None;
		for p in addr.iter() {
			match p {
				Protocol::Dnsaddr(h) | Protocol::Dns4(h) | Protocol::Dns6(h) | Protocol::Dns(h) => { host = Some(h.to_string()); },
				Protocol::Ip4(ip) => { host = Some(ip.to_string()); },
				Protocol::Ip6(ip) => { host = Some(ip.to_string()); },
				Protocol::Tcp(p) => { port = Some(p); },
				_ => {}
			}
		}
		let host = host.ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "missing host in multiaddr")).map_err(libp2p::core::transport::TransportError::Other)?;
		let port = port.ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "missing tcp in multiaddr")).map_err(libp2p::core::transport::TransportError::Other)?;
		let proxy_addr = self.socks_addr.clone();
		Ok(Box::pin(async move {
			// Connect to SOCKS proxy first
			let mut proxy_sock = TcpStream::connect(proxy_addr).await.map_err(|e| io::Error::new(io::ErrorKind::Other, format!("connect proxy failed: {}", e)))?;
			// Issue SOCKS CONNECT
			let _res: AddrKind = socks_connect(&mut proxy_sock, (host.as_str(), port), None).await.map_err(|e| io::Error::new(io::ErrorKind::Other, format!("socks dial failed: {}", e)))?;
			Ok(proxy_sock.compat())
		}))
	}
	fn dial_as_listener(&mut self, _addr: Multiaddr) -> std::result::Result<Self::Dial, libp2p::core::transport::TransportError<Self::Error>> { Err(libp2p::core::transport::TransportError::Other(io::Error::new(io::ErrorKind::Other, "no dial_as_listener"))) }
	fn remove_listener(&mut self, _id: libp2p::core::transport::ListenerId) -> bool { false }
	fn address_translation(&self, _listened: &libp2p::Multiaddr, _observed: &libp2p::Multiaddr) -> Option<libp2p::Multiaddr> { None }
	fn poll(self: Pin<&mut Self>, _cx: &mut std::task::Context<'_>) -> std::task::Poll<libp2p::core::transport::TransportEvent<Self::ListenerUpgrade, Self::Error>> { std::task::Poll::Pending }
}


