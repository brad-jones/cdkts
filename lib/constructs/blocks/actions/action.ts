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
    forEach = new Block.Input<Record<string, string> | string[] | undefined>();

    /**
     * The provider argument instructs Terraform to use an alternate provider
     * configuration to invoke the action.
     *
     * @see https://developer.hashicorp.com/terraform/language/block/action#provider
     */
    provider = new Block.Input<Provider | undefined>();
  };

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

  protected override mapInputsForHcl(): unknown {
    const inputs = { ...this.inputs };
    delete inputs["config"];
    return inputs;
  }
}
