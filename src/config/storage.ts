import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { CONFIG_DIR, CONFIG_FILE } from "../constants";
import { Config, DEFAULT_CONFIG, Profile } from "./types";

export function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): Config {
  ensureConfigDir();

  if (!existsSync(CONFIG_FILE)) {
    saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }

  try {
    const content = readFileSync(CONFIG_FILE, "utf-8");
    const config = JSON.parse(content) as Config;
    // Ensure defaults exists for backward compatibility
    if (!config.defaults) {
      config.defaults = {};
    }
    return config;
  } catch {
    console.error("Failed to parse config file, using default config");
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: Config): void {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

export function getProfiles(): Profile[] {
  return loadConfig().profiles;
}

export function getProfile(name: string): Profile | undefined {
  return getProfiles().find((p) => p.name === name);
}

export function addProfile(profile: Profile): void {
  const config = loadConfig();
  const existingIndex = config.profiles.findIndex((p) => p.name === profile.name);

  if (existingIndex >= 0) {
    throw new Error(`Profile "${profile.name}" already exists`);
  }

  config.profiles.push(profile);
  saveConfig(config);
}

export function updateProfile(name: string, profile: Profile): void {
  const config = loadConfig();
  const index = config.profiles.findIndex((p) => p.name === name);

  if (index < 0) {
    throw new Error(`Profile "${name}" not found`);
  }

  config.profiles[index] = profile;
  saveConfig(config);
}

export function removeProfile(name: string): void {
  const config = loadConfig();
  const index = config.profiles.findIndex((p) => p.name === name);

  if (index < 0) {
    throw new Error(`Profile "${name}" not found`);
  }

  config.profiles.splice(index, 1);
  saveConfig(config);
}

// Defaults management
export function getDefaults(): Record<string, string> {
  return loadConfig().defaults;
}

export function setDefaults(defaults: Record<string, string>): void {
  const config = loadConfig();
  config.defaults = defaults;
  saveConfig(config);
}

export function updateDefaults(updates: Record<string, string>): void {
  const config = loadConfig();
  config.defaults = { ...config.defaults, ...updates };
  saveConfig(config);
}

export function removeDefaultKeys(keys: string[]): void {
  const config = loadConfig();
  for (const key of keys) {
    delete config.defaults[key];
  }
  saveConfig(config);
}

// Get merged env: defaults + profile.env (profile takes precedence)
export function getMergedEnv(profile: Profile): Record<string, string> {
  const defaults = getDefaults();
  return { ...defaults, ...profile.env };
}
