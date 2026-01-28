import { input, select, confirm } from "@inquirer/prompts";
import { getDefaults, updateDefaults, removeDefaultKeys } from "../config/storage";
import { parseEnvArgs } from "./add";

function maskSensitiveValue(value: string): string {
  const sensitivePatterns = ["token", "key", "secret", "password", "auth"];
  const lowerKey = value.toLowerCase();
  if (sensitivePatterns.some((p) => lowerKey.includes(p))) {
    return value.length > 8 ? value.slice(0, 4) + "****" + value.slice(-4) : "****";
  }
  return value;
}

export function listDefaultsCommand(): void {
  const defaults = getDefaults();
  const keys = Object.keys(defaults);

  if (keys.length === 0) {
    console.log("No default environment variables configured.");
    console.log("\nUse 'cc-switch defaults set KEY=VALUE' to add defaults.");
    return;
  }

  console.log("\nDefault environment variables:\n");
  for (const key of keys) {
    console.log(`  ${key}=${maskSensitiveValue(defaults[key])}`);
  }
  console.log();
}

export async function setDefaultsCommand(args: string[]): Promise<void> {
  let env: Record<string, string> = {};

  if (args.length > 0) {
    // Parse KEY=VALUE from command line
    env = parseEnvArgs(args);
    if (Object.keys(env).length === 0) {
      console.error("Invalid format. Use: cc-switch defaults set KEY=VALUE [KEY2=VALUE2 ...]");
      process.exit(1);
    }
  } else {
    // Interactive mode
    console.log("\nEnter default environment variables (KEY=VALUE format, empty line to finish):\n");

    while (true) {
      const line = await input({
        message: ">",
      });

      if (!line.trim()) break;

      const parsed = parseEnvArgs([line]);
      if (Object.keys(parsed).length === 0) {
        console.log("  Invalid format. Use KEY=VALUE");
        continue;
      }

      Object.assign(env, parsed);
    }
  }

  if (Object.keys(env).length === 0) {
    console.log("No variables to set.");
    return;
  }

  updateDefaults(env);
  console.log("\nDefaults updated:");
  for (const [key, value] of Object.entries(env)) {
    console.log(`  ${key}=${maskSensitiveValue(value)}`);
  }
}

export async function editDefaultsCommand(): Promise<void> {
  const defaults = getDefaults();
  const keys = Object.keys(defaults);

  if (keys.length === 0) {
    console.log("No default environment variables configured.");
    console.log("\nUse 'cc-switch defaults set KEY=VALUE' to add defaults.");
    return;
  }

  while (true) {
    const currentKeys = Object.keys(getDefaults());
    const choices = [
      { name: "Add/Update variable", value: "add" },
      ...(currentKeys.length > 0 ? [{ name: "Edit existing variable", value: "edit" }] : []),
      ...(currentKeys.length > 0 ? [{ name: "Remove variable", value: "remove" }] : []),
      { name: "Done", value: "done" },
    ];

    const action = await select({
      message: `Default variables (${currentKeys.length} defined):`,
      choices,
    });

    if (action === "done") break;

    const currentDefaults = getDefaults();

    if (action === "add") {
      const line = await input({
        message: "Enter KEY=VALUE:",
      });

      if (line.trim()) {
        const parsed = parseEnvArgs([line]);
        if (Object.keys(parsed).length > 0) {
          updateDefaults(parsed);
          console.log("  Added/Updated.");
        } else {
          console.log("  Invalid format.");
        }
      }
    } else if (action === "edit") {
      const varToEdit = await select({
        message: "Select variable to edit:",
        choices: currentKeys.map((k) => ({
          name: `${k}=${maskSensitiveValue(currentDefaults[k])}`,
          value: k,
        })),
      });

      const newValue = await input({
        message: `New value for ${varToEdit}:`,
        default: currentDefaults[varToEdit],
      });

      updateDefaults({ [varToEdit]: newValue });
      console.log("  Updated.");
    } else if (action === "remove") {
      const varToRemove = await select({
        message: "Select variable to remove:",
        choices: currentKeys.map((k) => ({
          name: `${k}=${maskSensitiveValue(currentDefaults[k])}`,
          value: k,
        })),
      });

      const confirmed = await confirm({
        message: `Remove ${varToRemove}?`,
        default: true,
      });

      if (confirmed) {
        removeDefaultKeys([varToRemove]);
        console.log("  Removed.");
      }
    }
  }

  console.log("\nDefaults saved.");
}

export async function removeDefaultsCommand(args: string[]): Promise<void> {
  if (args.length === 0) {
    console.error("Usage: cc-switch defaults rm KEY [KEY2 ...]");
    process.exit(1);
  }

  const defaults = getDefaults();
  const keysToRemove = args.filter((k) => k in defaults);
  const notFound = args.filter((k) => !(k in defaults));

  if (notFound.length > 0) {
    console.log(`Keys not found: ${notFound.join(", ")}`);
  }

  if (keysToRemove.length > 0) {
    removeDefaultKeys(keysToRemove);
    console.log(`Removed: ${keysToRemove.join(", ")}`);
  }
}
