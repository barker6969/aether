# Aether — Changelog

## 2026-02-23 · Desktop CI green + Tauri wrapper shipped

### Path A — Real device repair via mtkclient subprocess wrapper (Feb 23, evening)
**Aether is no longer a stub — it actually repairs MTK devices.**

- **`aether-cli/src/mtkclient.rs` (NEW)** — Subprocess wrapper around `python -m mtkclient` (https://github.com/bkerler/mtkclient — GPL-3.0). Streams stdout/stderr line-by-line via Tokio mpsc channel. Subprocess invocation pattern keeps Aether outside the GPL derivative-work boundary (`mere aggregation` per FSF guidance).
- **`aether-cli/src/exploits/{frp,imei,bootloader,info}.rs`** — Converted from stubs to real implementations that shell out to mtkclient:
  - `frp.rs` → `mtkclient e frp` (erase FRP partition)
  - `imei.rs` → `mtkclient w imei <imei1> [imei2]` (with Luhn validation + legal warning)
  - `bootloader.rs` → `mtkclient da seccfg unlock`
  - `info.rs` → `mtkclient printgpt`
- **`aether-cli/src/bridge.rs` (REWRITTEN)** — Converted raw TCP newline-JSON to real **WebSocket via tokio-tungstenite**. Browser `new WebSocket()` now connects directly. New event-streaming protocol: long-running jobs return `{job_id, status:"started"}` immediately, then push `event` notifications with each line of mtkclient output. Capabilities advertised: `mtk.frp_bypass`, `mtk.repair_imei`, `mtk.unlock_bootloader`, `mtk.erase_userdata`, `mtk.read_info`, `devices`, `info`.
- **`aether-cli/src/main.rs`** — Added `setup` subcommand (`pip install --user mtkclient`) + `doctor` subcommand (verify install).
- **`aether-cli/Cargo.toml`** — Added `tokio-tungstenite` + `futures-util` + tokio `process`/`io-util`/`net`/`sync` features.
- **`aether-cli/NOTICE.md` (NEW)** — GPL-3.0 attribution, IMEI legal warning, trademark notices.
- **`frontend/src/hooks/useCliBridge.js`** — New `runJob(method, params, onEvent)` API with job_id event subscription map. Auto-reconnect every 5s. Gates connection behind `localStorage.aether.bridge.enabled === "1"`.
- **`frontend/src/context/AppContext.jsx`** — `runAction` now prefers `cliBridge.runJob()` when the bridge is connected (streams real mtkclient output to console); falls back to `ACTION_LOG_TEMPLATES` demo simulation when offline. Console label: `EXECUTING (LIVE):` vs `EXECUTING (DEMO):`.
- **Verified end-to-end via Python WebSocket smoke test**: bridge v2 advertises 7 capabilities, `mtk.frp_bypass` returns job_id immediately, streams stderr ("mtkclient not installed") + done event with exit_code=1. Frontend regression test (iteration_5) = 100% pass on all 10 items.
- **User workflow now**: install `.msi` → `aether-cli setup` (one-time, installs mtkclient via pip) → plug in phone in BROM mode → click Bypass FRP in dashboard → real FRP partition erased.

### Polish pass — P2 bug fixes (Feb 23, late)
- **Sidebar mobile drawer** — was always 240px regardless of viewport; squeezed mobile content to ~135px and caused hero card title to wrap letter-by-letter. Now hides off-screen below `lg` (1024px), hamburger (top-left, `lg:hidden`) toggles a drawer with backdrop, auto-closes on route change. Verified at 375 / 768 / 1024 / 1920px viewports.
- **Form error accessibility** — Login + Signup error elements now have `role="alert"` + `className="error"` so screen readers + automated test selectors pick them up.
- **Shared release constants** — `/app/frontend/src/lib/releases.js` centralizes `DESKTOP_VERSION`, `CLI_VERSION`, `DESKTOP_RELEASES_BASE`, `CLI_RELEASES_BASE`. `DownloadDesktopButton`, `DownloadCliButton`, `GetDesktopHeroCard` all import from it — single source of truth on version bumps.
- **Replaced broken `get.aether.sh/cli.sh`** install command in `DownloadCliButton` with a real PowerShell one-liner that downloads the actual Windows zip from the GitHub Release.
- **GetDesktopHeroCard responsive layout** — hero card now uses `flex-col md:flex-row` with mobile-first stacking and full-width CTA below md.
- Verified by testing_agent_v3_fork — iteration_4 = 100% pass (4 viewports × 4 regressions).

### aether-cli v0.1.0 ship-readiness (Feb 23)
- Fixed Rust borrow-checker bug in `bridge.rs` — `RpcError` held a `&str` reference to a `String` dropped mid-match arm. Switched to owned `String`. Binary compiles clean (`cargo build --release` 13s, 1.5 MB stripped).
- Verified runtime: `--help`, `--version`, `serve` all functional.
- Added `libudev-dev` to CLI Linux CI deps (transitive `serialport` requirement).
- Known limitation: `rusb::devices()` panics on USB-less environments (containers, headless CI). Real Windows/macOS/Linux tech machines are fine. Defer graceful fallback to v0.2.0.

### Tauri Desktop Wrapper
- `/app/aether-desktop/` — Tauri 2 wraps the React dashboard as native `.msi` (Win x64), `.dmg` (macOS Universal), `.AppImage` (Linux x64).
- `public/index.html` splash bootstrap + 6s remote-URL fallback redirect.
- Generated full icon set (32 / 128 / 128@2x / .ico / .icns / Windows-Store Square sizes) committed to repo.
- Rust 1.96 toolchain validated; `cargo check --release` passes in 59s.

### CI workflows
- `.github/workflows/aether-desktop-release.yml` — official `tauri-apps/tauri-action@v0`, 3 jobs (Win/macOS Universal/Linux), creates draft Release on `desktop-v*` tag.
- `.github/workflows/aether-cli-release.yml` — 4 jobs (Linux x64, macOS arm/x64, Windows x64), auto-publishes Release on `v*` tag.
- Dropped fragile targets: `aarch64-pc-windows-msvc`, `aarch64-unknown-linux-gnu` cross-compile.
- Removed icon `.gitignore` exclusions so generated icons ship with the repo.

### Frontend conversion surfaces
- `DownloadDesktopButton.jsx` (window chrome) — 3-platform popover.
- `GetDesktopHeroCard.jsx` (Dashboard) — dismissible hero with `.msi` primary CTA + `.dmg`/`.AppImage` secondary.
- `DownloadCliButton.jsx` — rewired from fake shell-stub to real GitHub Release URLs (4 platforms).
- Env vars: `REACT_APP_GITHUB_RELEASES_URL` + `REACT_APP_CLI_RELEASES_URL` → `https://github.com/braidenbarker/aether/releases/latest/download`.

### Repo
- Live at `braidenbarker/aether` on GitHub.
- `desktop-v0.1.0` produced a draft Release — publish via GitHub UI to activate in-app download buttons.

---

## 2026-02 · Web app finalization (prior fork)
- Auth (JWT + Emergent Google OAuth) + Stripe Checkout (test mode) + admin auto-seed.
- Dashboard, MTK/Qualcomm/iPhone service modules, Logs, Pricing, Settings, Docs.
- Cloud Exploit DB live feed, Founding Builder $299 lifetime CTA, Demo Mode banner.
- Scaffolded Rust CLI (`/app/aether-cli/`) with JSON-RPC bridge stub.
