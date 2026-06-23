//! Local WebSocket bridge.
//!
//! `aether-cli serve --addr 127.0.0.1:8765`
//!
//! Starts a tiny TCP listener that the Aether web dashboard can connect to.
//! The web UI sends JSON commands like `{ "cmd": "scan" }` and receives device
//! events back as JSON lines. This is the recommended architecture: the CLI does
//! the low-level USB work, the web app stays a remote dashboard.

use anyhow::Result;
use colored::Colorize;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::TcpListener;

pub async fn serve(addr: &str) -> Result<()> {
    let listener = TcpListener::bind(addr).await?;
    println!(
        "  {} aether bridge listening on {}",
        "○".bright_green(),
        addr.bright_white()
    );
    loop {
        let (sock, peer) = listener.accept().await?;
        println!("  {} client connected: {}", "+".bright_green(), peer);
        tokio::spawn(async move {
            let (read, mut write) = sock.into_split();
            let mut reader = BufReader::new(read);
            let mut line = String::new();
            loop {
                line.clear();
                if reader.read_line(&mut line).await.unwrap_or(0) == 0 {
                    break;
                }
                let trimmed = line.trim();
                if trimmed.is_empty() {
                    continue;
                }
                // Echo for now — real impl dispatches to exploits::*
                let response = format!(
                    "{{\"ok\":true,\"echo\":{:?},\"note\":\"stub bridge\"}}\n",
                    trimmed
                );
                if write.write_all(response.as_bytes()).await.is_err() {
                    break;
                }
            }
            println!("  {} client disconnected", "-".red());
        });
    }
}
