// deno-lint-ignore-file no-explicit-any

import { outdent } from "@cspotcode/outdent";
import type { z } from "@zod/zod";
import { Construct } from "../construct.ts";
import { Attribute } from "../input_output/attribute.ts";
import type { InferInputs, InferOutputs } from "../input_output/types.ts";
import { Input, Output } from "../input_output/types.ts";
import { fmtHcl, toHcl } from "../utils.ts";

export class Block<
  Self = any,
  Inputs = InferInputs<Self>,
  Outputs = InferOutputs<Self>,
> extends Construct {
  static readonly Input = class<ValueType = string> extends Input<ValueType> {
    constructor(override readonly metadata?: { default?: string }) {
      super(metadata);
    }
  };

  static readonly ZodInput = class<Schema extends z.ZodType> extends Block.Input<Schema> {
    constructor(
      /**
       * NB: Reserved for future use.
       *
       * The schema is currently unused with-in CDKTS and is only here as a
       * convenience to avoid using z.infer multiple times.
       *
       * But assuming you pass the same schema to denobridge providers,
       * then validation will happen once all values are resolved by tf.
       */
      readonly schema: Schema,
      metadata?: { default?: string },
    ) {
      super(metadata);
    }
  };

  static readonly Output = class<ValueType = string> extends Output<ValueType> {
    constructor(override readonly metadata?: Record<PropertyKey, never>) {
      super(metadata);
    }
  };

  static readonly ZodOutput = class<Schema extends z.ZodType> extends Block.Output<Schema> {
    constructor(
      /**
       * NB: Reserved for future use.
       *
       * The schema is currently unused with-in CDKTS and is only here as a
       * convenience to avoid using z.infer multiple times.
       *
       * But assuming you pass the same schema to denobridge providers,
       * then validation will happen once all values are resolved by tf.
       */
      readonly schema: Schema,
      metadata?: Record<PropertyKey, never>,
    ) {
      super(metadata);
    }
  };

  static readonly Props = class {};

  get props(): Record<string, Input | Output> {
    return new ((this.constructor as any).Props)();
  }

  get outputs(): Outputs {
    return new Proxy(new Attribute(this.id), {
      get(target, propName, _) {
        // Check if this is an actual property/method on the Attribute instance
        if (propName in target) {
          const value = (target as any)[propName];
          if (typeof value === "function") {
            return value.bind(target);
          }
          return value;
        }
        if (typeof propName === "string") {
          return target.atMapKey(propName);
        }
        if (typeof propName === "number") {
          return target.atIndex(propName);
        }
        if (propName === Symbol.toPrimitive) {
          return function (hint: any) {
            if (hint === "string") {
              return target.toString();
            }
            throw new Error(`toPrimitive not supported: ${hint}`);
          };
        }
        throw new Error(`atIndex not supported: ${String(propName)}`);
      },
    }) as Outputs;
  }

  readonly inputs?: Inputs;

  get ref() {
    return this.id;
  }

  constructor(
    parent: Construct,
    readonly type: string,
    readonly labels: string[],
    inputs?: any,
    childBlocks?: (b: Block) => void,
  ) {
    super(parent, `${type}${labels.length > 0 ? `.${labels.join(".")}` : ""}`);

    this.inputs = inputs ?? {};

    for (const [k, v] of Object.entries(this.props)) {
      if (v instanceof Block.Input) {
        if (v.metadata?.default && !(this.inputs as any)[k]) {
          (this.inputs as any)[k] = v.metadata?.default;
        }
      }
    }

    if (childBlocks) childBlocks(this as any);
  }

  protected mapInputsForHcl(): unknown {
    return this.inputs;
  }

  async toHcl(fmt = true): Promise<string> {
    let childBlocks = "";

    for (const block of this.children.filter((_) => _ instanceof Block)) {
      childBlocks = outdent`
        ${childBlocks}

        ${await block.toHcl(false)}
      `;
    }

    childBlocks = childBlocks.trim();

    return await fmtHcl(
      outdent`
        ${this.type} ${this.labels.map((labels) => `"${labels}"`).join(" ")} {
          ${toHcl(this.mapInputsForHcl())}${childBlocks.length > 0 ? `\n${childBlocks}` : ""}
        }
      `,
      fmt,
    );
  }
}
