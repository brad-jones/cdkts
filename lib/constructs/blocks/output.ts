import type { Construct } from "../construct.ts";
import { Block } from "./block.ts";

/**
 * @see https://developer.hashicorp.com/terraform/language/block/output
 */
export class Output extends Block<typeof Output> {
  static override readonly Props = class extends Block.Props {
    value = new Block.Input<any>();
    description = new Block.Input<string | undefined>();
    sensitive = new Block.Input<boolean | undefined>();
    ephemeral = new Block.Input<boolean | undefined>();
    dependsOn = new Block.Input<string[] | undefined>();
    preconditions = new Block.Input<
      {
        condition: string;
        errorMessage: string;
      }[] | undefined
    >();
  };

  constructor(parent: Construct, label: string, inputs: Output["inputs"]) {
    super(parent, "output", [label], inputs);

    for (const precondition of inputs?.preconditions ?? []) {
      new Block(this, "precondition", [], {
        condition: precondition.condition,
        error_message: precondition.errorMessage,
      });
    }
  }

  protected override mapInputsForHcl(): unknown {
    const inputs = this.inputs;
    if (inputs) {
      delete inputs["preconditions"];
    }
    return inputs;
  }
}
