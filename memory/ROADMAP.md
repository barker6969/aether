# Aether — Roadmap

## P0 — Active
*(empty — Path A done, desktop CI green, web app 100% verified)*

## P1 — Next up
- **Publish the desktop draft Release** on GitHub (`braidenbarker/aether`) → flips all in-app download buttons live.
- **Re-tag `desktop-v0.1.0`** so the rewritten workflow runs cleanly (delete old tag → push new tag).
- **Tag `v0.1.0`** for the CLI → 4 build artifacts auto-publish.
- **Code-signing**: add Windows Authenticode + macOS Developer ID secrets so installers don't show SmartScreen / Gatekeeper warnings.
- **IMEI Repair modal** — form for inputting IMEI1/IMEI2 with strong legal disclaimer checkbox, then wires into `BRIDGE_METHODS.repair_imei`.

## P2 — Backlog
- Persist credits + log history to MongoDB (currently client-side only).
- Port real Qualcomm exploits — wrap `edl.py` (https://github.com/bkerler/edl) the same way mtkclient is wrapped. ~3 days.
- Wire `DownloadCliButton` and `DownloadDesktopButton` to use tag-specific URLs (`/releases/download/<tag>/<file>`) so desktop + CLI releases can coexist without "latest" picking the wrong one.
- "Sign in on Desktop" deep-link flow — first-launch auto-auth.
- Wrap `rusb::devices()` for graceful USB-less fallback (no panic on Docker/headless) → ship as `aether-cli v0.2.0`.
- Theme toggle (light mode), multi-language, additional chipset DB.
- Add `data-testid` to dashboard top-level panels (device-status, device-info, quick-actions, console, hero-card, stat-tiles) for easier future automation.

## P3 — Future
- Braiden AI Companion HUD (Claude Sonnet 4.5 via Emergent LLM Key) — context-aware floating chat reading active operation + console logs.
- Auto-update channel for the Tauri app (built-in support, needs signing keys wired).
- Apple DFU support — wrap `checkra1n` / `pongoOS` for legacy iPhone models.
- Samsung KG / MDM bypass via `Heimdall` or similar tool.
