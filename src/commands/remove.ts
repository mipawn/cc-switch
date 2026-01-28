import { confirm } from "@inquirer/prompts";
import { getProfile, removeProfile } from "../config/storage";

export async function removeCommand(name: string): Promise<void> {
  const profile = getProfile(name);

  if (!profile) {
    console.error(`Profile "${name}" not found.`);
    process.exit(1);
  }

  const confirmed = await confirm({
    message: `Are you sure you want to delete profile "${name}"?`,
    default: false,
  });

  if (!confirmed) {
    console.log("Deletion cancelled.");
    return;
  }

  try {
    removeProfile(name);
    console.log(`Profile "${name}" deleted successfully.`);
  } catch (err) {
    console.error(`Error deleting profile: ${(err as Error).message}`);
    process.exit(1);
  }
}
