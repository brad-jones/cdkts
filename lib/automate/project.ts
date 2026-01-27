import { snakeCase } from "@mesqueeb/case-anything";
import { encodeHex } from "@std/encoding/hex";
import { ensureDir, exists, walk } from "@std/fs";
import { dirname, join, normalize } from "@std/path";
import type { Stack } from "../constructs/stack.ts";
import { OpenTofuDownloader } from "./downloader/opentofu.ts";
import { TerraformDownloader } from "./downloader/terraform.ts";
import type { ApplyOptions } from "./types/apply_options.ts";
import type { InitOptions } from "./types/init_options.ts";
import type { Plan, PlanJsonObject } from "./types/plan.ts";
import type { PlanOptions } from "./types/plan_options.ts";
import type { OutputValue, State } from "./types/state.ts";
import type { ValidateOptions } from "./types/validate_options.ts";
import type { ValidateResult } from "./types/validate_result.ts";
import { getDenoCompileRootDir } from "./utils.ts";

export interface ProjectProps<Self, Inputs, Outputs> {
  flavor?: "tofu" | "terraform";
  projectDir?: string;
  stack?: Stack<Self, Inputs, Outputs>;
  tfBinaryPath?: string;
  tfVersion?: string;
}

export class Project<Self, Inputs, Outputs> {
  #initialized = false;

