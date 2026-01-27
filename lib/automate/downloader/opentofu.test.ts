import { assertEquals, assertMatch } from "@std/assert";
import { existsSync } from "@std/fs";
import { join } from "@std/path";
import { OpenTofuDownloader } from "./opentofu.ts";

// Helper to create a temporary directory for testing
async function withTempDir(fn: (tempDir: string) => Promise<void>) {
  const tempDir = await Deno.makeTempDir({ prefix: "opentofu-test-" });
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

Deno.test("OpenTofuDownloader - downloads latest version", async () => {
  await withTempDir(async (tempDir) => {
    const downloader = new OpenTofuDownloader({ baseDir: tempDir });
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
    assertMatch(output, /OpenTofu v\d+\.\d+\.\d+/);
  });
});

Deno.test("OpenTofuDownloader - downloads specific version", async () => {
  await withTempDir(async (tempDir) => {
    const version = "1.8.0";
    const downloader = new OpenTofuDownloader({ baseDir: tempDir });
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
    assertMatch(output, /OpenTofu v1\.8\.0/);
  });
});

Deno.test("OpenTofuDownloader - caches downloaded binary", async () => {
  await withTempDir(async (tempDir) => {
    const version = "1.8.0";
    const downloader = new OpenTofuDownloader({ baseDir: tempDir });

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

Deno.test("OpenTofuDownloader - cleans up old versions", async () => {
  await withTempDir(async (tempDir) => {
    const downloader = new OpenTofuDownloader({ baseDir: tempDir });

    // Download 4 different versions
    await downloader.getBinaryPath("1.6.0");
    await new Promise((resolve) => setTimeout(resolve, 100));
    await downloader.getBinaryPath("1.7.0");
    await new Promise((resolve) => setTimeout(resolve, 100));
    await downloader.getBinaryPath("1.8.0");
    await new Promise((resolve) => setTimeout(resolve, 100));
    await downloader.getBinaryPath("1.8.1");

    // Count directories in baseDir
    const entries = [];
    for await (const entry of Deno.readDir(tempDir)) {
      if (entry.isDirectory) {
        entries.push(entry.name);
      }
    }

    // Should only have 3 versions (oldest should be removed)
    assertEquals(entries.length, 3);
    assertEquals(entries.includes("1.6.0"), false);
    assertEquals(entries.includes("1.7.0"), true);
    assertEquals(entries.includes("1.8.0"), true);
    assertEquals(entries.includes("1.8.1"), true);
  });
});

Deno.test("OpenTofuDownloader - downloads for different platforms", async () => {
  await withTempDir(async (tempDir) => {
    const version = "1.8.0";

    // Test Linux AMD64
    const linuxDownloader = new OpenTofuDownloader({
      baseDir: join(tempDir, "linux"),
      platform: "linux",
      arch: "x86_64",
    });
    const linuxPath = await linuxDownloader.getBinaryPath(version);
    assertEquals(existsSync(linuxPath), true);
    assertEquals(linuxPath.endsWith("tofu"), true);

    // Test Windows AMD64
    const windowsDownloader = new OpenTofuDownloader({
      baseDir: join(tempDir, "windows"),
      platform: "windows",
      arch: "x86_64",
    });
    const windowsPath = await windowsDownloader.getBinaryPath(version);
    assertEquals(existsSync(windowsPath), true);
    assertEquals(windowsPath.endsWith("tofu.exe"), true);

    // Test Darwin ARM64
    const darwinDownloader = new OpenTofuDownloader({
      baseDir: join(tempDir, "darwin"),
      platform: "darwin",
      arch: "aarch64",
    });
    const darwinPath = await darwinDownloader.getBinaryPath(version);
    assertEquals(existsSync(darwinPath), true);
    assertEquals(darwinPath.endsWith("tofu"), true);
  });
});

Deno.test("OpenTofuDownloader - binary is executable on Unix-like systems", async () => {
  // Only run this test on Unix-like systems
  if (Deno.build.os === "windows") {
    return;
  }

  await withTempDir(async (tempDir) => {
    const downloader = new OpenTofuDownloader({ baseDir: tempDir });
    const binaryPath = await downloader.getBinaryPath();

    const stat = await Deno.stat(binaryPath);
    // Check if the file has execute permissions (mode & 0o111)
    // This is platform-specific and will only work on Unix-like systems
    assertEquals((stat.mode! & 0o111) !== 0, true);
  });
});
