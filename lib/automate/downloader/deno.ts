import { GithubDownloader } from "./downloader.ts";

/**
 * Downloads and manages Deno binary versions.
 *
 * This class handles downloading Deno binaries from GitHub releases, caching them locally,
 * verifying checksums, and managing multiple versions. It automatically cleans up older
 * versions to keep only the most recently used binaries.
 *
 * @example
 * ```ts
 * const downloader = new DenoDownloader();
 * const denoPath = await downloader.getBinaryPath(); // Gets latest version
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
export class DenoDownloader extends GithubDownloader {
  /**
   * Creates a new DenoDownloader instance.
   *
   * @param options - Optional configuration for the downloader
   * @param options.baseDir - The directory to store downloaded Deno binaries. Defaults to a temporary directory under the system temp folder.
   * @param options.platform - Platform override for testing or cross-compilation. If not specified, uses the current platform.
   * @param options.arch - Architecture override for testing or cross-compilation. If not specified, uses the current architecture.
   */
  constructor(options?: { baseDir?: string; platform?: typeof Deno.build.os; arch?: typeof Deno.build.arch }) {
    super("deno", options);
  }

  /**
   * Gets the path to the Deno binary, downloading it if necessary.
   *
   * This method will fetch the specified version (or latest GA release if not specified)
   * from GitHub, download and verify it if not already cached, and clean up old versions
   * to keep only the most recent 3 versions.
   *
   * @param version - Optional specific Deno version to download (e.g., "1.40.0"). If not provided, downloads the latest GA release.
   * @returns The absolute path to the Deno binary executable
   * @throws {Error} If the release cannot be found, download fails, or checksum verification fails
   */
  async getBinaryPath(version?: string): Promise<string> {
    const targetRelease = await this.getRelease("denoland", "deno", version);
    const binaryPath = await this.downloadIfNeeded(
      "deno",
      `deno-${this.getArch()}-${this.getPlatform()}.zip`,
      targetRelease,
    );
    await this.cleanupOldVersions();
    return binaryPath;
  }

  protected override getPlatform() {
    const os = this.platformOverride ?? Deno.build.os;
    switch (os) {
      case "windows":
        return "pc-windows-msvc";
      case "darwin":
        return "apple-darwin";
      case "linux":
        return "unknown-linux-gnu";
      default:
        throw new Error(`Unsupported platform: ${os}`);
    }
  }

  protected override getArch() {
    const arch = this.archOverride ?? Deno.build.arch;
    switch (arch) {
      case "x86_64":
        return "x86_64";
      case "aarch64":
        return "aarch64";
      default:
        throw new Error(`Unsupported architecture: ${arch}`);
    }
  }
}
