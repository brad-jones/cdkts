import ProgressBar from "@deno-library/progress";
import { encodeHex } from "@std/encoding";
import { ensureDir } from "@std/fs";
import { dirname, join } from "@std/path";
import { BlobReader, BlobWriter, configure, ZipReader } from "@zip-js/zip-js";
import { z } from "@zod/zod";
import ky from "ky";
import { tempDir } from "../utils.ts";

// Configure zip.js to not use workers to avoid timer leaks in tests
configure({ useWebWorkers: false });

export abstract class Downloader {
  /** The maximum number of older versions we will cache in the base dir */
  protected readonly maxVersions = 3;

  /** The directory that we will store the downloaded artifacts in */
  protected readonly baseDir: string;

  /** Useful for testing and cross compilation scenarios, allows one to download for a different platform other than the current one. */
  protected readonly platformOverride?: typeof Deno.build.os;

  /** Useful for testing and cross compilation scenarios, allows one to download for a different architecture other than the current one. */
  protected readonly archOverride?: typeof Deno.build.arch;

  constructor(
    protected readonly type: string,
    options?: { baseDir?: string; platform?: typeof Deno.build.os; arch?: typeof Deno.build.arch },
  ) {
    this.platformOverride = options?.platform;
    this.archOverride = options?.arch;
    this.baseDir = options?.baseDir ?? tempDir("cdkts", type, this.getPlatform(), this.getArch());
  }

  abstract getBinaryPath(version?: string): Promise<string>;

  /**
   * Overridable method to get the platform, useful for testing and cross compilation scenarios.
   * By default, it will return the current platform or the platform override if provided.
   */
  protected getPlatform(): string {
    return this.platformOverride ?? Deno.build.os;
  }

  /**
   * Overridable method to get the arch, useful for testing and cross compilation scenarios.
   * By default, it will return the current arch or the arch override if provided.
   */
  protected getArch(): string {
    return this.archOverride ?? Deno.build.arch;
  }

  /**
   * Helper method to download a file from a URL to a specified output path with optional headers.
   * This method is used by the concrete downloaders to handle the downloading of files from GitHub or other sources.
   * It ensures that the output directory exists before downloading and writes the file in a streaming manner to avoid loading large files into memory.
   */
  protected async downloadFile(url: string, outputPath: string, headers: Record<string, string> = {}): Promise<void> {
    console.log(`Downloading ${url}`);
    await ensureDir(dirname(outputPath));
    const response = await ky.get(url, { headers });
    if (!response.body) throw new Error("missing body");

    // Get content length for progress tracking
    const contentLength = response.headers.get("content-length");
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    if (total > 0) {
      // Create progress bar
      const progressBar = new ProgressBar({
        total,
        complete: "=",
        incomplete: "-",
        display: ":percent :bar :time :completed/:total",
      });

      // Create a transform stream to track progress
      let loaded = 0;
      const progressStream = new TransformStream({
        transform(chunk, controller) {
          loaded += chunk.byteLength;
          progressBar.render(loaded);
          controller.enqueue(chunk);
        },
      });

      // Pipe through progress tracker to file
      await response.body
        .pipeThrough(progressStream)
        .pipeTo((await Deno.open(outputPath, { create: true, write: true, truncate: true })).writable);
    } else {
      // No content length, just download without progress
      await response.body.pipeTo((await Deno.open(outputPath, { create: true, write: true, truncate: true })).writable);
    }
  }

  /**
   * Helper method to verify the SHA256 checksum of a file against an expected hash.
   * If the verification fails, it will delete the file and throw an error.
   * This method is used by the concrete downloaders to ensure the integrity of downloaded files.
   */
  protected async verifySha256(expectedHash: string, filePath: string): Promise<void> {
    const actualHash = encodeHex(await crypto.subtle.digest("SHA-256", await Deno.readFile(filePath)));
    if (actualHash !== expectedHash) {
      await Deno.remove(filePath);
      throw new Error(`SHA256 mismatch for ${filePath}. Expected: ${expectedHash}, Got: ${actualHash}`);
    }
  }

  /**
   * Given a zip file path, extracts the zip to the specified output directory.
   * This method is used by the concrete downloaders to extract the downloaded zip files.
   */
  protected async extractZip(zipPath: string, outputDir: string): Promise<void> {
    const zipFileBlob = new Blob([await Deno.readFile(zipPath)]);
    const zipReader = new ZipReader(new BlobReader(zipFileBlob));
    const entries = await zipReader.getEntries();

    for (const entry of entries) {
      if (!entry.directory) {
        const outputPath = join(outputDir, entry.filename);
        const writer = new BlobWriter();
        const blob = await entry.getData(writer);
        const data = new Uint8Array(await blob.arrayBuffer());
        await Deno.writeFile(outputPath, data);
      }
    }

    await zipReader.close();
    await Deno.remove(zipPath);
  }

