import { execSync } from "child_process";
import { GITHUB_API_URL, GITHUB_REPO, VERSION } from "../constants";

interface GitHubRelease {
  tag_name: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
}

export async function checkForUpdates(): Promise<{ hasUpdate: boolean; latestVersion: string }> {
  try {
    const response = await fetch(GITHUB_API_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const release = (await response.json()) as GitHubRelease;
    const latestVersion = release.tag_name.replace(/^v/, "");
    const currentVersion = VERSION;

    return {
      hasUpdate: compareVersions(latestVersion, currentVersion) > 0,
      latestVersion,
    };
  } catch {
    throw new Error("Failed to check for updates");
  }
}

export async function performUpdate(): Promise<void> {
  const platform = process.platform;
  const arch = process.arch;

  let assetName: string;
  if (platform === "darwin" && arch === "arm64") {
    assetName = "cc-switch-darwin-arm64";
  } else if (platform === "darwin" && arch === "x64") {
    assetName = "cc-switch-darwin-x64";
  } else if (platform === "linux" && arch === "x64") {
    assetName = "cc-switch-linux-x64";
  } else {
    throw new Error(`Unsupported platform: ${platform}-${arch}`);
  }

  try {
    const response = await fetch(GITHUB_API_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const release = (await response.json()) as GitHubRelease;
    const asset = release.assets.find((a) => a.name === assetName);

    if (!asset) {
      throw new Error(`No release asset found for ${assetName}`);
    }

    console.log(`Downloading ${assetName}...`);

    // Get current executable path
    const execPath = process.execPath;

    // Download and replace
    const downloadUrl = asset.browser_download_url;
    execSync(`curl -fsSL "${downloadUrl}" -o "${execPath}.new"`, { stdio: "inherit" });
    execSync(`chmod +x "${execPath}.new"`);
    execSync(`mv "${execPath}.new" "${execPath}"`);

    console.log(`Successfully updated to ${release.tag_name}`);
  } catch (err) {
    throw new Error(`Update failed: ${(err as Error).message}`);
  }
}

function compareVersions(a: string, b: string): number {
  const partsA = a.split(".").map(Number);
  const partsB = b.split(".").map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;

    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }

  return 0;
}
