# cc-switch

A CLI tool for managing multiple Claude Code configurations. Quickly switch between different API endpoints and keys.

[中文文档](./README_CN.md)

## Features

- Manage multiple Claude Code profiles with different API configurations
- **Default environment variables** - shared across all profiles
- **Import/Export** - backup, share, and migrate configurations
- Interactive profile selection
- Quick edit with `--set` flag
- Direct config file editing
- Self-update support
- Cross-platform (macOS, Linux)

## Installation

### Quick Install (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/mipawn/cc-switch/main/scripts/install.sh | bash
```

### Manual Install

Download the binary for your platform from [Releases](https://github.com/mipawn/cc-switch/releases) and place it in your PATH.

## Shell Completion (Tab)

Completions are installed automatically during installation. If not working, add manually:

**Zsh:** Add to `~/.zshrc`:
```bash
fpath=(~/.zsh/completions $fpath)
autoload -Uz compinit && compinit
```
Then generate completion file:
```bash
mkdir -p ~/.zsh/completions
cc-switch completion zsh > ~/.zsh/completions/_cc-switch
```

**Bash:**
```bash
mkdir -p ~/.local/share/bash-completion/completions
cc-switch completion bash > ~/.local/share/bash-completion/completions/cc-switch
```

**Fish:**
```bash
mkdir -p ~/.config/fish/completions
cc-switch completion fish > ~/.config/fish/completions/cc-switch.fish
```

## Uninstall

```bash
cc-switch uninstall
```

## Usage

### Interactive Mode

Simply run `cc-switch` to interactively select a profile:

```bash
cc-switch
```

### Commands

| Command | Description |
|---------|-------------|
| `cc-switch` | Interactive profile selection and launch claude |
| `cc-switch add [name] [K=V ...]` | Add a new profile |
| `cc-switch edit <name>` | Edit profile interactively |
| `cc-switch edit <name> --set K=V` | Quick update env vars |
| `cc-switch edit <name> --rm KEY` | Quick remove env vars |
| `cc-switch rm <name>` | Remove a profile |
| `cc-switch list` | List all profiles |
| `cc-switch use <name> [args]` | Launch claude with specific profile |
| `cc-switch defaults` | List default env vars |
| `cc-switch defaults set K=V` | Set default env vars |
| `cc-switch defaults edit` | Edit defaults interactively |
| `cc-switch defaults rm KEY` | Remove default env vars |
| `cc-switch config` | Open config file in editor |
| `cc-switch config --path` | Print config file path |
| `cc-switch export [name]` | Export profiles to JSON |
| `cc-switch import <file>` | Import profiles from JSON |
| `cc-switch update` | Check and install updates |
| `cc-switch uninstall` | Uninstall cc-switch |
| `cc-switch --help` | Show help message |
| `cc-switch --version` | Show version |

### Examples

```bash
# Add a new profile (interactive)
cc-switch add

# Add with inline env vars
cc-switch add myprofile ANTHROPIC_BASE_URL=https://api.example.com ANTHROPIC_AUTH_TOKEN=sk-xxx

# Quick edit a single variable
cc-switch edit myprofile --set ANTHROPIC_BASE_URL=https://newurl.com

# Remove a variable from profile
cc-switch edit myprofile --rm API_TIMEOUT_MS

# Set default env vars (shared by all profiles)
cc-switch defaults set API_TIMEOUT_MS=300000 CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1

# Edit config file directly
cc-switch config

# Use a profile with additional claude arguments
cc-switch use myprofile --dangerously-skip-permissions

# Export all profiles to a file
cc-switch export > backup.json

# Export a single profile
cc-switch export myprofile > single.json

# Import profiles from a file
cc-switch import backup.json

# Import with force overwrite
cc-switch import backup.json --force

# Check for updates and install
cc-switch update

# If update fails due to permissions, you'll be prompted to retry with sudo
# Or run directly with sudo:
sudo cc-switch update
```

## Configuration

Profiles are stored in `~/.config/cc-switch/config.json`.

### Profile Format

```json
{
  "version": "1",
  "defaults": {
    "API_TIMEOUT_MS": "300000",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  },
  "profiles": [
    {
      "name": "my-api",
      "description": "My API Proxy",
      "env": {
        "ANTHROPIC_BASE_URL": "https://api.example.com",
        "ANTHROPIC_AUTH_TOKEN": "sk-xxx"
      }
    }
  ]
}
```

### Defaults

Default environment variables are shared across all profiles. Profile-specific variables take precedence over defaults.

```bash
# Set defaults
cc-switch defaults set API_TIMEOUT_MS=300000

# Now all profiles will have API_TIMEOUT_MS=300000
# unless they override it with their own value
```

### Common Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_BASE_URL` | Custom API endpoint URL |
| `ANTHROPIC_AUTH_TOKEN` | API authentication token |
| `ANTHROPIC_API_KEY` | API key (alternative to token) |
| `API_TIMEOUT_MS` | API request timeout in milliseconds |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | Disable telemetry |

### Import/Export

Backup, share, or migrate your configurations between machines.

```bash
# Export all profiles (includes defaults)
cc-switch export > backup.json

# Export specific profile
cc-switch export myprofile > single.json

# Export without default variables
cc-switch export --no-defaults > profiles-only.json

# Import from file
cc-switch import backup.json

# Import with force overwrite (skip confirmation)
cc-switch import backup.json --force

# Import without defaults
cc-switch import backup.json --no-defaults
```

**Export options:**
- `--no-defaults` - Don't include default variables

**Import options:**
- `--force` / `-f` - Overwrite existing profiles without confirmation
- `--merge-defaults` - Auto-merge default variables
- `--no-defaults` - Skip importing default variables

> ⚠️ **Security Note:** Exported files may contain sensitive data (API keys, tokens). Handle them securely.

## How It Works

cc-switch launches Claude Code as a subprocess with profile-specific environment variables. Environment variables are merged at runtime: `defaults` + `profile.env` (profile takes precedence).

```typescript
// Merge order: defaults -> profile.env -> process.env
const mergedEnv = { ...defaults, ...profile.env };
spawn("claude", args, {
  env: { ...process.env, ...mergedEnv },
  stdio: "inherit"
});
```

**Equivalent shell command:**

```bash
# Linux/macOS
ANTHROPIC_BASE_URL=https://api.example.com ANTHROPIC_AUTH_TOKEN=sk-xxx claude

# Windows (PowerShell)
$env:ANTHROPIC_BASE_URL="https://api.example.com"; $env:ANTHROPIC_AUTH_TOKEN="sk-xxx"; claude
```

## Building from Source

Requires [Bun](https://bun.sh) runtime.

```bash
# Install dependencies
bun install

# Run in development
bun run src/index.ts

# Build binary
bun run build
```

## Supported Platforms

- macOS (Apple Silicon / Intel)
- Linux (x64)
- Windows (x64)

## License

MIT
