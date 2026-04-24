import type { Construct } from "../construct.ts";
import { Block } from "./block.ts";
import type { Provider } from "./providers/provider.ts";

/**
 * Represents a Terraform/OpenTofu module block.
 *
 * The `module` block instructs Terraform to create resources defined in a local or
 * remote module. A module is a collection of multiple resources that Terraform manages
 * together. Module outputs are accessible via `module.<label>.<output>` references.
 *
 * @see https://developer.hashicorp.com/terraform/language/block/module
 *
 * @example
 * ```typescript
 * // Basic local module
 * new Module(this, "vpc", {
 *   source: "./modules/vpc",
 *   cidr_block: "10.0.0.0/16",
 * });
 *
 * // Registry module with version
 * const network = new Module(this, "network", {
 *   source: "hashicorp/consul/aws",
 *   version: "0.1.0",
 *   num_servers: 3,
 * });
 *
 * // Reference module outputs
 * new Resource(this, "aws_instance", "web", {
 *   subnet_id: network.outputs.subnet_id,
 * });
 *
 * // Module with provider pass-through
 * const awsWest = new Provider(this, "aws", { alias: "west", region: "us-west-2" });
 * new Module(this, "backend", {
 *   source: "./modules/backend",
 *   providers: { aws: awsWest },
 * });
 * ```
 */
export class Module extends Block<typeof Module> {
  /**
   * Configuration properties for a Module block.
   *
   * Defines the schema for module configuration including the module source,
   * version constraint, and standard meta-arguments. Module-specific inputs
   * (the child module's variables) are passed through as additional properties.
   */
  static override readonly Props = class extends Block.Props {
    /**
     * The location of the module source code.
     *
     * Can be a local path (`./modules/vpc`), a Terraform registry address
     * (`hashicorp/consul/aws`), a GitHub URL, a Git URL, or any other
     * supported module source type.
     *
     * This must be a literal string — template sequences and arbitrary
     * expressions are not supported.
     *
     * @see https://developer.hashicorp.com/terraform/language/block/module#source
     *
     * @example
     * ```typescript
     * source: "./modules/vpc"
     * source: "hashicorp/consul/aws"
     * source: "github.com/hashicorp/example"
     * ```
     */
    source = new Block.Input<string>();

    /**
     * A version constraint for modules installed from a registry.
     *
     * Only applicable to modules sourced from a Terraform registry.
     * Accepts version constraint syntax including operators like `=`, `!=`,
     * `>`, `>=`, `<`, `<=`, and `~>`.
     *
     * @see https://developer.hashicorp.com/terraform/language/block/module#version
     *
     * @example
     * ```typescript
     * version: "0.1.0"
     * version: "~> 1.0"
     * version: ">=1.0,<2.0"
     * ```
     */
    version = new Block.Input<string | undefined>();

    /**
     * Creates multiple instances of the module using a numeric count.
     *
     * Each instance is identified by its index, accessible via `count.index`.
     * Mutually exclusive with `forEach`.
     *
     * @see https://developer.hashicorp.com/terraform/language/block/module#count
     *
     * @example
     * ```typescript
     * new Module(this, "cluster", {
     *   source: "./modules/cluster",
     *   count: 3,
     * });
     * ```
     */
    count = new Block.Input<number | undefined>();

    /**
     * Creates multiple instances of the module by iterating over a collection.
     *
     * Accepts a map (key → value) or a set of strings. Each instance is
     * identified by its key, accessible via `each.key` and `each.value`.
     * Mutually exclusive with `count`.
     *
     * @see https://developer.hashicorp.com/terraform/language/block/module#for_each
     *
     * @example
     * ```typescript
     * new Module(this, "bucket", {
     *   source: "./modules/bucket",
     *   forEach: { staging: "bucket-staging", prod: "bucket-prod" },
     * });
     * ```
     */
    forEach = new Block.Input<Record<string, string> | string[] | undefined>({ hclName: "for_each" });

    /**
     * Establishes explicit dependencies between the module and other resources.
     *
     * By default, Terraform infers dependencies from attribute references.
     * Use `dependsOn` to create explicit dependencies when implicit ones
     * are insufficient.
     *
     * @see https://developer.hashicorp.com/terraform/language/block/module#depends_on
     *
     * @example
     * ```typescript
     * new Module(this, "app", {
     *   source: "./modules/app",
     *   dependsOn: [vpcResource, securityGroupResource],
     * });
     * ```
     */
    dependsOn = new Block.Input<Block[] | undefined>({ hclName: "depends_on" });

    /**
     * Passes provider configurations to the child module.
     *
     * @see https://developer.hashicorp.com/terraform/language/block/module#providers
     *
     * @example
     * ```typescript
     * const awsWest = new Provider(this, "aws", { alias: "west", region: "us-west-2" });
     * new Module(this, "backend", {
     *   source: "./modules/backend",
     *   providers: { aws: awsWest },
     * });
     * ```
     */
    providers = new Block.Input<Record<string, Provider> | undefined>();
  };

  /**
   * Creates a new Module block.
   *
   * @param parent - The parent construct (typically a Stack)
   * @param label - The local name for the module (used in `module.<label>.<output>` references)
   * @param inputs - Configuration including source, version, meta-arguments, and module-specific variables
   * @param childBlocks - Optional callback for defining nested blocks within the module
   *
   * @example
   * ```typescript
   * // Simple local module
   * new Module(this, "vpc", {
   *   source: "./modules/vpc",
   *   cidr_block: "10.0.0.0/16",
   * });
   *
   * // Registry module with version and count
   * new Module(this, "worker", {
   *   source: "hashicorp/consul/aws",
   *   version: "0.1.0",
   *   count: 3,
   * });
   * ```
   */
  constructor(
    parent: Construct,
    readonly label: string,
    inputs: Module["inputs"],
    childBlocks?: (b: Block) => void,
  ) {
    super(parent, "module", [label], inputs, childBlocks);
  }
}
