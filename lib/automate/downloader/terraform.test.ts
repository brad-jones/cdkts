import { assertEquals, assertMatch } from "@std/assert";
import { existsSync } from "@std/fs";
import { join } from "@std/path";
import { TerraformDownloader } from "./terraform.ts";

// Helper to create a temporary directory for testing
async function withTempDir(fn: (tempDir: string) => Promise<void>) {
  const tempDir = await Deno.makeTempDir({ prefix: "terraform-test-" });
  try {
    await fn(tempDir);
  } finally {
    // Cleanup
    try {
      await Deno.remove(tempDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

Deno.test("TerraformDownloader - downloads latest version", async () => {
  await withTempDir(async (tempDir) => {
    const downloader = new TerraformDownloader({ baseDir: tempDir });
    const binaryPath = await downloader.getBinaryPath();

    // Verify binary exists
    assertEquals(existsSync(binaryPath), true);

    // Verify binary is in the expected location
    assertEquals(binaryPath.includes(tempDir), true);

    // Verify it is executable
    const command = new Deno.Command(binaryPath, {
      args: ["--version"],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout } = await command.output();
    assertEquals(code, 0);

    const output = new TextDecoder().decode(stdout);
    assertMatch(output, /Terraform v\d+\.\d+\.\d+/);
  });
});

Deno.test("TerraformDownloader - downloads specific version", async () => {
  await withTempDir(async (tempDir) => {
    const version = "1.9.0";
    const downloader = new TerraformDownloader({ baseDir: tempDir });
    const binaryPath = await downloader.getBinaryPath(version);

    // Verify binary exists
    assertEquals(existsSync(binaryPath), true);

    // Verify version is in the path
    assertEquals(binaryPath.includes(version), true);

    // Verify it is executable
    const command = new Deno.Command(binaryPath, {
      args: ["--version"],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout } = await command.output();
    assertEquals(code, 0);

    const output = new TextDecoder().decode(stdout);
    assertMatch(output, /Terraform v1\.9\.0/);
  });
});

Deno.test("TerraformDownloader - caches downloaded binary", async () => {
  await withTempDir(async (tempDir) => {
    const version = "1.9.0";
    const downloader = new TerraformDownloader({ baseDir: tempDir });

    // First download
    const binaryPath1 = await downloader.getBinaryPath(version);
    const stat1 = await Deno.stat(binaryPath1);

    // Wait a moment to ensure different timestamps if re-downloaded
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Second call should return cached version
    const binaryPath2 = await downloader.getBinaryPath(version);
    const stat2 = await Deno.stat(binaryPath2);

    assertEquals(binaryPath1, binaryPath2);
    assertEquals(stat1.mtime?.getTime(), stat2.mtime?.getTime());
  });
});

Deno.test("TerraformDownloader - cleans up old versions", async () => {
  await withTempDir(async (tempDir) => {
    const downloader = new TerraformDownloader({ baseDir: tempDir });

    // Download 4 different versions
    await downloader.getBinaryPath("1.7.0");
    await new Promise((resolve) => setTimeout(resolve, 100));
    await downloader.getBinaryPath("1.8.0");
    await new Promise((resolve) => setTimeout(resolve, 100));
    await downloader.getBinaryPath("1.9.0");
    await new Promise((resolve) => setTimeout(resolve, 100));
    await downloader.getBinaryPath("1.9.5");

    // Count directories in baseDir
    const entries = [];
    for await (const entry of Deno.readDir(tempDir)) {
      if (entry.isDirectory) {
        entries.push(entry.name);
      }
    }

    // Should only have 3 versions (oldest should be removed)
    assertEquals(entries.length, 3);
    assertEquals(entries.includes("1.7.0"), false);
    assertEquals(entries.includes("1.8.0"), true);
    assertEquals(entries.includes("1.9.0"), true);
    assertEquals(entries.includes("1.9.5"), true);
  });
});

Deno.test("TerraformDownloader - downloads for different platforms", async () => {
  await withTempDir(async (tempDir) => {
    const version = "1.9.0";

    // Test Linux AMD64
    const linuxDownloader = new TerraformDownloader({
      baseDir: join(tempDir, "linux"),
      platform: "linux",
      arch: "amd64",
    });
    const linuxPath = await linuxDownloader.getBinaryPath(version);
    assertEquals(existsSync(linuxPath), true);
    assertEquals(linuxPath.endsWith("terraform"), true);

    // Test Windows AMD64
    const windowsDownloader = new TerraformDownloader({
      baseDir: join(tempDir, "windows"),
      platform: "windows",
      arch: "amd64",
    });
    const windowsPath = await windowsDownloader.getBinaryPath(version);
    assertEquals(existsSync(windowsPath), true);
    assertEquals(windowsPath.endsWith("terraform.exe"), true);

    // Test Darwin ARM64
    const darwinDownloader = new TerraformDownloader({
      baseDir: join(tempDir, "darwin"),
      platform: "darwin",
      arch: "arm64",
    });
    const darwinPath = await darwinDownloader.getBinaryPath(version);
    assertEquals(existsSync(darwinPath), true);
    assertEquals(darwinPath.endsWith("terraform"), true);
  });
});

Deno.test("TerraformDownloader - binary is executable on Unix-like systems", async () => {
  // Only run this test on Unix-like systems
  if (Deno.build.os === "windows") {
    return;
  }

  await withTempDir(async (tempDir) => {
    const downloader = new TerraformDownloader({ baseDir: tempDir });
    const binaryPath = await downloader.getBinaryPath();

    const stat = await Deno.stat(binaryPath);
    // Check if the file has execute permissions (mode & 0o111)
    // This is platform-specific and will only work on Unix-like systems
    assertEquals((stat.mode! & 0o111) !== 0, true);
  });
});
