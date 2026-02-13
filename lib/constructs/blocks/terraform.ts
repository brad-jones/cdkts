import type { Construct } from "../construct.ts";
import { LocalBackend } from "./backends/local_backend.ts";
import { RemoteBackend } from "./backends/remote_backend.ts";
import { Block } from "./block.ts";

/**
 * Represents a Terraform/OpenTofu configuration block.
 *
 * The Terraform block configures overall behavior of Terraform/OpenTofu, including
 * version constraints, required providers, backend configuration, and experimental
 * features. Only constant values can be used within a Terraform block; references
 * to resources, variables, or data sources are not allowed.
 *
 * @see https://developer.hashicorp.com/terraform/language/settings
 *
 * @example
 * ```typescript
 * // Basic configuration with version and provider requirements
 * new Terraform(this, {
 *   requiredVersion: ">=1.0,<2.0",
 *   requiredProviders: {
 *     aws: {
 *       source: "hashicorp/aws",
 *       version: "~> 5.0",
 *     },
 *   },
 * });
 *
 * // Configuration with local backend
 * new Terraform(this, {
 *   requiredVersion: ">=1.0",
 *   requiredProviders: {
 *     local: {
 *       source: "hashicorp/local",
 *       version: "2.6.1",
 *     },
 *   },
 *   backend: {
 *     local: {
 *       path: "custom-terraform.tfstate",
 *     },
 *   },
 * });
 * ```
 */
export class Terraform extends Block<typeof Terraform> {
  /**
   * Configuration properties for a Terraform block.
   *
   * Defines the schema for Terraform/OpenTofu settings including version constraints,
   * provider requirements, backend configuration, and experimental features.
   */
  static override readonly Props = class extends Block.Props {
    /**
     * Specifies which version of the Terraform CLI is allowed to run the configuration.
     *
     * Accepts a version constraint string using operators like `=`, `!=`, `>`, `>=`,
     * `<`, `<=`, and `~>`. Multiple constraints can be combined with commas.
     *
     * @see https://developer.hashicorp.com/terraform/language/expressions/version-constraints
     *
     * @example
     * ```typescript
     * requiredVersion: ">=1.0,<2.0"
     * requiredVersion: "~> 1.5.0"
     * ```
     */
    requiredVersion = new Block.Input<string | undefined>({ hclName: "required_version" });

    /**
     * Specifies all provider plugins required to create and manage resources.
     *
     * Maps provider local names to their configuration, including source address
     * and version constraints. The source address format is `[hostname/]namespace/type`,
     * where hostname defaults to `registry.terraform.io` if omitted.
     *
     * @see https://developer.hashicorp.com/terraform/language/providers/requirements
     *
     * @example
     * ```typescript
     * requiredProviders: {
     *   aws: {
     *     source: "hashicorp/aws",
     *     version: "~> 5.0",
     *   },
     *   local: {
     *     source: "hashicorp/local",
     *     version: "2.6.1",
     *   },
     * }
     * ```
     */
    requiredProviders = new Block.Input<Record<string, { version: string; source: string }> | undefined>();

    /**
     * Specifies a mechanism for storing Terraform state files.
     *
     * Backends determine where state is stored and how operations are executed.
     * Only one backend may be configured per Terraform block.
     *
     * @see https://developer.hashicorp.com/terraform/language/settings/backends/configuration
     *
     * @example
     * ```typescript
     * // Local backend
     * backend: {
     *   local: {
     *     path: "terraform.tfstate",
     *   },
     * }
     *
     * // Remote backend
     * backend: {
     *   remote: {
     *     hostname: "app.terraform.io",
     *     organization: "my-org",
     *     workspaces: {
     *       name: "my-workspace",
     *     },
     *   },
     * }
     * ```
     */
    backend = new Block.Input<
      | Record<"local", LocalBackend["inputs"]>
      | Record<"remote", RemoteBackend["inputs"]>
      // TODO: Add support for all the other backend types: https://developer.hashicorp.com/terraform/language/settings/backends/configuration#backend-configuration-blocks
      | undefined
    >();

    /**
     * Specifies a list of experimental feature names to enable.
     *
     * Experimental features may have bugs or unexpected behavior and are subject
     * to change in future releases without warning. Use with caution in production.
     *
     * @see https://developer.hashicorp.com/terraform/language/settings#experimental-language-features
     *
     * @example
     * ```typescript
     * experiments: ["module_variable_optional_attrs"]
     * ```
     */
    experiments = new Block.Input<string[] | undefined>();

    // TODO: https://developer.hashicorp.com/terraform/language/settings/terraform-cloud
    // TODO: https://developer.hashicorp.com/terraform/language/providers/requirements#provider-meta
  };

  /**
   * Creates a new Terraform configuration block.
   *
   * @param parent - The parent construct to attach this Terraform block to
   * @param inputs - Configuration settings for the Terraform block
   * @param childBlocks - Optional callback to add additional child blocks
   */
  constructor(parent: Construct, inputs: Terraform["inputs"], childBlocks?: (b: Block) => void) {
    super(parent, "terraform", [], inputs, childBlocks);

    if (inputs?.requiredProviders) {
      new Block(this, "required_providers", [], inputs.requiredProviders);
    }

    if (inputs?.backend) {
      if ("local" in inputs.backend) {
        new LocalBackend(this, inputs.backend.local);
      } else if ("remote" in inputs.backend) {
        new RemoteBackend(this, inputs.backend.remote);
      }
    }
  }

  /**
   * Maps inputs for HCL generation by removing properties handled by child blocks.
   *
   * The `requiredProviders` and `backend` properties are converted to nested blocks
   * in the constructor, so they need to be excluded from the main block's inputs
   * to avoid duplication in the generated HCL.
   *
   * @returns The inputs object with backend and requiredProviders properties removed
   */
  protected override mapInputsForHcl() {
    const inputs = super.mapInputsForHcl();
    if (inputs) {
      delete inputs["backend"];
      delete inputs["requiredProviders"];
    }
    return inputs;
  }
}
