#!/usr/bin/env -S deno run -qA --ext=ts
import { Command } from "@cliffy/command";
import { $ } from "@david/dax";
import { DenoDownloader } from "../lib/automate/downloader/deno.ts";

function toGOARCH(arch: "x86_64" | "aarch64"): string {
  switch (arch) {
    case "x86_64":
      return "amd64";
    case "aarch64":
      return "arm64";
  }
}

await new Command()
  .name("build-cdkts")
  .action(async () => {
    const binDir = await Deno.realPath(`${import.meta.dirname}/../bin`);
    const cliDir = await Deno.realPath(`${import.meta.dirname}/../cli/wrapper`);

    // Read version from deno.json
    const denoJsonPath = await Deno.realPath(`${import.meta.dirname}/../deno.json`);
    const denoJson = JSON.parse(await Deno.readTextFile(denoJsonPath));
    const version = denoJson.version;

    // Update the version in main.go
    const mainGoPath = `${cliDir}/main.go`;
    let mainGoContent = await Deno.readTextFile(mainGoPath);
    mainGoContent = mainGoContent.replace(
      /var cdkTsVersion = ".*"/,
      `var cdkTsVersion = "${version}"`,
    );
    await Deno.writeTextFile(mainGoPath, mainGoContent);

    console.log(`Updated main.go with version ${version}`);

    const targets = [
      { platform: "windows" as const, arch: "x86_64" as const },
      { platform: "linux" as const, arch: "x86_64" as const },
      { platform: "darwin" as const, arch: "x86_64" as const },
      { platform: "darwin" as const, arch: "aarch64" as const },
    ];

    for (const { platform, arch } of targets) {
      console.log(`Building for ${platform} ${arch}...`);
      const suffix = platform === "windows" ? ".exe" : "";
      const denoBinary = await new DenoDownloader({ platform, arch }).getBinaryPath();
      await Deno.copyFile(denoBinary, `${cliDir}/deno`);
      await $`gzip --best ${cliDir}/deno`;
      try {
        await $`
          CGO_ENABLED=0
          GOOS=${platform}
          GOARCH=${toGOARCH(arch)}
          go build -v
          -o ${`${binDir}/cdkts_${platform}_${arch}${suffix}`}
          ${`${cliDir}/main.go`}
        `;
      } finally {
        await Deno.remove(`${cliDir}/deno.gz`);
      }
    }
  })
  .parse();
