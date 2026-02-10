import { $ } from "@david/dax";
import { assertEquals, assertMatch } from "@std/assert";
import { existsSync } from "@std/fs";
import { join } from "@std/path";
import { OpenTofuDownloader } from "./opentofu.ts";

// Helper to create a temporary directory for testing
async function withTempDir(fn: (tempDir: string) => Promise<void>) {
  const tempDir = await Deno.makeTempDir({ prefix: "tofu-test-" });
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

Deno.test("OpenTofuDownloader - downloads latest version", {
  ignore: Deno.env.get("RUN_DOWNLOADER_TESTS") ? false : true,
}, async () => {
  await withTempDir(async (tempDir) => {
    const downloader = new OpenTofuDownloader({ baseDir: tempDir });
    const binaryPath = await downloader.getBinaryPath();

    // Verify binary exists
    assertEquals(existsSync(binaryPath), true);

    // Verify binary is in the expected location
    assertEquals(binaryPath.includes(tempDir), true);

    // Verify it is executable
    const result = await $`${binaryPath} --version`.captureCombined().quiet();
    assertEquals(result.code, 0);
    assertMatch(result.combined, /OpenTofu v\d+\.\d+\.\d+/);
  });
});

Deno.test("OpenTofuDownloader - downloads specific version", {
  ignore: Deno.env.get("RUN_DOWNLOADER_TESTS") ? false : true,
}, async () => {
  await withTempDir(async (tempDir) => {
    const version = "1.11.3";
    const downloader = new OpenTofuDownloader({ baseDir: tempDir });
    const binaryPath = await downloader.getBinaryPath(version);

    // Verify binary exists
    assertEquals(existsSync(binaryPath), true);

    // Verify version is in the path
    assertEquals(binaryPath.includes(version), true);

    // Verify it is executable
    const result = await $`${binaryPath} --version`.captureCombined().quiet();
    assertEquals(result.code, 0);
    assertMatch(result.combined, /OpenTofu v1\.11\.3/);
  });
});

Deno.test("OpenTofuDownloader - caches downloaded binary", {
  ignore: Deno.env.get("RUN_DOWNLOADER_TESTS") ? false : true,
}, async () => {
  await withTempDir(async (tempDir) => {
    const version = "1.11.2";
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

Deno.test("OpenTofuDownloader - cleans up old versions", {
  ignore: Deno.env.get("RUN_DOWNLOADER_TESTS") ? false : true,
}, async () => {
  await withTempDir(async (tempDir) => {
    const downloader = new OpenTofuDownloader({ baseDir: tempDir });

    // Download 4 different versions
    await downloader.getBinaryPath("1.11.4");
    await new Promise((resolve) => setTimeout(resolve, 100));
    await downloader.getBinaryPath("1.11.3");
    await new Promise((resolve) => setTimeout(resolve, 100));
    await downloader.getBinaryPath("1.11.2");
    await new Promise((resolve) => setTimeout(resolve, 100));
    await downloader.getBinaryPath("1.11.1");

    // Count directories in base dir
    const entries = [];
    for await (const entry of Deno.readDir(tempDir)) {
      if (entry.isDirectory) {
        entries.push(entry.name);
      }
    }

    // Should only have 3 versions (oldest one cleaned up)
    assertEquals(entries.length, 3);
    assertEquals(entries.includes("1.11.4"), false);
    assertEquals(entries.includes("1.11.3"), true);
    assertEquals(entries.includes("1.11.2"), true);
    assertEquals(entries.includes("1.11.1"), true);
  });
});

Deno.test("OpenTofuDownloader - handles different platforms", {
  ignore: Deno.env.get("RUN_DOWNLOADER_TESTS") ? false : true,
}, async () => {
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
      const downloader = new OpenTofuDownloader({
        baseDir: join(tempDir, `${config.platform}-${config.arch}`),
        platform: config.platform,
        arch: config.arch,
      });

      // This should not throw an error
      const binaryPath = await downloader.getBinaryPath("1.11.4");
      assertEquals(existsSync(binaryPath), true);
    }
  });
});
