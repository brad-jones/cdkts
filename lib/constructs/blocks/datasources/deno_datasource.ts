// deno-lint-ignore-file no-explicit-any

import type { Construct } from "../../construct.ts";
import { DataSource } from "./datasource.ts";

/**
 * A Terraform data source that executes a Deno TypeScript script.
 *
 * `DenoDataSource` bridges the Terraform plugin framework's data source concept to Deno
 * scripts, allowing you to fetch and compute data using TypeScript from within Terraform.
 * Data sources are read-only and do not create or manage infrastructure - they are ideal
 * for querying APIs, performing computations, or reading external data.
 *
 * The Deno script should implement a `DatasourceProvider` from the
 * `@brad-jones/terraform-provider-denobridge` package.
 *
 * @template Self - The derived class type for proper type inference
 *
 * @see {@link https://registry.terraform.io/providers/brad-jones/denobridge/latest/docs/data-sources/datasource | denobridge_datasource Documentation}
 * @see {@link https://developer.hashicorp.com/terraform/plugin/framework/data-sources | Terraform Data Sources Framework}
 *
 * @example
 * Combined pattern - Construct and Provider Implementation in one file!
 * ```ts
 * import { type Construct, type DataSource, DenoDataSource } from "@brad-jones/cdkts/constructs";
 * import { ZodDatasourceProvider } from "@brad-jones/terraform-provider-denobridge";
 * import { z } from "@zod/zod";
 *
 * const Props = z.object({
 *   value: z.string(),
 * });
 *
 * const Result = z.object({
 *   hash: z.string(),
 * });
 *
 * export class Sha256ExampleDataSource extends DenoDataSource<typeof Sha256ExampleDataSource> {
 *   static override readonly Props = class extends DenoDataSource.Props {
 *     override props = new DenoDataSource.ZodInput(Props);
 *     override result = new DenoDataSource.ZodOutput(Result);
 *   };
 *
 *   constructor(
 *     parent: Construct,
 *     label: string,
 *     props: z.infer<typeof Props>,
 *     options?: DataSource["inputs"],
 *   ) {
 *     super(parent, label, {
 *       props,
 *       path: import.meta.url,
 *       permissions: {
 *         all: true,
 *       },
 *       ...options,
 *     });
 *   }
 * }
 *
 * if (import.meta.main) {
 *   new ZodDatasourceProvider(Props, Result, {
 *     async read({ value }) {
 *       const encoder = new TextEncoder();
 *       const data = encoder.encode(value);
 *       const hashBuffer = await crypto.subtle.digest("SHA-256", data);
 *       const hashArray = Array.from(new Uint8Array(hashBuffer));
 *       const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
 *       return { hash };
 *     },
 *   });
 * }
 * ```
 */
export class DenoDataSource<Self = typeof DenoDataSource> extends DataSource<Self> {
  /**
   * Marker property to identify it's type to avoid circular dependencies when type checking.
   *
   * @internal
   */
  private readonly __type = "DenoDataSource";

  /**
   * Properties class defining the inputs and outputs for DenoDataSource.
   *
   * Extends the base DataSource.Props with typed inputs for DenoDataSource specifics.
   */
  static override readonly Props = class extends DataSource.Props {
    /**
     * Path to the Deno script to execute.
     *
     * This can be a local file path or a remote HTTP URL. Any valid value that
     * `deno run` accepts is supported.
     *
     * @example
     * ```ts
     * // Local file
     * path: "${path.module}/datasource.ts"
     *
     * // Remote URL
     * path: "https://example.com/datasource.ts"
     *
     * // Using import.meta.url
     * path: import.meta.url
     * ```
     */
    path = new DataSource.Input<string>();

    /**
     * Input properties to pass to the Deno script.
     *
     * These props are provided to the `DatasourceProvider.read()` method in your
     * Deno script implementation. The type is dynamic and determined by your script.
     *
     * @example
     * ```ts
     * props: {
     *   query: "deno.com.",
     *   recordType: "A"
     * }
     * ```
     */
    props = new DataSource.Input<any>();

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
    permissions = new DataSource.Input<
      {
        /** Grant all permissions to the Deno script (maps to `--allow-all`). Use with caution. */
        all?: boolean;

        /** List of permissions to allow (e.g., `read`, `write=/tmp`, `net=example.com:443`). */
        allow?: string[];

        /** List of permissions to deny. Deny rules take precedence over allow rules. */
        deny?: string[];
      } | undefined
    >();

    /**
     * Output data returned from the Deno script.
     *
     * This is the result from the `DatasourceProvider.read()` method and can be
     * referenced in your Terraform configuration. The type is dynamic and determined
     * by what your script returns.
     *
     * @example
     * ```ts
     * // In your Deno script
     * return { ips: ["104.21.1.94", "172.67.133.100"] };
     *
     * // In Terraform
     * resource "foo" "bar" {
     *   ip_address = data.denobridge_datasource.dns.result.ips[0]
     * }
     * ```
     */
    result = new DataSource.Output<any>();
  };

  /**
   * Creates a new DenoDataSource instance.
   *
   * @param parent - The parent construct in the construct tree
   * @param label - Unique label for this data source within its parent scope
   * @param inputs - Input properties including path, props, and permissions
   *
   * @example
   * ```ts
   * new DenoDataSource(myStack, "sha256", {
   *   path: "./scripts/datasource.ts",
   *   props: { value: "hello world" },
   *   permissions: { allow: ["read"] }
   * });
   * ```
   */
  constructor(parent: Construct, label: string, inputs: DenoDataSource["inputs"]) {
    super(parent, "denobridge_datasource", label, inputs);
  }
}
