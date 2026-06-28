//! Local WebSocket / JSON-RPC bridge.
//!
//! The Aether web dashboard connects here over WebSocket (ws://127.0.0.1:8765)
//! and sends JSON-RPC 2.0 requests. The bridge uses `tokio-tungstenite` so
//! browser `new WebSocket()` calls work directly — no protocol translator
//! needed in front of it.
//!
//!   --> {"jsonrpc":"2.0","id":1,"method":"hello","params":{}}
//!   <-- {"jsonrpc":"2.0","id":1,"result":{"name":"aether-cli","version":"0.1.0",...}}
//!
//!   --> {"jsonrpc":"2.0","id":2,"method":"mtk.frp_bypass","params":{}}
//!   <-- {"jsonrpc":"2.0","id":2,"result":{"job_id":"f0b1a2","status":"started"}}
//!   <-- {"jsonrpc":"2.0","method":"event","params":{"job_id":"f0b1a2","stream":"stdout","line":"Connecting..."}}
//!   <-- {"jsonrpc":"2.0","method":"event","params":{"job_id":"f0b1a2","stream":"done","exit_code":0}}

use anyhow::Result;
use colored::Colorize;
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::sync::Arc;
use tokio::net::TcpListener;
use tokio::sync::Mutex;
use tokio_tungstenite::tungstenite::Message;

use crate::mtkclient;

const CLI_VERSION: &str = env!("CARGO_PKG_VERSION");
const BRIDGE_VERSION: &str = "2";

/// One end of a WebSocket connection (write half) shared between the main
/// request-dispatch loop and any background `event` notification tasks.
type WsSink = Arc<
    Mutex<
        futures_util::stream::SplitSink<
            tokio_tungstenite::WebSocketStream<tokio::net::TcpStream>,
            Message,
        >,
    >,
>;

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
struct RpcResponse {
    jsonrpc: &'static str,
    id: Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    result: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<RpcError>,
}

#[derive(Debug, Serialize)]
struct RpcError {
    code: i32,
    message: String,
}

pub async fn serve(addr: &str) -> Result<()> {
    let listener = TcpListener::bind(addr).await?;
    println!(
        "  {} aether bridge listening on ws://{} (JSON-RPC v{})",
        "○".bright_green(),
        addr.bright_white(),
        BRIDGE_VERSION,
    );
    println!(
        "  {} the Aether web dashboard auto-connects on its next reload.",
        "↳".dimmed(),
    );
    println!();
    loop {
        let (sock, peer) = listener.accept().await?;
        println!("  {} client connected: {}", "+".bright_green(), peer);
        tokio::spawn(async move {
            match tokio_tungstenite::accept_async(sock).await {
                Ok(ws) => handle_client(ws).await,
                Err(e) => eprintln!("  ws handshake failed: {}", e),
            }
        });
    }
}

async fn handle_client(ws: tokio_tungstenite::WebSocketStream<tokio::net::TcpStream>) {
    let (write, mut read) = ws.split();
    let write: WsSink = Arc::new(Mutex::new(write));
    while let Some(msg) = read.next().await {
        let text = match msg {
            Ok(Message::Text(t)) => t,
            Ok(Message::Close(_)) | Err(_) => break,
            _ => continue,
        };
        let trimmed = text.trim();
        if trimmed.is_empty() {
            continue;
        }
        let request: RpcRequest = match serde_json::from_str(trimmed) {
            Ok(r) => r,
            Err(e) => {
                send_json(
                    &write,
                    json!({
                        "jsonrpc": "2.0",
                        "id": Value::Null,
                        "error": { "code": -32700, "message": format!("parse error: {}", e) }
                    }),
                )
                .await;
                continue;
            }
        };
        let id = request.id.clone().unwrap_or(Value::Null);
        let result = dispatch(&request.method, &request.params, &write).await;
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
                error: Some(RpcError { code: -32000, message: msg }),
            },
        };
        let payload = serde_json::to_value(&response).unwrap_or(Value::Null);
        send_json(&write, payload).await;
    }
    println!("  {} client disconnected", "-".red());
}

async fn send_json(write: &WsSink, payload: Value) {
    let s = serde_json::to_string(&payload).unwrap_or_else(|_| "{}".into());
    let mut g = write.lock().await;
    let _ = g.send(Message::Text(s)).await;
}

