import type { Construct } from "../../../construct.ts";
import { Block } from "../../block.ts";
import type { Provider } from "../../providers/provider.ts";

/**
 * Represents an OpenTofu/Terraform ephemeral resource.
 *
 * Ephemeral resources are temporary resources that exist only during a Terraform plan or apply
 * operation. They are useful for generating temporary credentials, creating short-lived tokens,
 * or managing resources that don't need to persist in state. Unlike regular resources, ephemeral
 * resources are not stored in the Terraform state file after the operation completes.
 *
 * @template Self - The concrete class type extending EphemeralResource, typically `typeof ClassName`
 *
 * @example
 * ```typescript
 * // Define a custom ephemeral resource
 * class TempToken extends EphemeralResource<typeof TempToken> {
 *   static override readonly Props = class extends EphemeralResource.Props {
 *     duration = new EphemeralResource.Input<string>();
 *     token = new EphemeralResource.Output<string>();
 *   };
 *
 *   constructor(parent: Construct, label: string, inputs: TempToken["inputs"]) {
 *     super(parent, "provider_temp_token", label, inputs);
 *   }
 * }
 * ```
 *
 * @see https://developer.hashicorp.com/terraform/language/block/ephemeral
 * @also https://opentofu.org/docs/language/ephemerality/ephemeral-resources/
 */
export class EphemeralResource<Self = typeof EphemeralResource> extends Block<Self> {
  /**
   * Defines the input and output properties for an ephemeral resource.
   *
   * This class extends Block.Props and adds meta-arguments specific to ephemeral resources.
   */
  static override readonly Props = class extends Block.Props {
    /** The number of resource instances to create. When set, creates multiple instances. */
    count = new Block.Input<number | undefined>();

    /** List of construct IDs that this resource depends on. Ensures proper ordering. */
    dependsOn = new Block.Input<Block[] | undefined>({ hclName: "depends_on" });

    /** Iterate over a collection to create multiple instances with different configurations. */
    forEach = new Block.Input<Record<string, string> | string[] | undefined>({ hclName: "for_each" });

    /** The provider instance to use for this resource. Overrides the default provider. */
    provider = new Block.Input<Provider | undefined>();

    /**
     * Lifecycle conditions (preconditions and postconditions) for the ephemeral resource.
     * Each condition includes when it should be evaluated, the condition expression, and an error message.
     */
    lifecycles = new Block.Input<{ when: "pre" | "post"; condition: string; errorMessage: string }[] | undefined>();
  };

  /**
   * Creates a new ephemeral resource block.
   *
   * @param parent - The parent construct (typically a Stack)
   * @param typeName - The fully qualified resource type (e.g., "provider_resource_type")
   * @param label - The local identifier for this resource instance
   * @param inputs - The input properties for the resource
   * @param childBlocks - Optional function to define nested child blocks
   */
  constructor(
    parent: Construct,
    readonly typeName: string,
    readonly label: string,
    inputs: EphemeralResource["inputs"],
    childBlocks?: (b: Block) => void,
  ) {
    const ephemeralResourceId = parent.parent ? `${parent.id}_${label}` : label;
    super(parent, "ephemeral", [typeName, ephemeralResourceId], inputs, childBlocks);

    if (inputs?.lifecycles && inputs.lifecycles.length > 0) {
      new Block(this, "lifecycle", [], {}, (b) => {
        for (const lifecycle of inputs!.lifecycles!) {
          new Block(b, `${lifecycle.when}condition`, [], {
            condition: lifecycle.condition,
            error_message: lifecycle.errorMessage,
          });
        }
      });
    }
  }

  /**
   * Maps inputs for HCL generation, excluding lifecycle inputs that are handled separately.
   *
   * This method removes the `lifecycles` property from the inputs since it's processed
   * and converted into nested lifecycle blocks by the constructor.
   *
   * @returns The inputs object without the lifecycles property
   */
  protected override mapInputsForHcl(): unknown {
    const inputs = super.mapInputsForHcl();
    delete inputs["lifecycles"];
    return inputs;
  }
}
