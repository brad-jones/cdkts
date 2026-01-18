import { $ } from "@david/dax";
import { encodeHex } from "@std/encoding/hex";
import { ensureDir, exists, walk } from "@std/fs";
import { join, normalize } from "@std/path";
import type { Stack } from "../constructs/stack.ts";
import { OpenTofuDownloader } from "./downloader/opentofu.ts";
import { TerraformDownloader } from "./downloader/terraform.ts";
import type { ApplyOptions } from "./types/apply_options.ts";
import type { InitOptions } from "./types/init_options.ts";
import type { Plan, PlanJsonObject } from "./types/plan.ts";
import type { PlanOptions } from "./types/plan_options.ts";
import type { State } from "./types/state.ts";
import type { ValidateOptions } from "./types/validate_options.ts";
import type { ValidateResult } from "./types/validate_result.ts";

export interface ProjectProps {
  flavor: "tofu" | "terraform";
  projectDir?: string;
  stack?: Stack;
  tfBinaryPath?: string;
  tfVersion?: string;
}

export class Project {
  #initialized = false;

  constructor(readonly props: ProjectProps) {}

  async init(reInit = false, options?: InitOptions): Promise<void> {
    // Handle projectDir: create temp dir if not provided
    if (!this.props.projectDir) {
      if (this.props.stack?.id) {
        // Create deterministic temp directory based on stack id hash
        const encoder = new TextEncoder();
        const data = encoder.encode(this.props.stack.id);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashHex = encodeHex(hashBuffer);
        const tempDir = Deno.env.get("TMPDIR") || Deno.env.get("TEMP") || Deno.env.get("TMP") || "/tmp";
        this.props.projectDir = join(tempDir, `cdkts-project-${hashHex}`);
      } else {
        // Fall back to random temp directory if no stack id
        this.props.projectDir = await Deno.makeTempDir({ prefix: "cdkts-project-" });
      }
    }
    this.props.projectDir = normalize(this.props.projectDir);
    await ensureDir(this.props.projectDir);

    // Handle tfBinaryPath: use embedded or download
    if (!this.props.tfBinaryPath) {
      // Check for an embedded binary
      if (Deno.build.standalone) {
        const suffix = Deno.build.os === "windows" ? ".exe" : "";
        const target = `${Deno.build.arch}-${
          Deno.build.os === "windows"
            ? "pc-windows-msvc"
            : Deno.build.os === "darwin"
            ? "apple-darwin"
            : "unknown-linux-gnu"
        }`;

        // Strip back to the deno-compile root directory
        const rawDir = import.meta.dirname!;
        const pathSegments = rawDir.split(/[\\/]/);
        const denoCompileIndex = pathSegments.findIndex((seg) => seg.startsWith("deno-compile-"));
        const rootEmbeddedDir = denoCompileIndex >= 0
          ? join(...pathSegments.slice(0, denoCompileIndex + 1) as [string, ...string[]])
          : rawDir;

        // The included binary could have any path based on the original compilation context
        let embeddedPath: string | undefined = undefined;
        for await (const entry of walk(rootEmbeddedDir)) {
          if (!entry.isFile) continue;

          // Prefer a binary that has been included with the exact target name
          if (entry.name === `${this.props.flavor}_${target}${suffix}`) {
            embeddedPath = entry.path;
            break;
          }

          // Otherwise just locate the flavor
          if (entry.name === `${this.props.flavor}${suffix}`) {
            embeddedPath = entry.path;
            break;
          }
        }

        if (embeddedPath) {
          // Create deterministic temp file path based on binary hash
          const embeddedBytes = await Deno.readFile(embeddedPath);
          const hashHex = encodeHex(await crypto.subtle.digest("SHA-256", embeddedBytes));
          const tempDir = Deno.env.get("TMPDIR") || Deno.env.get("TEMP") || Deno.env.get("TMP") || "/tmp";
          this.props.tfBinaryPath = join(tempDir, `cdkts-embedded-${hashHex}${suffix}`);

          // Only write if file doesn't exist
          // And yes we have to write the embedded binary to the file system
          // even though it looks like we just read it from the filesystem.
          // This is because Deno writes embedded assets to an in memory
          // filesystem which we can't execute binaries from.
          if (!await exists(this.props.tfBinaryPath)) {
            await Deno.writeFile(this.props.tfBinaryPath, embeddedBytes);
            if (Deno.build.os !== "windows") {
              await Deno.chmod(this.props.tfBinaryPath, 0o755);
            }
          }
        }
      }

      // Otherwise download
      if (!this.props.tfBinaryPath) {
        const downloader = this.props.flavor === "tofu" ? new OpenTofuDownloader() : new TerraformDownloader();
        this.props.tfBinaryPath = await downloader.getBinaryPath(this.props.tfVersion);
      }
    }

    // Handle stack: either use provided stack or verify .tf files exist
    if (this.props.stack) {
      const hcl = await this.props.stack.toHcl();
      const mainTfPath = join(this.props.projectDir, "main.tf");
      await Deno.writeTextFile(mainTfPath, hcl);
    } else {
      let hasTfFiles = false;
      for await (const entry of Deno.readDir(this.props.projectDir)) {
        if (entry.isFile && entry.name.endsWith(".tf")) {
          hasTfFiles = true;
          break;
        }
      }
      if (!hasTfFiles) {
        throw new Error(`No .tf files found in project directory: ${this.props.projectDir}`);
      }
    }

    // Return early if already initialized and not re-initializing
    const terraformDir = join(this.props.projectDir, ".terraform");
    const lockFile = join(this.props.projectDir, ".terraform.lock.hcl");
    const isInitialized = this.#initialized ? true : await exists(terraformDir);
    if (isInitialized && !reInit) {
      return;
    }

    // If re-initializing, clean up the previous init state
    if (reInit && isInitialized) {
      if (await exists(terraformDir)) await Deno.remove(terraformDir, { recursive: true });
      if (await exists(lockFile)) await Deno.remove(lockFile);
    }

    const args: string[] = ["init"];

    if (options) {
      if (options.backend !== undefined) args.push(`-backend=${options.backend}`);

      if (options.backendConfig) {
        for (const config of options.backendConfig) {
          args.push(`-backend-config=${config}`);
        }
      }

      if (options.forceCopy) args.push("-force-copy");
      if (options.fromModule) args.push(`-from-module=${options.fromModule}`);
      if (options.get !== undefined) args.push(`-get=${options.get}`);
      if (options.input !== undefined) args.push(`-input=${options.input}`);
      if (options.lock !== undefined) args.push(`-lock=${options.lock}`);
      if (options.lockTimeout) args.push(`-lock-timeout=${options.lockTimeout}`);
      if (options.noColor) args.push("-no-color");
      if (options.json) args.push("-json");

      if (options.pluginDir) {
        for (const dir of options.pluginDir) {
          args.push(`-plugin-dir=${dir}`);
        }
      }

      if (options.reconfigure) args.push("-reconfigure");
      if (options.migrateState) args.push("-migrate-state");
      if (options.upgrade) args.push("-upgrade");
      if (options.lockfile) args.push(`-lockfile=${options.lockfile}`);
      if (options.ignoreRemoteVersion) args.push("-ignore-remote-version");
      if (options.testDirectory) args.push(`-test-directory=${options.testDirectory}`);
    }

    // Execute terraform/opentofu init
    await this.exec(args);
    this.#initialized = true;
  }

