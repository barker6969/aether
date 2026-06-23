# Release Guide for Aether

This guide explains how to create and distribute new releases of Aether across all platforms.

## Overview

Aether has automated release workflows that build and package the application for multiple platforms:

- **CLI Tool** (aether-cli): Linux, macOS, Windows
- **Desktop App**: Windows (MSI, NSIS, Portable), Linux (AppImage, DEB), macOS (DMG)

## Creating a Release

### Prerequisites

- Maintainer access to the repository
- Semantic versioning (e.g., `0.1.0`, `1.0.0-beta.1`)

### Step 1: Update Version Numbers

Update version in these files:

```bash
# CLI version
# Edit: aether-cli/Cargo.toml
[package]
version = "0.2.0"

# Desktop version  
# Edit: aether-desktop/src-tauri/tauri.conf.json
{
  "productVersion": "0.2.0"
}
```

### Step 2: Update Changelog

Edit `CHANGELOG.md` with:
- New version number
- Release date
- Features added
- Bugs fixed
- Breaking changes (if any)

**Format:**
```markdown
## [0.2.0] - 2026-06-24

### Added
- New feature X
- New feature Y

### Fixed
- Bug fix A
- Bug fix B

### Changed
- Breaking change A

### Deprecated
- Old feature X (use Y instead)
```

### Step 3: Commit Changes

```bash
git add aether-cli/Cargo.toml aether-desktop/src-tauri/tauri.conf.json CHANGELOG.md
git commit -m "Bump version to 0.2.0"
git push
```

### Step 4: Create Release Tag

```bash
# Tag format: release-v{VERSION}
git tag release-v0.2.0
git push origin release-v0.2.0
```

This triggers the automated release workflow.

## Automated Release Workflow

### What Happens Automatically

1. **Build CLI** for all platforms:
   - Linux (x86_64)
   - macOS (Intel x86_64 + Apple Silicon)
   - Windows (MSVC)

2. **Build Desktop for Windows**:
   - MSI Installer (professional)
   - NSIS Installer (lightweight)
   - Portable EXE (no installation)

3. **Build Desktop for Linux**:
   - AppImage (universal binary)
   - DEB package (Debian/Ubuntu)

4. **Build Desktop for macOS**:
   - DMG installer (universal binary for Intel + Apple Silicon)

5. **Create GitHub Release** with:
   - All built artifacts
   - SHA256 checksums
   - Release notes
   - Download links

### Timeline

- **CLI builds**: ~5-10 minutes each
- **Desktop builds**: ~10-15 minutes each
- **Total time**: ~30-40 minutes from tag push

### Monitoring Progress

1. Go to [GitHub Actions](https://github.com/barker6969/aether/actions)
2. Look for the "Release All Platforms" workflow
3. Watch status of each job

### After Release

1. GitHub Release is automatically created at:
   ```
   https://github.com/barker6969/aether/releases/tag/release-v0.2.0
   ```

2. Artifacts include:
   - CLI binaries (all platforms)
   - Desktop installers (all formats)
   - SHA256 checksums
   - Release notes with installation instructions

## Distribution

### Update README

Add download links to main README.md:

```markdown
## Download

### Latest Release: v0.2.0

#### CLI Tool
- [Linux x86_64](https://github.com/barker6969/aether/releases/download/release-v0.2.0/aether-cli-linux-x64)
- [macOS Intel](https://github.com/barker6969/aether/releases/download/release-v0.2.0/aether-cli-macos-x64)
- [macOS Apple Silicon](https://github.com/barker6969/aether/releases/download/release-v0.2.0/aether-cli-macos-arm64)
- [Windows](https://github.com/barker6969/aether/releases/download/release-v0.2.0/aether-cli-windows.exe)

#### Desktop App
- [Windows MSI](https://github.com/barker6969/aether/releases/download/release-v0.2.0/msi/Aether_Repair_Tool_0.2.0_x64_en-US.msi)
- [Windows NSIS](https://github.com/barker6969/aether/releases/download/release-v0.2.0/nsis/Aether_Repair_Tool_0.2.0_x64-setup.exe)
- [Windows Portable](https://github.com/barker6969/aether/releases/download/release-v0.2.0/portable/aether-desktop.exe)
- [Linux AppImage](https://github.com/barker6969/aether/releases/download/release-v0.2.0/appimage/Aether_Repair_Tool_0.2.0_x86_64.AppImage)
- [Linux DEB](https://github.com/barker6969/aether/releases/download/release-v0.2.0/deb/aether_0.2.0_amd64.deb)
- [macOS DMG](https://github.com/barker6969/aether/releases/download/release-v0.2.0/dmg/Aether%20Repair%20Tool_0.2.0_x64.dmg)
```

### Share Release

- **GitHub**: Share release URL
- **Social Media**: Announce new version
- **Email**: Notify users (if applicable)

## Troubleshooting

### Release Failed to Build

1. Check GitHub Actions logs:
   ```
   https://github.com/barker6969/aether/actions
   ```

2. Common issues:
   - **Cargo dependency resolution**: Run `cargo update`
   - **Yarn resolution**: Run `yarn install --force`
   - **Missing system dependencies**: Check CI logs for specific errors

### Partial Build Failure

If some platforms fail:

1. Fix the issue in code
2. Push fix to main branch
3. Create new tag: `release-v0.2.0-hotfix.1`

### Manual Override

If automated workflow fails completely, you can build manually:

```bash
# CLI
cargo build --release

# Desktop
cd aether-desktop
yarn build  # or specific build commands
```

Then manually create GitHub Release and upload artifacts.

## Release Checklist

Before creating a release:

- [ ] All tests pass (`cargo test`)
- [ ] Code reviewed and merged to main
- [ ] Version numbers updated
- [ ] CHANGELOG.md updated
- [ ] No breaking changes documented
- [ ] Security issues fixed
- [ ] Performance improvements noted

Before announcing release:

- [ ] All builds completed successfully
- [ ] Checksums verified
- [ ] Installation tested on all platforms (if possible)
- [ ] Documentation updated with new features
- [ ] Download links added to README

## Version Numbering

Aether uses [Semantic Versioning](https://semver.org/):

- **MAJOR** (e.g., 1.0.0): Breaking changes
- **MINOR** (e.g., 0.2.0): New features, backwards compatible
- **PATCH** (e.g., 0.1.1): Bug fixes only

**Examples:**
- `0.1.0` - Initial release
- `0.1.1` - Bug fix
- `0.2.0` - New features
- `1.0.0` - Stable release
- `2.0.0` - Major rewrite

## Advanced: Signing Releases

### Generate GPG Key (Optional)

```bash
gpg --gen-key
```

### Sign Tag

```bash
git tag -s release-v0.2.0 -m "Release version 0.2.0"
git push origin release-v0.2.0
```

### Verify Signature

```bash
git tag -v release-v0.2.0
```

## FAQ

**Q: Can I re-run a failed build?**
A: Yes, delete the tag and re-push: `git tag -d release-v0.2.0 && git push origin :release-v0.2.0`

**Q: How long do releases stay available?**
A: Permanently on GitHub Releases. Artifacts are kept for 5 days in GitHub Actions.

**Q: Can I build pre-releases?**
A: Yes, use semver pre-release: `release-v0.2.0-beta.1`

**Q: What if I need to rebuild a previous release?**
A: Check out that tag and re-create the release workflow manually via GitHub Actions.

---

**Last Updated**: 2026-06-23  
**Maintainer**: Aether Development Team
