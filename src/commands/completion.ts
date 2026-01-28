import { APP_NAME } from "../constants";

// Config file path using shell variable for runtime expansion
const SHELL_CONFIG_FILE = "$HOME/.config/cc-switch/config.json";

const BASH_COMPLETION = `# cc-switch bash completion
# Add to ~/.bashrc or ~/.bash_profile:
#   eval "$(cc-switch completion bash)"

_cc_switch_completions() {
    local cur prev words cword
    _init_completion 2>/dev/null || {
        cur="\${COMP_WORDS[COMP_CWORD]}"
        prev="\${COMP_WORDS[COMP_CWORD-1]}"
        words=("\${COMP_WORDS[@]}")
        cword=$COMP_CWORD
    }

    local commands="add edit rm remove list ls use defaults config update uninstall completion --help --version"
    local defaults_subcmds="set edit rm remove"

    # Get profile names from config file
    _cc_switch_profiles() {
        local config_file="${SHELL_CONFIG_FILE}"
        if [[ -f "$config_file" ]]; then
            grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' "$config_file" 2>/dev/null | sed 's/.*"name"[[:space:]]*:[[:space:]]*"\\([^"]*\\)".*/\\1/'
        fi
    }

    case "$cword" in
        1)
            # First argument: complete commands
            COMPREPLY=($(compgen -W "$commands" -- "$cur"))
            ;;
        2)
            # Second argument: depends on command
            case "$prev" in
                edit|rm|remove|use)
                    # Complete profile names
                    local profiles=$(_cc_switch_profiles)
                    COMPREPLY=($(compgen -W "$profiles" -- "$cur"))
                    ;;
                defaults)
                    # Complete defaults subcommands
                    COMPREPLY=($(compgen -W "$defaults_subcmds" -- "$cur"))
                    ;;
                config)
                    COMPREPLY=($(compgen -W "--path" -- "$cur"))
                    ;;
                completion)
                    COMPREPLY=($(compgen -W "bash zsh fish" -- "$cur"))
                    ;;
                *)
                    ;;
            esac
            ;;
        *)
            # Handle edit options
            if [[ "\${words[1]}" == "edit" && $cword -ge 3 ]]; then
                COMPREPLY=($(compgen -W "--set --rm" -- "$cur"))
            fi
            ;;
    esac
}

complete -F _cc_switch_completions ${APP_NAME}
`;

const ZSH_COMPLETION = `#compdef cc-switch
# cc-switch zsh completion
# Add to ~/.zshrc:
#   eval "$(cc-switch completion zsh)"

_cc-switch() {
    local -a commands profiles defaults_subcmds

    commands=(
        'add:Add a new profile'
        'edit:Edit an existing profile'
        'rm:Remove a profile'
        'remove:Remove a profile'
        'list:List all profiles'
        'ls:List all profiles'
        'use:Use a specific profile'
        'defaults:Manage default env vars'
        'config:Open config file in editor'
        'update:Check for updates'
        'uninstall:Uninstall cc-switch'
        'completion:Generate shell completion script'
    )

    defaults_subcmds=(
        'set:Set default env vars'
        'edit:Edit defaults interactively'
        'rm:Remove default env vars'
        'remove:Remove default env vars'
    )

    # Get profile names from config file
    _cc_switch_profiles() {
        local config_file="${SHELL_CONFIG_FILE}"
        if [[ -f "$config_file" ]]; then
            grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' "$config_file" 2>/dev/null | sed 's/.*"name"[[:space:]]*:[[:space:]]*"\\([^"]*\\)".*/\\1/'
        fi
    }

    _arguments -C \\
        '1: :->command' \\
        '*: :->args'

    case $state in
        command)
            _describe -t commands 'cc-switch commands' commands
            ;;
        args)
            case $words[2] in
                edit|rm|remove|use)
                    local -a profile_list
                    profile_list=(\${(f)"$(_cc_switch_profiles)"})
                    _describe -t profiles 'profiles' profile_list
                    ;;
                defaults)
                    if (( CURRENT == 3 )); then
                        _describe -t subcommands 'defaults subcommands' defaults_subcmds
                    fi
                    ;;
                config)
                    _arguments '--path[Print config file path]'
                    ;;
                completion)
                    _values 'shell' bash zsh fish
                    ;;
            esac
            ;;
    esac
}

compdef _cc-switch cc-switch
`;

