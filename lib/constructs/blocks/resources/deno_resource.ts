// deno-lint-ignore-file no-explicit-any

import type { Construct } from "../../construct.ts";
import { Resource } from "./resource.ts";

/**
 * A Terraform resource that executes a Deno TypeScript script.
 *
 * `DenoResource` bridges the Terraform plugin framework's resource concept to Deno
 * scripts, allowing you to create and manage infrastructure using TypeScript from
 * within Terraform. Resources have a full lifecycle (create, read, update, delete)
 * and their state is persisted in the Terraform state file - making them ideal for
 * managing infrastructure, external APIs, or any stateful operations that need to be
 * tracked over time.
 *
 * The Deno script should implement a `ResourceProvider` from the
 * `@brad-jones/terraform-provider-denobridge` package.
 *
 * @template Self - The derived class type for proper type inference
 *
 * @see {@link https://registry.terraform.io/providers/brad-jones/denobridge/latest/docs/resources/resource | denobridge_resource Documentation}
 * @see {@link https://developer.hashicorp.com/terraform/plugin/framework/resources | Terraform Resources Framework}
 *
 * @example
 * Combined pattern - Construct and Provider Implementation in one file!
 * ```ts
 * import { type Construct, DenoResource, type Resource } from "@brad-jones/cdkts/constructs";
 * import { ZodResourceProvider } from "@brad-jones/terraform-provider-denobridge";
 * import { z } from "@zod/zod";
 *
 * const Props = z.object({
 *   path: z.string(),
 *   content: z.string(),
 * });
 *
 * const State = z.object({
 *   mtime: z.number(),
 * });
 *
 * export class FileExampleResource extends DenoResource<typeof FileExampleResource> {
 *   static override readonly Props = class extends DenoResource.Props {
 *     override props = new DenoResource.ZodInput(Props);
 *     override state = new DenoResource.ZodOutput(State);
 *   };
 *
 *   constructor(
 *     parent: Construct,
 *     label: string,
 *     props: z.infer<typeof Props>,
 *     options?: Resource["inputs"],
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
 * // The ResourceProvider implementation runs through the full lifecycle
 * if (import.meta.main) {
 *   new ZodResourceProvider(Props, State, {
 *     async create({ path, content }) {
 *       await Deno.writeTextFile(path, content);
 *       return {
 *         id: path,
 *         state: {
 *           mtime: (await Deno.stat(path)).mtime!.getTime(),
 *         },
 *       };
 *     },
 *
 *     async read(id, props) {
 *       try {
 *         const content = await Deno.readTextFile(id);
 *         return {
 *           props: { path: id, content },
 *           state: {
 *             mtime: (await Deno.stat(id)).mtime!.getTime(),
 *           },
 *         };
 *       } catch (e) {
 *         if (e instanceof Deno.errors.NotFound) {
 *           return { exists: false };
 *         }
 *         throw e;
 *       }
 *     },
 *
 *     async update(id, nextProps, currentProps, currentState) {
 *       if (nextProps.path !== currentProps.path) {
 *         throw new Error("can not update a file with a different path, must be replaced");
 *       }
 *
 *       await Deno.writeTextFile(id, nextProps.content);
 *
 *       return {
 *         mtime: (await Deno.stat(id)).mtime!.getTime(),
 *       };
 *     },
 *
 *     async delete(id, props, state) {
 *       try {
 *         await Deno.remove(id);
 *       } catch (e) {
 *         if (e instanceof Deno.errors.NotFound) {
 *           return;
 *         }
 *         throw e;
 *       }
 *     },
 *
 *     async modifyPlan(id, planType, nextProps, currentProps, currentState) {
 *       if (planType !== "update") return undefined;
 *       return { requiresReplacement: currentProps?.path !== nextProps?.path };
 *     },
 *   });
 * }
 * ```
 */
export class DenoResource<Self = typeof DenoResource> extends Resource<Self> {
  /**
   * Marker property to identify it's type to avoid circular dependencies when type checking.
   *
   * @internal
   */
  private readonly __type = "DenoResource";

  /**
   * Properties class defining the inputs and outputs for DenoResource.
   *
   * Extends the base Resource.Props with typed inputs for DenoResource specifics.
   */
  static override readonly Props = class extends Resource.Props {
    /**
     * Unique identifier for the resource.
     *
     * This is automatically set by Terraform when the resource is created through the
     * `ResourceProvider.create()` method. The ID uniquely identifies this resource instance
     * and is used in subsequent read, update, and delete operations.
     *
     * @example
     * ```ts
     * // In your Deno script's create method
     * return { id: "file-123" };
     *
     * // In Terraform, access via id attribute
     * resource "foo" "bar" {
     *   resource_id = denobridge_resource.my_resource.id
     * }
     * ```
     */
    id = new Resource.Output<string>();

    /**
     * Input properties to pass to the Deno script.
     *
     * These props are provided to the `ResourceProvider` methods (create, read, update, delete)
     * in your Deno script implementation. The type is dynamic and determined by your script.
     *
     * @example
     * ```ts
     * props: {
     *   path: "example.txt",
     *   content: "Hello World"
     * }
     * ```
     */
    props = new Resource.Input<any>();

    /**
     * Additional computed state of the resource.
     *
     * This is the state returned from the `ResourceProvider` methods and can be
     * referenced in your Terraform configuration. The type is dynamic and determined
     * by what your script returns. Unlike props, state values are typically computed
     * or known only after the resource is created/updated.
     *
     * @example
     * ```ts
     * // In your Deno script
     * return { state: { mtime: Date.now(), size: 1024 } };
     *
     * // In Terraform
     * resource "foo" "bar" {
     *   last_modified = denobridge_resource.my_resource.state.mtime
     * }
     * ```
     */
    state = new Resource.Output<any>();

    /**
     * Path to the Deno script to execute.
     *
     * This can be a local file path or a remote HTTP URL. Any valid value that
     * `deno run` accepts is supported.
     *
     * @example
     * ```ts
     * // Local file
     * path: "${path.module}/resource.ts"
     *
     * // Remote URL
     * path: "https://example.com/resource.ts"
     *
     * // Using import.meta.url
     * path: import.meta.url
     * ```
     */
    path = new Resource.Input<string>();

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
    permissions = new Resource.Input<
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
   * Creates a new DenoResource instance.
   *
   * @param parent - The parent construct in the construct tree
   * @param label - Unique label for this resource within its parent scope
   * @param inputs - Input properties including path, props, and permissions
   *
   * @example
   * ```ts
   * new DenoResource(myStack, "my_file", {
   *   path: "./scripts/resource.ts",
   *   props: { path: "example.txt", content: "Hello World" },
   *   permissions: { allow: ["read", "write=/tmp"] }
   * });
   * ```
   */
  constructor(parent: Construct, label: string, inputs: DenoResource["inputs"]) {
    if (inputs?.props["writeOnly"]) {
      inputs["write_only_props"] = inputs.props["writeOnly"];
      delete inputs.props["writeOnly"];
    }
    super(parent, "denobridge_resource", label, inputs);
  }
}
