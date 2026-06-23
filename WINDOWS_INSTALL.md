# Aether for Windows - Complete Guide

Aether now has full Windows support with multiple distribution options for CLI and desktop app.

## What is Aether?

**Aether** is a unified repair console for licensed technicians that provides:
- **CLI Tool** (`aether-cli`) - Standalone command-line utility for scripting and automation
- **Desktop App** - Native Windows application with graphical interface

## Getting Started on Windows

### Option 1: Download Pre-Built Binaries (Easiest)

Visit the [Releases](https://github.com/barker6969/aether/releases) page and download:

**For CLI Users:**
- `aether-cli.exe` - Command-line tool (~1.6 MB)

**For Desktop Users (Choose One):**
- `Aether Repair Tool_0.1.0_x64_en-US.msi` - Professional installer (recommended)
- `Aether Repair Tool_0.1.0_x64-setup.exe` - NSIS installer (lightweight)
- `aether-desktop.exe` - Portable app (no installation needed)

### Option 2: Build from Source

See [scripts/README.md](scripts/README.md) for automated build scripts.

**Quick build:**
```powershell
# Build CLI
.\scripts\build-cli-windows.ps1

# Build Desktop (all formats)
.\scripts\build-desktop-windows.ps1 -Type all

# Or just the format you need
.\scripts\build-desktop-windows.ps1 -Type msi
```

See [WINDOWS_BUILD.md](WINDOWS_BUILD.md) for detailed build instructions.

## CLI Usage

### Installation

1. Download `aether-cli.exe` from [Releases](https://github.com/barker6969/aether/releases)
2. Place it anywhere on your system
3. Optionally add the directory to your PATH for system-wide access

### Usage

```powershell
# Show help
aether-cli --help

# Show version
aether-cli --version

# Example command (consult documentation for full CLI API)
aether-cli command-name --option value
```

### Adding to PATH (Optional)

Make `aether-cli` callable from anywhere:

**PowerShell (Admin Required):**
```powershell
# Add to PATH
[Environment]::SetEnvironmentVariable(
    "Path",
    [Environment]::GetEnvironmentVariable("Path", "User") + ";C:\path\to\aether",
    "User"
)

# Verify
aether-cli --version
```

**Command Prompt (Admin Required):**
```cmd
setx PATH "%PATH%;C:\path\to\aether"
```

## Desktop App Installation

### MSI Installer (Professional, Recommended)

**Benefits:**
- Professional Windows installer
- Uninstall via Control Panel
- System shortcuts/Start menu integration
- Automatic updates (when configured)

**Installation:**
1. Download `Aether Repair Tool_0.1.0_x64_en-US.msi`
2. Double-click to open installer
3. Follow installation wizard
4. Launch from Start menu or desktop shortcut

**Uninstallation:**
- Settings → Apps → Apps & Features → Find "Aether Repair Tool" → Uninstall

### NSIS Installer (Lightweight)

**Benefits:**
- Smaller download than MSI
- Custom installation options
- Portable/Standalone installation option

**Installation:**
1. Download `Aether Repair Tool_0.1.0_x64-setup.exe`
2. Double-click to open installer
3. Choose installation location
4. Complete setup

### Portable App (No Installation)

**Benefits:**
- No installation required
- Runs from USB drive
- Perfect for testing
- No system modifications

**Usage:**
1. Download `aether-desktop.exe`
2. Run directly by double-clicking
3. Or from command prompt: `aether-desktop.exe`

## System Requirements

| Component | Requirement |
|-----------|-------------|
| **OS** | Windows 10 (build 19041) or Windows 11 |
| **Architecture** | 64-bit (x86_64) |
| **Disk Space** | ~100 MB for CLI + dependencies |
|  | ~500 MB for Desktop app |
| **RAM** | 2 GB minimum (4 GB recommended) |
| **WebView2** | Windows 11 has built-in; Windows 10 may need [runtime](https://go.microsoft.com/fwlink/p/?LinkId=2124703) |

## Troubleshooting

### CLI

**Issue: "aether-cli is not recognized"**
- Solution: Either use full path (`C:\path\to\aether-cli.exe`) or add directory to PATH

**Issue: "File is blocked" dialog when running**
- Solution: Right-click → Properties → Check "Unblock" → Apply

**Issue: Antivirus quarantining the file**
- Solution: This is a false positive. Add to antivirus whitelist or download from official releases only

### Desktop App

**Issue: "WebView2 Runtime not found"**
- Solution: Download [WebView2 Runtime](https://go.microsoft.com/fwlink/p/?LinkId=2124703)
- Windows 11 has it built-in

**Issue: "App won't start" or crashes immediately**
- Solution: 
  1. Ensure Windows is up to date
  2. Verify WebView2 is installed
  3. Check Windows Event Viewer for error details
  4. Try portable version to rule out installer issues

**Issue: Permission denied when installing**
- Solution: Run installer as Administrator
- Right-click installer → "Run as Administrator"

### Common Solutions

```powershell
# Update Windows
wsl --update

# Verify WebView2
& "C:\Program Files\Internet Explorer\iexplore.exe"

# Check system info
systeminfo | findstr /C:"OS Version" /C:"System Type"

# Restart to clear temporary issues
Restart-Computer
```

## Advanced Usage

### Command-Line Deployment

**For IT Departments:**
```powershell
# Silent MSI installation
msiexec /i "Aether_Repair_Tool.msi" /quiet /norestart

# NSIS silent installation
"Aether_Setup.exe" /S /D="C:\Program Files\Aether"
```

### Portable Deployment

**For mobile/USB distribution:**
```powershell
# Copy portable app to USB
xcopy "aether-desktop.exe" "E:\Aether\" /Y

# Copy CLI to USB
xcopy "aether-cli.exe" "E:\Aether\CLI\" /Y
```

### Development/Testing

If you need to modify or rebuild:

1. See [WINDOWS_BUILD.md](WINDOWS_BUILD.md) for build from source
2. See [README_DEVELOPMENT.md](README_DEVELOPMENT.md) for development workflow
3. See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines

## Architecture Overview

```
Aether (Windows)
│
├── CLI (Rust Binary)
│   └── aether-cli.exe (~1.6 MB)
│       ├── Native compilation
│       ├── No dependencies
│       └── Runs anywhere
│
└── Desktop App (Tauri Framework)
    ├── Frontend (Web UI)
    ├── Rust Backend
    └── Distributions:
        ├── MSI Installer (~22 MB)
        ├── NSIS Installer (~23 MB)
        └── Portable EXE (~25 MB)
```

## Support & Resources

- **Bug Reports**: [GitHub Issues](https://github.com/barker6969/aether/issues)
- **Documentation**: See [README.md](README.md)
- **Development**: See [README_DEVELOPMENT.md](README_DEVELOPMENT.md)
- **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md)

## Version Information

- **Aether Version**: 0.1.0
- **Build Date**: 2026-06-23
- **Platform**: Windows x86_64
- **Target Windows**: Windows 10 (19041) and Windows 11

## Next Steps

1. **Download & Install**
   - Go to [Releases](https://github.com/barker6969/aether/releases)
   - Choose CLI and/or Desktop app
   - Follow installation instructions above

2. **Learn to Use**
   - CLI: Run `aether-cli --help`
   - Desktop: See in-app help and documentation

3. **Report Issues**
   - Found a bug? [Report on GitHub](https://github.com/barker6969/aether/issues)
   - Include OS version, error messages, reproduction steps

4. **Contribute**
   - Interested in development? See [CONTRIBUTING.md](CONTRIBUTING.md)
   - Join the project!

---

**Platform**: Windows 10+, Windows 11  
**Architecture**: x86_64 (64-bit)  
**Last Updated**: 2026-06-23
