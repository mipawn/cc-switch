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

# Install shell completions
install_completions() {
    info "Installing shell completions..."

    # Zsh completions
    if command -v zsh &> /dev/null; then
        ZSH_COMPLETION_DIR="${HOME}/.zsh/completions"
        ZSH_COMPLETION_FILE="${ZSH_COMPLETION_DIR}/_${BINARY_NAME}"
        mkdir -p "$ZSH_COMPLETION_DIR"

        # Always write completion file
        "${INSTALL_DIR}/${BINARY_NAME}" completion zsh > "${ZSH_COMPLETION_FILE}"
        info "Zsh completions installed to ${ZSH_COMPLETION_FILE}"

        # Configure fpath in .zshrc if not already set
        if grep -q '\.zsh/completions' "${HOME}/.zshrc" 2>/dev/null; then
            info "Zsh fpath already configured"
        elif grep -q 'oh-my-zsh\|zinit\|zplug\|antigen' "${HOME}/.zshrc" 2>/dev/null; then
            # For framework users, still need to add fpath but skip compinit (framework handles it)
            echo "" >> "${HOME}/.zshrc"
            echo "# cc-switch completions" >> "${HOME}/.zshrc"
            echo 'fpath=(~/.zsh/completions $fpath)' >> "${HOME}/.zshrc"
            info "Added fpath to ~/.zshrc (compinit handled by your zsh framework)"
        else
            # Plain zsh, add both fpath and compinit
            echo "" >> "${HOME}/.zshrc"
            echo "# cc-switch completions" >> "${HOME}/.zshrc"
            echo 'fpath=(~/.zsh/completions $fpath)' >> "${HOME}/.zshrc"
            if ! grep -q 'compinit' "${HOME}/.zshrc" 2>/dev/null; then
                echo 'autoload -Uz compinit && compinit' >> "${HOME}/.zshrc"
            fi
            info "Added completion config to ~/.zshrc"
        fi
    fi

    # Bash completions
    if command -v bash &> /dev/null; then
        BASH_COMPLETION_DIR="${HOME}/.local/share/bash-completion/completions"
        BASH_COMPLETION_FILE="${BASH_COMPLETION_DIR}/${BINARY_NAME}"
        mkdir -p "$BASH_COMPLETION_DIR"
        "${INSTALL_DIR}/${BINARY_NAME}" completion bash > "${BASH_COMPLETION_FILE}"
        info "Bash completions installed to ${BASH_COMPLETION_FILE}"
    fi

    # Fish completions
    if command -v fish &> /dev/null; then
        FISH_COMPLETION_DIR="${HOME}/.config/fish/completions"
        FISH_COMPLETION_FILE="${FISH_COMPLETION_DIR}/${BINARY_NAME}.fish"
        mkdir -p "$FISH_COMPLETION_DIR"
        "${INSTALL_DIR}/${BINARY_NAME}" completion fish > "${FISH_COMPLETION_FILE}"
        info "Fish completions installed to ${FISH_COMPLETION_FILE}"
    fi
}

# Verify installation
verify() {
    if command -v "$BINARY_NAME" &> /dev/null; then
        info "Installation successful!"
        echo ""
        "$BINARY_NAME" --version
        echo ""
        info "Run '${BINARY_NAME} --help' to get started"
        info "Restart your shell or run 'source ~/.zshrc' to enable completions"
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
    install_completions
    verify
}

main
