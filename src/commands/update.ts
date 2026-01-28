import { confirm } from "@inquirer/prompts";
import { VERSION } from "../constants";
import { checkForUpdates, performUpdate } from "../utils/updater";

export async function updateCommand(): Promise<void> {
  console.log(`Current version: ${VERSION}`);
  console.log("Checking for updates...");

  try {
    const { hasUpdate, latestVersion } = await checkForUpdates();

    if (!hasUpdate) {
      console.log("You are already running the latest version.");
      return;
    }

    console.log(`New version available: ${latestVersion}`);

    const confirmed = await confirm({
      message: "Do you want to update now?",
      default: true,
    });

    if (!confirmed) {
      console.log("Update cancelled.");
      return;
    }

    await performUpdate();
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
    process.exit(1);
  }
}
