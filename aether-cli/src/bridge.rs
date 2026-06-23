//! Local WebSocket / JSON-RPC bridge.
//!
//! The Aether web dashboard connects here and sends JSON-RPC 2.0 requests
//! over a newline-delimited JSON TCP stream:
//!
//!   --> {"jsonrpc":"2.0","id":1,"method":"devices","params":{}}
//!   <-- {"jsonrpc":"2.0","id":1,"result":{"devices":[...]}}
//!
//!   --> {"jsonrpc":"2.0","id":2,"method":"info","params":{"port":"auto"}}
//!   <-- {"jsonrpc":"2.0","id":2,"result":{"chipset":"MT6895", ...}}
//!
//!   --> {"jsonrpc":"2.0","id":3,"method":"subscribe","params":{"channel":"hotplug"}}
//!   <-- {"jsonrpc":"2.0","method":"event","params":{"channel":"hotplug","kind":"attached","vid":"0e8d","pid":"2000"}}
//!
//! `id` is omitted for server-pushed events.
//!
//! The bridge also responds to the special method `hello` with a handshake
//! payload describing capabilities — the dashboard uses this to flip from
//! demo mode into live mode.

use anyhow::Result;
use colored::Colorize;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::sync::Arc;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::TcpListener;
use tokio::sync::Mutex;

const CLI_VERSION: &str = env!("CARGO_PKG_VERSION");
const BRIDGE_VERSION: &str = "1";

#[derive(Debug, Deserialize)]
struct RpcRequest {
    #[allow(dead_code)]
    jsonrpc: Option<String>,
    id: Option<Value>,
    method: String,
    #[serde(default)]
    params: Value,
}

#[derive(Debug, Serialize)]
struct RpcResponse<'a> {
    jsonrpc: &'static str,
    id: Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    result: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<RpcError<'a>>,
}

#[derive(Debug, Serialize)]
struct RpcError<'a> {
    code: i32,
    message: &'a str,
}

pub async fn serve(addr: &str) -> Result<()> {
    let listener = TcpListener::bind(addr).await?;
    println!(
        "  {} aether bridge listening on {} (JSON-RPC v{})",
        "○".bright_green(),
        addr.bright_white(),
        BRIDGE_VERSION,
    );
    println!(
        "  {} point the web dashboard at this CLI by running:",
        "↳".dimmed()
    );
    println!(
        "  {} localStorage.setItem('aether.bridge', 'ws://{}'); location.reload();",
        " ".dimmed(),
        addr.dimmed(),
    );
    println!();
    loop {
        let (sock, peer) = listener.accept().await?;
        println!("  {} client connected: {}", "+".bright_green(), peer);
        tokio::spawn(handle_client(sock));
    }
}

async fn handle_client(sock: tokio::net::TcpStream) {
    let (read, write) = sock.into_split();
    let write = Arc::new(Mutex::new(write));
    let mut reader = BufReader::new(read);
    let mut line = String::new();
    loop {
        line.clear();
        match reader.read_line(&mut line).await {
            Ok(0) => break,
            Ok(_) => {}
            Err(_) => break,
        }
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        let request: RpcRequest = match serde_json::from_str(trimmed) {
            Ok(r) => r,
            Err(e) => {
                send(&write, json!({
                    "jsonrpc": "2.0",
                    "id": Value::Null,
                    "error": { "code": -32700, "message": format!("parse error: {}", e) }
                })).await;
                continue;
            }
        };
        let id = request.id.clone().unwrap_or(Value::Null);
        let result = dispatch(&request.method, &request.params).await;
        let response = match result {
            Ok(value) => RpcResponse {
                jsonrpc: "2.0",
                id,
                result: Some(value),
                error: None,
            },
            Err(msg) => RpcResponse {
                jsonrpc: "2.0",
                id,
                result: None,
                error: Some(RpcError { code: -32000, message: &msg }),
            },
        };
        let payload = serde_json::to_value(&response).unwrap_or(Value::Null);
        send(&write, payload).await;
    }
    println!("  {} client disconnected", "-".red());
}

async fn send(write: &Arc<Mutex<tokio::net::tcp::OwnedWriteHalf>>, payload: Value) {
    let mut s = serde_json::to_string(&payload).unwrap_or_else(|_| "{}".into());
    s.push('\n');
    let mut g = write.lock().await;
    let _ = g.write_all(s.as_bytes()).await;
}

async fn dispatch(method: &str, params: &Value) -> Result<Value, String> {
    match method {
        "hello" => Ok(json!({
            "name": "aether-cli",
            "version": CLI_VERSION,
            "bridge": BRIDGE_VERSION,
            "capabilities": ["devices", "scan", "info", "bypass_frp", "repair_imei", "unlock_bootloader"],
        })),
        "devices" => Ok(json!({ "devices": crate::usb::devices_as_json().unwrap_or_default() })),
        "info" => {
            let port = params.get("port").and_then(|v| v.as_str()).unwrap_or("auto");
            // Currently stub — wire to exploits::info::read_device_info when ready
            Ok(json!({
                "port": port,
                "status": "stub",
                "message": "exploits::info is not yet implemented — see EXPLOITS_PORTING.md",
            }))
        }
        "bypass_frp" | "repair_imei" | "unlock_bootloader" => Ok(json!({
            "status": "stub",
            "method": method,
            "message": format!("{} not yet implemented — wire bkerler/mtkclient or bkerler/edl", method),
        })),
        other => Err(format!("unknown method: {}", other)),
    }
}
