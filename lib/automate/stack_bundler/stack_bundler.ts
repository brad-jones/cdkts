import { outdent } from "@cspotcode/outdent";
import { $ } from "@david/dax";
import { basename, join, normalize } from "@std/path";
import { DenoBridgeProvider } from "../../constructs/blocks/providers/denobridge.ts";
import { DenoDownloader } from "../downloader/deno.ts";
import { OpenTofuDownloader } from "../downloader/opentofu.ts";
import { TerraformDownloader } from "../downloader/terraform.ts";
import { Project } from "../project.ts";
import { importStack } from "../utils.ts";

/**
 * Configuration properties for the StackBundler.
 */
export interface StackBundlerProps {
  /** The infrastructure tool flavor to use. Defaults to "tofu". */
  flavor?: "tofu" | "terraform";
  /** The version of Terraform/OpenTofu to use. */
  tfVersion?: string;
  /** The version of Deno to use. */
  denoVersion?: string;
}

/**
 * Supported compilation targets for cross-platform bundling.
 */
export type Target =
  | "x86_64-pc-windows-msvc"
  | "x86_64-apple-darwin"
  | "aarch64-apple-darwin"
  | "x86_64-unknown-linux-gnu"
  | "aarch64-unknown-linux-gnu";

/**
 * Options for creating a single bundle.
 */
export interface BundleOptions {
  /** Path to the TypeScript stack file to bundle. */
  stackFilePath: string;
  /** Path to the Terraform/OpenTofu binary. */
  tfBinPath: string;
  /** Path to the Terraform provider mirror directory. */
  tfMirrorDir: string;
  /** Path to the Terraform lock file (.terraform.lock.hcl). */
  tfLockFilePath: string;
  /** Target platform for compilation. */
  target?: Target;
  /** Output path for the compiled executable. */
  outPath?: string;
  /** Path to the Deno binary, if needed. */
  denoBinPath?: string;
}

/**
 * Bundles CDKTS stacks into standalone executables with all dependencies included.
 *
 * The StackBundler handles:
 * - Generating Terraform lock files for provider versions
 * - Downloading providers for target platforms
 * - Downloading Terraform/OpenTofu and Deno binaries
 * - Creating self-contained executable bundles using Deno compile
 */
