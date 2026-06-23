# Changelog

All notable changes to Aether are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Windows build infrastructure (MSI, NSIS, Portable installers)
- macOS support (planned)

### Changed
- Improved build documentation

### Fixed
- AppImage bundling (linuxdeploy integration)

---

## [0.1.0] - 2026-06-23

### Added
- Initial release of Aether
- CLI tool for command-line operations
- Desktop application (Tauri-based)
- Linux support (DEB package, AppImage)
- Windows support (CLI, Desktop via GitHub Actions)
- Documentation for installation and usage
- GitHub Actions CI/CD workflows
- PowerShell build scripts for Windows

### Features
- Cross-platform support (Linux, Windows, macOS via CI)
- Unified repair console for licensed technicians
- CLI with full feature support
- Desktop GUI with WebView2 (Windows), GTK3 (Linux)
- Professional installer options (MSI, NSIS, Portable)

### Known Limitations
- macOS builds not yet tested (infrastructure ready)
- ARM support for CLI (arm64-apple-darwin compiled but not extensively tested)

---

## Version History

| Version | Release Date | Platform Support | Status |
|---------|--------------|------------------|--------|
| 0.1.0   | 2026-06-23   | Linux, Windows   | ✅ Released |

---

## Upcoming Releases

### v0.2.0 (Planned)
- macOS desktop app refinements
- Performance optimizations
- Enhanced documentation

### v1.0.0 (Planned)
- Stable API
- Extended platform support
- Production readiness

---

## Release Notes Format

When creating a new release, use this template:

```markdown
## [VERSION] - YYYY-MM-DD

### Added
- New feature A
- New feature B
- New feature C

### Changed
- Modified behavior X
- Updated component Y
- Improved performance Z

### Fixed
- Fixed bug A
- Fixed bug B
- Resolved issue C

### Deprecated
- Old API X (use Y instead)
- Legacy feature Z (will be removed in v2.0)

### Removed
- Removed legacy feature X
- Removed deprecated API Y

### Security
- Fixed security issue A (CVE-XXXX-XXXXX)
- Patched vulnerability B

### Technical
- Updated Tauri to version X
- Upgraded Rust toolchain to version X
- Refactored module X for clarity
```

---

## How to Release

See [RELEASE.md](RELEASE.md) for detailed release procedures.

**Quick release:**
```bash
# 1. Update version in files
# 2. Update CHANGELOG.md
# 3. Commit changes
git commit -m "Bump version to 0.2.0"

# 4. Create release tag
git tag release-v0.2.0

# 5. Push to GitHub
git push && git push origin release-v0.2.0

# 6. GitHub Actions will automatically build and create release
```

---

**Changelog maintained by**: Aether Development Team  
**Last updated**: 2026-06-23
