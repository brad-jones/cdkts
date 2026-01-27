import type { Construct } from "../../construct.ts";
import { Block } from "../block.ts";

export class Provider<Self = typeof Provider> extends Block<Self> {
  static override readonly Props = class extends Block.Props {
    alias = new Block.Input<string | undefined>();
  };

  constructor(
    parent: Construct,
    readonly providerName: string,
    inputs?: Provider["inputs"],
    childBlocks?: (b: Block) => void,
  ) {
    super(parent, "provider", [providerName], inputs, childBlocks);
  }

  override get ref() {
    return `${this.providerName}.${this.inputs?.alias}`;
  }
}
