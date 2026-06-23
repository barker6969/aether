# Aether — Roadmap

## P0 — Active
*(empty — desktop CI is green and download buttons are wired live)*

## P1 — Next up
- **Publish the desktop draft Release** on GitHub (`braidenbarker/aether`) → flips all in-app download buttons live.
- **Code-signing**: add Windows Authenticode signing cert + macOS Developer ID secrets to GitHub repo so the `.msi` and `.dmg` don't show "Untrusted" warnings on first launch.
- **`aether-cli` v0.1.0** — tag `v0.1.0` to ship the first CLI release. Stubbed exploits at first; real ones follow.

## P2 — Backlog
- Persist credits + log history to MongoDB (currently client-side only).
- Port real exploit modules to Rust CLI per `/app/aether-cli/EXPLOITS_PORTING.md` (libusb / BROM / EDL / DFU).
- Wire `DownloadCliButton` and `DownloadDesktopButton` to use tag-specific URLs (`/releases/download/<tag>/<file>`) so desktop + CLI releases can coexist without "latest" picking the wrong one.
- "Sign in on Desktop" deep-link flow — first-launch auto-auth instead of password prompt.
- Theme toggle (light mode), multi-language, additional chipset DB.

## P3 — Future
- Braiden AI Companion HUD (Claude Sonnet 4.5 via Emergent LLM Key) — context-aware floating chat reading active operation + console logs.
- Auto-update channel for the Tauri app (built-in support, just needs signing key wired up).
- Native USB device picker via Tauri IPC `invoke()` once `aether-cli` ports real exploits.
