import { confirm, checkbox } from "@inquirer/prompts";
import { existsSync, readFileSync } from "fs";
import { loadConfig, saveConfig, getProfile } from "../config/storage";
import type { Config, Profile } from "../config/types";

interface ExportData {
  version: string;
  exportedAt?: string;
  defaults?: Record<string, string>;
  profiles: Profile[];
}

export async function importCommand(args: string[]): Promise<void> {
  // Parse flags
  const forceFlag = args.includes("--force") || args.includes("-f");
  const mergeDefaultsFlag = args.includes("--merge-defaults");
  const noDefaultsFlag = args.includes("--no-defaults");

  // Filter out flags from args to get file path
  const filePath = args.find(arg => !arg.startsWith("-"));

  let jsonContent: string;

  if (filePath) {
    // Read from file
    if (!existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }
    jsonContent = readFileSync(filePath, "utf-8");
  } else {
    // Read from stdin
    jsonContent = await readStdin();
    if (!jsonContent.trim()) {
      console.error("No input provided. Usage:");
      console.error("  cc-switch import config.json");
      console.error("  cc-switch import < config.json");
      console.error("  cat config.json | cc-switch import");
      process.exit(1);
    }
  }

  let importData: ExportData;

  try {
    importData = JSON.parse(jsonContent);
  } catch {
    console.error("Invalid JSON format");
    process.exit(1);
  }

  // Normalize import data - profiles defaults to empty array
  if (!importData.profiles) {
    importData.profiles = [];
  }

  // Validate profiles is an array if present
  if (!Array.isArray(importData.profiles)) {
    console.error("Invalid import format: 'profiles' must be an array");
    process.exit(1);
  }

  const config = loadConfig();
  let importedCount = 0;
  let skippedCount = 0;
  let overwrittenCount = 0;

  // Handle defaults
  if (importData.defaults && !noDefaultsFlag) {
    const defaultsKeys = Object.keys(importData.defaults);
    if (defaultsKeys.length > 0) {
      const existingDefaultsKeys = Object.keys(config.defaults);

      if (mergeDefaultsFlag) {
        // Merge defaults
        config.defaults = { ...config.defaults, ...importData.defaults };
        console.log(`✓ Merged ${defaultsKeys.length} default variable(s)`);
      } else if (existingDefaultsKeys.length > 0) {
        // Ask user what to do with defaults
        if (forceFlag) {
          config.defaults = { ...config.defaults, ...importData.defaults };
          console.log(`✓ Merged ${defaultsKeys.length} default variable(s)`);
        } else {
          const overwriteDefaults = await confirm({
            message: `Import contains ${defaultsKeys.length} default variable(s). Merge with existing defaults?`,
            default: true,
          });

          if (overwriteDefaults) {
            config.defaults = { ...config.defaults, ...importData.defaults };
            console.log(`✓ Merged ${defaultsKeys.length} default variable(s)`);
          } else {
            console.log(`⊘ Skipped default variables`);
          }
        }
      } else {
        // No existing defaults, just add them
        config.defaults = importData.defaults;
        console.log(`✓ Imported ${defaultsKeys.length} default variable(s)`);
      }
    }
  }

  // Handle profiles
  const existingNames = new Set(config.profiles.map(p => p.name));
  const conflictingProfiles = importData.profiles.filter(p => existingNames.has(p.name));
  const newProfiles = importData.profiles.filter(p => !existingNames.has(p.name));

  // Add new profiles directly
  for (const profile of newProfiles) {
    if (validateProfile(profile)) {
      config.profiles.push(profile);
      importedCount++;
      console.log(`✓ Imported profile: ${profile.name}`);
    } else {
      const unknownProfile = profile as { name?: string };
      console.error(`⚠ Skipped invalid profile: ${unknownProfile.name || "(unnamed)"}`);
      skippedCount++;
    }
  }

  // Handle conflicting profiles
  if (conflictingProfiles.length > 0) {
    if (forceFlag) {
      // Force overwrite all conflicts
      for (const profile of conflictingProfiles) {
        if (validateProfile(profile)) {
          const index = config.profiles.findIndex(p => p.name === profile.name);
          config.profiles[index] = profile;
          overwrittenCount++;
          console.log(`✓ Overwritten profile: ${profile.name}`);
        }
      }
    } else {
      // Interactive mode: let user choose which to overwrite
      console.log(`\nFound ${conflictingProfiles.length} existing profile(s):`);

      const choices = conflictingProfiles.map(p => ({
        name: p.name,
        value: p.name,
        checked: false,
      }));

      const selectedToOverwrite = await checkbox({
        message: "Select profiles to overwrite (space to select, enter to confirm):",
        choices,
      });

      for (const profile of conflictingProfiles) {
        if (selectedToOverwrite.includes(profile.name)) {
          if (validateProfile(profile)) {
            const index = config.profiles.findIndex(p => p.name === profile.name);
            config.profiles[index] = profile;
            overwrittenCount++;
            console.log(`✓ Overwritten profile: ${profile.name}`);
          }
        } else {
          skippedCount++;
          console.log(`⊘ Skipped profile: ${profile.name}`);
        }
      }
    }
  }

  // Save config
  saveConfig(config);

  // Summary
  console.log("\nImport complete:");
  console.log(`  ${importedCount} profile(s) imported`);
  if (overwrittenCount > 0) {
    console.log(`  ${overwrittenCount} profile(s) overwritten`);
  }
  if (skippedCount > 0) {
    console.log(`  ${skippedCount} profile(s) skipped`);
  }
}

function validateProfile(profile: unknown): profile is Profile {
  if (!profile || typeof profile !== "object") return false;
  const p = profile as Record<string, unknown>;
  if (typeof p.name !== "string" || !p.name.trim()) return false;
  if (!/^[a-zA-Z0-9_-]+$/.test(p.name)) return false;
  if (p.env && typeof p.env !== "object") return false;
  return true;
}

async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";

    // Check if stdin is a TTY (interactive terminal)
    if (process.stdin.isTTY) {
      resolve("");
      return;
    }

    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      resolve(data);
    });
    process.stdin.on("error", () => {
      resolve("");
    });

    // Timeout after 100ms if no data
    setTimeout(() => {
      if (!data) {
        resolve("");
      }
    }, 100);
  });
}
