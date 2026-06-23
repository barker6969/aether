# Aether Repair Tool — PRD

## Original problem statement
Desktop-style dashboard for "Aether Repair Tool" (mobile repair software). Looks like a professional Windows utility (dark mode, hacker tool aesthetic). Sidebar navigation, large device status indicator, MTK / Qualcomm / iPhone tabs with bypass FRP / IMEI repair / unlock bootloader / erase userdata, scrolling terminal-style console, device info panel.

## Design choices
- Cyber green (#00FF41) on near-black, IBM Plex Sans + JetBrains Mono
- Pure UI mockup — no real hardware integration
- Mock device cycler (MTK + Qualcomm random), simulated USB + COM ports
- No auth; straight to dashboard

## Architecture
- React 19 + react-router 7 + Tailwind, custom AppContext (no backend changes)
- Pages: /, /mtk, /qualcomm, /iphone, /logs, /pricing, /settings
- Shared state: device, status, comPort, logs, activeAction, progress, credits, autoConnect
- Mock data: 5 MTK chipsets + 5 Qualcomm chipsets, IMEI/serial/cpuId generators
- Console hook with timestamp + level color coding (INFO/SUCCESS/WARN/ERROR)
- Boot sequence with required `[Aether]` engine-loaded log lines

## Implemented (Feb 2026)
- Window chrome (fake title bar) + Sidebar (logo, credits widget, 7 nav items) + StatusBar
- Dashboard: 4 stat tiles, DeviceStatus panel (Searching → Detected animation), DeviceInfoPanel, ActionGrid, Console
- MTK + Qualcomm + iPhone service modules (each with action grid, supported chipset matrix, console)
- Logs page (filter by level, grep search, .log export)
- Pricing & Credits page (Solo Builder $89/yr plan, 4 services with credit costs, top-up packs, working credit top-up)
- Settings page (toggle preferences, exploit DB, about)
- Animated USB scan, simulated multi-step operations with progress bar

## What is mocked
EVERYTHING is MOCKED — there is no real device interaction, no real bypass / repair / unlock logic, and no payment processing. All device data, logs, and credit operations are client-side simulated.

## Backlog
- P1: persist credits + log history to MongoDB
- P1: real Stripe-based credit top-up
- P2: dark/light theme toggle, additional chipset DB, multi-language

## Production Finalization (Feb 2026)
- Cloud Exploit Database panel on Dashboard with live CVE feed (CVE-2026-25262 active, MT6983 BROM fixed, etc.), filter pills, auto-injecting fresh advisories every 9s
- Founding Builder $299 lifetime CTA banner (dismissible) on Dashboard + dedicated card on Pricing page (animated green-glow border, 6 features, 500 bonus credits on claim)
- Download Aether CLI button in Window Chrome top bar + iPhone Service header → popover with one-line install, 6 native build targets, generates real shell stub download
- iPhone Service header rebranded with Aether logo overlay + "AETHER NATIVE" badge + large faded watermark
- Dashboard layout restructured: stats → device/info/actions row → CloudExploitDB (5/12) + Console (7/12)

## Auth + Stripe + Docs (Feb 2026)
- Backend (`/app/backend/server.py`): JWT email/password auth + Emergent Google OAuth session exchange + Stripe Checkout (real test-mode via emergentintegrations) + webhook + brute-force lockout (email-keyed for k8s safety) + admin auto-seed
- Endpoints: /api/auth/{signup,login,logout,me,session}, /api/stripe/{pricing,checkout,status/{id}}, /api/webhook/stripe
- Frontend: Login + Signup pages (Google + email/password), AuthCallback (hash-fragment race-safe), ProtectedRoute, UserProfile popover (member since, plan, provider, credits, sign out), BuyCreditsModal (2 plans + 4 packs all wired to Stripe), DocsHub + DocArticle (3 markdown guides — Samsung KG / MTK FRP / Qualcomm IMEI rendered via react-markdown), Terms + Privacy pages, Footer with ToS/Privacy/Docs links
- Test creds: admin@aether.dev / aether_admin_2026 (founding_builder, 5000 credits)
- Bugs fixed post-test: brute-force lockout (was using k8s pod IP, now email-only), Stripe status (was 500ing, now graceful fallback to cached txn state)
- KNOWN LIMITATION: Stripe status fetch via emergentintegrations SDK hits api.stripe.com directly which doesn't know about Emergent-proxy sessions — fulfilment relies on the /api/webhook/stripe webhook firing. UI gracefully shows pending with warning until webhook reconciles.

## Native Desktop App — Tauri 2 (Feb 2026)
- `/app/aether-desktop/` — Tauri 2 wrapper that bundles the React dashboard as a native `.msi` / `.exe` / `.dmg` / `.AppImage`. Window chrome theme=Dark, 1600×1000, WebView2 on Windows.
- **Fixed P0 build blockers**: `frontendDist` now points at `public/index.html` (graceful "trying to reach Aether" splash + 6s remote fallback redirect). Icon set generated via `npx tauri icon` (32 / 128 / 128@2x / .ico / .icns / Square Windows-Store sizes). Rust toolchain installed + `cargo check --release` validates the workspace builds cleanly on Linux ARM64.
- **P1 — Frontend conversion surface**:
  - `DownloadDesktopButton.jsx` in window chrome top bar → popover with 5 platform targets (Win x64/arm64, macOS arm/intel, Linux x64), all pointing at GitHub Releases.
  - `GetDesktopHeroCard.jsx` on Dashboard — dismissible hero card with `.msi` primary CTA + `.dmg`/`.AppImage` secondary links, localStorage-remembered.
- **P2 — Polish**:
  - `DownloadCliButton.jsx` rewired from fake shell-stub to real GitHub Release URLs (configurable via `REACT_APP_CLI_RELEASES_URL`).
  - Env vars added: `REACT_APP_GITHUB_RELEASES_URL`, `REACT_APP_CLI_RELEASES_URL` — flip on once `git tag desktop-v0.1.0 && git push --tags` is run.
- CI: `.github/workflows/aether-desktop-release.yml` matrix-builds .msi/.exe/.dmg/.AppImage for x64+arm64 across Windows/macOS/Linux on tag `desktop-v*`.
