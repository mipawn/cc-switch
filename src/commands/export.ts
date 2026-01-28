import { loadConfig, getProfile } from "../config/storage";
import type { Profile } from "../config/types";

interface ExportData {
  version: string;
  exportedAt: string;
  defaults?: Record<string, string>;
  profiles: Profile[];
}

export function exportCommand(args: string[]): void {
  const config = loadConfig();

  // Parse flags
  const noDefaultsFlag = args.includes("--no-defaults");

  // Filter out flags from args to get profile names
  const profileNames = args.filter(arg => !arg.startsWith("-"));

  let profilesToExport: Profile[];

  if (profileNames.length > 0) {
    // Export specific profiles
    profilesToExport = [];
    for (const name of profileNames) {
      const profile = getProfile(name);
      if (!profile) {
        console.error(`Profile "${name}" not found`);
        process.exit(1);
      }
      profilesToExport.push(profile);
    }
  } else {
    // Export all profiles
    profilesToExport = config.profiles;
  }

  const exportData: ExportData = {
    version: config.version,
    exportedAt: new Date().toISOString(),
    profiles: profilesToExport,
  };

  // Include defaults if not disabled and there are any
  if (!noDefaultsFlag && Object.keys(config.defaults).length > 0) {
    exportData.defaults = config.defaults;
  }

  // Output to stdout for piping
  console.log(JSON.stringify(exportData, null, 2));

  // Warning goes to stderr so it doesn't affect piped output (yellow color)
  console.warn("\n⚠️  Warning: Export may contain sensitive data (API keys, tokens).");
  console.warn("   Please handle the exported file securely.");
}