export class StackBundler {
  readonly #props: StackBundlerProps & {
    flavor: "tofu" | "terraform";
    currentTarget: Target;
  };

  /**
   * Creates a new StackBundler instance.
   *
   * @param props - Configuration properties for the bundler.
   */
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

  /**
   * Generates a Terraform lock file (.terraform.lock.hcl) for the given stack.
   *
   * This lock file pins provider versions and contains checksums for the specified target platforms.
   *
   * @param stackFilePath - Path to the TypeScript stack file.
   * @param targets - Array of target platforms to include in the lock file. Defaults to current platform.
   * @returns Path to the generated lock file.
   */
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

  /**
   * Downloads all Terraform providers required by the stack for a specific target platform.
   *
   * Providers are downloaded to a mirror directory that can be included in the bundle.
   *
   * @param stackFilePath - Path to the TypeScript stack file.
   * @param target - Target platform to download providers for. Defaults to current platform.
   * @returns Path to the provider mirror directory.
   */
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

  /**
   * Downloads the Terraform or OpenTofu binary for a specific target platform.
   *
   * @param target - Target platform to download the binary for. Defaults to current platform.
   * @returns Path to the downloaded binary.
   */
  async downloadTfBin(target?: Target): Promise<string> {
    target ??= this.#props.currentTarget;
    const platform = this.#targetToOs(target);
    const arch = this.#targetToArch(target);

    const downloader = this.#props.flavor === "tofu"
      ? new OpenTofuDownloader({ platform, arch })
      : new TerraformDownloader({ platform, arch });

    return await downloader.getBinaryPath(this.#props.tfVersion);
  }

  /**
   * Downloads the Deno binary for a specific target platform.
   *
   * @param target - Target platform to download the binary for. Defaults to current platform.
   * @returns Path to the downloaded Deno binary.
   */
  async downloadDenoBin(target?: Target): Promise<string> {
    target ??= this.#props.currentTarget;
    const platform = this.#targetToOs(target);
    const arch = this.#targetToArch(target);
    const downloader = new DenoDownloader({ platform, arch });
    return await downloader.getBinaryPath(this.#props.denoVersion);
  }

  /**
   * Determines if the stack requires the Deno runtime.
   *
   * A stack needs Deno if it uses any DenoBridgeProvider constructs.
   *
   * @param stackFilePath - Path to the TypeScript stack file.
   * @returns True if the stack requires Deno, false otherwise.
   */
  async needsDeno(stackFilePath: string): Promise<boolean> {
    const stack = await importStack(stackFilePath);
    for (const construct of stack.descendants) {
      if (construct instanceof DenoBridgeProvider) {
        return true;
      }
    }
    return false;
  }

  /**
   * Creates a bundled executable from the stack using Deno's compile command.
   *
   * The bundle includes the stack code, Terraform/OpenTofu binary, provider mirror,
   * lock file, and optionally the Deno binary if needed.
   *
   * @param options - Bundle creation options including all required paths.
   */
  async createBundle(options: BundleOptions): Promise<void> {
    const { stackFilePath, tfBinPath, tfLockFilePath, tfMirrorDir, denoBinPath } = options;
    const target = options?.target ?? this.#props.currentTarget;
    const exeSuffix = this.#targetToOs(target) === "windows" ? ".exe" : "";
    const outPath = options?.outPath ?? `${stackFilePath.replace(".ts", `_${target}`)}${exeSuffix}`;
    let args = [
      "compile",
      "--target",
      target,
      "--include",
      tfBinPath,
      "--include",
      tfLockFilePath,
      "--include",
      tfMirrorDir,
    ];
    if (denoBinPath) {
      args.push("--include", denoBinPath);
    }
    args = [...args, "-A", "-o", outPath, stackFilePath];

    // If we are running from inside a compiled binary, we need to download the
    // real deno binary to run the compile command, since the Deno.compile API
    // is not available in the compiled runtime. If we are running from the Deno
    // runtime, we can just use Deno.execPath() to get the path to the current Deno binary.
    const denoBin = Deno.build.standalone ? await new DenoDownloader().getBinaryPath() : Deno.execPath();

    await $`${denoBin} ${args}`;
  }

  /**
   * Checks if the stack file contains its own entrypoint (import.meta.main check).
   *
   * @param stackFilePath - Path to the TypeScript stack file.
   * @returns True if the stack has an entrypoint, false otherwise.
   */
  async stackHasEntrypoint(stackFilePath: string): Promise<boolean> {
    const tsSrc = await Deno.readTextFile(stackFilePath);
    return tsSrc.includes("import.meta.main");
  }

  readonly #CDKTS_VERSION = "0.7.1";

  /**
   * Gets the entrypoint file for the stack.
   *
   * If the stack doesn't have its own entrypoint, creates a temporary entrypoint file
   * that imports the stack and runs it with the Project class.
   *
   * @param stackFilePath - Path to the TypeScript stack file.
   * @returns Path to the entrypoint file (either the original or a generated temporary one).
   */
  async getStackEntrypoint(stackFilePath: string) {
    if (await this.stackHasEntrypoint(stackFilePath)) {
      return stackFilePath;
    }

    const tmpEntryPointPath = stackFilePath.replace(".ts", "_cdkts_entrypoint.ts");
    await Deno.writeTextFile(
      tmpEntryPointPath,
      outdent`
        import Stack from "./${basename(stackFilePath)}";
        import { Project } from "jsr:@brad-jones/cdkts@${this.#CDKTS_VERSION}/automate";
        await new Project({ stack: new Stack() }).apply();
      `,
    );

    return tmpEntryPointPath;
  }

  /**
   * Bundles a CDKTS stack into standalone executables for one or more target platforms.
   *
   * This is the main entry point that orchestrates the entire bundling process:
   * 1. Generates a lock file for all target platforms
   * 2. Downloads the Terraform/OpenTofu binary for each target
   * 3. Downloads providers for each target
   * 4. Downloads Deno binary if needed for each target
   * 5. Creates a compiled executable for each target
   *
   * @param stackFilePath - Path to the TypeScript stack file to bundle.
   * @param targets - Array of target platforms to bundle for. Defaults to current platform.
   */
  async bundle(stackFilePath: string, targets?: Target[]): Promise<void> {
    const stackEntrypoint = await this.getStackEntrypoint(stackFilePath);
    try {
      const tfLockFilePath = await this.generateLockFile(stackFilePath);
      for (const target of targets ?? [this.#props.currentTarget]) {
        const tfBinPath = await this.downloadTfBin(target);
        const tfMirrorDir = await this.downloadProviders(stackFilePath, target);
        let denoBinPath: string | undefined;
        if (await this.needsDeno(stackFilePath)) {
          denoBinPath = await this.downloadDenoBin(target);
        }
        await this.createBundle({
          target,
          stackFilePath: stackEntrypoint,
          tfBinPath,
          tfLockFilePath,
          tfMirrorDir,
          denoBinPath,
        });
      }
    } finally {
      if (stackEntrypoint.endsWith("_cdkts_entrypoint.ts")) {
        await Deno.remove(stackEntrypoint);
      }
    }
  }
}
