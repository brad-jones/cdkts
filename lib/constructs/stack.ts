// deno-lint-ignore-file no-explicit-any

import { DENOBRIDGE_VERSION } from "@brad-jones/terraform-provider-denobridge";
import { outdent } from "@cspotcode/outdent";
import { DenoAction } from "./blocks/actions/deno_action.ts";
import { Block } from "./blocks/block.ts";
import { DenoDataSource } from "./blocks/datasources/deno_datasource.ts";
import { Output as OutputBlock } from "./blocks/output.ts";
import { DenoBridgeProvider } from "./blocks/providers/denobridge.ts";
import { Provider } from "./blocks/providers/provider.ts";
import { DenoResource } from "./blocks/resources/deno_resource.ts";
import { DenoEphemeralResource } from "./blocks/resources/ephemeral/deno_ephemeral_resource.ts";
import { Terraform } from "./blocks/terraform.ts";
import { Variable } from "./blocks/variable.ts";
import { Construct } from "./construct.ts";
import { type InferInputs, type InferOutputs, Input, Output } from "./input_output/types.ts";
import { findConfigFileSync, fmtHcl } from "./utils.ts";

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
   * Walks the construct tree upward from the given construct to find the enclosing Stack.
   *
   * This is useful in nested Constructs and Blocks where you don't have direct
   * access to the Stack instance but need to reference it.
   *
   * @param construct - Any construct within a Stack's tree
   * @returns The enclosing Stack instance
   * @throws Error if no Stack is found in the parent chain
   *
   * @example
   * ```typescript
   * const stack = Stack.of(this);
   * ```
   */
  static of(construct: Construct): Stack {
    let current: Construct | undefined = construct;
    while (current) {
      if (current instanceof Stack) return current;
      current = current.parent;
    }
    throw new Error(`No Stack found in the construct tree above ${construct.id}`);
  }

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

  #configFile?: string;

  get configFile(): string | undefined {
    if (this.#configFile) return this.#configFile;
    if (this.id.match(/^file:\/\/.*#.*$/)) {
      this.#configFile = findConfigFileSync(this.id.split("#")[0]);
      return this.#configFile;
    }
    return undefined;
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
   * Automatically configures DenoBridge provider and Terraform block if Deno-based constructs are present.
   *
   * This method checks if any Deno-based constructs (DenoAction, DenoDataSource, DenoResource,
   * DenoEphemeralResource) exist in the stack. If found, it ensures that:
   * 1. A DenoBridgeProvider is added to the stack
   * 2. A Terraform block exists with the denobridge provider in requiredProviders
   *
   * @internal
   */
  #ensureDenobridgeConfiguration(): void {
    // Check if any Deno-based constructs are present
    const hasDenoConstructs = this.descendants.some((_) =>
      _ instanceof DenoAction ||
      _ instanceof DenoDataSource ||
      _ instanceof DenoResource ||
      _ instanceof DenoEphemeralResource
    );

    if (!hasDenoConstructs) {
      return;
    }

    // Check for existing DenoBridgeProvider
    const hasDenoBridgeProvider = this.descendants.some((_) => _ instanceof DenoBridgeProvider);
    if (!hasDenoBridgeProvider) {
      new DenoBridgeProvider(this);
    }

    // Check for existing Terraform block
    const terraformBlock = this.descendants.find((_) => _ instanceof Terraform) as Terraform | undefined;

    if (!terraformBlock) {
      // Create new Terraform block with denobridge provider
      new Terraform(this, {
        requiredProviders: {
          denobridge: {
            source: "brad-jones/denobridge",
            version: DENOBRIDGE_VERSION,
          },
        },
      });
    } else {
      // Ensure denobridge is in requiredProviders
      this.#ensureDenobridgeInRequiredProviders(terraformBlock, DENOBRIDGE_VERSION);
    }
  }

  /**
   * Ensures the denobridge provider is registered in the Terraform block's requiredProviders.
   *
   * Checks if the Terraform block has a required_providers child block and adds
   * the denobridge provider configuration if it's not already present. If the
   * required_providers block doesn't exist, it creates one.
   *
   * @param terraformBlock - The existing Terraform block to update
   * @param version - The denobridge provider version to register
   *
   * @internal
   */
  #ensureDenobridgeInRequiredProviders(terraformBlock: Terraform, version: string): void {
    // Find the required_providers child block
    const requiredProvidersBlock = terraformBlock.children.find(
      (child) => child instanceof Block && (child as Block).type === "required_providers",
    ) as Block | undefined;

    if (requiredProvidersBlock) {
      // Check if denobridge is already in the inputs
      const inputs = requiredProvidersBlock.inputs as any;
      if (!inputs.denobridge) {
        // Add denobridge to the inputs
        inputs.denobridge = {
          source: "brad-jones/denobridge",
          version: version,
        };
      }
    } else {
      // Create the required_providers block
      new Block(terraformBlock, "required_providers", [], {
        denobridge: {
          source: "brad-jones/denobridge",
          version: version,
        },
      });
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

    // Automatically configure DenoBridge provider and Terraform block if needed
    this.#ensureDenobridgeConfiguration();

    // Filter for top-level Blocks: those whose parent is NOT a Block.
    // This includes Blocks that are direct children of the Stack, as well as
    // Blocks nested within non-Block Constructs. Blocks nested inside other
    // Blocks are excluded here since they're rendered by their parent Block's toHcl().
    const topLevelBlocks = this.descendants.filter((_) =>
      _ instanceof Block && !(_.parent instanceof Block)
    ) as Block[];

    // Separate blocks by type for ordered output
    const terraformBlocks = topLevelBlocks.filter((_) => _ instanceof Terraform);
    const providerBlocks = topLevelBlocks.filter((_) => _ instanceof Provider);
    const otherBlocks = topLevelBlocks.filter((_) => !(_ instanceof Terraform) && !(_ instanceof Provider));

    // Output Terraform blocks first
    for (const block of terraformBlocks) {
      hcl = outdent`
        ${hcl}

        ${await block.toHcl(false)}
      `;
    }

    // Output Provider blocks second
    for (const block of providerBlocks) {
      hcl = outdent`
        ${hcl}

        ${await block.toHcl(false)}
      `;
    }

    // Output all other blocks
    for (const block of otherBlocks) {
      hcl = outdent`
        ${hcl}

        ${await block.toHcl(false)}
      `;
    }

    hcl = hcl.trim();

    return fmtHcl(hcl, fmt);
  }
}
