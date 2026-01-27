import type { Construct } from "../../construct.ts";
import { Action } from "./action.ts";

// deno-lint-ignore no-explicit-any
export interface DenoActionConfig<Props = any> {
  /**
   * Path to the Deno script to execute.
   *
   * @see https://registry.terraform.io/providers/brad-jones/denobridge/latest/docs/actions/action#path-1
   */
  path: string;

  /**
   * Input properties to pass to the Deno script.
   *
   * @see https://registry.terraform.io/providers/brad-jones/denobridge/latest/docs/actions/action#props-1
   */
  props: Props;

  /**
   * Deno runtime permissions for the script.
   *
   * @see https://registry.terraform.io/providers/brad-jones/denobridge/latest/docs/actions/action#permissions-1
   */
  permissions?: {
    /**
     * Grant all permissions.
     *
     * @see https://registry.terraform.io/providers/brad-jones/denobridge/latest/docs/actions/action#all-1
     */
    all?: boolean;

    /**
     * List of permissions to allow (e.g., 'read', 'write', 'net').
     *
     * @see https://registry.terraform.io/providers/brad-jones/denobridge/latest/docs/actions/action#allow-1
     */
    allow?: string[];

    /**
     * List of permissions to deny.
     *
     * @see https://registry.terraform.io/providers/brad-jones/denobridge/latest/docs/actions/action#deny-1
     */
    deny?: string[];
  };
}

/**
 * Proxies the "action" Invoke GRPC call to a Deno script over standard HTTP.
 *
 * @see https://registry.terraform.io/providers/brad-jones/denobridge/latest/docs/actions/action
 *
 * _NB: Unsupported by OpenTofu <https://github.com/opentofu/opentofu/issues/3309>_
 *
 * @example
 *
 * Unmanaged Example
 *
 * Here we show how you might use this construct directly, you are solely
 * responsible for the implementation of the underlying deno script.
 *
 * Refer to the denobridge provider documentation which explains how to do this.
 *
 * ```ts
 * import { Stack, DenoAction } from "jsr:@brad-jones/cdkts/constructs";
 *
 * class MyStack extends Stack {
 *   constructor() {
 *     super(`${import.meta.url}#${MyStack.name}`);
 *
 *     new DenoAction(this, "MyAction", {
 *       path: "/path/to/action/server/script.ts",
 *       props: {
 *         foo: "bar",
 *       }
 *     });
 *   }
 * }
 * ```
 *
 * @example
 *
 * Integrated Example
 *
 * In this example you extend the DenoAction construct & implement the
 * Invoke GRPC call (via the denobridge HTTP proxy) directly in the same
 * deno script.
 *
 * This is the whole purpose for the denobridge provider :)
 *
 * _my_action.ts_
 * ```ts
 * import { z } from "@zod/zod";
 * import { Construct, Stack, DenoAction } from "jsr:@brad-jones/cdkts/constructs";
 *
 * const MyActionInputs = z.object({
 *   foo: z.string(),
 * });
 *
 * export class MyAction extends DenoAction {
 *   constructor(
 *     parent: Construct,
 *     label: string,
 *     props: z.input<typeof MyActionInputs>,
 *     options?: Omit<MyAction["inputType"], "config">,
 *   ) {
 *     super(
 *       parent,
 *       label,
 *       {
 *         config: {
 *           // The properties that will eventually be resolved
 *           // and sent to your invoke method below.
 *           props,
 *
 *           // This file also exports a default export which acts
 *           // as the HTTP server for denobridge to call.
 *           path: import.meta.url,
 *
 *           permissions: {
 *             all: true, // - use with caution !
 *
 *             // Prefer setting more specific permissions
 *             // that your action actually needs
 *             allow: ["read", "write", "etc..."],
 *             deny: ["net=evil.com"]
 *           },
 *         },
 *         ...options,
 *       },
 *       DenoActionInputs(ExampleDenoActionInputs),
 *     );
 *   }
 * }
 *
 * export default MyAction.provider({
 *   propsSchema: MyActionInputs,
 *
 *   // Ultimately this method is the implementation for the Invoke method in the Terraform Plugin Framework.
 *   // see: https://developer.hashicorp.com/terraform/plugin/framework/actions/implementation#invoke-method
 *   async invoke(props, progress) {
 *     // Finally do something with your properties.
 *     props.foo;
 *
 *     // And optionally emit some progress updates, if your action is long running.
 *     await progress("Hello World");
 *   },
 * });
 * ```
 *
 * _my_stack.ts_
 * ```ts
 * import { Stack } from "jsr:@brad-jones/cdkts/constructs";
 * import { MyAction } from "./my_action.ts";
 *
 * class MyStack extends Stack {
 *   constructor() {
 *     super(`${import.meta.url}#${MyStack.name}`);
 *
 *     new MyAction(this, "Action1", {
 *       foo: "bar"
 *     });
 *   }
 * }
 * ```
 */
export class DenoAction<Self = typeof DenoAction> extends Action<Self> {
  static override readonly Props = class extends Action.Props {
    override config = new Action.Input<DenoActionConfig>();
  };

  constructor(parent: Construct, label: string, inputs: DenoAction["inputs"]) {
    super(parent, "denobridge_action", label, inputs);
  }
}
