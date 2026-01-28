import { input, confirm, select } from "@inquirer/prompts";
import { getProfile, updateProfile } from "../config/storage";
import type { Profile } from "../config/types";
import { parseEnvArgs } from "./add";

export async function editCommand(name: string, args: string[] = []): Promise<void> {
  const profile = getProfile(name);

  if (!profile) {
    console.error(`Profile "${name}" not found.`);
    process.exit(1);
  }

  // Check for --set flag for quick edit
  const setFlagIndex = args.indexOf("--set");
  if (setFlagIndex >= 0) {
    const envArgs = args.slice(setFlagIndex + 1);
    const updates = parseEnvArgs(envArgs);

    if (Object.keys(updates).length === 0) {
      console.error("Invalid format. Use: cc-switch edit <name> --set KEY=VALUE [KEY2=VALUE2 ...]");
      process.exit(1);
    }

    const updatedProfile: Profile = {
      ...profile,
      env: { ...profile.env, ...updates },
    };

    updateProfile(name, updatedProfile);
    console.log(`\nProfile "${name}" updated:`);
    for (const [key, value] of Object.entries(updates)) {
      console.log(`  ${key}=${value}`);
    }
    return;
  }

  // Check for --rm flag for quick removal of env vars
  const rmFlagIndex = args.indexOf("--rm");
  if (rmFlagIndex >= 0) {
    const keysToRemove = args.slice(rmFlagIndex + 1);

    if (keysToRemove.length === 0) {
      console.error("Usage: cc-switch edit <name> --rm KEY [KEY2 ...]");
      process.exit(1);
    }

    const env = { ...profile.env };
    const removed: string[] = [];
    const notFound: string[] = [];

    for (const key of keysToRemove) {
      if (key in env) {
        delete env[key];
        removed.push(key);
      } else {
        notFound.push(key);
      }
    }

    if (notFound.length > 0) {
      console.log(`Keys not found: ${notFound.join(", ")}`);
    }

    if (removed.length > 0) {
      const updatedProfile: Profile = { ...profile, env };
      updateProfile(name, updatedProfile);
      console.log(`Removed: ${removed.join(", ")}`);
    }
    return;
  }

  // Interactive mode
  console.log(`\nEditing profile: ${name}\n`);

  const newName = await input({
    message: "Profile name:",
    default: profile.name,
    validate: (value) => {
      if (!value.trim()) {
        return "Profile name is required";
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        return "Profile name can only contain letters, numbers, hyphens, and underscores";
      }
      if (value !== name && getProfile(value)) {
        return `Profile "${value}" already exists`;
      }
      return true;
    },
  });

  const description = await input({
    message: "Description:",
    default: profile.description || "",
  });

  const env: Record<string, string> = { ...profile.env };

  while (true) {
    const envKeys = Object.keys(env);
    const choices = [
      { name: "Add new variable", value: "add" },
      ...(envKeys.length > 0 ? [{ name: "Edit existing variable", value: "edit" }] : []),
      ...(envKeys.length > 0 ? [{ name: "Remove variable", value: "remove" }] : []),
      { name: "Done editing", value: "done" },
    ];

    const action = await select({
      message: `Environment variables (${envKeys.length} defined):`,
      choices,
    });

    if (action === "done") {
      break;
    }

    if (action === "add") {
      const envName = await input({
        message: "Variable name:",
      });

      if (envName.trim()) {
        const envValue = await input({
          message: `Value for ${envName}:`,
        });
        env[envName] = envValue;
      }
    } else if (action === "edit" && envKeys.length > 0) {
      const varToEdit = await select({
        message: "Select variable to edit:",
        choices: envKeys.map((k) => ({ name: `${k}=${env[k]}`, value: k })),
      });

      const newValue = await input({
        message: `New value for ${varToEdit}:`,
        default: env[varToEdit],
      });
      env[varToEdit] = newValue;
    } else if (action === "remove" && envKeys.length > 0) {
      const varToRemove = await select({
        message: "Select variable to remove:",
        choices: envKeys.map((k) => ({ name: `${k}=${env[k]}`, value: k })),
      });

      const confirmed = await confirm({
        message: `Remove ${varToRemove}?`,
        default: true,
      });

      if (confirmed) {
        delete env[varToRemove];
      }
    }
  }

  const updatedProfile: Profile = {
    name: newName,
    ...(description && { description }),
    env,
  };

  try {
    updateProfile(name, updatedProfile);
    console.log(`\nProfile "${newName}" updated successfully.`);
  } catch (err) {
    console.error(`Error updating profile: ${(err as Error).message}`);
    process.exit(1);
  }
}
