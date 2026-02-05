import { $ } from "@david/dax";
import { assertEquals, assertMatch } from "@std/assert";
import { existsSync } from "@std/fs";
import { join } from "@std/path";
import { DenoDownloader } from "./deno.ts";

// Helper to create a temporary directory for testing
async function withTempDir(fn: (tempDir: string) => Promise<void>) {
  const tempDir = await Deno.makeTempDir({ prefix: "deno-test-" });
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

Deno.test("DenoDownloader - downloads latest version", async () => {
  await withTempDir(async (tempDir) => {
    const downloader = new DenoDownloader({ baseDir: tempDir });
    const binaryPath = await downloader.getBinaryPath();

    // Verify binary exists
    assertEquals(existsSync(binaryPath), true);

    // Verify binary is in the expected location
    assertEquals(binaryPath.includes(tempDir), true);

    // Verify it is executable
    const result = await $`${binaryPath} --version`.captureCombined().quiet();
    assertEquals(result.code, 0);
    assertMatch(result.combined, /deno \d+\.\d+\.\d+/);
  });
});

Deno.test("DenoDownloader - downloads specific version", async () => {
  await withTempDir(async (tempDir) => {
    const version = "2.6.7";
    const downloader = new DenoDownloader({ baseDir: tempDir });
    const binaryPath = await downloader.getBinaryPath(version);

    // Verify binary exists
    assertEquals(existsSync(binaryPath), true);

    // Verify version is in the path
    assertEquals(binaryPath.includes(version), true);

    // Verify it is executable
    const result = await $`${binaryPath} --version`.captureCombined().quiet();
    assertEquals(result.code, 0);
    assertMatch(result.combined, /deno 2\.6\.7/);
  });
});

Deno.test("DenoDownloader - caches downloaded binary", async () => {
  await withTempDir(async (tempDir) => {
    const version = "2.6.6";
    const downloader = new DenoDownloader({ baseDir: tempDir });

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

Deno.test("DenoDownloader - cleans up old versions", async () => {
  await withTempDir(async (tempDir) => {
    const downloader = new DenoDownloader({ baseDir: tempDir });

    // Download 4 different versions
    await downloader.getBinaryPath("2.6.8");
    await new Promise((resolve) => setTimeout(resolve, 100));
    await downloader.getBinaryPath("2.6.7");
    await new Promise((resolve) => setTimeout(resolve, 100));
    await downloader.getBinaryPath("2.6.6");
    await new Promise((resolve) => setTimeout(resolve, 100));
    await downloader.getBinaryPath("2.6.5");

    // Count directories in base dir
    const entries = [];
    for await (const entry of Deno.readDir(tempDir)) {
      if (entry.isDirectory) {
        entries.push(entry.name);
      }
    }

    // Should only have 3 versions (oldest one cleaned up)
    assertEquals(entries.length, 3);
    assertEquals(entries.includes("2.6.8"), false);
    assertEquals(entries.includes("2.6.7"), true);
    assertEquals(entries.includes("2.6.6"), true);
    assertEquals(entries.includes("2.6.5"), true);
  });
});

Deno.test("DenoDownloader - handles different platforms", async () => {
  await withTempDir(async (tempDir) => {
    // Test different platform configurations
    const configs = [
      { platform: "windows" as const, arch: "x86_64" as const },
      { platform: "darwin" as const, arch: "x86_64" as const },
      { platform: "darwin" as const, arch: "aarch64" as const },
      { platform: "linux" as const, arch: "x86_64" as const },
      { platform: "linux" as const, arch: "aarch64" as const },
    ];

    for (const config of configs) {
      const downloader = new DenoDownloader({
        baseDir: join(tempDir, `${config.platform}-${config.arch}`),
        platform: config.platform,
        arch: config.arch,
      });

      // This should not throw an error
      const binaryPath = await downloader.getBinaryPath("2.6.8");
      assertEquals(existsSync(binaryPath), true);
    }
  });
});
