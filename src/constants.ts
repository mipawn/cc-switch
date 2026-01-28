import { homedir } from "os";
import { join } from "path";
import packageJson from "../package.json";

export const APP_NAME = "cc-switch";
export const VERSION = packageJson.version;

export const CONFIG_DIR = join(homedir(), ".config", APP_NAME);
export const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export const GITHUB_REPO = "mipawn/cc-switch";
export const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