  readonly #props: ProjectProps<Self, Inputs, Outputs> & {
    flavor: "tofu" | "terraform";
  };

  get projectDir(): string {
    if (!this.#props.projectDir) {
      throw new Error("Ensure preInit has been called to set the temp projectDir");
    }
    return this.#props.projectDir;
  }

  constructor(props: ProjectProps<Self, Inputs, Outputs>) {
    this.#props = { flavor: "tofu", ...props };
  }

  async preInit(): Promise<void> {
    // Handle projectDir: create temp dir if not provided
    if (!this.#props.projectDir) {
      if (this.#props.stack?.id) {
        // Create deterministic temp directory based on stack id hash
        const encoder = new TextEncoder();
        const data = encoder.encode(this.#props.stack.id);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashHex = encodeHex(hashBuffer);
        const tempDir = Deno.env.get("TMPDIR") || Deno.env.get("TEMP") || Deno.env.get("TMP") || "/tmp";
        this.#props.projectDir = join(tempDir, `cdkts-project-${hashHex}`);
      } else {
        // Fall back to random temp directory if no stack id
        this.#props.projectDir = await Deno.makeTempDir({ prefix: "cdkts-project-" });
      }
    }
    this.#props.projectDir = normalize(this.#props.projectDir);
    await ensureDir(this.#props.projectDir);

    // Handle tfBinaryPath: use embedded or download
    if (!this.#props.tfBinaryPath) {
      // Check for an embedded binary
      if (Deno.build.standalone) {
        const suffix = Deno.build.os === "windows" ? ".exe" : "";

        // Strip back to the deno-compile root directory
        const rootEmbeddedDir = getDenoCompileRootDir(import.meta.dirname!);

        // The included binary could have any path based on the original compilation context
        let embeddedPath: string | undefined = undefined;
        for await (const entry of walk(rootEmbeddedDir)) {
          if (!entry.isFile) continue;
          if (entry.name === `${this.#props.flavor}${suffix}`) {
            embeddedPath = entry.path;
            break;
          }
        }

        if (embeddedPath) {
          // Create deterministic temp file path based on binary hash
          const embeddedBytes = await Deno.readFile(embeddedPath);
          const hashHex = encodeHex(await crypto.subtle.digest("SHA-256", embeddedBytes));
          const tempDir = Deno.env.get("TMPDIR") || Deno.env.get("TEMP") || Deno.env.get("TMP") || "/tmp";
          this.#props.tfBinaryPath = join(tempDir, `cdkts-embedded-${hashHex}${suffix}`);

          // Only write if file doesn't exist
          // And yes we have to write the embedded binary to the file system
          // even though it looks like we just read it from the filesystem.
          // This is because Deno writes embedded assets to an in memory
          // filesystem which we can't execute binaries from.
          if (!await exists(this.#props.tfBinaryPath)) {
            await Deno.writeFile(this.#props.tfBinaryPath, embeddedBytes);
            if (Deno.build.os !== "windows") {
              await Deno.chmod(this.#props.tfBinaryPath, 0o755);
            }
          }
        }
      }

      // Otherwise download
      if (!this.#props.tfBinaryPath) {
        const downloader = this.#props.flavor === "tofu" ? new OpenTofuDownloader() : new TerraformDownloader();
        this.#props.tfBinaryPath = await downloader.getBinaryPath(this.#props.tfVersion);
      }
    }

    // Handle stack: either use provided stack or verify .tf files exist
    if (this.#props.stack) {
      const hcl = await this.#props.stack.toHcl();
      const mainTfPath = join(this.#props.projectDir, "main.tf");
      await Deno.writeTextFile(mainTfPath, hcl);
    } else {
      let hasTfFiles = false;
      for await (const entry of Deno.readDir(this.#props.projectDir)) {
        if (entry.isFile && entry.name.endsWith(".tf")) {
          hasTfFiles = true;
          break;
        }
      }
      if (!hasTfFiles) {
        throw new Error(`No .tf files found in project directory: ${this.#props.projectDir}`);
      }
    }
  }

  async init(options?: InitOptions): Promise<void> {
    await this.preInit();

    // Return early if already initialized and not re-initializing
    const terraformDir = join(this.#props.projectDir!, ".terraform");
    const lockFile = join(this.#props.projectDir!, ".terraform.lock.hcl");
    const isInitialized = this.#initialized ? true : await exists(terraformDir);
    if (isInitialized && !options?.reInit) {
      return;
    }

    // If re-initializing, clean up the previous init state
    if (options?.reInit && isInitialized) {
      if (await exists(terraformDir)) await Deno.remove(terraformDir, { recursive: true });
      if (await exists(lockFile)) await Deno.remove(lockFile);
    }

    // Extract embedded lockfile & providers
    let pluginDir: string | undefined = undefined;
    if (Deno.build.standalone) {
      const rootEmbeddedDir = getDenoCompileRootDir(import.meta.dirname!);

      for await (const entry of walk(rootEmbeddedDir)) {
        if (!entry.isFile) continue;
        if (entry.name === ".terraform.lock.hcl") {
          const dstPath = join(this.projectDir, ".terraform.lock.hcl");
          await Deno.writeFile(dstPath, await Deno.readFile(entry.path));
          break;
        }
      }

      for await (const entry of walk(rootEmbeddedDir)) {
        if (!entry.isFile) continue;

        if (entry.path.includes("tf-mirror")) {
          pluginDir = join(this.projectDir, "providers");
          const parts = entry.path.split(/tf-mirror[\\/]/);
          const relativePath = parts[parts.length - 1];
          const dstPath = join(pluginDir, relativePath);
          await Deno.mkdir(dirname(dstPath), { recursive: true });
          await Deno.writeFile(dstPath, await Deno.readFile(entry.path));
        }
      }
    }

    const args: string[] = ["init"];

    if (pluginDir) {
      args.push("--plugin-dir", pluginDir);
    }

    if (options?.passThroughArgs) {
      args.push(...options.passThroughArgs);
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
      if (options.passThroughArgs) args.push(...options.passThroughArgs);
    }

    if (options?.json) {
      return await this.exec(args, { json: true });
    }

    await this.exec(args);
  }

  async plan(options?: PlanOptions): Promise<Plan> {
    await this.init();

    const args: string[] = ["plan"];

    const binaryPlanFilePath = join(this.#props.projectDir!, ".tfplan");
    args.push(`-out=${binaryPlanFilePath}`);

    if (options) {
      if (options.destroy) args.push("-destroy");
      if (options.passThroughArgs) args.push(...options.passThroughArgs);
    }

    // Inject stack inputs as tf vars
    const env: Record<string, string | undefined> = {};
    if (this.#props.stack && this.#props.stack["_inputValues"]) {
      for (const [k, v] of Object.entries(this.#props.stack["_inputValues"])) {
        env[`TF_VAR_${snakeCase(k)}`] = typeof v !== "string" ? JSON.stringify(v) : v;
      }
    }

    // Run the plan
    await this.exec(args, { quiet: options?.quiet, env });

    // Get the plan as json
    const planJsonObject = await this.exec<PlanJsonObject>(["show", "-json", binaryPlanFilePath], { json: true });
    return { binaryPlanFilePath, planJsonObject };
  }

  async apply(plan?: Plan, options?: ApplyOptions): Promise<State<Outputs>> {
    await this.init();

    const args: string[] = ["apply"];

    if (options) {
      if (options.destroy) args.push("-destroy");
      if (options.passThroughArgs) args.push(...options.passThroughArgs);
    }

    // Allow an inline stack to easily destroy it's self without having
    // to make changes to the source code to call the destroy method.
    if (Deno.env.get("CDKTS_DESTROY") && !options?.destroy) {
      args.push("-destroy");
    }

    if (plan) {
      args.push(plan.binaryPlanFilePath);
    }

    // Inject stack inputs as tf vars
    const env: Record<string, string | undefined> = {};
    if (this.#props.stack && this.#props.stack["_inputValues"]) {
      for (const [k, v] of Object.entries(this.#props.stack["_inputValues"])) {
        env[`TF_VAR_${snakeCase(k)}`] = typeof v !== "string" ? JSON.stringify(v) : v;
      }
    }

    await this.exec(args, { quiet: options?.quiet, env });
    if (plan) await Deno.remove(plan.binaryPlanFilePath);
    return await this.exec(["show", "-json"], { json: true });
  }

  async outputs(): Promise<Outputs> {
    await this.init();
    const rawOutputs: Record<string, OutputValue<any>> = await this.exec(["output", "-json"], { json: true });

    const output: Record<string, any> = {};
    for (const [k, v] of Object.entries(rawOutputs)) {
      output[k] = v.value;
    }

    return output as Outputs;
  }

  async destroy(plan?: Plan, options?: ApplyOptions): Promise<State<Outputs>> {
    await this.init();
    return await this.apply(plan, { ...options, destroy: true });
  }

  async exec<T>(args: string[], options: { json: true; env?: Record<string, string | undefined> }): Promise<T>;
  async exec(args: string[], options: { quiet?: boolean; env?: Record<string, string | undefined> }): Promise<void>;
  async exec(args: string[]): Promise<void>;
  async exec(
    args: string[],
    options?: { json?: boolean; quiet?: boolean; env?: Record<string, string | undefined> },
  ): Promise<unknown | void> {
    const env = { ...Deno.env.toObject() };
    if (options?.env) {
      for (const [key, value] of Object.entries(options.env)) {
        if (value !== undefined) {
          env[key] = value;
        }
      }
    }

    const command = new Deno.Command(this.#props.tfBinaryPath!, {
      args,
      cwd: this.#props.projectDir!,
      env,
      stdout: options?.json || options?.quiet ? "piped" : "inherit",
      stderr: options?.quiet ? "piped" : "inherit",
    });

    const process = command.spawn();
    const output = await process.output();

    if (!output.success) {
      throw new Error(`Command failed with exit code ${output.code}`);
    }

    if (options?.json) {
      const text = new TextDecoder().decode(output.stdout);
      return JSON.parse(text);
    }
  }

  async cleanUp(): Promise<void> {
    if (this.#props.projectDir) {
      await Deno.remove(this.#props.projectDir, { recursive: true });
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
