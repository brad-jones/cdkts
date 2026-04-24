import type { Construct } from "../construct.ts";
import { RawHcl } from "../rawhcl.ts";
import { Block } from "./block.ts";

/**
 * Represents a Terraform/OpenTofu `moved` block.
 *
 * The `moved` block instructs Terraform to treat an existing object at the `from`
 * address as if it were originally created at the `to` address. This lets you
 * rename resources, move them into or out of child modules, and enable `count`
 * or `for_each` — all without destroying and recreating infrastructure.
 *
 * @see https://developer.hashicorp.com/terraform/language/block/moved
 *
 * @example
 * ```typescript
 * // Rename a resource
 * const instance = new Resource(this, "aws_instance", "web", { ami: "ami-123" });
 *
 * new Moved(this, {
 *   from: "aws_instance.old_name",
 *   to: instance,
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Rename a module
 * const network = new Module(this, "network", { source: "./modules/network" });
 *
 * new Moved(this, {
 *   from: "module.vpc",
 *   to: network,
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Move a resource between modules (both as string addresses)
 * new Moved(this, {
 *   from: "module.old.aws_instance.example",
 *   to: "module.new.aws_instance.example",
 * });
 * ```
 */
export class Moved extends Block<typeof Moved> {
  /**
   * Configuration properties for a Moved block.
   *
   * Defines the schema for the moved block, specifying the previous and new
   * addresses for a resource or module in Terraform state.
   */
  static override readonly Props = class extends Block.Props {
    /**
     * The previous address of the resource or module.
     *
     * Typically a string representing the old Terraform address that no longer
     * has a corresponding block in the configuration. Can also be a `Block`
     * reference when the old resource still exists temporarily.
     *
     * String values are serialized as unquoted HCL reference expressions.
     *
     * @example
     * ```typescript
     * from: "aws_instance.old_name"
     * from: "module.old_vpc"
     * from: "module.old.aws_instance.example"
     * ```
     */
    // deno-lint-ignore no-explicit-any
    from = new Block.Input<Block<any> | string>();

    /**
     * The new address to relocate the resource or module to.
     *
     * Typically a `Block` reference to the resource or module construct at
     * the new address. Can also be a string for cross-module addresses or
     * other cases where a direct construct reference is not available.
     *
     * String values are serialized as unquoted HCL reference expressions.
     *
     * @example
     * ```typescript
     * to: myResourceInstance   // produces: to = resource.aws_instance.web
     * to: myModuleInstance     // produces: to = module.network
     * to: "module.new.aws_instance.example"
     * ```
     */
    // deno-lint-ignore no-explicit-any
    to = new Block.Input<Block<any> | string>();
  };

  /**
   * Creates a new Moved block.
   *
   * @param parent - The parent construct (typically a Stack)
   * @param inputs - Configuration properties for the moved block
   *
   * @example
   * ```typescript
   * const instance = new Resource(this, "aws_instance", "web", { ami: "ami-123" });
   *
   * new Moved(this, {
   *   from: "aws_instance.old_name",
   *   to: instance,
   * });
   * ```
   */
  constructor(parent: Construct, inputs: Moved["inputs"]) {
    super(parent, "moved", [], inputs);
  }

  /**
   * Maps inputs for HCL generation.
   *
   * Wraps string addresses in `RawHcl` so they are serialized as unquoted
   * reference expressions in the generated HCL output.
   *
   * @returns The transformed input object for HCL serialization
   * @internal
   */
  protected override mapInputsForHcl(): unknown {
    const inputs = super.mapInputsForHcl();
    if (typeof inputs.from === "string") {
      inputs.from = new RawHcl(inputs.from);
    }
    if (typeof inputs.to === "string") {
      inputs.to = new RawHcl(inputs.to);
    }
    return inputs;
  }
}
