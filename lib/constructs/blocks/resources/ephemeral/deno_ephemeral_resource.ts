// deno-lint-ignore-file no-explicit-any

import type { Construct } from "../../../construct.ts";
import { EphemeralResource } from "./ephemeral_resource.ts";

/**
 * A Terraform ephemeral resource that executes a Deno TypeScript script.
 *
 * `DenoEphemeralResource` bridges the Terraform plugin framework's ephemeral resource concept to Deno
 * scripts, allowing you to generate temporary values using TypeScript from within Terraform.
 * Ephemeral resources exist only during a Terraform plan or apply operation and are not stored
 * in the state file - making them ideal for generating short-lived credentials, temporary tokens,
 * or other transient data.
 *
 * The Deno script should implement an `EphemeralResourceProvider` from the
 * `@brad-jones/terraform-provider-denobridge` package.
 *
 * @template Self - The derived class type for proper type inference
 *
 * @see {@link https://registry.terraform.io/providers/brad-jones/denobridge/latest/docs/ephemeral-resources/ephemeral_resource | denobridge_ephemeral_resource Documentation}
 * @see {@link https://developer.hashicorp.com/terraform/plugin/framework/ephemeral-resources | Terraform Ephemeral Resources Framework}
 *
 * @remarks
 * - Ephemeral resources are supported in Terraform 1.10 and later
 * - Not stored in Terraform state file after operation completes
 * - Use the `open` method instead of create/read/update/delete lifecycle
 *
 * @example
 * Combined pattern - Construct and Provider Implementation in one file!
 * ```ts
 * import { type Construct, DenoEphemeralResource, type EphemeralResource } from "@brad-jones/cdkts/constructs";
 * import { ZodEphemeralResourceProvider } from "@brad-jones/terraform-provider-denobridge";
 * import { z } from "@zod/zod";
 *
 * const Props = z.object({
 *   type: z.enum(["v4"]),
 * });
 *
 * const Result = z.object({
 *   uuid: z.uuid(),
 * });
 *
 * export class UuidExampleEphemeralResource extends DenoEphemeralResource<typeof UuidExampleEphemeralResource> {
 *   static override readonly Props = class extends DenoEphemeralResource.Props {
 *     override props = new DenoEphemeralResource.ZodInput(Props);
 *     override result = new DenoEphemeralResource.ZodOutput(Result);
 *   };
 *
 *   constructor(
 *     parent: Construct,
 *     label: string,
 *     props: z.infer<typeof Props>,
 *     options?: EphemeralResource["inputs"],
 *   ) {
 *     super(parent, label, {
 *       props,
 *       path: import.meta.url, // References this same file!
 *       permissions: { all: true },
 *       ...options,
 *     });
 *   }
 * }
 *
 * // The EphemeralResourceProvider implementation runs when opened by Terraform
 * if (import.meta.main) {
 *   const privateData = z.never();
 *
 *   new ZodEphemeralResourceProvider(Props, Result, privateData, {
 *     async open({ type }) {
 *       if (type !== "v4") {
 *         return {
 *           diagnostics: [{
 *             severity: "error",
 *             summary: "Unsupported UUID type",
 *             detail: "This resource only supports v4 UUIDs",
 *           }],
 *         };
 *       }
 *
 *       return { result: { uuid: crypto.randomUUID() } };
 *     },
 *   });
 * }
 * ```
 */
export class DenoEphemeralResource<Self = typeof DenoEphemeralResource> extends EphemeralResource<Self> {
  /**
   * Properties class defining the inputs and outputs for DenoEphemeralResource.
   *
   * Extends the base EphemeralResource.Props with typed inputs for DenoEphemeralResource specifics.
   */
  static override readonly Props = class extends EphemeralResource.Props {
    /**
     * Input properties to pass to the Deno script.
     *
     * These props are provided to the `EphemeralResourceProvider.open()` method in your
     * Deno script implementation. The type is dynamic and determined by your script.
     *
     * @example
     * ```ts
     * props: {
     *   type: "v4",
     *   namespace: "my-namespace"
     * }
     * ```
     */
    props = new EphemeralResource.Input<any>();

    /**
     * Output data returned from the Deno script.
     *
     * This is the result from the `EphemeralResourceProvider.open()` method and can be
     * referenced in your Terraform configuration. The type is dynamic and determined
     * by what your script returns. Unlike regular resources, this value is not persisted
     * in state and is regenerated on each operation.
     *
     * @example
     * ```ts
     * // In your Deno script
     * return { result: { uuid: crypto.randomUUID() } };
     *
     * // In Terraform
     * resource "foo" "bar" {
     *   token = ephemeral.denobridge_ephemeral_resource.temp.result.uuid
     * }
     * ```
     */
    result = new EphemeralResource.Output<any>();

    /**
     * Path to the Deno script to execute.
     *
     * This can be a local file path or a remote HTTP URL. Any valid value that
     * `deno run` accepts is supported.
     *
     * @example
     * ```ts
     * // Local file
     * path: "${path.module}/ephemeral_resource.ts"
     *
     * // Remote URL
     * path: "https://example.com/ephemeral_resource.ts"
     *
     * // Using import.meta.url
     * path: import.meta.url
     * ```
     */
    path = new EphemeralResource.Input<string>();

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
    permissions = new EphemeralResource.Input<
      {
        /** Grant all permissions to the Deno script (maps to `--allow-all`). Use with caution. */
        all?: boolean;

        /** List of permissions to allow (e.g., `read`, `write=/tmp`, `net=example.com:443`). */
        allow?: string[];

        /** List of permissions to deny. Deny rules take precedence over allow rules. */
        deny?: string[];
      } | undefined
    >();
  };

  /**
   * Creates a new DenoEphemeralResource instance.
   *
   * @param parent - The parent construct in the construct tree
   * @param label - Unique label for this ephemeral resource within its parent scope
   * @param inputs - Input properties including path, props, and permissions
   *
   * @example
   * ```ts
   * new DenoEphemeralResource(myStack, "temp_token", {
   *   path: "./scripts/ephemeral_resource.ts",
   *   props: { duration: "1h" },
   *   permissions: { allow: ["net=auth.example.com:443"] }
   * });
   * ```
   */
  constructor(parent: Construct, label: string, inputs: DenoEphemeralResource["inputs"]) {
    super(parent, "denobridge_ephemeral_resource", label, inputs);
  }
}
