import type { Construct } from "../construct.ts";
import { Block } from "./block.ts";
import type { Provider } from "./providers/provider.ts";

/**
 * Represents a Terraform/OpenTofu import block.
 *
 * The `import` block instructs Terraform to import existing infrastructure resources
 * into state so they can be managed as code. Each import block targets one resource
 * instance (or a collection when using `forEach`).
 *
 * @see https://developer.hashicorp.com/terraform/language/block/import
 *
 * @example
 * ```typescript
 * // Import a single resource by ID
 * const bucket = new Resource(this, "aws_s3_bucket", "my_bucket", {});
 *
 * new Import(this, {
 *   to: bucket,
 *   id: "my-existing-bucket",
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Import multiple resources with for_each
 * const bucket = new Resource(this, "aws_s3_bucket", "this", {
 *   forEach: { staging: "bucket1", prod: "bucket2" },
 * });
 *
 * new Import(this, {
 *   to: bucket,
 *   forEach: { staging: "bucket1", prod: "bucket2" },
 *   id: "each.value",
 * });
 * ```
 */
export class Import extends Block<typeof Import> {
  /**
   * Configuration properties for an Import block.
   *
   * Defines the schema for import configuration, specifying the target resource
   * address, the resource identifier, and optional meta-arguments.
   */
  static override readonly Props = class extends Block.Props {
    /**
     * The address of the resource instance to import into.
     *
     * Must match the address of an existing `resource` block in the configuration.
     * This value is serialized as an unquoted HCL reference expression.
     *
     * @example
     * ```typescript
     * to: myResourceInstance  // produces: to = resource.aws_instance.web
     * ```
     */
    // deno-lint-ignore no-explicit-any
    to = new Block.Input<Block<any>>();

    /**
     * The cloud provider's unique ID for the resource to import.
     *
     * Mutually exclusive with `identity`. You must provide either `id` or `identity`.
     * The value must be known during the plan operation.
     *
     * @example
     * ```typescript
     * id: "i-096fba6d03d36d262"  // AWS EC2 instance ID
     * id: "my-s3-bucket-name"
     * ```
     */
    id = new Block.Input<string | undefined>();

    /**
     * A resource identity object that uniquely identifies the resource to import.
     *
     * Mutually exclusive with `id`. Use when the provider identifies resources
     * by a combination of attributes rather than a single string ID.
     * Keys and values are provider-specific — refer to provider documentation.
     *
     * @example
     * ```typescript
     * identity: {
     *   account_id: "123456789012",
     *   bucket:     "my-bucket",
     *   region:     "us-east-1",
     * }
     * ```
     */
    identity = new Block.Input<Record<string, string> | undefined>();

    /**
     * Imports multiple resource instances by iterating over a collection.
     *
     * Accepts a map (key → value) or a set of strings. When used, the `id` or
     * `identity` field typically references `each.value` or `each.key`.
     *
     * @see https://developer.hashicorp.com/terraform/language/meta-arguments/for_each
     *
     * @example
     * ```typescript
     * forEach: { staging: "bucket1", prod: "bucket2" }
     * forEach: ["bucket1", "bucket2"]
     * ```
     */
    forEach = new Block.Input<Record<string, string> | string[] | undefined>({ hclName: "for_each" });

    /**
     * Selects an alternate provider configuration for this import.
     *
     * By default, Terraform uses the default (un-aliased) provider. Use this when
     * the resource to import exists in a non-default provider configuration such as
     * a different region or account alias.
     *
     * @see https://developer.hashicorp.com/terraform/language/meta-arguments/provider
     *
     * @example
     * ```typescript
     * const awsEast = new Provider(this, "aws", { alias: "east", region: "us-east-1" });
     * provider: awsEast
     * ```
     */
    provider = new Block.Input<Provider | undefined>();
  };

  /**
   * Creates a new Import block.
   *
   * @param parent - The parent construct (typically a Stack)
   * @param inputs - Configuration properties for the import block
   *
   * @example
   * ```typescript
   * const instance = new Resource(this, "aws_instance", "web", { ami: "ami-12345678" });
   *
   * new Import(this, {
   *   to: instance,
   *   id: "i-096fba6d03d36d262",
   * });
   * ```
   */
  constructor(parent: Construct, inputs: Import["inputs"]) {
    super(parent, "import", [], inputs);
  }
}
