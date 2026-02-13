import type { Construct } from "../../construct.ts";
import { Backend } from "./backend.ts";

/**
 * Local backend configuration for storing Terraform/OpenTofu state on the local filesystem.
 *
 * The local backend stores state on the local filesystem, locks that state using
 * system APIs, and performs operations locally. This is the default backend used
 * when no backend configuration is specified.
 *
 * The local backend is suitable for development environments and small teams where
 * shared state storage is not required. For production environments with multiple
 * team members, consider using a remote backend that supports locking and versioning.
 *
 * @see https://developer.hashicorp.com/terraform/language/backend/local
 *
 * @example
 * ```typescript
 * // Using default local backend
 * new LocalBackend(terraform);
 *
 * // Specifying a custom state file path
 * new LocalBackend(terraform, {
 *   path: "custom-terraform.tfstate",
 * });
 *
 * // Configuring workspace directory
 * new LocalBackend(terraform, {
 *   path: "terraform.tfstate",
 *   workspaceDir: "terraform-workspaces",
 * });
 * ```
 */
export class LocalBackend extends Backend<typeof LocalBackend> {
  static override readonly Props = class extends Backend.Props {
    /**
     * (Optional) The path to the tfstate file.
     * This defaults to "terraform.tfstate" relative to the root module by default.
     */
    path = new Backend.Input<string | undefined>();

    /**
     * (Optional) The path to non-default workspaces.
     */
    workspaceDir = new Backend.Input<string | undefined>({ hclName: "workspace_dir" });
  };

  /**
   * Creates a new local backend configuration block.
   *
   * @param parent - The parent construct (typically a Terraform block)
   * @param inputs - Optional configuration inputs for the local backend
   */
  constructor(parent: Construct, inputs?: LocalBackend["inputs"]) {
    super(parent, "local", inputs);
  }
}
