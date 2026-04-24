import type { Construct } from "../construct.ts";
import { Block } from "./block.ts";

/**
 * Represents a Terraform/OpenTofu `cloud` block for connecting to HCP Terraform or Terraform Enterprise.
 *
 * The `cloud` block configures the connection between a local Terraform/OpenTofu working
 * directory and HCP Terraform (formerly Terraform Cloud) or a Terraform Enterprise installation.
 * It enables remote state storage, remote execution, and workspace management features.
 *
 * The `cloud` block is **mutually exclusive** with the `backend` block — only one of the
 * two can be configured per `terraform` block. The `cloud` block cannot refer to named
 * values such as input variables, locals, or data source attributes.
 *
 * @see https://developer.hashicorp.com/terraform/language/block/terraform#cloud
 *
 * @example
 * ```typescript
 * // Connect to HCP Terraform with a named workspace
 * new Cloud(terraform, {
 *   organization: "my-org",
 *   workspaces: { name: "my-workspace" },
 * });
 *
 * // Connect using workspace tags
 * new Cloud(terraform, {
 *   organization: "my-org",
 *   workspaces: { tags: ["app", "production"] },
 * });
 *
 * // Connect to Terraform Enterprise
 * new Cloud(terraform, {
 *   organization: "my-org",
 *   hostname: "terraform.example.com",
 *   workspaces: { name: "my-workspace" },
 * });
 *
 * // Minimal configuration (relies on environment variables)
 * new Cloud(terraform, {});
 * ```
 */
export class Cloud extends Block<typeof Cloud> {
  /**
   * Configuration properties for the `cloud` block.
   *
   * All properties are optional to support configuration via environment
   * variables (`TF_CLOUD_ORGANIZATION`, `TF_CLOUD_HOSTNAME`, `TF_WORKSPACE`,
   * `TF_CLOUD_PROJECT`). When provided through code, Terraform validates the
   * configuration according to the requirements documented for each property.
   */
  static override readonly Props = class extends Block.Props {
    /**
     * The name of the HCP Terraform or Terraform Enterprise organization to connect to.
     *
     * Can alternatively be set via the `TF_CLOUD_ORGANIZATION` environment variable.
     * Required when connecting to HCP Terraform unless provided by environment variable.
     *
     * @see https://developer.hashicorp.com/terraform/language/block/terraform#organization
     */
    organization = new Block.Input<string | undefined>();

    /**
     * The hostname of a Terraform Enterprise installation.
     *
     * Can alternatively be set via the `TF_CLOUD_HOSTNAME` environment variable.
     * Defaults to `app.terraform.io` (HCP Terraform) when omitted.
     *
     * @see https://developer.hashicorp.com/terraform/language/block/terraform#hostname
     */
    hostname = new Block.Input<string | undefined>();

    /**
     * A token for authenticating with HCP Terraform or Terraform Enterprise.
     *
     * It is recommended to omit the token from configuration and instead
     * use `terraform login` or manually configure credentials in the
     * CLI configuration file.
     *
     * @see https://developer.hashicorp.com/terraform/language/block/terraform#token
     */
    token = new Block.Input<string | undefined>();

    /**
     * Metadata for matching workspaces in HCP Terraform.
     *
     * Specifies which workspace(s) to associate with this configuration.
     * The `name` and `tags` attributes are mutually exclusive.
     *
     * Can alternatively be configured via the `TF_WORKSPACE` (for `name`)
     * and `TF_CLOUD_PROJECT` (for `project`) environment variables.
     *
     * @see https://developer.hashicorp.com/terraform/language/block/terraform#workspaces
     *
     * @example
     * ```typescript
     * // Single named workspace
     * workspaces: { name: "my-workspace" }
     *
     * // Tag-based workspace matching
     * workspaces: { tags: ["app", "production"] }
     *
     * // With project scoping
     * workspaces: { tags: ["app"], project: "my-project" }
     * ```
     */
    workspaces = new Block.Input<
      | {
        /**
         * The full name of a single HCP Terraform workspace.
         * Mutually exclusive with `tags`.
         */
        name?: string;

        /**
         * A list of tag values to match against HCP Terraform workspaces.
         * All matching workspaces can be used with this configuration.
         * Mutually exclusive with `name`.
         */
        tags?: string[];

        /**
         * The name of an HCP Terraform project.
         * Terraform creates all workspaces that use this configuration in the specified project.
         */
        project?: string;
      }
      | undefined
    >();
  };

  /**
   * Creates a new `cloud` configuration block.
   *
   * @param parent - The parent construct (typically a Terraform block)
   * @param inputs - Configuration properties for the cloud block.
   *                 Can be empty to rely on environment variable configuration.
   */
  constructor(parent: Construct, inputs?: Cloud["inputs"]) {
    super(parent, "cloud", [], inputs);

    if (inputs?.workspaces) {
      new Block(this, "workspaces", [], inputs.workspaces);
    }
  }

  /**
   * Maps inputs for HCL generation by removing properties handled by child blocks.
   *
   * The `workspaces` property is converted to a nested block in the constructor,
   * so it needs to be excluded from the main block's inputs to avoid duplication
   * in the generated HCL.
   *
   * @returns The inputs object with workspaces removed
   */
  protected override mapInputsForHcl() {
    const inputs = super.mapInputsForHcl();
    if (inputs) {
      delete inputs["workspaces"];
    }
    return inputs;
  }
}
