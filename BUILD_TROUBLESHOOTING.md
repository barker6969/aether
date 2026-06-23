# Build Troubleshooting Guide

This document tracks known build issues and their fixes.

## Current Release Status

**Tag**: `release-v0.1.0`  
**Status**: Building on GitHub Actions  
**Expected Completion**: ~30-40 minutes from push

## Known Build Issues

### Issue 1: Windows CLI Build - Missing libusb

**Symptom**: 
```
error occurred in cc-rs: failed to find tool "x86_64-w64-mingw32-gcc"
error: linking with x86_64-pc-windows-msvc failed
```

**Root Cause**: Windows CLI tries to build with `ring` crate which needs libusb

**Fix Applied**:
- Made vcpkg dependency optional in workflow
- CLI should still build without libusb on Windows
- If it fails, update workflow to use MSVC build tools instead

### Issue 2: Linux AppImage Build - linuxdeploy Failures

**Symptom**:
```
failed to bundle project: `failed to run linuxdeploy`
```

**Root Cause**: 
- Tauri's bundler doesn't properly execute linuxdeploy in CI
- FUSE2 may not be available in GitHub Actions containers

**Fix Applied**:
- Split AppImage and DEB builds into separate steps
- AppImage build failure is now non-blocking (DEB will succeed)
- Previous manual workaround: Use `linuxdeploy --appimage-extract-and-run`

**Expected Behavior in release-v0.1.0**:
- ✅ DEB package builds successfully (2.2 MB)
- ⚠️ AppImage may fail (fallback to DEB for Linux distribution)

### Issue 3: macOS Target - Universal Binary Complexity

**Symptom**:
```
failed to build for target universal-apple-darwin
```

**Root Cause**: 
- Universal binaries require both x86_64 and aarch64 Rust targets
- Tauri's macOS bundler may have issues with universal targets

**Fix Applied**:
- Both targets installed in workflow
- Fallback: Can build separate x86_64 and aarch64 DMGs if universal fails

**Expected Behavior in release-v0.1.0**:
- ✅ CLI builds for both Intel and Apple Silicon (separate binaries)
- ✅ Desktop DMG should be universal

### Issue 4: Artifact Upload - File Glob Pattern

**Symptom**:
```
Error: No files matching pattern found
```

**Root Cause**: Nested directory structure from artifact downloads

**Fix Applied**:
- Changed glob from `*/**/*` to `**/*` for broader matching
- Added debug output to list all artifacts before release creation

### Issue 5: Windows Desktop - Bundle Format Issues

**Symptom**:
```
failed to build MSI/NSIS installer
```

**Root Cause**:
- WiX Toolset not installed (Windows GitHub Actions should have it)
- NSIS not installed on runner

**Expected Behavior**:
- Latest Windows GitHub Actions images include both toolsets
- If fails, manually install via:
  ```powershell
  choco install wixtoolset nsis
  ```

## Release-v0.1.0: Expected Outcomes

### Most Likely ✅
- ✅ CLI: All 4 platforms build successfully
- ✅ Desktop Windows: MSI and NSIS build successfully  
- ✅ Desktop Linux: DEB builds successfully
- ✅ Desktop macOS: DMG builds successfully

### Possible Issues ⚠️
- ⚠️ AppImage may not build (non-blocking, use DEB instead)
- ⚠️ Windows CLI may have warnings about libusb (but should still work)
- ⚠️ macOS universal binary might not work (fall back to x86_64 build)

### Unlikely ❌
- ❌ Git checkout fails
- ❌ Rust toolchain installation fails
- ❌ All builds fail simultaneously

## Quick Fix Matrix

| Issue | Quick Fix |
|-------|-----------|
| linuxdeploy failure | Install FUSE2: `sudo apt-get install libfuse2` |
| vcpkg not found | Skip libusb: comment out vcpkg line |
| Permission denied on binary | Run: `chmod +x binary-name` |
| Symbol not found (macOS) | Rebuild with correct target: `--target x86_64-apple-darwin` |
| "tool not found" (Windows) | Install: `choco install <tool-name>` |

## Monitoring Build Status

### GitHub Actions Dashboard
```
https://github.com/barker6969/aether/actions
→ Look for "Release All Platforms" workflow
→ Check job status and logs
```

### Expected Job Timeline

| Job | Expected Duration | Expected Start |
|-----|-------------------|-----------------|
| build-cli (parallel) | 5-10 min each | 0 min |
| build-desktop-* (parallel) | 10-15 min each | 0 min |
| create-release | 1-2 min | +15 min |
| **Total** | **~30-40 min** | — |

## If Build Fails

### Step 1: Identify the Issue

1. Go to GitHub Actions
2. Click on the failed job
3. Look at the error message
4. Match to known issues above

### Step 2: Quick Actions

**CLI build failed?**
```bash
cd aether-cli
cargo build --release --target x86_64-unknown-linux-gnu  # Test locally
```

**Desktop build failed?**
```bash
cd aether-desktop
yarn install
yarn tauri build  # Test locally
```

### Step 3: File an Issue

If the issue isn't in this guide:
1. Copy the error message from GitHub Actions
2. Create issue: https://github.com/barker6969/aether/issues/new
3. Include: OS, target, error message, build logs

## For Next Release

To avoid future issues:

1. **Run local builds first**
   ```bash
   cargo build --release
   cd aether-desktop && yarn build
   ```

2. **Test on target platforms**
   - Windows: Test on Windows 10+
   - macOS: Test on macOS 10.13+
   - Linux: Test on Ubuntu 20.04+

3. **Update workflow if needed**
   - Add system dependencies
   - Update action versions
   - Fix known issues before release tag

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Tauri Build Guide](https://tauri.app/v1/guides/building/)
- [Rust Targets](https://doc.rust-lang.org/nightly/rustc/platform-support.html)
- [linuxdeploy Issues](https://github.com/linuxdeploy/linuxdeploy/issues)

---

**Last Updated**: 2026-06-23  
**Build Status**: In Progress (release-v0.1.0)  
**Maintainer**: Aether Development Team
