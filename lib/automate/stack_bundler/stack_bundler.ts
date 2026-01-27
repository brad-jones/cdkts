import { $ } from "@david/dax";
import { join, normalize } from "@std/path";
import { OpenTofuDownloader } from "../downloader/opentofu.ts";
import { TerraformDownloader } from "../downloader/terraform.ts";
import { Project } from "../project.ts";
import { importStack } from "../utils.ts";

export interface StackBundlerProps {
  flavor?: "tofu" | "terraform";
  tfVersion?: string;
}

export type Target =
  | "x86_64-pc-windows-msvc"
  | "x86_64-apple-darwin"
  | "aarch64-apple-darwin"
  | "x86_64-unknown-linux-gnu"
  | "aarch64-unknown-linux-gnu";

export interface BundleOptions {
  stackFilePath: string;
  tfBinPath: string;
  tfMirrorDir: string;
  tfLockFilePath: string;
  target?: Target;
  outPath?: string;
}

export class StackBundler {
  readonly #props: StackBundlerProps & {
    flavor: "tofu" | "terraform";
    currentTarget: Target;
  };

  constructor(props?: StackBundlerProps) {
    this.#props = {
      flavor: "tofu",
      currentTarget: `${Deno.build.arch}-${
        Deno.build.os === "windows"
          ? "pc-windows-msvc"
          : Deno.build.os === "darwin"
          ? "apple-darwin"
          : "unknown-linux-gnu"
      }` as Target,
      ...props,
    };
  }

  #targetToOs(target: Target) {
    return target.includes("windows") ? "windows" : target.includes("darwin") ? "darwin" : "linux";
  }

  #targetToArch(target: Target) {
    return target.includes("x86_64") ? "x86_64" : "aarch64";
  }

  #targetToGOARCH(target: Target) {
    return target.includes("x86_64") ? "amd64" : "arm64";
  }

  #targetToPlatform(target: Target) {
    return `${this.#targetToOs(target)}_${this.#targetToGOARCH(target)}`;
  }

  async generateLockFile(stackFilePath: string, targets?: Target[]): Promise<string> {
    stackFilePath = normalize(stackFilePath);

    // Import the stack from the stack file
    const stack = await importStack(stackFilePath);

    // Create a new project
    const project = new Project({
      flavor: this.#props.flavor,
      tfVersion: this.#props.tfVersion,
      stack,
    });
    await project.preInit();

    // Build the lock file args
    const args = ["providers", "lock"];
    for (const target of targets ?? [this.#props.currentTarget]) {
      args.push(`-platform=${this.#targetToPlatform(target)}`);
    }

    // Create the lock file
    console.log(`generating .terraform.lock.hcl for ${stackFilePath}`);
    await project.exec(args);
    console.log("\n");

    // Return it's path
    return join(project.projectDir, ".terraform.lock.hcl");
  }

  async downloadProviders(stackFilePath: string, target?: Target): Promise<string> {
    target ??= this.#props.currentTarget;
    stackFilePath = normalize(stackFilePath);

    // Import the stack from the stack file
    const stack = await importStack(stackFilePath);

    // Create a new project
    const project = new Project({
      flavor: this.#props.flavor,
      tfVersion: this.#props.tfVersion,
      stack,
    });
    await project.preInit();

    // Download the providers and return the mirror dir
    console.log(`downloading providers:${target} for ${stackFilePath}`);
    const tfMirrorDir = join(project.projectDir, target, "tf-mirror");
    await project.exec(["providers", "mirror", `-platform=${this.#targetToPlatform(target)}`, tfMirrorDir]);
    console.log("\n");

    return tfMirrorDir;
  }

  async downloadTfBin(target?: Target): Promise<string> {
    target ??= this.#props.currentTarget;
    const platform = this.#targetToOs(target);
    const arch = this.#targetToArch(target);

    const downloader = this.#props.flavor === "tofu"
      ? new OpenTofuDownloader({ platform, arch })
      : new TerraformDownloader({ platform, arch });

    return await downloader.getBinaryPath(this.#props.tfVersion);
  }

  async createBundle(options: BundleOptions): Promise<void> {
    const { stackFilePath, tfBinPath, tfLockFilePath, tfMirrorDir } = options;
    const target = options?.target ?? this.#props.currentTarget;
    const exeSuffix = this.#targetToOs(target) === "windows" ? ".exe" : "";
    const outPath = options?.outPath ?? `${stackFilePath.replace(".ts", `_${target}`)}${exeSuffix}`;
    await $`${Deno.execPath()} compile --target ${target} --include ${tfBinPath} --include ${tfLockFilePath} --include ${tfMirrorDir} -A -o ${outPath} ${stackFilePath}`;
  }

  async bundle(stackFilePath: string, targets?: Target[]): Promise<void> {
    const tfLockFilePath = await this.generateLockFile(stackFilePath);
    for (const target of targets ?? [this.#props.currentTarget]) {
      const tfBinPath = await this.downloadTfBin(target);
      const tfMirrorDir = await this.downloadProviders(stackFilePath, target);
      await this.createBundle({ target, stackFilePath, tfBinPath, tfLockFilePath, tfMirrorDir });
    }
  }
}
