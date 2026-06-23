# Aether — Changelog

## 2026-02-23 · Desktop CI green + Tauri wrapper shipped

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
