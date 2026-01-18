import { outdent } from "@cspotcode/outdent";
import { Attribute } from "../attribute.ts";
import { Construct } from "../construct.ts";
import { fmtHcl, toHcl } from "../utils.ts";

// deno-lint-ignore no-explicit-any
export class Block<Inputs extends any = undefined, Outputs extends any = undefined> extends Construct {
  protected get blocks(): Block[] {
    return this.children.filter((_) => _ instanceof Block);
  }

  get outputs() {
    return new Proxy(new Attribute(this.id), {
      get(target, propName, _) {
        if (typeof propName === "string") {
          return target.atMapKey(propName);
        }
        if (typeof propName === "number") {
          return target.atIndex(propName);
        }
        throw new Error("not supported");
      },
    }) as Outputs;
  }

  constructor(
    parent: Construct,
    protected readonly type: string,
    protected readonly labels: string[],
    readonly inputs?: Inputs,
    childBlocks?: (b: Block) => void,
  ) {
    super(parent, `${type}${labels.length > 0 ? `.${labels.join(".")}` : ""}`);

    // deno-lint-ignore no-explicit-any
    if (childBlocks) childBlocks(this as any);
  }

  protected mapInputsForHcl(): unknown {
    return this.inputs;
  }

  async toHcl(fmt = true): Promise<string> {
    let childBlocks = "";

    for (const block of this.blocks) {
      childBlocks = outdent`
        ${childBlocks}

        ${await block.toHcl(false)}
      `;
    }

    childBlocks = childBlocks.trim();

    return await fmtHcl(
      outdent`
        ${this.type} ${this.labels.map((labels) => `"${labels}"`).join(" ")} {
          ${toHcl(this.mapInputsForHcl())}${childBlocks.length > 0 ? `\n\n${childBlocks}` : ""}
        }
      `,
      fmt,
    );
  }
}
