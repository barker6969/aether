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
