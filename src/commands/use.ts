import { getProfile } from "../config/storage";
import { launchClaude } from "../utils/spawn";

export function useCommand(name: string, args: string[]): void {
  const profile = getProfile(name);

  if (!profile) {
    console.error(`Profile "${name}" not found. Use 'cc-switch list' to see available profiles.`);
    process.exit(1);
  }

  launchClaude(profile, args);
}
