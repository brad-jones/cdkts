import { Construct } from "../../construct.ts";
import { Block } from "../block.ts";
import { Provider } from "../providers/provider.ts";

export interface DataSourceInputs {
  count?: number;
  depends_on?: string[];
  forEach?: Record<string, string> | string[];
  provider?: Provider;
  lifecycles?: { when: "pre" | "post"; condition: string; errorMessage: string }[];
  [x: string]: unknown;
}

// deno-lint-ignore no-explicit-any
export class DataSource<Inputs extends DataSourceInputs = DataSourceInputs, Outputs extends any = any>
  extends Block<Inputs, Outputs> {
  constructor(
    parent: Construct,
    readonly typeName: string,
    readonly label: string,
    inputs: Inputs,
    childBlocks?: (b: Block) => void,
  ) {
    super(parent, "data", [typeName, label], inputs, childBlocks);

    if (inputs.lifecycles && inputs.lifecycles.length > 0) {
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
