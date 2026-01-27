import type { Construct } from "../construct.ts";
import { Block } from "./block.ts";

/**
 * @see https://developer.hashicorp.com/terraform/language/block/variable
 */
export class Variable extends Block<typeof Variable> {
  static override readonly Props = class extends Block.Props {
    type = new Block.Input<string | undefined>();
    default = new Block.Input<string | undefined>();
    description = new Block.Input<string | undefined>();
    sensitive = new Block.Input<boolean | undefined>();
    ephemeral = new Block.Input<boolean | undefined>();
    nullable = new Block.Input<boolean | undefined>();
    validations = new Block.Input<
      {
        condition: string;
        errorMessage: string;
      }[] | undefined
    >();
  };

  override get ref() {
    return `var.${this.label}`;
  }

  constructor(parent: Construct, readonly label: string, inputs?: Variable["inputs"]) {
    super(parent, "variable", [label], inputs);

    for (const validation of inputs?.validations ?? []) {
      new Block(this, "validation", [], {
        condition: validation.condition,
        error_message: validation.errorMessage,
      });
    }
  }

  protected override mapInputsForHcl(): unknown {
    const inputs = this.inputs;
    if (inputs) {
      delete inputs["validations"];
    }
    return inputs;
  }
}
