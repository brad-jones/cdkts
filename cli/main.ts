/**
 * CLI tool for CDKTS - CDK for Terraform/OpenTofu
 *
 * This module provides a command-line interface for executing CDKTS stacks,
 * including init, plan, apply, destroy, and other Terraform/OpenTofu operations.
 *
 * @example
 * ```bash
 * # Initialize and apply a stack
 * cdkts apply ./my_stack.ts
 *
 * # Plan changes with pass-through arguments
 * cdkts plan ./my_stack.ts -- -var="instance_type=t3.micro"
 *
 * # Use as an escape hatch for any terraform command
 * cdkts state list ./my_stack.ts
 * ```
 *
 * @module
 */

import { Command, EnumType } from "@cliffy/command";
import { Confirm } from "@cliffy/prompt";
import { outdent } from "@cspotcode/outdent";
import { join } from "@std/path";
import { Project } from "../lib/automate/project.ts";
import { StackBundler, type Target } from "../lib/automate/stack_bundler/stack_bundler.ts";
import { importStack, tempDir } from "../lib/automate/utils.ts";

/** The version, updated by the build process */
const VERSION = "0.3.5";

await new Command()
  .name("cdkts")
  .version(VERSION)
  .description(`
    CDK for Terraform/OpenTofu (CDKTS) - Define infrastructure using TypeScript and synthesize to HCL

    ESCAPE HATCH:
    This top-level command acts as an escape hatch for any tofu/terraform functionality not
    explicitly exposed by CDKTS. You can execute any valid tofu/terraform command by providing
    it as the subcommand. For example:
        cdkts show ./my_stack.ts
        cdkts state list ./my_stack.ts
        cdkts console ./my_stack.ts

    CDKTS will initialize the project (synthesize HCL, download binaries, etc.) and then pass
    your command directly to the underlying tofu/terraform binary.

    PASS-THROUGH ARGUMENTS:
    All commands support pass-through arguments using the -- separator. Arguments after -- are
    forwarded directly to tofu/terraform without interpretation. For example:
        cdkts init ./my_stack.ts -- -backend=false -upgrade
        cdkts plan ./my_stack.ts -- -var="instance_type=t3.micro" -out=tfplan
        cdkts apply ./my_stack.ts -- -auto-approve -parallelism=10

    This allows you to use any native tofu/terraform flags alongside CDKTS commands.
  `)
  .globalType("flavor", new EnumType(["tofu", "terraform"]))
  .globalEnv(
    "CDKTS_FLAVOR=<value:flavor>",
    "Select infrastructure-as-code tool: 'tofu' for OpenTofu or 'terraform' for Terraform (default: tofu)",
    { prefix: "CDKTS_" },
  )
  .globalEnv(
    "CDKTS_TF_BINARY_PATH=<value:string>",
    "Path to an existing tofu/terraform binary. If not provided, CDKTS will automatically download the appropriate binary",
    { prefix: "CDKTS_" },
  )
  .globalEnv(
    "CDKTS_TF_VERSION=<value:string>",
    "Specify the version of tofu/terraform to download (e.g., '1.11.4'). Only used when CDKTS_TF_BINARY_PATH is not set",
    { prefix: "CDKTS_" },
  )
  .globalEnv(
    "CDKTS_PROJECT_DIR=<value:string>",
    "Working directory for generated .tf files and .terraform state. If not set, a temporary directory is created based on stack ID hash",
    { prefix: "CDKTS_" },
  )
  .globalOption(
    "--clean",
    "Delete the project directory after command completion. Use with caution as this removes all generated files and state",
  )
  .arguments("<subCmd:string> <stackFilePath:string> -- [...passThroughArgs:string]")
  .action(async function (options, subCmd: string, stackFilePath: string) {
    const stack = await importStack(await Deno.realPath(stackFilePath));

    const project = new Project({
      stack,
      flavor: options.flavor ?? "tofu",
      tfBinaryPath: options.tfBinaryPath,
      tfVersion: options.tfVersion,
      projectDir: options.projectDir,
    });

    await project.preInit();

    await project.exec([subCmd, ...this.getLiteralArgs()]);

    if (options.clean) {
      await project.cleanUp();
    }
  })
  // ---
  .command("init")
  .description(`
    Initialize a new or existing CDKTS Stack by creating initial files,
    loading any remote state, downloading modules, etc.

    This is the first command that should be run for any new or existing
    CDKTS Stack per machine. This sets up all the local data necessary to run
    OpenTofu (or Terraform) that is typically not committed to version control.

    This command is always safe to run multiple times. Though subsequent runs
    may give errors, this command will never delete your configuration or
    state. Even so, if you have important information, please back it up prior
    to running this command, just in case.
  `)
  .arguments("<stackFilePath:string> -- [...passThroughArgs:string]")
  .option("--re-init", "Delete .terraform directory and .terraform.lock.hcl before running init")
  .action(async function (options, stackFilePath: string) {
    const stack = await importStack(await Deno.realPath(stackFilePath));

    const project = new Project({
      stack,
      flavor: options.flavor ?? "tofu",
      tfBinaryPath: options.tfBinaryPath,
      tfVersion: options.tfVersion,
      projectDir: options.projectDir,
    });

    await project.init({
      passThroughArgs: this.getLiteralArgs(),
      reInit: options.reInit ? true : undefined,
    });

    if (options.clean) {
      await project.cleanUp();
    }
  })
  // ---
  .command("validate")
  .description(`
    Validate the configuration files in a directory, referring only to the
    configuration and not accessing any remote services such as remote state,
    provider APIs, etc.

    Validate runs checks that verify whether a configuration is syntactically
    valid and internally consistent, regardless of any provided variables or
    existing state. It is thus primarily useful for general verification of
    reusable modules, including correctness of attribute names and value types.

    It is safe to run this command automatically, for example as a post-save
    check in a text editor or as a test step for a re-usable module in a CI
    system.

    Validation requires an initialized working directory with any referenced
    plugins and modules installed. To initialize a working directory for
    validation without accessing any configured remote backend, use:
        cdkts init ./my_stack.ts -- -backend=false

    To verify configuration in the context of a particular run (a particular
    target workspace, input variable values, etc), use the 'cdkts plan'
    command instead, which includes an implied validation check.
  `)
  .arguments("<stackFilePath:string> -- [...passThroughArgs:string]")
  .action(async function (options, stackFilePath: string) {
    const stack = await importStack(await Deno.realPath(stackFilePath));

    const project = new Project({
      stack,
      flavor: options.flavor ?? "tofu",
      tfBinaryPath: options.tfBinaryPath,
      tfVersion: options.tfVersion,
      projectDir: options.projectDir,
    });

    await project.validate({
      passThroughArgs: this.getLiteralArgs(),
    });

    if (options.clean) {
      await project.cleanUp();
    }
  })
  // ---
  .command("plan")
  .description(`
    Generates a speculative execution plan, showing what actions tofu (or terraform)
    would take to apply the current configuration. This command will not actually
    perform the planned actions.

    You can optionally save the plan to a file, which you can then pass to the
    "apply" command to perform exactly the actions described in the plan.
  `)
  .option("--destroy", "Generate a plan to destroy all resources instead of creating/updating them")
  .option("-o, --out <path:string>", "Save the generated plan to the specified file path for later use with 'apply'")
  .arguments("<stackFilePath:string> -- [...passThroughArgs:string]")
  .action(async function (options, stackFilePath: string) {
    const stack = await importStack(await Deno.realPath(stackFilePath));

    const project = new Project({
      stack,
      flavor: options.flavor ?? "tofu",
      tfBinaryPath: options.tfBinaryPath,
      tfVersion: options.tfVersion,
      projectDir: options.projectDir,
    });

    const plan = await project.plan({
      destroy: options.destroy,
      passThroughArgs: this.getLiteralArgs(),
    });

    if (options.out) {
      await Deno.copyFile(plan.binaryPlanFilePath, options.out);
      console.log(`written plan to: ${options.out}`);
    }

    if (options.clean) {
      await project.cleanUp();
    }
  })
  // ---
  .command("refresh")
  .description(`
    Update the state file of your infrastructure with metadata that matches
    the physical resources they are tracking.

    This will not modify your infrastructure, but it can modify your
    state file to update metadata. This metadata might cause new changes
    to occur when you generate a plan or call apply next.
  `)
  .arguments("<stackFilePath:string> -- [...passThroughArgs:string]")
  .action(async function (options, stackFilePath: string) {
    const stack = await importStack(await Deno.realPath(stackFilePath));

    const project = new Project({
      stack,
      flavor: options.flavor ?? "tofu",
      tfBinaryPath: options.tfBinaryPath,
      tfVersion: options.tfVersion,
      projectDir: options.projectDir,
    });

    await project.preInit();
    await project.exec(["refresh", ...this.getLiteralArgs()]);

    if (options.clean) {
      await project.cleanUp();
    }
  })
  // ---
  .command("apply")
  .description(`
    Creates or updates infrastructure according to the CDKTS Stack.

    By default, tofu (or terraform) will generate a new plan and present it for
    your approval before taking any action.

    You can optionally provide a plan file created by a previous call to "cdkts plan",
    in which case tofu (or terraform) will take the actions described in that plan
    without any confirmation prompt.
  `)
  .option("--destroy", "Destroy all resources instead of creating/updating them")
  .option("-p, --plan <path:string>", "Apply a previously saved plan file instead of generating a new plan")
  .arguments("<stackFilePath:string> -- [...passThroughArgs:string]")
  .action(async function (options, stackFilePath: string) {
    const stack = await importStack(await Deno.realPath(stackFilePath));

    const project = new Project({
      stack,
      flavor: options.flavor ?? "tofu",
      tfBinaryPath: options.tfBinaryPath,
      tfVersion: options.tfVersion,
      projectDir: options.projectDir,
    });

    const plan = options.plan
      ? { binaryPlanFilePath: options.plan, planJsonObject: { format_version: "1.0" } }
      : undefined;

    await project.apply(plan, {
      destroy: options.destroy,
      passThroughArgs: this.getLiteralArgs(),
    });

    if (options.clean) {
      await project.cleanUp();
    }
  })
  // ---
  .command("destroy")
  .description(`
    Destroy CDKTS-managed infrastructure.

    This command is a convenience alias for:
        cdkts apply --destroy ./my_stack.ts

    You can also create a plan to destroy:
      cdkts plan --destroy --out ./planned-destruction.json ./my_stack.ts
      cdkts apply --plan ./planned-destruction.json ./my_stack.ts
  `)
  .arguments("<stackFilePath:string> -- [...passThroughArgs:string]")
  .action(async function (options, stackFilePath: string) {
    const stack = await importStack(await Deno.realPath(stackFilePath));

    const project = new Project({
      stack,
      flavor: options.flavor ?? "tofu",
      tfBinaryPath: options.tfBinaryPath,
      tfVersion: options.tfVersion,
      projectDir: options.projectDir,
    });

    await project.destroy(undefined, { passThroughArgs: this.getLiteralArgs() });

    if (options.clean) {
      await project.cleanUp();
    }
  })
  // ---
  .command("output")
  .description(`
    Reads an output variable from a tofu (or terraform) state file and prints the value.
    With no additional arguments, output will display all the outputs for the root module.
    If NAME is not specified, all outputs are printed.
  `)
  .arguments("<stackFilePath:string> [name:string] -- [...passThroughArgs:string]")
  .action(async function (options, stackFilePath: string, name?: string) {
    const stack = await importStack(await Deno.realPath(stackFilePath));

    const project = new Project({
      stack,
      flavor: options.flavor ?? "tofu",
      tfBinaryPath: options.tfBinaryPath,
      tfVersion: options.tfVersion,
      projectDir: options.projectDir,
    });

    const outputs = await project.outputs();
    if (name) {
      console.log(outputs[name]);
    } else {
      console.log(JSON.stringify(outputs));
    }

    if (options.clean) {
      await project.cleanUp();
    }
  })
  // ---
  .command("synth")
  .description(`
    Synthesize the TypeScript Stack definition into HashiCorp Configuration Language (HCL).
    This outputs the generated .tf configuration without initializing or executing anything.
    Useful for debugging, reviewing generated configuration, or understanding what CDKTS produces.
  `)
  .arguments("<stackFilePath:string>")
  .action(async function (_, stackFilePath: string) {
    const stack = await importStack(await Deno.realPath(stackFilePath));
    console.log(await stack.toHcl());
  })
  // ---
  .command("bundle")
  .description(`
    Create a self-contained executable that includes the stack, tofu/terraform binary,
    provider plugins, and lock file. The resulting binary can be deployed to air-gapped
    environments without internet access. Powered by 'deno compile'.
  `)
  .type(
    "target",
    new EnumType([
      "x86_64-pc-windows-msvc",
      "x86_64-apple-darwin",
      "aarch64-apple-darwin",
      "x86_64-unknown-linux-gnu",
      "aarch64-unknown-linux-gnu",
    ]),
  )
  .option(
    "-a, --all",
    "Bundle for all supported platforms: Windows (x86_64), macOS (x86_64, ARM64), and Linux (x86_64, ARM64)",
  )
  .arguments("<stackFilePath:string> [...targets:target]")
  .action(async function (options, stackFilePath: string, ...targets) {
    const bundler = new StackBundler({ flavor: options.flavor ?? "tofu", tfVersion: options.tfVersion });

    const allTargets: Target[] = [
      "x86_64-pc-windows-msvc",
      "x86_64-apple-darwin",
      "aarch64-apple-darwin",
      "x86_64-unknown-linux-gnu",
      "aarch64-unknown-linux-gnu",
    ];

    let targetsToBundle: Target[] | undefined = targets;
    if (options.all) {
      targetsToBundle = allTargets;
    } else if (targets.length === 0) {
      targetsToBundle = undefined;
    }

    await bundler.bundle(await Deno.realPath(stackFilePath), targetsToBundle);
  })
  // ---
  .command("clean")
  .description(`
    Deletes all temporary data that CDKTS stores on your system.

    This command removes:
    - Temporary project directories created during command execution
    - Downloaded tofu/terraform binaries cached in the system temp directory
    - Any other CDKTS-related temporary files

    Use this to free up disk space or reset CDKTS to a clean state.
  `)
  .action(async function () {
    // Double check with the user that this is really what they want to do.
    const confirmed = await Confirm.prompt({
      message: outdent`
        Are you sure you want to delete all CDKTS temporary data?

        WARNING: This may delete state that you care about if you have not
        configured a state backend or otherwise are using local state!
      `,
      default: false,
    });

    if (!confirmed) {
      console.log("Clean operation cancelled.");
      return;
    }

    // Delete downloaded tofu/terraform binaries
    try {
      await Deno.remove(tempDir("cdkts"), { recursive: true });
    } catch (e) {
      if (!(e instanceof Deno.errors.NotFound)) {
        throw e;
      }
    }

    // Also delete any cdkts-project- dirs
    await Project.cleanUp();

    // Remove any cdkts-embedded- files (these are extracted from the CDKTS binary when running bundled projects)
    const tmpDir = tempDir();
    for await (const entry of Deno.readDir(tmpDir)) {
      if (entry.name.startsWith("cdkts-embedded-")) {
        const filePath = join(tmpDir, entry.name);
        try {
          await Deno.remove(filePath, { recursive: true });
        } catch (error) {
          // Ignore errors for individual file (e.g., permission issues, in-use files)
          console.warn(`Failed to remove ${filePath}:`, error);
        }
      }
    }

    console.log("Successfully cleaned CDKTS temporary data.");
  })
  .parse();
