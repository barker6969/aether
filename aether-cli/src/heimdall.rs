//! Heimdall wrapper — Samsung Odin protocol (Download Mode) operations.
//!
//! Heimdall (https://gitlab.com/BenjaminDobell/Heimdall — LGPL-3.0) is the
//! open-source reimplementation of Samsung's proprietary Odin flash tool.
//! It speaks the Loke protocol used by Samsung phones in Download Mode
//! (Vol-Down + Bixby + Power, then release and press Vol-Up).
//!
//! KNOWN LIMITATIONS (these are not bugs — they're Knox-imposed hardware constraints):
//! - Works on Galaxy S9 / Note 9 / A-series 2018 and earlier — partition writes
//!   succeed and a factory reset wipes userdata cleanly.
//! - On S10 through S22 / Note 10-20: read-only operations (PIT dump, device
//!   info) work, but partition writes fail because Knox 3.x requires
//!   Samsung-signed firmware sequences. The bridge returns the heimdall
//!   error so the user knows.
//! - S23+ and current foldables: Knox 3.7+ blocks Heimdall entirely.
//!
//! Like mtkclient, we keep Heimdall as a subprocess (`mere aggregation`)
//! so its LGPL license doesn't bleed into Aether's licensing.

use anyhow::{anyhow, Context, Result};
use std::process::Stdio;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::mpsc::UnboundedSender;

use crate::mtkclient::StreamLine;

/// Locate the `heimdall` binary on PATH. On Windows it's typically at
/// `C:\Program Files (x86)\Heimdall\heimdall.exe` after the official
/// installer runs; on macOS `brew install heimdall`; on Linux
/// `apt install heimdall-flash`.
fn find_heimdall() -> Result<String> {
    for candidate in ["heimdall", "heimdall.exe"] {
        if let Ok(out) = std::process::Command::new(candidate).arg("version").output() {
            if out.status.success() {
                return Ok(candidate.to_string());
            }
        }
    }
    Err(anyhow!(
        "heimdall not found on PATH — install it from:\n  \
         • Windows: https://glassechidna.com.au/heimdall/ (run the .msi, reboot)\n  \
         • macOS:   brew install heimdall\n  \
         • Linux:   sudo apt install heimdall-flash\n\
         You also need the Zadig USB driver bound to libusbK on Windows — see:\n  \
         https://github.com/Benjamin-Dobell/Heimdall/blob/master/Win32/README.txt"
    ))
}

/// Verify Heimdall is installed and report its version.
pub fn check_heimdall() -> Result<String> {
    let bin = find_heimdall()?;
    let out = std::process::Command::new(&bin)
        .arg("version")
        .output()
        .context("failed to spawn heimdall")?;
    if !out.status.success() {
        return Err(anyhow!("heimdall version failed: exit {:?}", out.status.code()));
    }
    // heimdall prints e.g.  "Heimdall v1.4.2"
    let text = String::from_utf8_lossy(&out.stdout).trim().to_string();
    Ok(text)
}

/// Spawn `heimdall ARGS...` and stream stdout/stderr through the channel.
/// Returns the exit code on completion.
pub async fn run_heimdall_streaming(
    args: &[&str],
    tx: UnboundedSender<StreamLine>,
) -> Result<i32> {
    let bin = find_heimdall()?;
    let mut cmd = Command::new(&bin);
    for a in args {
        cmd.arg(a);
    }
    cmd.stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .stdin(Stdio::null());
    let mut child: Child = cmd.spawn().context("failed to spawn heimdall")?;
    let stdout = child.stdout.take().ok_or_else(|| anyhow!("no stdout"))?;
    let stderr = child.stderr.take().ok_or_else(|| anyhow!("no stderr"))?;

    let tx_out = tx.clone();
    let stdout_task = tokio::spawn(async move {
        let mut lines = BufReader::new(stdout).lines();
        while let Ok(Some(line)) = lines.next_line().await {
            let _ = tx_out.send(StreamLine { stream: "stdout", line });
        }
    });
    let tx_err = tx.clone();
    let stderr_task = tokio::spawn(async move {
        let mut lines = BufReader::new(stderr).lines();
        while let Ok(Some(line)) = lines.next_line().await {
            let _ = tx_err.send(StreamLine { stream: "stderr", line });
        }
    });

    let status = child.wait().await.context("heimdall exited abnormally")?;
    let _ = stdout_task.await;
    let _ = stderr_task.await;
    drop(tx);
    Ok(status.code().unwrap_or(-1))
}

/// Collect heimdall output into a single string. Used by the
/// non-streaming CLI subcommands.
pub async fn run_heimdall_collect(args: &[&str]) -> Result<(i32, String)> {
    let owned: Vec<String> = args.iter().map(|s| s.to_string()).collect();
    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<StreamLine>();
    let join = tokio::spawn(async move {
        let refs: Vec<&str> = owned.iter().map(|s| s.as_str()).collect();
        run_heimdall_streaming(&refs, tx).await
    });
    let mut buf = String::new();
    while let Some(line) = rx.recv().await {
        buf.push_str(&line.line);
        buf.push('\n');
    }
    let exit = join.await.context("heimdall task panicked")??;
    Ok((exit, buf))
}
