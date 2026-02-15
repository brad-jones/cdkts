import type { Construct } from "../../construct.ts";
import { Stack } from "../../stack.ts";
import { Action } from "./action.ts";

/**
 * Configuration for a DenoAction that bridges Terraform actions to Deno scripts.
 *
 * @template Props - Type of the input properties to pass to the Deno script
 *
 * @example
 * ```ts
 * const config: DenoActionConfig<{ message: string }> = {
 *   path: "${path.module}/action.ts",
 *   props: { message: "Hello World" },
 *   permissions: {
 *     allow: ["read", "net=example.com:443"]
 *   }
 * };
 * ```
 */
// deno-lint-ignore no-explicit-any
export interface DenoActionConfig<Props = any> {
  /**
   * Path to the Deno script to execute.
   *
   * This can be a local file path or a remote HTTP URL. Any valid value that
   * `deno run` accepts is supported.
   *
   * @example
   * ```ts
   * // Local file
   * path: "${path.module}/action.ts"
   *
   * // Remote URL
   * path: "https://example.com/action.ts"
   *
   * // Using import.meta.url
   * path: import.meta.url
   * ```
   */
  path: string;

  /**
   * Input properties to pass to the Deno script.
   *
   * These props are provided to the `ActionProvider.invoke()` method in your
   * Deno script implementation.
   *
   * @example
   * ```ts
   * props: {
   *   destination: "mars",
   *   launchDate: "2026-03-15"
   * }
   * ```
   */
  props: Props;

  /**
   * Optional path to a Deno configuration file (e.g., `deno.json` or `deno.jsonc`).
   *
   * If specified, the Deno script will be executed with the settings from this
   * config file. This allows you to define compiler options, import maps, and
   * other Deno configurations in a separate file.
   */
  configFile?: string;

  /**
   * Deno runtime permissions for the script.
   *
   * Controls what system resources the Deno script can access at runtime.
   * Following Deno's security model, scripts have no permissions by default.
   *
   * @see {@link https://registry.terraform.io/providers/brad-jones/denobridge/latest/docs/guides/deno-permissions | Deno Permissions Guide}
   * @see {@link https://docs.deno.com/runtime/fundamentals/security/#permissions | Deno Security Documentation}
   *
   * @example
   * ```ts
   * // Grant all permissions (use with caution!)
   * permissions: { all: true }
   *
   * // Fine-grained control
   * permissions: {
   *   allow: [
   *     "read",                    // --allow-read (all paths)
   *     "write=/tmp",              // --allow-write=/tmp
   *     "net=example.com:443",     // --allow-net=example.com:443
   *     "env=HOME,USER",           // --allow-env=HOME,USER
   *     "run=curl,whoami",         // --allow-run=curl,whoami
   *   ]
   * }
   *
   * // Deny specific permissions (deny takes precedence over allow)
   * permissions: {
   *   allow: ["net"],              // Allow all network access
   *   deny: ["net=evil.com"]       // Except evil.com
   * }
   * ```
   */
  permissions?: {
    /** Grant all permissions to the Deno script (maps to `--allow-all`). Use with caution. */
    all?: boolean;

    /** List of permissions to allow (e.g., `read`, `write=/tmp`, `net=example.com:443`). */
    allow?: string[];

    /** List of permissions to deny. Deny rules take precedence over allow rules. */
    deny?: string[];
  };
}

/**
 * A Terraform action that executes a Deno TypeScript script.
 *
 * `DenoAction` bridges the Terraform plugin framework's action concept to Deno
 * scripts, allowing you to invoke TypeScript-based automations from Terraform.
 * Actions are preset operations that can be triggered via the Terraform CLI or
 * during an apply operation.
 *
 * The Deno script should implement an `ActionProvider` from the
 * `@brad-jones/terraform-provider-denobridge` package.
 *
 * @template Self - The derived class type for proper type inference
 *
 * @see {@link https://registry.terraform.io/providers/brad-jones/denobridge/latest/docs/actions/action | denobridge_action Documentation}
 * @see {@link https://developer.hashicorp.com/terraform/plugin/framework/actions | Terraform Actions Framework}
 *
 * @remarks
 * - Actions are supported in Terraform 1.14 and later
 * - Unsupported by OpenTofu (see https://github.com/opentofu/opentofu/issues/3309)
 *
 * @example
 * Combined pattern - Construct and Provider Implementation in one file!
 * ```ts
 * import { type Action, type Construct, DenoAction } from "@brad-jones/cdkts/constructs";
 * import { ZodActionProvider } from "@brad-jones/terraform-provider-denobridge";
 * import { z } from "@zod/zod";
 *
 * const Props = z.object({
 *   message: z.string(),
 *   count: z.number().optional().default(3),
 *   delaySec: z.number().optional().default(1),
 * });
 *
 * export class EchoExampleAction extends DenoAction<typeof EchoExampleAction> {
 *   constructor(
 *     parent: Construct,
 *     label: string,
 *     props: z.input<typeof Props>,
 *     options?: Omit<Action["inputs"], "config">
 *   ) {
 *     super(parent, label, {
 *       ...options,
 *       config: {
 *         props,
 *         path: import.meta.url, // References this same file!
 *         permissions: { all: true }
 *       }
 *     });
 *   }
 * }
 *
 * // The ActionProvider implementation runs when executed by Terraform
 * if (import.meta.main) {
 *   new ZodActionProvider(Props, {
 *     async invoke({ message, count, delaySec }, progressCallback) {
 *       for (let i = 0; i < count; i++) {
 *         await progressCallback(`${i}: ${message}`);
 *         await new Promise((r) => setTimeout(r, delaySec * 1000));
 *       }
 *     }
 *   });
 * }
 * ```
 */
export class DenoAction<Self = typeof DenoAction> extends Action<Self> {
  /**
   * Marker property to identify it's type to avoid circular dependencies when type checking.
   *
   * @internal
   */
  private readonly __type = "DenoAction";

  /**
   * Properties class defining the inputs and outputs for DenoAction.
   *
   * Extends the base Action.Props with a typed config input for DenoAction specifics.
   */
  static override readonly Props = class extends Action.Props {
    /**
     * Configuration for the denobridge_action.
     *
     * Specifies the Deno script to execute, the props to pass to it,
     * and the runtime permissions it requires.
     *
     * @see {@link DenoActionConfig}
     */
    override config = new Action.Input<DenoActionConfig>();
  };

  /**
   * Creates a new DenoAction instance.
   *
   * @param parent - The parent construct in the construct tree
   * @param label - Unique label for this action within its parent scope
   * @param inputs - Input properties including config with path, props, and permissions
   *
   * @example
   * ```ts
   * new DenoAction(myStack, "my_action", {
   *   config: {
   *     path: "./scripts/action.ts",
   *     props: { key: "value" },
   *     permissions: { allow: ["read", "write=/tmp"] }
   *   }
   * });
   * ```
   */
  constructor(parent: Construct, label: string, inputs: DenoAction["inputs"]) {
    if (!inputs?.config.configFile) inputs!.config.configFile = Stack.of(parent).configFile;
    if (inputs?.config.configFile) {
      // deno-lint-ignore no-explicit-any
      (inputs as any).config["config_file"] = inputs.config.configFile;
      delete inputs.config.configFile;
    }
    super(parent, "denobridge_action", label, inputs);
  }
}
