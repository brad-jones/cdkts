import { ensureDir } from "@std/fs";
import { join } from "@std/path";
import { BlobReader, BlobWriter, configure, ZipReader } from "@zip-js/zip-js";
import type { Downloader } from "./downloader.ts";

// Configure zip.js to not use workers to avoid timer leaks in tests
configure({ useWebWorkers: false });

/*
  Terraform binaries can be downloaded from:
  https://releases.hashicorp.com/terraform
*/

interface TerraformRelease {
  version: string;
  status: {
    state: string;
  };
  builds: Array<{
    os: string;
    arch: string;
    url: string;
  }>;
}

export class TerraformDownloader implements Downloader {
  private readonly maxVersions = 3;
  private readonly baseDir: string;
  private readonly platformOverride?: string;
  private readonly archOverride?: string;

  constructor(options?: { baseDir?: string; platform?: string; arch?: string }) {
    this.baseDir = options?.baseDir ??
      join(
        Deno.env.get("TMPDIR") || Deno.env.get("TEMP") || Deno.env.get("TMP") || "/tmp",
        "cdkts",
        "terraform",
      );
    this.platformOverride = options?.platform;
    this.archOverride = options?.arch;
  }

  async getBinaryPath(version?: string): Promise<string> {
    const targetVersion = version || await this.getLatestVersion();
    const binaryPath = await this.downloadIfNeeded(targetVersion);
    await this.cleanupOldVersions();
    return binaryPath;
  }

  private async getLatestVersion(): Promise<string> {
    const response = await fetch("https://api.releases.hashicorp.com/v1/releases/terraform");
    if (!response.ok) {
      throw new Error(`Failed to fetch Terraform versions: ${response.statusText}`);
    }

    const data: TerraformRelease[] = await response.json();
    // Filter for GA versions (no pre-release suffixes like -alpha, -beta, -rc)
    const gaVersions = data.filter((release) => !release.version.includes("-") && release.status.state === "supported");

    if (gaVersions.length === 0) {
      throw new Error("No GA versions found");
    }

    return gaVersions[0].version;
  }

  private async downloadIfNeeded(version: string): Promise<string> {
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
    } catch {
      // Binary doesn't exist, proceed with download
    }

    // Download and extract
    await ensureDir(versionDir);
    const downloadUrl =
      `https://releases.hashicorp.com/terraform/${version}/terraform_${version}_${platform}_${arch}.zip`;

    console.log(`Downloading Terraform ${version} from ${downloadUrl}`);
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Failed to download Terraform: ${response.statusText}`);
    }

    const zipData = new Uint8Array(await response.arrayBuffer());
    const zipPath = join(versionDir, "terraform.zip");
    await Deno.writeFile(zipPath, zipData);

    // Verify SHA256 checksum
    await this.verifySha256(version, platform, arch, zipData);

    // Extract zip file
    await this.extractZip(zipPath, versionDir);
    await Deno.remove(zipPath);

    // Make executable on Unix-like systems
    if (platform !== "windows") {
      await Deno.chmod(binaryPath, 0o755);
    }

    return binaryPath;
  }

  private async extractZip(zipPath: string, outputDir: string): Promise<void> {
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
  }

  private async verifySha256(
    version: string,
    platform: string,
    arch: string,
    zipData: Uint8Array,
  ): Promise<void> {
    const checksumUrl = `https://releases.hashicorp.com/terraform/${version}/terraform_${version}_SHA256SUMS`;
    const response = await fetch(checksumUrl);
    if (!response.ok) {
      throw new Error(`Failed to download checksums: ${response.statusText}`);
    }

    const checksumText = await response.text();
    const filename = `terraform_${version}_${platform}_${arch}.zip`;

    // Parse the checksum file (format: "<hash>  <filename>")
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

    // Calculate actual hash
    const hashBuffer = await crypto.subtle.digest("SHA-256", new Uint8Array(zipData));
    const actualHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (actualHash !== expectedHash) {
      throw new Error(
        `SHA256 mismatch for ${filename}. Expected: ${expectedHash}, Got: ${actualHash}`,
      );
    }
  }

  private async cleanupOldVersions(): Promise<void> {
    try {
      const entries = [];
      for await (const entry of Deno.readDir(this.baseDir)) {
        if (entry.isDirectory) {
          const stat = await Deno.stat(join(this.baseDir, entry.name));
          entries.push({ name: entry.name, mtime: stat.mtime || new Date(0) });
        }
      }

      // Sort by modification time, newest first
      entries.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // Remove all but the most recent 3 versions
      for (let i = this.maxVersions; i < entries.length; i++) {
        const dirPath = join(this.baseDir, entries[i].name);
        await Deno.remove(dirPath, { recursive: true });
      }
    } catch (error) {
      // If cleanup fails, log but don't throw
      console.warn(`Failed to cleanup old Terraform versions: ${error}`);
    }
  }

  private getPlatform(): string {
    if (this.platformOverride) {
      return this.platformOverride;
    }

    switch (Deno.build.os) {
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
        throw new Error(`Unsupported platform: ${Deno.build.os}`);
    }
  }

  private getArch(): string {
    if (this.archOverride) {
      return this.archOverride;
    }

    switch (Deno.build.arch) {
      case "x86_64":
        return "amd64";
      case "aarch64":
        return "arm64";
      default:
        throw new Error(`Unsupported architecture: ${Deno.build.arch}`);
    }
  }
}
