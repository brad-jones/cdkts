import type { Construct } from "../../construct.ts";
import { Block } from "../block.ts";

/**
 * Represents a Terraform/OpenTofu provider configuration block.
 *
 * Providers are plugins that Terraform uses to interact with cloud providers, SaaS
 * providers, and other APIs. A provider configuration specifies settings required to
 * authenticate and communicate with the provider's API, such as credentials, regions,
 * or endpoints.
 *
 * Multiple configurations of the same provider can be defined using the `alias` property,
 * allowing resources to use different settings (e.g., different regions or accounts).
 *
 * @template Self - The concrete provider class type (use `typeof YourProvider`)
 *
 * @see https://developer.hashicorp.com/terraform/language/providers/configuration
 * @also https://opentofu.org/docs/language/providers
 *
 * @example
 * ```typescript
 * // Basic provider configuration
 * const awsProvider = new Provider(this, "aws", {
 *   region: "us-west-2",
 *   access_key: "...",
 *   secret_key: "...",
 * });
 *
 * // Provider with alias for multiple configurations
 * const awsEast = new Provider(this, "aws", {
 *   alias: "east",
 *   region: "us-east-1",
 * });
 *
 * const awsWest = new Provider(this, "aws", {
 *   alias: "west",
 *   region: "us-west-2",
 * });
 *
 * // Use specific provider in a resource
 * new Resource(this, "aws_instance", "web_east", {
 *   provider: awsEast,
 *   ami: "ami-12345678",
 *   instance_type: "t2.micro",
 * });
 * ```
 */
export class Provider<Self = typeof Provider> extends Block<Self> {
  /**
   * Configuration properties for a Provider block.
   *
   * Defines the base schema for provider configuration. Concrete provider classes
   * typically extend this to add provider-specific settings.
   */
  static override readonly Props = class extends Block.Props {
    /**
     * An alternative name for this provider configuration.
     *
     * Use aliases to define multiple configurations of the same provider (e.g., different
     * regions, accounts, or credentials). Resources can then reference specific provider
     * configurations using the alias.
     *
     * @example
     * ```typescript
     * // Define two AWS providers for different regions
     * const primary = new Provider(this, "aws", {
     *   alias: "primary",
     *   region: "us-west-2",
     * });
     *
     * const secondary = new Provider(this, "aws", {
     *   alias: "secondary",
     *   region: "eu-west-1",
     * });
     *
     * // Use the aliased provider in a resource
     * new Resource(this, "aws_s3_bucket", "backup", {
     *   provider: secondary,
     *   bucket: "my-backup-bucket",
     * });
     * ```
     */
    alias = new Block.Input<string | undefined>();
  };

  /**
   * Creates a new Provider block.
   *
   * @param parent - The parent construct (typically a Stack)
   * @param providerName - The provider type (e.g., "aws", "google", "azurerm")
   * @param inputs - Configuration properties for the provider
   * @param childBlocks - Optional callback to define nested configuration blocks
   *
   * @example
   * ```typescript
   * // Simple provider
   * new Provider(this, "aws", {
   *   region: "us-west-2",
   * });
   *
   * // Provider with nested configuration
   * new Provider(this, "kubernetes", {
   *   host: "https://...",
   * }, (provider) => {
   *   new Block(provider, "exec", [], {
   *     api_version: "client.authentication.k8s.io/v1beta1",
   *     command: "aws",
   *     args: ["eks", "get-token", "--cluster-name", "my-cluster"],
   *   });
   * });
   * ```
   */
  constructor(
    parent: Construct,
    readonly providerName: string,
    inputs?: Provider["inputs"],
    childBlocks?: (b: Block) => void,
  ) {
    super(parent, "provider", [providerName], inputs, childBlocks);
  }

  /**
   * Returns the reference string for this provider.
   *
   * This reference can be used in resources, data sources, and actions to specify
   * which provider configuration to use.
   *
   * @returns The provider reference in the form `<providerName>.<alias>` if an alias is set.
   *
   * @example
   * ```typescript
   * const awsWest = new Provider(this, "aws", { alias: "west" });
   * // awsWest.ref returns "aws.west"
   * ```
   */
  override get ref() {
    return this.inputs?.alias ? `${this.providerName}.${this.inputs.alias}` : this.providerName;
  }
}
