#!/usr/bin/env bun

import { VERSION, APP_NAME } from "./constants";
import { addCommand } from "./commands/add";
import { editCommand } from "./commands/edit";
import { listCommand } from "./commands/list";
import { removeCommand } from "./commands/remove";
import { selectCommand } from "./commands/select";
import { updateCommand } from "./commands/update";
import { useCommand } from "./commands/use";
import {
  listDefaultsCommand,
  setDefaultsCommand,
  editDefaultsCommand,
  removeDefaultsCommand,
} from "./commands/defaults";
import { configCommand, configPathCommand } from "./commands/config";

const HELP_TEXT = `
${APP_NAME} v${VERSION}
CLI tool for managing multiple Claude Code configurations

Usage:
  ${APP_NAME}                              Interactive profile selection
  ${APP_NAME} add [name] [KEY=VALUE ...]   Add a new profile
  ${APP_NAME} edit <name>                  Edit an existing profile (interactive)
  ${APP_NAME} edit <name> --set K=V [...]  Quick update env vars
  ${APP_NAME} edit <name> --rm KEY [...]   Quick remove env vars
  ${APP_NAME} rm <name>                    Remove a profile
  ${APP_NAME} list                         List all profiles
  ${APP_NAME} use <name> [args]            Use a specific profile
  ${APP_NAME} defaults                     List default env vars
  ${APP_NAME} defaults set K=V [...]       Set default env vars
  ${APP_NAME} defaults edit                Edit defaults interactively
  ${APP_NAME} defaults rm KEY [...]        Remove default env vars
  ${APP_NAME} config                       Open config file in editor
  ${APP_NAME} config --path                Print config file path
  ${APP_NAME} update                       Check for updates
  ${APP_NAME} --help                       Show this help message
  ${APP_NAME} --version                    Show version

Examples:
  ${APP_NAME}                              # Interactive selection
  ${APP_NAME} add                          # Add new profile (interactive)
  ${APP_NAME} add myprofile API_KEY=xxx    # Add with inline env vars
  ${APP_NAME} edit myprofile --set API_KEY=newkey
  ${APP_NAME} defaults set API_TIMEOUT=30000
  ${APP_NAME} config                       # Edit config.json directly
  ${APP_NAME} use myprofile -p             # Use 'myprofile' with claude args
`;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  // Handle flags
  if (command === "--help" || command === "-h") {
    console.log(HELP_TEXT);
    return;
  }

  if (command === "--version" || command === "-v") {
    console.log(`${APP_NAME} v${VERSION}`);
    return;
  }

  // Handle commands
  switch (command) {
    case "add":
      await addCommand(args.slice(1));
      break;

    case "edit": {
      const name = args[1];
      if (!name) {
        console.error("Usage: cc-switch edit <name>");
        process.exit(1);
      }
      await editCommand(name, args.slice(2));
      break;
    }

    case "rm":
    case "remove": {
      const name = args[1];
      if (!name) {
        console.error("Usage: cc-switch rm <name>");
        process.exit(1);
      }
      await removeCommand(name);
      break;
    }

    case "list":
    case "ls":
      listCommand();
      break;

    case "use": {
      const name = args[1];
      if (!name) {
        console.error("Usage: cc-switch use <name> [claude-args...]");
        process.exit(1);
      }
      const claudeArgs = args.slice(2);
      useCommand(name, claudeArgs);
      break;
    }

    case "defaults": {
      const subCommand = args[1];
      switch (subCommand) {
        case "set":
          await setDefaultsCommand(args.slice(2));
          break;
        case "edit":
          await editDefaultsCommand();
          break;
        case "rm":
        case "remove":
          await removeDefaultsCommand(args.slice(2));
          break;
        default:
          listDefaultsCommand();
          break;
      }
      break;
    }

    case "config": {
      if (args[1] === "--path") {
        configPathCommand();
      } else {
        configCommand();
      }
      break;
    }

    case "update":
      await updateCommand();
      break;

    default:
      // Default: interactive selection
      // Pass all args (including any that look like commands) to claude
      await selectCommand(args);
      break;
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
