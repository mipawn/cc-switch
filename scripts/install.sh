#!/bin/bash
set -e

REPO="mipawn/cc-switch"
INSTALL_DIR="/usr/local/bin"
BINARY_NAME="cc-switch"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Detect OS and architecture
detect_platform() {
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)

    case "$OS" in
        darwin)
            OS="darwin"
            ;;
        linux)
            OS="linux"
            ;;
        *)
            error "Unsupported operating system: $OS"
            ;;
    esac

    case "$ARCH" in
        x86_64)
            ARCH="x64"
            ;;
        aarch64|arm64)
            ARCH="arm64"
            ;;
        *)
            error "Unsupported architecture: $ARCH"
            ;;
    esac

    # Linux arm64 not supported yet
    if [ "$OS" = "linux" ] && [ "$ARCH" = "arm64" ]; then
        error "Linux ARM64 is not supported yet"
    fi

    PLATFORM="${OS}-${ARCH}"
    info "Detected platform: $PLATFORM"
}

# Get latest release version
get_latest_version() {
    info "Fetching latest release..."
    LATEST_RELEASE=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" 2>/dev/null)
    if [ $? -ne 0 ]; then
        error "Failed to fetch latest release info"
    fi

    VERSION=$(echo "$LATEST_RELEASE" | grep '"tag_name":' | sed -E 's/.*"tag_name": *"([^"]+)".*/\1/')
    if [ -z "$VERSION" ]; then
        error "Failed to parse version from release info"
    fi

    info "Latest version: $VERSION"
}

# Download and install
install() {
    ASSET_NAME="${BINARY_NAME}-${PLATFORM}"
    DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${VERSION}/${ASSET_NAME}"

    info "Downloading ${ASSET_NAME}..."

    TMP_DIR=$(mktemp -d)
    TMP_FILE="${TMP_DIR}/${BINARY_NAME}"

    if ! curl -fsSL "$DOWNLOAD_URL" -o "$TMP_FILE"; then
        rm -rf "$TMP_DIR"
        error "Failed to download binary"
    fi

    chmod +x "$TMP_FILE"

    # Check if we need sudo
    if [ -w "$INSTALL_DIR" ]; then
        mv "$TMP_FILE" "${INSTALL_DIR}/${BINARY_NAME}"
    else
        info "Need sudo to install to ${INSTALL_DIR}"
        sudo mv "$TMP_FILE" "${INSTALL_DIR}/${BINARY_NAME}"
    fi

    rm -rf "$TMP_DIR"

    info "Installed ${BINARY_NAME} to ${INSTALL_DIR}/${BINARY_NAME}"
}

# Verify installation
verify() {
    if command -v "$BINARY_NAME" &> /dev/null; then
        info "Installation successful!"
        echo ""
        "$BINARY_NAME" --version
        echo ""
        info "Run '${BINARY_NAME} --help' to get started"
    else
        warn "Installation completed, but ${BINARY_NAME} is not in PATH"
        warn "You may need to add ${INSTALL_DIR} to your PATH"
    fi
}

main() {
    echo ""
    echo "  cc-switch Installer"
    echo "  ==================="
    echo ""

    detect_platform
    get_latest_version
    install
    verify
}

main
