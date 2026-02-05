import { ensureDir } from "@std/fs";
import { join } from "@std/path";
import { z } from "@zod/zod";
import ky from "ky";
import { Downloader } from "./downloader.ts";

const TerraformRelease = z.object({
  version: z.string(),
  status: z.object({
    state: z.string(),
  }),
  builds: z.array(
    z.object({
      os: z.string(),
      arch: z.string(),
      url: z.string().url(),
    }),
  ),
});

/**
 * Downloads and manages Terraform binary versions.
 *
 * This class handles downloading Terraform binaries from GitHub releases, caching them locally,
 * verifying checksums, and managing multiple versions. It automatically cleans up older
 * versions to keep only the most recently used binaries.
 *
 * @example
 * ```ts
 * const downloader = new TerraformDownloader();
 * const terraformPath = await downloader.getBinaryPath(); // Gets latest version
 * const specificVersion = await downloader.getBinaryPath("1.40.0"); // Gets specific version
 * ```
 *
 * Features:
 * - Automatic version caching (keeps 3 most recent versions)
 * - SHA256 checksum verification
 * - Cross-platform support (Windows, macOS, Linux)
 * - Cross-compilation support via platform/arch overrides
 * - Respects GH_TOKEN/GITHUB_TOKEN environment variables for API rate limits
 */
export class TerraformDownloader extends Downloader {
  /**
   * Creates a new TerraformDownloader instance.
   *
   * @param options - Optional configuration for the downloader
   * @param options.baseDir - The directory to store downloaded Terraform binaries. Defaults to a temporary directory under the system temp folder.
   * @param options.platform - Platform override for testing or cross-compilation. If not specified, uses the current platform.
   * @param options.arch - Architecture override for testing or cross-compilation. If not specified, uses the current architecture.
   */
  constructor(options?: { baseDir?: string; platform?: typeof Deno.build.os; arch?: typeof Deno.build.arch }) {
    super("terraform", options);
  }

  /**
   * Gets the path to the Terraform binary, downloading it if necessary.
   *
   * This method will fetch the specified version (or latest GA release if not specified)
   * from GitHub, download and verify it if not already cached, and clean up old versions
   * to keep only the most recent 3 versions.
   *
   * @param version - Optional specific Terraform version to download (e.g., "1.40.0"). If not provided, downloads the latest GA release.
   * @returns The absolute path to the Terraform binary executable
   * @throws {Error} If the release cannot be found, download fails, or checksum verification fails
   */
  async getBinaryPath(version?: string): Promise<string> {
    const targetVersion = version ?? await this.#getLatestVersion();
    const binaryPath = await this.#downloadIfNeeded(targetVersion);
    await this.cleanupOldVersions();
    return binaryPath;
  }

  protected override getPlatform(): string {
    const os = this.platformOverride ?? Deno.build.os;
    switch (os) {
      case "windows":
        return "windows";
      case "darwin":
        return "darwin";
      case "linux":
        return "linux";
      case "freebsd":
        return "freebsd";
      case "solaris":
        return "solaris";
      default:
        throw new Error(`Unsupported platform: ${os}`);
    }
  }

  protected override getArch(): string {
    const arch = this.archOverride ?? Deno.build.arch;
    switch (arch) {
      case "x86_64":
        return "amd64";
      case "aarch64":
        return "arm64";
      default:
        throw new Error(`Unsupported architecture: ${arch}`);
    }
  }

  async #getLatestVersion(): Promise<string> {
    const releases = z.array(TerraformRelease).parse(
      await ky.get("https://api.releases.hashicorp.com/v1/releases/terraform").json(),
    );

    // Filter for GA versions (no pre-release suffixes like -alpha, -beta, -rc)
    const gaVersions = releases.filter((release) =>
      !release.version.includes("-") && release.status.state === "supported"
    );
    if (gaVersions.length === 0) {
      throw new Error("No GA versions found");
    }

    return gaVersions[0].version;
  }

  async #downloadIfNeeded(version: string): Promise<string> {
    const platform = this.getPlatform();
    const arch = this.getArch();
    const versionDir = join(this.baseDir, version);
    const binaryName = platform === "windows" ? "terraform.exe" : "terraform";
    const binaryPath = join(versionDir, binaryName);

    // Check if binary already exists
    try {
      const stat = await Deno.stat(binaryPath);
      if (stat.isFile) {
        return binaryPath;
      }
    } catch (e) {
      if (!(e instanceof Deno.errors.NotFound)) {
        // Re-throw some other error happened
        throw e;
      }
      // Binary doesn't exist, proceed with download
    }

    // Download zip file
    await ensureDir(versionDir);
    const zipFilename = `terraform_${version}_${platform}_${arch}.zip`;
    const zipPath = join(versionDir, zipFilename);
    await this.downloadFile(`https://releases.hashicorp.com/terraform/${version}/${zipFilename}`, zipPath);
    await this.verifySha256(await this.#getExpectedHash(version, platform, arch), zipPath);
    await this.extractZip(zipPath, versionDir);

    // Make executable on Unix-like systems
    if (platform !== "windows") {
      await Deno.chmod(binaryPath, 0o755);
    }

    return binaryPath;
  }

  async #getExpectedHash(
    version: string,
    platform: string,
    arch: string,
  ): Promise<string> {
    // Download the checksum file for the specific version
    const checksumText = await ky.get(
      `https://releases.hashicorp.com/terraform/${version}/terraform_${version}_SHA256SUMS`,
    ).text();

    // Parse the checksum file (format: "<hash>  <filename>")
    const filename = `terraform_${version}_${platform}_${arch}.zip`;
    const lines = checksumText.split("\n");
    let expectedHash: string | undefined;
    for (const line of lines) {
      const match = line.match(/^([a-f0-9]{64})\s+(.+)$/i);
      if (match && match[2] === filename) {
        expectedHash = match[1].toLowerCase();
        break;
      }
    }
    if (!expectedHash) {
      throw new Error(`Checksum not found for ${filename}`);
    }

    return expectedHash;
  }
}
