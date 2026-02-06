/**
 * This module acts a custom installer for the CDKTS CLI.
 * It downloads the latest version of the CLI from GitHub releases.
 *
 * The CLI is actually a Go binary with Deno embedded inside it.
 *
 * We use this over say the normal `deno install` approach because
 * it allows us to inject any deno config files of the imported stackfile
 * as opposed to config files for the CLI itself.
 *
 * So to install the CLI you would run:
 *
 * ```sh
 * $ deno run -A jsr:@brad-jones/cdkts/cli-installer
 * ```
 *
 * @module
 */

import { Command } from "@cliffy/command";
import { ensureDir } from "@std/fs";
import { join } from "@std/path";
import { GithubDownloader } from "../../lib/automate/downloader/downloader.ts";

/** The default version to install, updated by the build process */
const DEFAULT_VERSION = "0.2.8";

/**
 * CDKTS CLI installer that downloads the CLI binary from GitHub releases.
 */
class CdktsInstaller extends GithubDownloader {
  constructor(private installDir: string) {
    super("cdkts");
  }

  /**
   * Downloads and installs the CDKTS CLI binary to the specified installation directory.
   */
  async getBinaryPath(version: string): Promise<string> {
    try {
      console.log(`\n📦 Installing CDKTS CLI v${version}...\n`);

      // Fetch the release information
      const release = await this.getRelease("brad-jones", "cdkts", version);

      // Determine the binary name based on platform
      const platform = this.getPlatform();
      const arch = this.getArch();
      const binaryExt = platform === "windows" ? ".exe" : "";
      const binaryName = `cdkts${binaryExt}`;
      const assetName = `cdkts_${platform}_${arch}${binaryExt}`;

      // Find the asset
      const asset = release.assets.find((a) => a.name === assetName);
      if (!asset) {
        throw new Error(
          `Asset ${assetName} not found in release ${version}.\nAvailable assets: ${
            release.assets.map((a) => a.name).join(", ")
          }`,
        );
      }

      // Ensure installation directory exists
      await ensureDir(this.installDir);
      const binaryPath = join(this.installDir, binaryName);

      // Download the binary
      console.log(`\n⬇️  Downloading binary...`);
      await this.downloadFile(asset.browser_download_url, binaryPath, this.getGithubBearerToken());

      // Verify checksum if available
      if (asset.digest) {
        console.log(`\n🔐 Verifying checksum...`);
        await this.verifySha256(asset.digest.split(":")[1].toLowerCase(), binaryPath);
        console.log(`✓ Checksum verified`);
      }

      // Make executable on Unix-like systems
      if (platform !== "windows") {
        await Deno.chmod(binaryPath, 0o755);
      }

      console.log(`\n✅ Successfully installed CDKTS CLI v${version}`);
      console.log(`\n📍 Installation location: ${binaryPath}`);
      console.log(`\n🚀 Usage:`);
      console.log(`   Add ${this.installDir} to your PATH, then run:`);
      console.log(`   $ cdkts --help`);
      console.log(`\n   Or run directly:`);
      console.log(`   $ ${binaryPath} --help\n`);

      return binaryPath;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`\n❌ Installation failed: ${error.message}\n`);
        if (error.message.includes("rate limit")) {
          console.error(
            `💡 Tip: Set GH_TOKEN or GITHUB_TOKEN environment variable to increase GitHub API rate limits.\n`,
          );
        }
      } else {
        console.error(`\n❌ Installation failed with an unknown error\n`);
      }
      throw error;
    }
  }
}

/**
 * Determines the default installation directory.
 * Uses DENO_INSTALL_ROOT if set, otherwise defaults to $HOME/.deno/bin
 */
function getDefaultInstallDir(): string {
  const denoInstallRoot = Deno.env.get("DENO_INSTALL_ROOT");
  if (denoInstallRoot) {
    return join(denoInstallRoot, "bin");
  }

  const home = Deno.env.get("HOME") ?? Deno.env.get("USERPROFILE");
  if (!home) {
    throw new Error("Could not determine home directory");
  }

  return join(home, ".deno", "bin");
}

await new Command()
  .name("cdkts-installer")
  .version(DEFAULT_VERSION)
  .description("Install the CDKTS CLI from GitHub releases")
  .option(
    "-v, --version <version:string>",
    "Specific version to install (e.g., 0.2.8). If not specified, installs the same version as the installer.",
    { default: DEFAULT_VERSION },
  )
  .option(
    "-d, --dir <directory:string>",
    "Installation directory. Defaults to DENO_INSTALL_ROOT/bin or $HOME/.deno/bin",
    { default: getDefaultInstallDir() },
  )
  .action(async ({ version, dir }) => {
    const installer = new CdktsInstaller(dir);
    await installer.getBinaryPath(version);
  })
  .parse();
