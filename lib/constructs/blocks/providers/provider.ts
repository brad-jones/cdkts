import { Construct } from "../../construct.ts";
import { Block } from "../block.ts";

export interface ProviderInputs {
  alias?: string;
  [x: string]: unknown;
}

export class Provider<Inputs extends ProviderInputs = ProviderInputs> extends Block<Inputs> {
  get aliasRef() {
    return `${this.providerName}.${this.inputs?.alias}`;
  }

  constructor(parent: Construct, readonly providerName: string, inputs: Inputs, childBlocks?: (b: Block) => void) {
    super(parent, "provider", [providerName], inputs, childBlocks);
  }
}
