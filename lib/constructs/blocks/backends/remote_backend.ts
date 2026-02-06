import type { Construct } from "../../construct.ts";
import { Backend } from "./backend.ts";

/**
 * Remote backend configuration for storing Terraform/OpenTofu state in HCP Terraform (formerly Terraform Cloud).
 *
 * The remote backend stores state in HCP Terraform, supports remote operations,
 * and provides features like workspace management, run history, and team collaboration.
 * It enables secure, centralized state management with built-in locking and versioning.
 *
 * This backend can be configured to work with a single workspace or multiple workspaces
 * using a naming prefix. All configuration properties are optional to allow for CLI-based
 * configuration via `terraform login` or environment variables.
 *
 * @see https://developer.hashicorp.com/terraform/language/backend/remote
 *
 * @example
 * ```typescript
 * // Single workspace configuration
 * new RemoteBackend(terraform, {
 *   organization: "my-org",
 *   workspaces: [{ name: "my-workspace" }],
 * });
 *
 * // Multiple workspaces with prefix
 * new RemoteBackend(terraform, {
 *   organization: "my-org",
 *   workspaces: [{ prefix: "my-app-" }],
 * });
 *
 * // Minimal configuration (relies on CLI authentication)
 * new RemoteBackend(terraform);
 * ```
 */
export class RemoteBackend extends Backend<typeof RemoteBackend> {
  /**
   * Configuration properties for the remote backend.
   *
   * All properties are optional to support CLI-based configuration where values
   * are provided through `terraform login`, environment variables, or interactive
   * prompts. However, when provided through code, Terraform will validate the
   * configuration according to the requirements documented for each property.
   *
   * @see https://developer.hashicorp.com/terraform/language/backend/remote#using-cli-input
   *
   * @example
   * ```hcl
   * # Equivalent HCL for minimal configuration
   * terraform {
   *   required_version = "~> 0.12.0"
   *   backend "remote" {}
   * }
   * ```
   */
  static override readonly Props = class extends Backend.Props {
    /**
     * (Optional) The remote backend hostname to connect to.
     *
     * Defaults to app.terraform.io.
     */
    hostname = new Backend.Input<string | undefined>();

    /**
     * (Required) The name of the organization containing the targeted workspace(s).
     */
    organization = new Backend.Input<string | undefined>();

    /**
     * (Optional) The token used to authenticate with the remote backend.
     *
     * We recommend omitting the token from the configuration,
     * and instead using terraform login or manually configuring
     * credentials in the CLI config file.
     */
    token = new Backend.Input<string | undefined>();

    /**
     * (Required) A block specifying which remote workspace(s) to use.
     */
    workspaces = new Backend.Input<
      {
        /**
         * (Optional) The full name of one remote workspace.
         * When configured, only the default workspace can be used.
         * This option conflicts with prefix.
         */
        name?: string;

        /**
         * (Optional) A prefix used in the names of one or more remote workspaces,
         * all of which can be used with this configuration.
         *
         * The full workspace names are used in HCP Terraform, and the short names
         * (minus the prefix) are used on the command line for Terraform CLI workspaces.
         *
         * If omitted, only the default workspace can be used.
         *
         * This option conflicts with name.
         */
        prefix: string;
      }[] | undefined
    >();
  };

  /**
   * Creates a new remote backend configuration block.
   *
   * @param parent - The parent construct (typically a Terraform block)
   * @param inputs - Optional configuration properties for the remote backend.
   *                 Can be omitted to rely on CLI-based configuration.
   */
  constructor(parent: Construct, inputs?: RemoteBackend["inputs"]) {
    super(parent, "remote", inputs);
  }
}
