import type { Construct } from "../../../construct.ts";
import { Block } from "../../block.ts";
import type { Provider } from "../../providers/provider.ts";

export class EphemeralResource<Self = typeof EphemeralResource> extends Block<Self> {
  static override readonly Props = class extends Block.Props {
    count = new Block.Input<number | undefined>();
    dependsOn = new Block.Input<string[] | undefined>();
    forEach = new Block.Input<Record<string, string> | string[] | undefined>();
    provider = new Block.Input<Provider | undefined>();
    lifecycles = new Block.Input<{ when: "pre" | "post"; condition: string; errorMessage: string }[] | undefined>();
  };

  constructor(
    parent: Construct,
    readonly typeName: string,
    readonly label: string,
    inputs: EphemeralResource["inputs"],
    childBlocks?: (b: Block) => void,
  ) {
    super(parent, "ephemeral", [typeName, label], inputs, childBlocks);

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

  protected override mapInputsForHcl(): unknown {
    const inputs = { ...this.inputs };
    delete inputs["lifecycles"];
    return inputs;
  }
}
