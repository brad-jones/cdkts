import type { Construct } from "../construct.ts";
import { RawHcl } from "../rawhcl.ts";
import { Block } from "./block.ts";
import type { Connection, RemovedProvisioner } from "./provisioning.ts";
import { buildConnectionBlock, buildProvisionerBlocks } from "./provisioning.ts";

/**
 * Represents a Terraform/OpenTofu `removed` block.
 *
 * The `removed` block instructs Terraform to stop managing an existing resource
 * without keeping the original `resource` block in configuration. When `destroy`
 * is `true` (the default), Terraform also destroys the underlying infrastructure.
 * When `destroy` is `false`, the resource is only removed from state, leaving
 * the real infrastructure intact.
 *
 * @see https://developer.hashicorp.com/terraform/language/block/removed
 *
 * @example
 * ```typescript
 * // Remove a resource and destroy the infrastructure (default)
 * new Removed(this, {
 *   from: "aws_instance.old_server",
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Remove a resource from state without destroying it
 * new Removed(this, {
 *   from: "aws_s3_bucket.legacy",
 *   destroy: false,
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Remove using a Block reference
 * const instance = new Resource(this, "aws_instance", "web", { ami: "ami-123" });
 *
 * new Removed(this, {
 *   from: instance,
 *   destroy: false,
 * });
 * ```
 */
export class Removed extends Block<typeof Removed> {
  /**
   * Configuration properties for a Removed block.
   *
   * Defines the schema for the removed block, specifying the resource address
   * to remove and whether to destroy the underlying infrastructure.
   */
  static override readonly Props = class extends Block.Props {
    /**
     * The address of the resource to remove from Terraform state.
     *
     * Typically a string representing the Terraform resource address that no
     * longer has a corresponding `resource` block in the configuration. Can
     * also be a `Block` reference when the resource still exists temporarily.
     *
     * String values are serialized as unquoted HCL reference expressions.
     *
     * @example
     * ```typescript
     * from: "aws_instance.old_server"
     * from: "module.old.aws_s3_bucket.data"
     * from: myResourceInstance
     * ```
     */
    // deno-lint-ignore no-explicit-any
    from = new Block.Input<Block<any> | string>();

    /**
     * Whether to destroy the underlying infrastructure when removing from state.
     *
     * When `true` (the default), Terraform removes the resource from state and
     * destroys the actual infrastructure. When `false`, Terraform only removes
     * the resource from state, leaving the real infrastructure intact. This is
     * useful for handing off management to another tool or team.
     *
     * @default true
     *
     * @example
     * ```typescript
     * destroy: false  // keep the infrastructure, just stop managing it
     * ```
     */
    destroy = new Block.Input<boolean | undefined>();

    /**
     * Default connection settings for all provisioners defined on this removed block.
     *
     * Provisioners can override these settings with their own `connection` block.
     *
     * @see https://developer.hashicorp.com/terraform/language/block/removed#connection
     *
     * @example
     * ```typescript
     * new Removed(this, {
     *   from: "aws_instance.old_server",
     *   connection: {
     *     type: "ssh",
     *     host: "10.0.0.1",
     *     user: "root",
     *   },
     * });
     * ```
     */
    connection = new Block.Input<Connection | undefined>();

    /**
     * Provisioners to run during destroy.
     *
     * Only `local-exec` and `remote-exec` are supported (no `file` provisioner).
     * The `when` argument is required and must be `"destroy"`.
     *
     * @see https://developer.hashicorp.com/terraform/language/block/removed#provisioner
     *
     * @example
     * ```typescript
     * new Removed(this, {
     *   from: "aws_instance.old_server",
     *   provisioners: [
     *     {
     *       type: "local-exec",
     *       when: "destroy",
     *       command: "echo 'Destroying old server'",
     *     },
     *   ],
     * });
     * ```
     */
    provisioners = new Block.Input<RemovedProvisioner[] | undefined>();
  };

  /**
   * Creates a new Removed block.
   *
   * @param parent - The parent construct (typically a Stack)
   * @param inputs - Configuration properties for the removed block
   *
   * @example
   * ```typescript
   * new Removed(this, {
   *   from: "aws_instance.old_server",
   *   destroy: false,
   * });
   * ```
   */
  constructor(parent: Construct, inputs: Removed["inputs"]) {
    super(parent, "removed", [], inputs);

    const destroy = inputs?.destroy ?? true;
    new Block(this, "lifecycle", [], { destroy });

    if (inputs?.connection) {
      buildConnectionBlock(this, inputs.connection);
    }

    if (inputs?.provisioners && inputs.provisioners.length > 0) {
      buildProvisionerBlocks(this, inputs.provisioners);
    }
  }

  /**
   * Maps inputs for HCL generation.
   *
   * Wraps string addresses in `RawHcl` so they are serialized as unquoted
   * reference expressions in the generated HCL output. Strips the `destroy`
   * property since it is handled by the child lifecycle block.
   *
   * @returns The transformed input object for HCL serialization
   * @internal
   */
  protected override mapInputsForHcl(): unknown {
    const inputs = super.mapInputsForHcl();
    if (typeof inputs.from === "string") {
      inputs.from = new RawHcl(inputs.from);
    }
    delete inputs["destroy"];
    delete inputs["connection"];
    delete inputs["provisioners"];
    return inputs;
  }
}