const FISH_COMPLETION = `# cc-switch fish completion
# Add to ~/.config/fish/completions/cc-switch.fish:
#   cc-switch completion fish > ~/.config/fish/completions/cc-switch.fish

set -l commands add edit rm remove list ls use defaults config update uninstall completion

# Get profile names
function __cc_switch_profiles
    set -l config_file "${SHELL_CONFIG_FILE}"
    if test -f "$config_file"
        string match -r '"name"\\s*:\\s*"[^"]*"' < "$config_file" | string replace -r '.*"name"\\s*:\\s*"([^"]*)".*' '$1'
    end
end

# Disable file completion by default
complete -c cc-switch -f

# Commands
complete -c cc-switch -n "not __fish_seen_subcommand_from $commands" -a add -d 'Add a new profile'
complete -c cc-switch -n "not __fish_seen_subcommand_from $commands" -a edit -d 'Edit an existing profile'
complete -c cc-switch -n "not __fish_seen_subcommand_from $commands" -a rm -d 'Remove a profile'
complete -c cc-switch -n "not __fish_seen_subcommand_from $commands" -a list -d 'List all profiles'
complete -c cc-switch -n "not __fish_seen_subcommand_from $commands" -a ls -d 'List all profiles'
complete -c cc-switch -n "not __fish_seen_subcommand_from $commands" -a use -d 'Use a specific profile'
complete -c cc-switch -n "not __fish_seen_subcommand_from $commands" -a defaults -d 'Manage default env vars'
complete -c cc-switch -n "not __fish_seen_subcommand_from $commands" -a config -d 'Open config file in editor'
complete -c cc-switch -n "not __fish_seen_subcommand_from $commands" -a update -d 'Check for updates'
complete -c cc-switch -n "not __fish_seen_subcommand_from $commands" -a uninstall -d 'Uninstall cc-switch'
complete -c cc-switch -n "not __fish_seen_subcommand_from $commands" -a completion -d 'Generate shell completion'

# Profile name completion for edit/rm/use
complete -c cc-switch -n "__fish_seen_subcommand_from edit rm remove use" -a "(__cc_switch_profiles)"

# Defaults subcommands
complete -c cc-switch -n "__fish_seen_subcommand_from defaults; and not __fish_seen_subcommand_from set edit rm remove" -a set -d 'Set default env vars'
complete -c cc-switch -n "__fish_seen_subcommand_from defaults; and not __fish_seen_subcommand_from set edit rm remove" -a edit -d 'Edit defaults interactively'
complete -c cc-switch -n "__fish_seen_subcommand_from defaults; and not __fish_seen_subcommand_from set edit rm remove" -a rm -d 'Remove default env vars'

# Config options
complete -c cc-switch -n "__fish_seen_subcommand_from config" -l path -d 'Print config file path'

# Completion shell types
complete -c cc-switch -n "__fish_seen_subcommand_from completion" -a "bash zsh fish"
`;

export function completionCommand(shell?: string): void {
  switch (shell) {
    case "bash":
      console.log(BASH_COMPLETION);
      break;
    case "zsh":
      console.log(ZSH_COMPLETION);
      break;
    case "fish":
      console.log(FISH_COMPLETION);
      break;
    default:
      console.log(`Usage: ${APP_NAME} completion <shell>

Generate shell completion script.

Supported shells:
  bash    Bash completion script
  zsh     Zsh completion script
  fish    Fish completion script

Automatic Setup:
  Completions are automatically installed when you install or update ${APP_NAME}.
  The installer and '${APP_NAME} update' handle this for you - no manual steps needed.

Manual Setup (if needed):
  # Zsh - add to ~/.zshrc
  fpath=(~/.zsh/completions $fpath)
  autoload -Uz compinit && compinit

  Then generate the completion file:
  ${APP_NAME} completion zsh > ~/.zsh/completions/_${APP_NAME}

  # Bash - add to ~/.bashrc
  eval "$(${APP_NAME} completion bash)"

  # Fish
  ${APP_NAME} completion fish > ~/.config/fish/completions/${APP_NAME}.fish

After setup, restart your shell or run 'source ~/.zshrc' (for zsh).
`);
  }
}
