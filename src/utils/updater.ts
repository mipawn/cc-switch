import { execSync } from "child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
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

    // Update completions after binary update
    await installCompletions({ mode: "update" });
  } catch (err) {
    throw new Error(`Update failed: ${(err as Error).message}`);
  }
}

// Install/update shell completions
export async function installCompletions(options?: { mode?: "ensure" | "update" }): Promise<void> {
  const mode = options?.mode ?? "update";
  const home = homedir();
  const execPath = process.execPath;
  const currentShell = process.env.SHELL ?? "";

  const didChange: string[] = [];

  console.log(mode === "update" ? "Updating shell completions..." : "Checking shell completions...");

  const commandExists = (cmd: string): boolean => {
    try {
      execSync(`command -v ${cmd}`, { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  };

  const readTextIfExists = (filePath: string): string => {
    try {
      if (!existsSync(filePath)) return "";
      return readFileSync(filePath, "utf-8");
    } catch {
      return "";
    }
  };

  const shellLooksLike = (name: string): boolean => {
    if (!currentShell) return false;
    return currentShell === name || currentShell.endsWith(`/${name}`);
  };

  // Zsh completions
  const zshrcFile = join(home, ".zshrc");
  const shouldHandleZsh =
    shellLooksLike("zsh") || existsSync(zshrcFile) || commandExists("zsh");
  const shouldConfigureZsh = shellLooksLike("zsh") || existsSync(zshrcFile);

  if (shouldHandleZsh) {
    const zshCompletionDir = join(home, ".zsh", "completions");
    const zshCompletionFile = join(zshCompletionDir, "_cc-switch");
    const zshrcContent = shouldConfigureZsh ? readTextIfExists(zshrcFile) : "";

    const hasZshFpathConfig =
      zshrcContent.includes(".zsh/completions") ||
      zshrcContent.includes("# cc-switch completions");
    const zshFrameworkRegex = /oh-my-zsh|zinit|zplug|antigen/i;
    const isZshFrameworkUser = zshFrameworkRegex.test(zshrcContent);
    const hasCompinit = /compinit/i.test(zshrcContent);

    const shouldWriteZshCompletion = true; // Always update completion file
    const shouldWriteZshConfig = shouldConfigureZsh && !hasZshFpathConfig;

    if (shouldWriteZshCompletion) {
      if (!existsSync(zshCompletionDir)) {
        mkdirSync(zshCompletionDir, { recursive: true });
      }

      try {
        const zshCompletion = execSync(`"${execPath}" completion zsh`, { encoding: "utf-8" });
        writeFileSync(zshCompletionFile, zshCompletion);
        console.log(
          `  Zsh completions ${mode === "update" ? "updated" : "installed"}: ${zshCompletionFile}`,
        );
        didChange.push("zsh");
      } catch {
        // Ignore if zsh completion generation fails
      }
    }

    if (shouldWriteZshConfig) {
      const blockLines: string[] = [
        "",
        "# cc-switch completions",
        "fpath=(~/.zsh/completions $fpath)",
      ];
      if (!isZshFrameworkUser && !hasCompinit) {
        blockLines.push("autoload -Uz compinit && compinit");
      }
      blockLines.push("");
      try {
        appendFileSync(zshrcFile, blockLines.join("\n"), { encoding: "utf-8" });
        console.log(`  Zsh config updated: ${zshrcFile}`);
        didChange.push("zshrc");
      } catch {
        // Ignore if writing .zshrc fails
      }
    }
  }

  // Bash completions
  const bashCompletionDir = join(home, ".local", "share", "bash-completion", "completions");
  const bashCompletionFile = join(bashCompletionDir, "cc-switch");
  const bashrcFile = join(home, ".bashrc");
  const bashProfileFile = join(home, ".bash_profile");
  const shouldHandleBash =
    shellLooksLike("bash") ||
    existsSync(bashrcFile) ||
    existsSync(bashProfileFile) ||
    commandExists("bash");

  if (shouldHandleBash) {
    const shouldWriteBashCompletion = true; // Always update completion file

    if (shouldWriteBashCompletion) {
      if (!existsSync(bashCompletionDir)) {
        mkdirSync(bashCompletionDir, { recursive: true });
      }

      try {
        const bashCompletion = execSync(`"${execPath}" completion bash`, { encoding: "utf-8" });
        writeFileSync(bashCompletionFile, bashCompletion);
        console.log(
          `  Bash completions ${mode === "update" ? "updated" : "installed"}: ${bashCompletionFile}`,
        );
        didChange.push("bash");
      } catch {
        // Ignore if bash completion generation fails
      }
    }
  }

  // Fish completions
  const fishCompletionDir = join(home, ".config", "fish", "completions");
  const fishCompletionFile = join(fishCompletionDir, "cc-switch.fish");
  const fishConfigDir = join(home, ".config", "fish");
  const shouldHandleFish = shellLooksLike("fish") || existsSync(fishConfigDir) || commandExists("fish");

  if (shouldHandleFish) {
    const shouldWriteFishCompletion = true; // Always update completion file

    if (shouldWriteFishCompletion) {
      if (!existsSync(fishCompletionDir)) {
        mkdirSync(fishCompletionDir, { recursive: true });
      }

      try {
        const fishCompletion = execSync(`"${execPath}" completion fish`, { encoding: "utf-8" });
        writeFileSync(fishCompletionFile, fishCompletion);
        console.log(
          `  Fish completions ${mode === "update" ? "updated" : "installed"}: ${fishCompletionFile}`,
        );
        didChange.push("fish");
      } catch {
        // Ignore if fish completion generation fails
      }
    }
  }

  if (
    didChange.length > 0 &&
    (didChange.includes("zsh") || didChange.includes("zshrc")) &&
    (shellLooksLike("zsh") || existsSync(zshrcFile))
  ) {
    console.log("  Restart your terminal or run: source ~/.zshrc");
  }

  if (mode === "ensure" && didChange.length === 0) {
    console.log("Shell completions already set up. No changes made.");
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
