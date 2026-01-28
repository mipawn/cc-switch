import { select } from "@inquirer/prompts";
import { getProfiles } from "../config/storage";
import { launchClaude } from "../utils/spawn";

export async function selectCommand(args: string[]): Promise<void> {
  const profiles = getProfiles();

  if (profiles.length === 0) {
    console.log("No profiles configured. Use 'cc-switch add' to add a profile.");
    return;
  }

  const choices = profiles.map((p) => ({
    name: p.description ? `${p.name} - ${p.description}` : p.name,
    value: p.name,
  }));

  const selectedName = await select({
    message: "Select a profile to use:",
    choices,
  });

  const profile = profiles.find((p) => p.name === selectedName);
  if (!profile) {
    console.error(`Profile "${selectedName}" not found`);
    process.exit(1);
  }

  launchClaude(profile, args);
}
