import { Construct } from "../../construct.ts";
import { Block } from "../block.ts";
import { Provider } from "../providers/provider.ts";

// deno-lint-ignore no-explicit-any
export interface ActionInputs<Config extends any = any> {
  config: Config;
  count?: number;
  forEach?: Record<string, string> | string[];
  provider?: Provider;
}

// deno-lint-ignore no-explicit-any
export class Action<Config extends any = any> extends Block<ActionInputs<Config>> {
  constructor(
    parent: Construct,
    readonly typeName: string,
    readonly label: string,
    inputs: ActionInputs<Config>,
    childBlocks?: (b: Block) => void,
  ) {
    super(parent, "action", [typeName, label], inputs, childBlocks);
    new Block(this, "config", [], inputs.config);
  }

  protected override mapInputsForHcl(): unknown {
    return {
      count: this.inputs?.count,
      for_each: this.inputs?.forEach,
      provider: this.inputs?.provider?.inputs?.alias,
    };
  }
}
