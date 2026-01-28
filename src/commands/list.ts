import { getProfiles, getDefaults } from "../config/storage";

export function listCommand(): void {
  const defaults = getDefaults();
  const profiles = getProfiles();

  // Show defaults first if any
  const defaultKeys = Object.keys(defaults);
  if (defaultKeys.length > 0) {
    console.log("Default environment variables:\n");
    for (const [key, value] of Object.entries(defaults)) {
      const displayValue = shouldMask(key) ? maskValue(value) : value;
      console.log(`  ${key}=${displayValue}`);
    }
    console.log();
  }

  if (profiles.length === 0) {
    console.log("No profiles configured. Use 'cc-switch add' to add a profile.");
    return;
  }

  console.log("Profiles:\n");

  for (const profile of profiles) {
    console.log(`  ${profile.name}`);
    if (profile.description) {
      console.log(`    Description: ${profile.description}`);
    }
    const envKeys = Object.keys(profile.env);
    if (envKeys.length > 0) {
      console.log(`    Environment variables:`);
      for (const [key, value] of Object.entries(profile.env)) {
        const displayValue = shouldMask(key) ? maskValue(value) : value;
        console.log(`      ${key}=${displayValue}`);
      }
    } else if (defaultKeys.length > 0) {
      console.log(`    (uses defaults only)`);
    }
    console.log();
  }
}

function shouldMask(key: string): boolean {
  const sensitivePatterns = ["token", "key", "secret", "password", "auth"];
  const lowerKey = key.toLowerCase();
  return sensitivePatterns.some((p) => lowerKey.includes(p));
}

function maskValue(value: string): string {
  if (value.length <= 8) {
    return "****";
  }
  return value.slice(0, 4) + "****" + value.slice(-4);
}
