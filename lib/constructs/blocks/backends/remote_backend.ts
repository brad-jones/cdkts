import type { Construct } from "../../construct.ts";
import type { Input } from "../../input_output/types.ts";
import { Backend } from "./backend.ts";

/**
 * @see https://developer.hashicorp.com/terraform/language/backend/remote
 */
export class RemoteBackend extends Backend<typeof RemoteBackend> {
  /**
   * _NB: All properties are optional here to allow for configurations that read
   * everything from the CLI but regardless of how the data is given to terraform,
   * it will be validated as per the hints in the comments._
   *
   * ```hcl
   * # main.tf
   * terraform {
   *   required_version = "~> 0.12.0"
   *   backend "remote" {}
   * }
   * ```
   *
   * @see: https://developer.hashicorp.com/terraform/language/backend/remote#using-cli-input
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

  constructor(parent: Construct, inputs?: RemoteBackend["inputs"]) {
    super(parent, "remote", inputs);
  }
}
