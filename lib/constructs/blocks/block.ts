// deno-lint-ignore-file no-explicit-any

import { outdent } from "@cspotcode/outdent";
import type { z } from "@zod/zod";
import { Construct } from "../construct.ts";
import { Attribute, createAttributeProxy } from "../input_output/attribute.ts";
import type { InferInputs, InferOutputs } from "../input_output/types.ts";
import { Input, Output } from "../input_output/types.ts";
import { fmtHcl, toHcl } from "../utils.ts";

/**
 * Base class for all Terraform/OpenTofu configuration blocks.
 *
 * Block represents a fundamental unit of Terraform/OpenTofu configuration (resources, data sources,
 * providers, variables, outputs, etc.) and provides the foundation for generating HCL. Each block
 * has a type, optional labels, inputs, outputs, and can contain child blocks for nested configuration.
 *
 * @template Self - The concrete class type extending Block, typically `typeof ClassName`
 * @template Inputs - Inferred input properties from the Props class
 * @template Outputs - Inferred output properties from the Props class
 *
 * @example
 * ```typescript
 * // Define a custom resource block
 * class MyResource extends Block<typeof MyResource> {
 *   static override readonly Props = class extends Block.Props {
 *     name = new Block.Input<string>();
 *     count = new Block.Input<number | undefined>();
 *   };
 *
 *   constructor(parent: Construct, label: string, inputs: MyResource["inputs"]) {
 *     super(parent, "resource", ["my_provider_my_resource", label], inputs);
 *   }
 * }
 *
 * // Usage
 * const resource = new MyResource(stack, "example", { name: "my-resource" });
 * const nameOutput = resource.outputs.name; // Type-safe output access
 * ```
 */
export class Block<
  Self = any,
  Inputs = InferInputs<Self>,
  Outputs = InferOutputs<Self>,
