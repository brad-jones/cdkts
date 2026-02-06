import type { Construct } from "../../construct.ts";
import { Block } from "../block.ts";

/**
 * Base class for Terraform/OpenTofu backend configurations.
 *
 * Backends determine where Terraform/OpenTofu state is stored and how operations
 * (plan, apply, etc.) are executed. Each backend type (local, remote, s3, etc.)
 * extends this class to provide type-specific configuration and behavior.
 *
 * Only one backend can be configured per Terraform block. State stored in backends
 * enables collaboration, remote execution, and secure storage of sensitive data.
 *
 * @template Self - The concrete backend class type extending Backend, typically `typeof ClassName`
 *
 * @see https://developer.hashicorp.com/terraform/language/backend
 *
 * @example
 * ```typescript
 * // Custom backend implementation
 * class S3Backend extends Backend<typeof S3Backend> {
 *   static override readonly Props = class extends Backend.Props {
 *     bucket = new Backend.Input<string>();
 *     key = new Backend.Input<string>();
 *     region = new Backend.Input<string | undefined>();
 *   };
 *
 *   constructor(parent: Construct, inputs?: S3Backend["inputs"]) {
 *     super(parent, "s3", inputs);
 *   }
 * }
 *
 * // Usage in Terraform block
 * new S3Backend(terraform, {
 *   bucket: "my-terraform-state",
 *   key: "path/to/state.tfstate",
 *   region: "us-west-2",
 * });
 * ```
 */
export class Backend<Self = typeof Backend> extends Block<Self> {
  /**
   * Creates a new backend configuration block.
   *
   * @param parent - The parent construct (typically a Terraform block)
   * @param backendType - The backend type identifier (e.g., "local", "remote", "s3")
   * @param inputs - Optional configuration inputs specific to the backend type
   * @param childBlocks - Optional callback function to add nested child blocks
   */
  constructor(
    parent: Construct,
    readonly backendType: string,
    inputs?: Backend["inputs"],
    childBlocks?: (b: Block) => void,
  ) {
    super(parent, "backend", [backendType], inputs, childBlocks);
  }
}
