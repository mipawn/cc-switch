import { spawn } from "child_process";
import { CONFIG_FILE } from "../constants";
import { ensureConfigDir, loadConfig, saveConfig } from "../config/storage";

export function configCommand(): void {
  // Ensure config file exists
  ensureConfigDir();
  loadConfig(); // This will create default config if not exists

  // Get editor from environment, fallback to common editors
  const editor = process.env.EDITOR || process.env.VISUAL || getDefaultEditor();

  console.log(`Opening ${CONFIG_FILE} with ${editor}...`);

  const child = spawn(editor, [CONFIG_FILE], {
    stdio: "inherit",
  });

  child.on("error", (err) => {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      console.error(`Error: Editor '${editor}' not found.`);
      console.error("Set the EDITOR environment variable to your preferred editor.");
      console.error(`Example: export EDITOR=vim`);
    } else {
      console.error("Error opening editor:", err.message);
    }
    process.exit(1);
  });

  child.on("close", (code) => {
    if (code === 0) {
      // Validate the config after editing
      try {
        const config = loadConfig();
        console.log(`\nConfig saved. ${config.profiles.length} profile(s) configured.`);
      } catch (err) {
        console.error("\nWarning: Config file may have invalid JSON.");
      }
    }
    process.exit(code ?? 0);
  });
}

function getDefaultEditor(): string {
  // Windows uses notepad, Unix-like uses vi (like git)
  if (process.platform === "win32") {
    return "notepad";
  }
  return "vi";
}

export function configPathCommand(): void {
  console.log(CONFIG_FILE);
}