  async validate(options: ValidateOptions & { json: true }): Promise<ValidateResult>;
  async validate(options?: ValidateOptions): Promise<void>;
  async validate(options?: ValidateOptions): Promise<ValidateResult | void> {
    await this.init();

    const args: string[] = ["validate"];

    if (options) {
      if (options.json) args.push("-json");
      if (options.noColor) args.push("-no-color");
      if (options.noTests) args.push("-no-tests");
      if (options.testDirectory) args.push(`-test-directory=${options.testDirectory}`);
      if (options.query) args.push("-query");
    }

    if (options?.json) {
      return await this.exec(args, { json: true });
    }

    await this.exec(args);
  }

  async plan(options?: PlanOptions): Promise<Plan> {
    await this.init();

    const args: string[] = ["plan"];

    const binaryPlanFilePath = join(this.props.projectDir!, ".tfplan");
    args.push(`-out=${binaryPlanFilePath}`);

    if (options) {
      if (options.destroy) args.push("-destroy");
      if (options.refreshOnly) args.push("-refresh-only");
      if (options.refresh !== undefined) args.push(`-refresh=${options.refresh}`);

      if (options.replace) {
        for (const resource of options.replace) {
          args.push(`-replace=${resource}`);
        }
      }

      if (options.target) {
        for (const target of options.target) {
          args.push(`-target=${target}`);
        }
      }

      if (options.var) {
        for (const [key, value] of Object.entries(options.var)) {
          args.push("-var", `${key}=${value}`);
        }
      }

      if (options.varFile) {
        for (const file of options.varFile) {
          args.push(`-var-file=${file}`);
        }
      }

      // Other options
      if (options.compactWarnings) args.push("-compact-warnings");
      if (options.detailedExitcode) args.push("-detailed-exitcode");
      if (options.generateConfigOut) args.push(`-generate-config-out=${options.generateConfigOut}`);
      if (options.input !== undefined) args.push(`-input=${options.input}`);
      if (options.lock !== undefined) args.push(`-lock=${options.lock}`);
      if (options.lockTimeout) args.push(`-lock-timeout=${options.lockTimeout}`);
      if (options.noColor) args.push("-no-color");
      if (options.parallelism !== undefined) args.push(`-parallelism=${options.parallelism}`);
      if (options.state) args.push(`-state=${options.state}`);
    }

    // Run the plan
    await this.exec(args, { quiet: options?.quiet });

    // Get the plan as json
    const planJsonObject = await this.exec<PlanJsonObject>(["show", "-json", binaryPlanFilePath], { json: true });
    return { binaryPlanFilePath, planJsonObject };
  }

