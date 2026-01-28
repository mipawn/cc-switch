import { confirm } from "@inquirer/prompts";
import { VERSION } from "../constants";
import { checkForUpdates, installCompletions, performUpdate, PermissionError } from "../utils/updater";

export async function updateCommand(): Promise<void> {
  console.log(`Current version: ${VERSION}`);
  console.log("Checking for updates...");

  try {
    const { hasUpdate, latestVersion } = await checkForUpdates();

    if (!hasUpdate) {
      console.log("You are already running the latest version.");
      // Repair for existing users: ensure completions exist even when no update is needed.
      await installCompletions({ mode: "ensure" });
      return;
    }

    console.log(`New version available: ${latestVersion}`);

    const confirmed = await confirm({
      message: "Do you want to update now?",
      default: true,
    });

    if (!confirmed) {
      console.log("Update cancelled.");
      // Still ensure shell completions are installed (repair mode).
      await installCompletions({ mode: "ensure" });
      return;
    }

    try {
      await performUpdate();
    } catch (err) {
      if (err instanceof PermissionError) {
        console.log(`\n${err.message}`);
        const useSudo = await confirm({
          message: "Do you want to retry with sudo?",
          default: true,
        });

        if (useSudo) {
          await performUpdate(true);
        } else {
          console.log("Update cancelled. You can manually run: sudo cc-switch update");
          process.exit(1);
        }
      } else {
        throw err;
      }
    }
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
    process.exit(1);
  }
}