> extends Construct {
  /**
   * Defines an input property for a Block.
   *
   * Input properties represent configuration values that can be passed to a block.
   * They are used within the `Props` class to define the block's schema.
   *
   * @template ValueType - The TypeScript type of the input value (defaults to `string`)
   *
   * @example
   * ```typescript
   * class MyBlockProps extends Block.Props {
   *   // Simple string input
   *   name = new Block.Input<string>();
   *
   *   // Optional number input with default
   *   port = new Block.Input<number | undefined>({ default: "8080" });
   * }
   * ```
   */
  static readonly Input = class<ValueType = string> extends Input<ValueType> {
    /**
     * Creates a new Input property.
     *
     * @param metadata - Optional metadata including default value
     * @param metadata.default - Default value expression (as HCL string) if input is not provided
     * @param metadata.hclName - The value used when printing this property to HCL.
     */
    constructor(override readonly metadata?: { default?: string; hclName?: string }) {
      super(metadata);
    }
  };

  /**
   * Defines an input property with Zod schema validation for a Block.
   *
   * This class extends `Block.Input` and associates a Zod schema with the input.
   * The schema is primarily a TypeScript convenience and can be used by denobridge
   * providers for runtime validation after Terraform resolves all values.
   *
   * @template Schema - A Zod schema type extending `z.ZodType`
   *
   * @example
   * ```typescript
   * const ConfigSchema = z.object({
   *   host: z.string(),
   *   port: z.number().min(1).max(65535),
   * });
   *
   * class MyBlockProps extends Block.Props {
   *   config = new Block.ZodInput(ConfigSchema);
   * }
   *
   * // Type-safe: config is inferred as z.infer<typeof ConfigSchema>
   * ```
   */
  static readonly ZodInput = class<Schema extends z.ZodType> extends Block.Input<Schema> {
    /**
     * Creates a new ZodInput property.
     *
     * @param schema - The Zod schema for validation (reserved for future use within CDKTS;
     *                 currently serves as a TypeScript type helper)
     * @param metadata - Optional metadata including default value
     * @param metadata.default - Default value expression (as HCL string) if input is not provided
     * @param metadata.hclName - The value used when printing this property to HCL.
     */
    constructor(
      readonly schema: Schema,
      metadata?: { default?: string; hclName?: string },
    ) {
      super(metadata);
    }
  };

  /**
   * Defines an output property for a Block.
   *
   * Output properties represent computed or exported values from a block (e.g., resource
   * attributes computed by Terraform/OpenTofu). They are used within the `Props` class
   * to define what values can be referenced from a block instance.
   *
   * @template ValueType - The TypeScript type of the output value (defaults to `string`)
   *
   * @example
   * ```typescript
   * class MyResourceProps extends Block.Props {
   *   // Output for a computed resource ID
   *   id = new Block.Output<string>();
   *
   *   // Output for a complex computed value
   *   metadata = new Block.Output<Record<string, any>>();
   * }
   *
   * // Access outputs with type safety
   * const resource = new MyResource(stack, "example", {...});
   * const resourceId = resource.outputs.id; // Attribute reference
   * ```
   */
  static readonly Output = class<ValueType = string> extends Output<ValueType> {
    /**
     * Creates a new Output property.
     *
     * @param metadata - Optional metadata (currently unused, reserved for future use)
     */
    constructor(override readonly metadata?: Record<PropertyKey, never>) {
      super(metadata);
    }
  };

  /**
   * Defines an output property with Zod schema typing for a Block.
   *
   * This class extends `Block.Output` and associates a Zod schema with the output.
   * The schema is primarily a TypeScript convenience to avoid using `z.infer` multiple
   * times and can be used by denobridge providers for type consistency.
   *
   * @template Schema - A Zod schema type extending `z.ZodType`
   *
   * @example
   * ```typescript
   * const StateSchema = z.object({
   *   status: z.enum(["active", "inactive"]),
   *   createdAt: z.string(),
   * });
   *
   * class MyResourceProps extends Block.Props {
   *   state = new Block.ZodOutput(StateSchema);
   * }
   *
   * // Type-safe: state is inferred as z.infer<typeof StateSchema>
   * ```
   */
  static readonly ZodOutput = class<Schema extends z.ZodType> extends Block.Output<Schema> {
    /**
     * Creates a new ZodOutput property.
     *
     * @param schema - The Zod schema for type inference (reserved for future use within CDKTS;
     *                 currently serves as a TypeScript type helper)
     * @param metadata - Optional metadata (currently unused, reserved for future use)
     */
    constructor(
      readonly schema: Schema,
      metadata?: Record<PropertyKey, never>,
    ) {
      super(metadata);
    }
  };

  /**
   * Base class for defining the properties schema of a Block.
   *
   * Extend this class and use `Block.Input`, `Block.Output`, `Block.ZodInput`, or
   * `Block.ZodOutput` to define the input and output properties for your custom block.
   * The `InferInputs` and `InferOutputs` utility types will extract the appropriate
   * types from your Props class definition.
   *
   * @example
   * ```typescript
   * class MyBlockProps extends Block.Props {
   *   // Inputs
   *   name = new Block.Input<string>();
   *   count = new Block.Input<number | undefined>();
   *
   *   // Outputs
   *   id = new Block.Output<string>();
   *   status = new Block.Output<string>();
   * }
   * ```
   */
  static readonly Props = class {};

  /**
   * Returns an instance of the Props class containing all input and output definitions.
   *
   * This is used internally to introspect the block's input/output schema.
   *
   * @returns An object containing all Block.Input and Block.Output instances
   */
  get props(): Record<string, Input | Output> {
    return new ((this.constructor as any).Props)();
  }

  /**
   * Provides type-safe access to the block's output attributes.
   *
   * Returns a proxy object that creates Attribute references for accessing
   * computed values from this block. These references are converted to HCL
   * interpolation expressions (e.g., `${resource.type.label.attribute}`)
   * during code generation.
   *
   * @returns A proxy object providing type-safe access to output attributes
   *
   * @example
   * ```typescript
   * const instance = new MyResource(stack, "example", {...});
   * const publicIp = instance.outputs.public_ip; // Creates Attribute reference
   * const dnsName = instance.outputs.dns_name;
   * ```
   */
  get outputs(): Outputs {
    return createAttributeProxy(new Attribute(this.id)) as Outputs;
  }

  /**
   * The input values provided to this block.
   *
   * Contains the configuration parameters passed during block construction.
   * Input properties with default values (defined in Props) will be automatically
   * populated if not explicitly provided.
   */
  readonly inputs?: Inputs;

  /**
   * Gets a reference identifier for this block.
   *
   * By default, returns the block's ID for use in Terraform/OpenTofu expressions.
   * Subclasses may override this to provide custom reference formats
   * (e.g., Variable overrides this to return `var.{label}`).
   *
   * @returns The reference identifier string
   */
  get ref() {
    return this.id;
  }

  /**
   * Creates a new Block instance.
   *
   * Initializes a block with the specified type, labels, inputs, and optional child blocks.
   * The block is automatically registered as a child of the parent construct. Input defaults
   * from the Props class are applied if values are not explicitly provided.
   *
   * @param parent - The parent construct for this block
   * @param type - The HCL block type (e.g., "resource", "data", "variable", "output")
   * @param labels - Array of label strings for the block (e.g., ["aws_instance", "example"])
   * @param inputs - Input configuration values for the block
   * @param childBlocks - Optional callback for creating nested child blocks
   *
   * @example
   * ```typescript
   * // Resource with type "resource" and labels ["aws_instance", "web"]
   * new Block(stack, "resource", ["aws_instance", "web"], { ami: "ami-12345" });
   *
   * // Block with child blocks
   * new Block(stack, "lifecycle", [], {}, (b) => {
   *   new Block(b, "precondition", [], { condition: "...", error_message: "..." });
   * });
   * ```
   */
  constructor(
    parent: Construct,
    /**
     * The HCL block type (e.g., "resource", "data", "variable").
     *
     * This determines the top-level keyword in the generated HCL configuration.
     */
    readonly type: string,
    /**
     * The label strings for this block.
     *
     * Labels appear after the block type in HCL. For example, a resource block
     * typically has two labels: the resource type and the resource name.
     * Empty array for unlabeled blocks like "terraform" or "locals".
     */
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

  /**
   * Transforms input values before HCL serialization.
   *
   * By default, this method maps input property keys to their HCL names by using the
   * `hclName` metadata from `Block.Input` definitions. If no `hclName` is specified,
   * the original property key is used. This allows TypeScript property names to differ
   * from their corresponding HCL attribute names.
   *
   * This method can be overridden by subclasses for additional transformations such as
   * removing internal properties, applying custom renaming logic, or filtering out
   * lifecycle-related inputs that are handled separately.
   *
   * @returns The transformed input object for HCL serialization
   *
   * @example
   * ```typescript
   * // Example Props with hclName mapping
   * class MyBlockProps extends Block.Props {
   *   myProperty = new Block.Input<string>({ hclName: "my_property" });
   * }
   * // Input { myProperty: "value" } becomes HCL: my_property = "value"
   *
   * // Override for custom transformation
   * protected override mapInputsForHcl(): unknown {
   *   const inputs = super.mapInputsForHcl();
   *   // Remove internal property not needed in HCL output
   *   delete inputs["lifecycles"];
   *   return inputs;
   * }
   * ```
   */
  protected mapInputsForHcl(): any {
    // Return nothing if we have nothing
    if (!this.inputs) return {};

    // Just return the inputs as is if we have no props schema to inspect
    const props = Object.entries(this.props);
    if (props.length === 0) return this.inputs;

    // First, copy all inputs as-is
    const hclInputs: any = {};
    for (const [k, v] of Object.entries(this.inputs)) {
      hclInputs[k] = v;
    }

    // Then, remap properties that have hclName metadata
    for (const [k, v] of props) {
      if (v instanceof Block.Input && v.metadata?.hclName) {
        const inputValue = (this.inputs as any)[k];
        if (typeof inputValue !== "undefined") {
          // Remove the original key and add with hclName
          delete hclInputs[k];
          hclInputs[v.metadata.hclName] = inputValue;
        }
      }
    }

    return hclInputs;
  }

  /**
   * Generates HCL (HashiCorp Configuration Language) representation of this block.
   *
   * Recursively converts this block and all its child blocks into HCL syntax.
   * The output includes the block type, labels, inputs (transformed via `mapInputsForHcl`),
   * and nested child blocks. The formatter can be optionally disabled for intermediate
   * block serialization.
   *
   * @param fmt - Whether to format the HCL output (defaults to `true`)
   * @returns A promise resolving to the HCL string representation
   *
   * @example
   * ```typescript
   * const block = new Block(stack, "resource", ["aws_instance", "web"], {
   *   ami: "ami-12345",
   *   instance_type: "t2.micro"
   * });
   *
   * const hcl = await block.toHcl();
   * // Outputs:
   * // resource "aws_instance" "web" {
   * //   ami           = "ami-12345"
   * //   instance_type = "t2.micro"
   * // }
   * ```
   */
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
