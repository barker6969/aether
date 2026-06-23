# Building Aether for Windows

This guide explains how to build the Aether CLI and desktop application for Windows.

## Prerequisites

### Required Software

1. **Rust Toolchain** (latest stable)
   - Download from https://rustup.rs/
   - Run the installer and follow prompts
   - Verify: `rustc --version` and `cargo --version`

2. **Node.js & npm** (v18 or later)
   - Download from https://nodejs.org/
   - Verify: `node --version` and `npm --version`

3. **Yarn Package Manager**
   ```powershell
   npm install --global yarn
   ```

4. **C++ Build Tools** (for native dependencies)
   - **Option A: Visual Studio Build Tools** (lightweight)
     - Download: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
     - Install: Select "Desktop development with C++"
   
   - **Option B: Visual Studio Community** (full IDE, optional)
     - Download: https://visualstudio.microsoft.com/downloads/
     - Install: Select "Desktop development with C++"

5. **WebView2 Runtime** (for Tauri desktop app)
   - Download: https://go.microsoft.com/fwlink/p/?LinkId=2124703
   - Or it may already be installed on Windows 11

### Verify Setup

```powershell
# Test Rust
rustc --version
cargo --version

# Test Node
node --version
npm --version

# Test Yarn
yarn --version

# Test C++ tools (if using MSVC)
cl.exe /?
```

## Building the CLI

The CLI is a standalone command-line tool with no GUI dependencies.

### Build Release Binary

```powershell
cd aether/aether-cli

# Build release binary
cargo build --release

# Binary location
# .\target\release\aether-cli.exe
```

### Portable CLI Executable

The built `aether-cli.exe` is fully portable and can be run from any location without installation.

```powershell
# Copy to any location
copy .\target\release\aether-cli.exe C:\Users\YourUser\Desktop\

# Run from anywhere
aether-cli --help
```

## Building the Desktop App

The desktop application uses Tauri to wrap a web UI with local Rust backend.

### Build MSI Installer (Recommended)

```powershell
cd aether/aether-desktop

# Install dependencies
yarn install

# Build MSI installer
yarn build:msi

# Installer location
# .\src-tauri\target\release\bundle\msi\Aether Repair Tool_0.1.0_x64_en-US.msi
```

### Build NSIS Installer (Alternative)

```powershell
cd aether/aether-desktop

yarn install

yarn build:nsis

# Installer location
# .\src-tauri\target\release\bundle\nsis\Aether Repair Tool_0.1.0_x64-setup.exe
```

### Build Portable EXE (No Installation)

```powershell
cd aether/aether-desktop

yarn install

# Build the app (this creates the uninstalled binary)
yarn build

# The app is in:
# .\src-tauri\target\release\aether-desktop.exe

# You can run it directly without installation
.\src-tauri\target\release\aether-desktop.exe
```

### Development/Debug Build

To test changes during development:

```powershell
cd aether/aether-desktop

yarn install

# Run in debug mode with hot reload
yarn dev

# This opens the app with web dev tools active
```

## Build Output Locations

After building, find your files here:

```
aether/
├── aether-cli/
│   └── target/release/
│       └── aether-cli.exe                 # CLI executable (1.6 MB)
│
└── aether-desktop/
    └── src-tauri/target/release/
        ├── aether-desktop.exe             # Portable app binary
        └── bundle/
            ├── msi/
            │   └── Aether Repair Tool_0.1.0_x64_en-US.msi
            └── nsis/
                └── Aether Repair Tool_0.1.0_x64-setup.exe
```

## Troubleshooting

### "Error: failed to find tool 'cl.exe'"

**Solution**: Install Visual C++ Build Tools
1. Download Visual Studio Build Tools from https://visualstudio.microsoft.com/downloads/
2. Run installer and select "Desktop development with C++"
3. Restart PowerShell/Command Prompt
4. Retry build

### "Error: Could not find webview2"

**Solution**: Install WebView2 Runtime
1. Download from https://go.microsoft.com/fwlink/p/?LinkId=2124703
2. Run the installer
3. Retry build

### "Error: failed to locate Tauri CLI"

**Solution**: Reinstall npm dependencies
```powershell
cd aether/aether-desktop
rm -r node_modules package-lock.json yarn.lock
yarn install
```

### Port 3000 Already in Use

When running `yarn dev`, if you get "port 3000 already in use":
```powershell
# Kill the process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

Or change the port in `src-tauri/tauri.conf.json`:
```json
"devUrl": "http://localhost:3001"  // Change from 3000
```

## Distribution

### For End Users

- **Recommended**: MSI installer (professional, handles installation/uninstallation)
- **Alternative**: NSIS installer (lightweight installer with custom options)
- **Portable**: `aether-desktop.exe` (no installation needed)

### CLI Distribution

- Distribute `aether-cli.exe` as a standalone portable executable
- No installation required
- Can be added to PATH for system-wide access

## Command Reference

```powershell
# Navigate to project
cd aether

# Build CLI
cd aether-cli && cargo build --release

# Build Desktop - Full
cd aether-desktop && yarn install && yarn build

# Build Desktop - MSI
cd aether-desktop && yarn build:msi

# Build Desktop - NSIS
cd aether-desktop && yarn build:nsis

# Build Desktop - Development
cd aether-desktop && yarn dev

# Test CLI
./aether-cli/target/release/aether-cli --help

# Test Desktop (portable)
./aether-desktop/src-tauri/target/release/aether-desktop.exe
```

## Notes

- Builds are optimized for x86_64 (64-bit) Windows
- Minimum Windows version: Windows 10 (build 19041) or Windows 11
- For older Windows versions, may need to adjust Tauri config
- All builds include proper error handling and logging

## Next Steps

After building, see [CONTRIBUTING.md](./CONTRIBUTING.md) for development practices and [README_DEVELOPMENT.md](./README_DEVELOPMENT.md) for architecture details.
