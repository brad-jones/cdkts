// deno-lint-ignore-file no-explicit-any

import { outdent } from "@cspotcode/outdent";
import { Block } from "./blocks/block.ts";
import { Output as OutputBlock } from "./blocks/output.ts";
import { Variable } from "./blocks/variable.ts";
import { Construct } from "./construct.ts";
import { type InferInputs, type InferOutputs, Input, Output } from "./input_output/types.ts";
import { fmtHcl } from "./utils.ts";

export abstract class Stack<
  Self = any,
  Inputs = InferInputs<Self>,
  Outputs = InferOutputs<Self>,
> extends Construct {
  static readonly Input = class<ValueType = string> extends Input<ValueType> {
    constructor(override readonly metadata?: InferInputs<typeof Variable.Props>) {
      super(metadata);
    }
  };

  static readonly Output = class<ValueType = string> extends Output<ValueType> {
    constructor(override readonly metadata?: InferInputs<typeof OutputBlock.Props>) {
      super(metadata);
    }
  };

  static readonly Props = class {};

  get props(): Record<string, Input | Output> {
    return new ((this.constructor as any).Props)();
  }

  readonly inputs: Inputs;

  protected readonly _inputValues?: Record<string, unknown>;

  protected set outputs(outputs: Outputs) {
    for (const [label, value] of Object.entries(outputs as Record<string, any>)) {
      const prop = this.props[label];
      if (prop instanceof Stack.Output) {
        const { metadata } = prop;
        new OutputBlock(this, label, { ...metadata, value });
      }
    }
  }

  constructor(
    id: string,
    inputs?: any,
  ) {
    super(undefined, id);

    this._inputValues = inputs;

    this.inputs = {} as any;
    for (const [name, prop] of Object.entries(this.props)) {
      if (prop instanceof Stack.Input) {
        const { metadata } = prop;
        (this.inputs as any)[name] = new Variable(this, name, { ...metadata });
      }
    }
  }

  async toHcl(fmt = true): Promise<string> {
    let hcl = "";

    for (const block of this.children.filter((_) => _ instanceof Block)) {
      hcl = outdent`
        ${hcl}

        ${await block.toHcl(false)}
      `;
    }

    hcl = hcl.trim();

    return fmtHcl(hcl, fmt);
  }
}
