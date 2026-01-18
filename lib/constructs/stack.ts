import { outdent } from "@cspotcode/outdent";
import { Block } from "./blocks/block.ts";
import { Construct } from "./construct.ts";
import { fmtHcl } from "./utils.ts";

// deno-lint-ignore no-explicit-any
export abstract class Stack<Inputs extends any = any, Outputs extends any = any> extends Construct {
  protected get blocks(): Block[] {
    return this.children.filter((_) => _ instanceof Block);
  }

  get outputs() {
    return new Proxy({}, {
      get(target, propName, _) {
        // IDEA: Cross Stack Refs could be resolved through a datasource?
        // see: https://developer.hashicorp.com/terraform/language/state/remote-state-data
        throw new Error("not implemented");
      },
    }) as Outputs;
  }

  constructor(name: string, protected readonly inputs?: Inputs) {
    super(undefined, name);
  }

  async toHcl(fmt = true): Promise<string> {
    let hcl = "";

    for (const block of this.blocks) {
      hcl = outdent`
        ${hcl}

        ${await block.toHcl(false)}
      `;
    }

    hcl = hcl.trim();

    return fmtHcl(hcl, fmt);
  }
}
