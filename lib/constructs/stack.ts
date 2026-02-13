// deno-lint-ignore-file no-explicit-any

import { outdent } from "@cspotcode/outdent";
import { Block } from "./blocks/block.ts";
import { Output as OutputBlock } from "./blocks/output.ts";
import { Variable } from "./blocks/variable.ts";
import { Construct } from "./construct.ts";
import { type InferInputs, type InferOutputs, Input, Output } from "./input_output/types.ts";
import { fmtHcl } from "./utils.ts";

/**
 * Base class for defining Terraform/OpenTofu stacks.
 *
 * A Stack represents a complete Terraform configuration that can be applied, planned, or destroyed.
 * It provides type-safe input and output handling through a declarative Props pattern.
 *
 * @template Self - The concrete stack class type (use `typeof YourStack`)
 * @template Inputs - Inferred input types from the Props class
 * @template Outputs - Inferred output types from the Props class
 *
 * @example
 * ```typescript
 * export default class MyStack extends Stack<typeof MyStack> {
 *   static override readonly Props = class extends Stack.Props {
 *     filename = new Stack.Input();
 *     content = new Stack.Input();
 *     contentHash = new Stack.Output();
 *   };
 *
 *   constructor() {
 *     super(`${import.meta.url}#${MyStack.name}`);
 *
 *     const myFile = new Resource(this, "local_file", "hello", {
 *       filename: this.inputs.filename,
 *       content: this.inputs.content,
 *     });
 *
 *     this.outputs = {
 *       contentHash: myFile.outputs.content_sha256,
 *     };
 *   }
 * }
 * ```
 */
export abstract class Stack<
  Self = any,
  Inputs = InferInputs<Self>,
  Outputs = InferOutputs<Self>,
> extends Construct {
  /**
   * Input class for defining stack input variables.
   *
   * Use this in your Props class to declare inputs that can be passed to the stack.
   * Inputs are automatically converted to Terraform variables.
   *
   * @template ValueType - The TypeScript type of the input value (default: string)
   *
   * @example
   * ```typescript
   * static override readonly Props = class extends Stack.Props {
   *   filename = new Stack.Input();
   *   port = new Stack.Input<number>({ default: 8080 });
   * };
   * ```
   */
  static readonly Input = class<ValueType = string> extends Input<ValueType> {
    constructor(override readonly metadata?: InferInputs<typeof Variable.Props>) {
      super(metadata);
    }
  };

  /**
   * Output class for defining stack output values.
   *
   * Use this in your Props class to declare outputs that can be exported from the stack.
   * Outputs are automatically converted to Terraform outputs.
   *
   * @template ValueType - The TypeScript type of the output value (default: string)
   *
   * @example
   * ```typescript
   * static override readonly Props = class extends Stack.Props {
   *   instanceId = new Stack.Output<string>({ description: "The EC2 instance ID" });
   * };
   * ```
   */
  static readonly Output = class<ValueType = string> extends Output<ValueType> {
    constructor(override readonly metadata?: InferInputs<typeof OutputBlock.Props>) {
      super(metadata);
    }
  };

  /**
   * Base Props class for stack input and output definitions.
   *
   * Override this in your stack to define typed inputs and outputs.
   * This enables type-safe access through `this.inputs` and `this.outputs`.
   */
  static readonly Props = class {};

  /**
   * Returns an instance of the Props class containing all input and output definitions.
   *
   * This is used internally to introspect the stack's input/output schema.
   *
   * @returns An object containing all Stack.Input and Stack.Output instances
   */
  get props(): Record<string, Input | Output> {
    return new ((this.constructor as any).Props)();
  }

  /**
   * Typed access to stack input variables.
   *
   * This property provides access to all inputs defined in the Props class.
   * Each input corresponds to a Terraform variable block.
   *
   * @example
   * ```typescript
   * const myFile = new Resource(this, "local_file", "hello", {
   *   filename: this.inputs.filename,
   *   content: this.inputs.content,
   * });
   * ```
   */
  readonly inputs: Inputs;

  /**
   * Internal storage for input values passed to the constructor.
   *
   * @internal
   */
  protected readonly _inputValues?: Record<string, unknown>;

  /**
   * Sets stack output values.
   *
   * Assign an object containing all output values defined in your Props class.
   * Each property will be converted to a Terraform output block.
   *
   * @param outputs - Object mapping output names to their values
   *
   * @example
   * ```typescript
   * this.outputs = {
   *   contentHash: myFile.outputs.content_sha256,
   *   filename: myFile.outputs.filename,
   * };
   * ```
   */
  protected set outputs(outputs: Outputs) {
    for (const [label, value] of Object.entries(outputs as Record<string, any>)) {
      const prop = this.props[label];
      if (prop instanceof Stack.Output) {
        const { metadata } = prop;
        new OutputBlock(this, label, { ...metadata, value });
      }
    }
  }

  /**
   * Creates a new Stack instance.
   *
   * The stack ID should be unique and is typically constructed from the module URL
   * and class name to ensure uniqueness across the project.
   *
   * @param id - Unique identifier for this stack (e.g., `${import.meta.url}#${MyStack.name}`)
   * @param inputs - Optional input values to pass to the stack
   *
   * @example
   * ```typescript
   * constructor() {
   *   super(`${import.meta.url}#${MyStack.name}`);
   *   // Add resources, providers, etc.
   * }
   * ```
   */
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

  /**
   * Converts the stack to HCL (HashiCorp Configuration Language) code.
   *
   * Generates Terraform/OpenTofu configuration by serializing all child blocks
   * (resources, providers, variables, outputs, etc.) into HCL format.
   *
   * @param fmt - Whether to format the HCL output (default: true)
   * @returns A Promise resolving to the HCL string representation of the stack
   *
   * @example
   * ```typescript
   * const stack = new MyStack();
   * const hcl = await stack.toHcl();
   * console.log(hcl);
   * ```
   */
  async toHcl(fmt = true): Promise<string> {
    let hcl = "";

    // Filter for top-level Blocks: those whose parent is NOT a Block.
    // This includes Blocks that are direct children of the Stack, as well as
    // Blocks nested within non-Block Constructs. Blocks nested inside other
    // Blocks are excluded here since they're rendered by their parent Block's toHcl().
    for (const item of this.descendants.filter((_) => _ instanceof Block && !(_.parent instanceof Block))) {
      const block = item as Block;
      hcl = outdent`
        ${hcl}

        ${await block.toHcl(false)}
      `;
    }

    hcl = hcl.trim();

    return fmtHcl(hcl, fmt);
  }
}
