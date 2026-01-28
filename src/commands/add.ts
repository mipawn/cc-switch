import { input, confirm } from "@inquirer/prompts";
import { addProfile, getProfile } from "../config/storage";
import type { Profile } from "../config/types";

// Parse KEY=VALUE format from args or a single string
export function parseEnvArgs(args: string[]): Record<string, string> {
  const env: Record<string, string> = {};

  for (const arg of args) {
    // Support multiple KEY=VALUE in one string (space separated)
    const parts = arg.match(/([A-Za-z_][A-Za-z0-9_]*)=("[^"]*"|'[^']*'|[^\s]+)/g);
    if (parts) {
      for (const part of parts) {
        const eqIndex = part.indexOf("=");
        if (eqIndex > 0) {
          const key = part.slice(0, eqIndex);
          let value = part.slice(eqIndex + 1);
          // Remove surrounding quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          env[key] = value;
        }
      }
    }
  }

  return env;
}

export async function addCommand(args: string[] = []): Promise<void> {
  // Check for --env flag for inline env vars
  const envFlagIndex = args.indexOf("--env");
  let inlineEnv: Record<string, string> = {};
  let profileNameArg: string | undefined;

  if (envFlagIndex >= 0) {
    // Everything after --env is KEY=VALUE pairs
    const envArgs = args.slice(envFlagIndex + 1);
    inlineEnv = parseEnvArgs(envArgs);
    // Name might be before --env
    if (envFlagIndex > 0) {
      profileNameArg = args[0];
    }
  } else if (args.length > 0) {
    // First arg might be profile name, rest are KEY=VALUE
    if (args[0].includes("=")) {
      // No name provided, all args are env vars
      inlineEnv = parseEnvArgs(args);
    } else {
      profileNameArg = args[0];
      inlineEnv = parseEnvArgs(args.slice(1));
    }
  }

  const name = profileNameArg || await input({
    message: "Profile name:",
    validate: (value) => {
      if (!value.trim()) {
        return "Profile name is required";
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        return "Profile name can only contain letters, numbers, hyphens, and underscores";
      }
      if (getProfile(value)) {
        return `Profile "${value}" already exists`;
      }
      return true;
    },
  });

  // Validate profile name if provided via args
  if (profileNameArg) {
    if (!/^[a-zA-Z0-9_-]+$/.test(profileNameArg)) {
      console.error("Profile name can only contain letters, numbers, hyphens, and underscores");
      process.exit(1);
    }
    if (getProfile(profileNameArg)) {
      console.error(`Profile "${profileNameArg}" already exists`);
      process.exit(1);
    }
  }

  const description = await input({
    message: "Description (optional):",
  });

  const env: Record<string, string> = { ...inlineEnv };

  // If no inline env vars provided, enter interactive mode
  if (Object.keys(inlineEnv).length === 0) {
    console.log("\nAdd environment variables (KEY=VALUE format, empty line to finish):\n");

    while (true) {
      const line = await input({
        message: ">",
      });

      if (!line.trim()) {
        break;
      }

      const parsed = parseEnvArgs([line]);
      if (Object.keys(parsed).length === 0) {
        console.log("  Invalid format. Use KEY=VALUE (e.g., API_KEY=xxx or API_KEY=\"value with spaces\")");
        continue;
      }

      Object.assign(env, parsed);
      for (const key of Object.keys(parsed)) {
        console.log(`  Added: ${key}`);
      }
    }
  } else {
    console.log("\nEnvironment variables:");
    for (const key of Object.keys(env)) {
      console.log(`  ${key}=${env[key]}`);
    }
  }

  if (Object.keys(env).length === 0) {
    const continueWithoutEnv = await confirm({
      message: "No environment variables added. Continue anyway?",
      default: false,
    });

    if (!continueWithoutEnv) {
      console.log("Profile creation cancelled.");
      return;
    }
  }

  const profile: Profile = {
    name,
    ...(description && { description }),
    env,
  };

  try {
    addProfile(profile);
    console.log(`\nProfile "${name}" created successfully.`);
  } catch (err) {
    console.error(`Error creating profile: ${(err as Error).message}`);
    process.exit(1);
  }
}
