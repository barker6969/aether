# Building Aether for Windows - Quick Start

This directory contains build scripts and documentation for creating Windows versions of Aether.

## Quick Build Guide

### 1. **Build CLI Only** (Fastest)
```powershell
.\scripts\build-cli-windows.ps1
# Output: aether-cli.exe (~1.6 MB) - Ready to distribute
```

### 2. **Build Desktop App** (Multiple Formats)

#### Option A: MSI Installer (Professional, Recommended)
```powershell
.\scripts\build-desktop-windows.ps1 -Type msi
# Output: Aether Repair Tool_0.1.0_x64_en-US.msi
```

#### Option B: NSIS Installer (Lightweight)
```powershell
.\scripts\build-desktop-windows.ps1 -Type nsis
# Output: Aether Repair Tool_0.1.0_x64-setup.exe
```

#### Option C: Portable EXE (No Installation)
```powershell
.\scripts\build-desktop-windows.ps1 -Type exe
# Output: aether-desktop.exe (~25 MB) - Ready to run
```

#### Option D: All Formats
```powershell
.\scripts\build-desktop-windows.ps1 -Type all
# Output: MSI + NSIS + Portable EXE
```

### 3. **Development Mode** (Testing Changes)
```powershell
.\scripts\build-desktop-windows.ps1 -Dev
# Opens app with hot reload - changes appear instantly as you edit
```

## File Structure

```
aether/
├── WINDOWS_BUILD.md                    # Detailed Windows build guide
├── scripts/
│   ├── build-cli-windows.ps1           # Automated CLI build
│   ├── build-desktop-windows.ps1       # Automated desktop build
│   └── README.md                       # This file
├── aether-cli/                         # Command-line tool
│   └── Cargo.toml
└── aether-desktop/                     # Desktop application (Tauri)
    └── src-tauri/
        └── tauri.conf.json
```

## Prerequisites Checklist

Before running build scripts, ensure you have:

- [ ] **Rust** - https://rustup.rs/
- [ ] **Node.js** (v18+) - https://nodejs.org/
- [ ] **Visual C++ Build Tools** - https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
- [ ] **WebView2 Runtime** - https://go.microsoft.com/fwlink/p/?LinkId=2124703

Verify with:
```powershell
node --version
npm --version
rustc --version
```

## Distribution

After building, you'll have:

### CLI Distribution
- **File**: `aether-cli.exe`
- **Size**: ~1.6 MB
- **Distribution**: Standalone portable executable
- **Usage**: Can be placed anywhere, added to PATH
- **Target Users**: Developers, automation, CLI enthusiasts

### Desktop Distribution
- **MSI**: Professional installer → App Store quality
- **NSIS**: Lightweight installer → Custom installation options  
- **Portable EXE**: No installation → USB drive, cloud storage
- **Target Users**: End users, enterprises, manual deployment

## Common Commands

```powershell
# Full clean rebuild (CLI)
Remove-Item -r aether-cli/target/
.\scripts\build-cli-windows.ps1

# Full clean rebuild (Desktop)
Remove-Item -r aether-desktop/src-tauri/target/
.\scripts\build-desktop-windows.ps1 -Type all

# List all build outputs
Get-ChildItem aether/aether-desktop/src-tauri/target/release/bundle -Recurse -Include *.exe,*.msi

# Test the portable desktop app
.\aether-desktop\src-tauri\target\release\aether-desktop.exe

# Test the CLI
.\aether-cli\target\release\aether-cli.exe --help
```

## Troubleshooting

### Issue: "PowerShell cannot be loaded because running scripts is disabled"
**Solution**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: "Error: failed to find tool 'cl.exe'"
**Solution**: Install Visual C++ Build Tools
1. Download: https://visualstudio.microsoft.com/downloads/
2. Run installer, select "Desktop development with C++"
3. Restart PowerShell
4. Retry build

### Issue: "WebView2 Runtime not found"
**Solution**: Install WebView2
- Download: https://go.microsoft.com/fwlink/p/?LinkId=2124703
- Windows 11 has it built-in
- Older Windows may need manual installation

## Build Pipeline

Both scripts follow this pipeline:

```
1. Check Prerequisites ✓
2. Install NPM/Yarn Dependencies ✓
3. Compile with Cargo/Tauri ✓
4. Sign Code (optional)
5. Create Bundle (MSI/NSIS/EXE) ✓
6. Generate Checksums (optional)
7. Output Ready-to-Distribute Files ✓
```

## Next Steps

1. **For Development**: See [../README_DEVELOPMENT.md](../README_DEVELOPMENT.md)
2. **For Contributing**: See [../CONTRIBUTING.md](../CONTRIBUTING.md)
3. **For Architecture**: See [../README.md](../README.md)

## CI/CD

These scripts are designed for:
- **Local development** - Windows developers can build locally
- **GitHub Actions** - Automated builds on commits/releases
- **Manual releases** - Run scripts to create release builds

See `.github/workflows/` for automated CI build configurations.

## Support

For issues:
1. Check [../WINDOWS_BUILD.md](../WINDOWS_BUILD.md) for detailed troubleshooting
2. Review build script output for error messages
3. Verify prerequisites with version checks above
4. Check Rust/Node documentation for environment issues

---

**Last Updated**: 2026-06-23
**Platform**: Windows 10+, Windows 11
**Architecture**: x86_64 (64-bit)
