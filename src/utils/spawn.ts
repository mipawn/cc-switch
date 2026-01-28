import { spawn } from "child_process";
import type { Profile } from "../config/types";
import { getMergedEnv } from "../config/storage";

export function launchClaude(profile: Profile, args: string[] = []): void {
  console.log(`Launching claude with profile: ${profile.name}`);

  const mergedEnv = getMergedEnv(profile);

  const child = spawn("claude", args, {
    env: { ...process.env, ...mergedEnv },
    stdio: "inherit",
  });

  child.on("error", (err) => {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      console.error("Error: 'claude' command not found. Please install Claude Code first.");
    } else {
      console.error("Error launching claude:", err.message);
    }
    process.exit(1);
  });

  child.on("close", (code) => {
    process.exit(code ?? 0);
  });
}
