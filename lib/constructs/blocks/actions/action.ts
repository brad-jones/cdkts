// deno-lint-ignore-file no-explicit-any

import type { Construct } from "../../construct.ts";
import { Block } from "../block.ts";
import type { Provider } from "../providers/provider.ts";

/**
 * The action block specifies a provider-defined action that you can invoke
 * using the Terraform CLI or during an apply operation.
 *
 * Actions are preset operations built into providers that you can invoke to
 * trigger automations outside of Terraform, such as Ansible playbooks and
 * Lambda jobs.
 *
 * @see https://developer.hashicorp.com/terraform/language/block/action
 *
 * _NB: Unsupported by OpenTofu <https://github.com/opentofu/opentofu/issues/3309>_
 */
export class Action<Self = typeof Action> extends Block<Self> {
  static override readonly Props = class extends Block.Props {
    /**
     * The config block sets values for arguments or nested blocks defined by the provider.
     *
     * @see: https://developer.hashicorp.com/terraform/language/block/action#config
     */
    config = new Block.Input<any>();

    /**
     * The count meta-argument instructs Terraform to invoke an action multiple
     * times using the same configuration.
     *
     * @see https://developer.hashicorp.com/terraform/language/block/action#count
     */
    count = new Block.Input<number | undefined>();

    /**
     * The for_each meta-argument instructs Terraform to invoke the action once
     * for each member of a list or key-value pair in a map.
     *
     * @see https://developer.hashicorp.com/terraform/language/block/action#for_each
     */
    forEach = new Block.Input<Record<string, string> | string[] | undefined>({ hclName: "for_each" });

    /**
     * The provider argument instructs Terraform to use an alternate provider
     * configuration to invoke the action.
     *
     * @see https://developer.hashicorp.com/terraform/language/block/action#provider
     */
    provider = new Block.Input<Provider | undefined>();
  };

  /**
   * Creates a new Action block.
   *
   * @param parent - The parent construct that will contain this action
   * @param typeName - The provider-specific action type (e.g., "denobridge_action")
   * @param label - A unique identifier for this action instance within its parent scope
   * @param inputs - Configuration inputs for the action, including config, count, forEach, and provider
   * @param childBlocks - Optional callback to define additional nested blocks within the action
   *
   * @example
   * ```typescript
   * new Action(stack, "my_provider_action", "my_action", {
   *   config: { key: "value" },
   *   count: 3,
   * });
   * ```
   */
  constructor(
    parent: Construct,
    readonly typeName: string,
    readonly label: string,
    inputs: Action["inputs"],
    childBlocks?: (b: Block) => void,
  ) {
    super(parent, "action", [typeName, label], inputs, childBlocks);
    new Block(this, "config", [], inputs!.config);
  }

  /**
   * Maps action inputs to HCL format by filtering out the config input.
   *
   * The config input is handled separately as a nested block rather than
   * an inline property, so it must be excluded from the main inputs object
   * during HCL serialization.
   *
   * @returns The inputs object without the config property
   */
  protected override mapInputsForHcl(): unknown {
    const inputs = super.mapInputsForHcl();
    delete inputs["config"];
    return inputs;
  }
}