  async apply(plan?: Plan, options?: ApplyOptions): Promise<State> {
    await this.init();

    const args: string[] = ["apply"];

    if (options) {
      if (options.autoApprove) args.push("-auto-approve");
      if (options.backup) args.push(`-backup=${options.backup}`);
      if (options.compactWarnings) args.push("-compact-warnings");
      if (options.destroy) args.push("-destroy");
      if (options.lock !== undefined) args.push(`-lock=${options.lock}`);
      if (options.lockTimeout) args.push(`-lock-timeout=${options.lockTimeout}`);
      if (options.input !== undefined) args.push(`-input=${options.input}`);
      if (options.noColor) args.push("-no-color");
      if (options.parallelism !== undefined) args.push(`-parallelism=${options.parallelism}`);

      if (options.replace) {
        for (const resource of options.replace) {
          args.push(`-replace=${resource}`);
        }
      }

      if (options.state) args.push(`-state=${options.state}`);
      if (options.stateOut) args.push(`-state-out=${options.stateOut}`);

      if (options.var) {
        for (const [key, value] of Object.entries(options.var)) {
          args.push("-var", `${key}=${value}`);
        }
      }

      if (options.varFile) {
        for (const file of options.varFile) {
          args.push(`-var-file=${file}`);
        }
      }
    }

    if (plan) {
      args.push(plan.binaryPlanFilePath);
    }

    await this.exec(args, { quiet: options?.quiet });
    if (plan) await Deno.remove(plan.binaryPlanFilePath);
    return await this.exec(["show", "-json"], { json: true });
  }

  async destroy(plan?: Plan, options?: ApplyOptions): Promise<State> {
    await this.init();
    return await this.apply(plan, { ...options, destroy: true });
  }

  async exec<T>(args: string[], options: { json: true }): Promise<T>;
  async exec(args: string[], options: { quiet?: boolean }): Promise<void>;
  async exec(args: string[]): Promise<void>;
  async exec(args: string[], options?: { json?: boolean; quiet?: boolean }): Promise<unknown | void> {
    const cmd = $`${this.props.tfBinaryPath!} ${args}`.cwd(this.props.projectDir!);

    if (options?.json) {
      return (await cmd.stdout("piped")).stdoutJson;
    }

    if (options?.quiet) {
      await cmd.quiet();
      return;
    }

    await cmd;
  }

  async cleanUp(): Promise<void> {
    if (this.props.projectDir) {
      await Deno.remove(this.props.projectDir, { recursive: true });
    }
  }

  static async cleanUp(): Promise<void> {
    const tempDir = Deno.env.get("TMPDIR") || Deno.env.get("TEMP") || Deno.env.get("TMP") || "/tmp";
    const prefix = "cdkts-project-";

    try {
      for await (const entry of Deno.readDir(tempDir)) {
        if (entry.isDirectory && entry.name.startsWith(prefix)) {
          const dirPath = join(tempDir, entry.name);
          try {
            await Deno.remove(dirPath, { recursive: true });
          } catch (error) {
            // Ignore errors for individual directories (e.g., permission issues, in-use directories)
            console.warn(`Failed to remove ${dirPath}:`, error);
          }
        }
      }
    } catch (error) {
      throw new Error(`Failed to clean temp folders: ${error}`);
    }
  }
}
