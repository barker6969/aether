#!/bin/bash
# Release script for Aether
# Usage: ./scripts/release.sh 0.2.0

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Configuration
# ============================================================================

VERSION="${1:-}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI_CARGO="${REPO_ROOT}/aether-cli/Cargo.toml"
DESKTOP_TAURI="${REPO_ROOT}/aether-desktop/src-tauri/tauri.conf.json"
CHANGELOG="${REPO_ROOT}/CHANGELOG.md"

# ============================================================================
# Functions
# ============================================================================

print_error() {
    echo -e "${RED}✗ Error: $1${NC}" >&2
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_step() {
    echo -e "\n${BLUE}→ $1${NC}"
}

# ============================================================================
# Validation
# ============================================================================

validate_version() {
    if [[ ! $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+)?$ ]]; then
        print_error "Invalid version format: $VERSION"
        print_info "Expected format: X.Y.Z or X.Y.Z-prerelease"
        exit 1
    fi
}

check_git_clean() {
    if ! git -C "$REPO_ROOT" diff --quiet; then
        print_error "Working directory has uncommitted changes"
        echo "Run: git status"
        exit 1
    fi
    
    if ! git -C "$REPO_ROOT" diff --cached --quiet; then
        print_error "Staging area has changes"
        echo "Run: git reset"
        exit 1
    fi
}

check_main_branch() {
    CURRENT_BRANCH=$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD)
    if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
        print_warning "Currently on branch: $CURRENT_BRANCH (not main/master)"
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# ============================================================================
# Update Files
# ============================================================================

update_cli_version() {
    print_step "Updating CLI version to $VERSION"
    
    if [[ ! -f "$CLI_CARGO" ]]; then
        print_error "CLI Cargo.toml not found: $CLI_CARGO"
        exit 1
    fi
    
    # Update Cargo.toml (works with toml format)
    sed -i.bak "s/^version = .*/version = \"$VERSION\"/" "$CLI_CARGO"
    rm "${CLI_CARGO}.bak"
    
    print_success "Updated: $CLI_CARGO"
}

update_desktop_version() {
    print_step "Updating Desktop version to $VERSION"
    
    if [[ ! -f "$DESKTOP_TAURI" ]]; then
        print_error "Desktop tauri.conf.json not found: $DESKTOP_TAURI"
        exit 1
    fi
    
    # Update JSON version field
    if command -v jq &> /dev/null; then
        jq ".productVersion = \"$VERSION\"" "$DESKTOP_TAURI" > "${DESKTOP_TAURI}.tmp"
        mv "${DESKTOP_TAURI}.tmp" "$DESKTOP_TAURI"
    else
        print_warning "jq not found, using sed (may not work perfectly)"
        sed -i.bak "s/\"productVersion\": \"[^\"]*\"/\"productVersion\": \"$VERSION\"/" "$DESKTOP_TAURI"
        rm "${DESKTOP_TAURI}.bak"
    fi
    
    print_success "Updated: $DESKTOP_TAURI"
}

prompt_changelog_update() {
    print_step "Update CHANGELOG.md"
    print_info "Please add an entry for version $VERSION to CHANGELOG.md"
    print_info "Template:"
    echo ""
    echo "## [$VERSION] - $(date +%Y-%m-%d)"
    echo ""
    echo "### Added"
    echo "- New feature X"
    echo ""
    echo "### Fixed"
    echo "- Bug fix Y"
    echo ""
    read -p "Press Enter when CHANGELOG.md is ready..."
    
    if ! grep -q "## \[$VERSION\]" "$CHANGELOG"; then
        print_error "CHANGELOG.md does not contain entry for $VERSION"
        exit 1
    fi
    
    print_success "CHANGELOG.md updated"
}

# ============================================================================
# Git Operations
# ============================================================================

commit_changes() {
    print_step "Committing changes"
    
    cd "$REPO_ROOT"
    git add aether-cli/Cargo.toml
    git add aether-desktop/src-tauri/tauri.conf.json
    git add CHANGELOG.md
    
    git commit -m "Bump version to $VERSION" --no-verify
    
    print_success "Committed: Version bump to $VERSION"
}

create_tag() {
    print_step "Creating release tag"
    
    cd "$REPO_ROOT"
    TAG="release-v$VERSION"
    
    git tag -a "$TAG" -m "Release version $VERSION"
    print_success "Created tag: $TAG"
    
    echo ""
    print_info "Tag details:"
    git show "$TAG" --stat
}

push_changes() {
    print_step "Pushing to GitHub"
    
    cd "$REPO_ROOT"
    
    print_info "Pushing commits..."
    git push
    
    print_info "Pushing tags..."
    git push origin "release-v$VERSION"
    
    print_success "Pushed to GitHub"
}

# ============================================================================
# Summary
# ============================================================================

print_summary() {
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ Release $VERSION is ready!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}What happens next:${NC}"
    echo "  1. GitHub Actions will automatically build all artifacts"
    echo "  2. Check progress at: https://github.com/barker6969/aether/actions"
    echo "  3. Release will be available at:"
    echo "     https://github.com/barker6969/aether/releases/tag/release-v$VERSION"
    echo ""
    echo -e "${BLUE}After release is available:${NC}"
    echo "  1. Download artifacts from release page"
    echo "  2. Verify checksums: sha256sum -c CHECKSUMS.sha256"
    echo "  3. Update README.md with new download links"
    echo "  4. Announce release (social media, email, etc.)"
    echo ""
}

print_help() {
    cat << EOF
Usage: $0 <version>

Create a new release of Aether with automatic GitHub Actions builds.

Arguments:
  version         Version number (e.g., 0.2.0 or 1.0.0-beta.1)

Options:
  -h, --help      Show this help message

Examples:
  # Release version 0.2.0
  $0 0.2.0

  # Release beta version
  $0 1.0.0-beta.1

Requirements:
  - Working directory must be clean (git diff empty)
  - On main/master branch
  - CHANGELOG.md must be updated
  - jq installed (optional, for better JSON handling)

Process:
  1. Validates version format
  2. Checks git status
  3. Updates version numbers in all files
  4. Prompts to update CHANGELOG.md
  5. Commits all changes
  6. Creates release tag
  7. Pushes to GitHub
  8. GitHub Actions automatically builds and creates release

See RELEASE.md for detailed documentation.

EOF
}

# ============================================================================
# Main
# ============================================================================

main() {
    if [[ -z "$VERSION" ]] || [[ "$VERSION" == "-h" ]] || [[ "$VERSION" == "--help" ]]; then
        print_help
        [[ -z "$VERSION" ]] && exit 1 || exit 0
    fi
    
    print_info "Aether Release Tool"
    print_info "Version: $VERSION"
    echo ""
    
    validate_version
    check_git_clean
    check_main_branch
    
    print_success "All checks passed"
    echo ""
    
    # Pre-flight confirmation
    read -p "Proceed with release v$VERSION? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Release cancelled"
        exit 0
    fi
    
    # Execute release steps
    update_cli_version
    update_desktop_version
    prompt_changelog_update
    commit_changes
    create_tag
    push_changes
    
    print_summary
}

main "$@"
