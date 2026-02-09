#!/usr/bin/env -S deno run -qA --ext=ts
import { Command } from "@cliffy/command";
import { $ } from "@david/dax";
import { ensureDir } from "@std/fs";
import { join } from "@std/path";

function toTARGET(platform: "windows" | "linux" | "darwin", arch: "x86_64" | "aarch64"): string {
  if (platform === "windows") {
    return "x86_64-pc-windows-msvc";
  } else if (platform === "darwin") {
    return arch === "x86_64" ? "x86_64-apple-darwin" : "aarch64-apple-darwin";
  } else {
    return arch === "x86_64" ? "x86_64-unknown-linux-gnu" : "aarch64-unknown-linux-gnu";
  }
}

await new Command()
  .name("build-cdkts")
  .action(async () => {
    const binDir = join(import.meta.dirname!, "../bin");
    await ensureDir(binDir);

    const targets = [
      { platform: "windows" as const, arch: "x86_64" as const },
      { platform: "linux" as const, arch: "x86_64" as const },
      { platform: "darwin" as const, arch: "x86_64" as const },
      { platform: "darwin" as const, arch: "aarch64" as const },
    ];

    for (const { platform, arch } of targets) {
      console.log(`Building for ${platform} ${arch}...`);
      const suffix = platform === "windows" ? ".exe" : "";
      await $`deno compile -A --target ${toTARGET(platform, arch)} --output ${
        join(binDir, `cdkts_${platform}_${arch}${suffix}`)
      } ${join(import.meta.dirname!, "../cli/main.ts")}`;
    }
  })
  .parse();