/// Generate a short unique-enough job id from system time.
fn new_job_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    format!("{:x}", nanos & 0xFFFFFFFF)
}

/// Spawn an mtkclient invocation and stream its lines back over the
/// connected WebSocket as JSON-RPC `event` notifications. Returns the
/// job_id so the dashboard can correlate the events with the original
/// request.
fn spawn_mtkclient_job(args: Vec<String>, write: WsSink) -> String {
    let job_id = new_job_id();
    let jid = job_id.clone();
    tokio::spawn(async move {
        let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<mtkclient::StreamLine>();
        let args_owned = args;
        let run_task = tokio::spawn(async move {
            let refs: Vec<&str> = args_owned.iter().map(|s| s.as_str()).collect();
            mtkclient::run_mtkclient_streaming(&refs, tx).await
        });
        while let Some(sl) = rx.recv().await {
            send_json(
                &write,
                json!({
                    "jsonrpc": "2.0",
                    "method": "event",
                    "params": { "job_id": jid, "stream": sl.stream, "line": sl.line },
                }),
            )
            .await;
        }
        let exit = match run_task.await {
            Ok(Ok(code)) => code,
            Ok(Err(e)) => {
                send_json(
                    &write,
                    json!({
                        "jsonrpc": "2.0",
                        "method": "event",
                        "params": { "job_id": jid, "stream": "stderr", "line": format!("aether: {}", e) },
                    }),
                )
                .await;
                -1
            }
            Err(_) => -1,
        };
        send_json(
            &write,
            json!({
                "jsonrpc": "2.0",
                "method": "event",
                "params": { "job_id": jid, "stream": "done", "exit_code": exit },
            }),
        )
        .await;
    });
    job_id
}

async fn dispatch(method: &str, params: &Value, write: &WsSink) -> Result<Value, String> {
    match method {
        "hello" => {
            let mtk_version = mtkclient::check_mtkclient().ok();
            Ok(json!({
                "name": "aether-cli",
                "version": CLI_VERSION,
                "bridge": BRIDGE_VERSION,
                "mtkclient": mtk_version,
                "capabilities": [
                    "devices",
                    "info",
                    "mtk.frp_bypass",
                    "mtk.repair_imei",
                    "mtk.unlock_bootloader",
                    "mtk.erase_userdata",
                    "mtk.read_info"
                ],
            }))
        }
        "devices" => Ok(json!({ "devices": crate::usb::devices_as_json().unwrap_or_default() })),

        "mtk.read_info" => {
            let job_id = spawn_mtkclient_job(vec!["printgpt".into()], write.clone());
            Ok(json!({ "job_id": job_id, "status": "started" }))
        }
        "mtk.frp_bypass" => {
            let job_id = spawn_mtkclient_job(vec!["e".into(), "frp".into()], write.clone());
            Ok(json!({ "job_id": job_id, "status": "started" }))
        }
        "mtk.repair_imei" => {
            let imei1 = params
                .get("imei1")
                .and_then(|v| v.as_str())
                .ok_or_else(|| "imei1 is required".to_string())?
                .to_string();
            let imei2 = params.get("imei2").and_then(|v| v.as_str()).map(|s| s.to_string());
            let mut args = vec!["w".into(), "imei".into(), imei1];
            if let Some(i2) = imei2 {
                args.push(i2);
            }
            let job_id = spawn_mtkclient_job(args, write.clone());
            Ok(json!({ "job_id": job_id, "status": "started" }))
        }
        "mtk.unlock_bootloader" => {
            let job_id = spawn_mtkclient_job(
                vec!["da".into(), "seccfg".into(), "unlock".into()],
                write.clone(),
            );
            Ok(json!({ "job_id": job_id, "status": "started" }))
        }
        "mtk.erase_userdata" => {
            let job_id = spawn_mtkclient_job(
                vec!["e".into(), "userdata,metadata".into()],
                write.clone(),
            );
            Ok(json!({ "job_id": job_id, "status": "started" }))
        }

        "doctor" => match mtkclient::check_mtkclient() {
            Ok(v) => Ok(json!({ "mtkclient": v, "ok": true })),
            Err(e) => Ok(json!({ "mtkclient": null, "ok": false, "error": e.to_string() })),
        },

        other => Err(format!("unknown method: {}", other)),
    }
}