  /**
   * Cleans up old versions in the base directory, keeping only the most recent `maxVersions` versions.
   * Versions are determined by their modification time, not by their version number, to better align with user usage patterns.
   * If cleanup fails for any reason, it will log a warning but will not throw an error to avoid disrupting the user experience.
   * Concrete downloaders can call this method after a successful download to ensure old versions are cleaned up.
   */
  protected async cleanupOldVersions(): Promise<void> {
    try {
      // List all versions in our base dir
      const entries = [];
      for await (const entry of Deno.readDir(this.baseDir)) {
        if (entry.isDirectory) {
          const stat = await Deno.stat(join(this.baseDir, entry.name));
          entries.push({ name: entry.name, mtime: stat.mtime || new Date(0) });
        }
      }

      // Sort by modification time, newest first
      // NB: We do not sort by actual version number because then if a user
      // has pinned to an older version we would keep deleting that version,
      // subsequently requiring a re-download, rather we base our deleting on
      // modification time which ties in better with the users usage patterns.
      entries.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // Remove all but the most recent 3 versions
      for (let i = this.maxVersions; i < entries.length; i++) {
        const dirPath = join(this.baseDir, entries[i].name);
        await Deno.remove(dirPath, { recursive: true });
      }
    } catch (error) {
      // If cleanup fails, log but don't throw
      console.warn(`Failed to cleanup old versions: ${error}`);
    }
  }
}

/** see: https://docs.github.com/en/rest/releases */
const GithubRelease = z.object({
  tag_name: z.string(),
  prerelease: z.boolean(),
  draft: z.boolean(),
  assets: z.array(z.object({
    name: z.string(),
    digest: z.templateLiteral(["sha256:", z.string()]).nullish(),
    browser_download_url: z.url(),
  })),
});

export abstract class GithubDownloader extends Downloader {
  /**
   * Helper method to get the GitHub bearer token from environment variables.
   * It checks for both GH_TOKEN and GITHUB_TOKEN, which are commonly used
   * environment variables for GitHub authentication.
   *
   * If a token is found, it returns an object with the Authorization header
   * set to "Bearer <token>". If no token is found, it returns an empty object.
   *
   * This method can be used by concrete downloaders that need to authenticate
   * with the GitHub API to fetch release information or download assets.
   */
  protected getGithubBearerToken(): Record<string, string> {
    const githubToken = Deno.env.get("GH_TOKEN") ?? Deno.env.get("GITHUB_TOKEN");
    if (githubToken) {
      return {
        "Authorization": `Bearer ${githubToken}`,
      };
    }
    return {};
  }

  /**
   * Fetches release information from GitHub for the specified repository and version.
   *
   * If a specific version is provided, it will fetch the release with that tag.
   *
   * If no version is provided, it will fetch all releases and return the latest GA release
   * (i.e., the latest release that is not a prerelease and not a draft).
   *
   * Concrete downloaders can use this method to get the necessary release information before downloading assets.
   */
  protected async getRelease(owner: string, repo: string, version?: string): Promise<z.infer<typeof GithubRelease>> {
    // Grab a specific release
    if (version) {
      return GithubRelease.parse(
        await ky.get(`https://api.github.com/repos/${owner}/${repo}/releases/tags/v${version}`, {
          headers: this.getGithubBearerToken(),
        }).json(),
      );
    }

    // Get all recent releases
    const releases = z.array(GithubRelease).parse(
      await ky.get(`https://api.github.com/repos/${owner}/${repo}/releases`, {
        headers: this.getGithubBearerToken(),
      }).json(),
    );

    // Filter for GA versions (not prerelease, not draft)
    const gaReleases = releases.filter((r) => !r.prerelease && !r.draft);
    if (gaReleases.length === 0) {
      throw new Error("No GA releases found");
    }

    // Return the first release, which should be the latest release
    return gaReleases[0];
  }

  /**
   * Extracts the version number from the GitHub release information.
   * By default, it will take the tag_name and remove a leading "v" if present.
   * Concrete downloaders can override this method if their versioning scheme differs.
   */
  protected getVersionFromRelease(release: z.infer<typeof GithubRelease>): string {
    return release.tag_name.replace(/^v/, "");
  }

  /**
   * Downloads the specified asset from the given GitHub release if it doesn't already exist in the cache.
   * It verifies the SHA256 checksum of the downloaded file against the digest provided in the release asset information.
   * If the checksum verification fails, it will delete the downloaded file and throw an error.
   * If the file already exists and passes checksum verification, it will return the path to the existing file without re-downloading.
   * Concrete downloaders can use this method to handle the downloading and verification of release assets from GitHub.
   */
  protected async downloadIfNeeded(
    binName: string,
    zipFilename: string,
    release: z.infer<typeof GithubRelease>,
  ): Promise<string> {
    const version = this.getVersionFromRelease(release);
    const versionDir = join(this.baseDir, version);
    const binaryName = this.getPlatform().includes("windows") ? `${binName}.exe` : binName;
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

    // Locate the release asset
    const asset = release.assets.find((a) => a.name === zipFilename);
    if (!asset) {
      throw new Error(`Asset ${zipFilename} not found in release`);
    }
    if (!asset.digest) {
      throw new Error(`Asset ${zipFilename} does not have a digest`);
    }

    // Download it
    const zipPath = join(versionDir, zipFilename);
    await this.downloadFile(asset.browser_download_url, zipPath, this.getGithubBearerToken());
    this.verifySha256(asset.digest.split(":")[1].toLowerCase(), zipPath);
    await this.extractZip(zipPath, versionDir);

    // Make executable on Unix-like systems
    if (this.getPlatform().includes("windows") === false) {
      await Deno.chmod(binaryPath, 0o755);
    }

    return binaryPath;
  }
}
