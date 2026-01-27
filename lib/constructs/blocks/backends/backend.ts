import type { Construct } from "../../construct.ts";
import { Block } from "../block.ts";

/**
 * @see https://developer.hashicorp.com/terraform/language/backend
 */
export class Backend<Self = typeof Backend> extends Block<Self> {
  constructor(
    parent: Construct,
    readonly backendType: string,
    inputs?: Backend["inputs"],
    childBlocks?: (b: Block) => void,
  ) {
    super(parent, "backend", [backendType], inputs, childBlocks);
  }
}
