import { Construct } from "../../construct.ts";
import { Block } from "../block.ts";

// deno-lint-ignore no-explicit-any
export class Backend<Inputs extends any = any> extends Block<Inputs> {
  constructor(parent: Construct, readonly backendType: string, inputs: Inputs, childBlocks?: (b: Block) => void) {
    super(parent, "backend", [backendType], inputs, childBlocks);
  }
}
