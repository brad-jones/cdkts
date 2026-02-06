import type { Construct } from "../construct.ts";
import { Block } from "./block.ts";

/**
 * Represents a Terraform/OpenTofu input variable block.
 *
 * Variables allow users to parameterize their configurations without altering
 * the source code. They serve as function parameters for a Terraform module,
 * enabling the same configuration to be used with different values.
 *
 * @see https://developer.hashicorp.com/terraform/language/values/variables
 *
 * @example
 * ```typescript
 * // Basic variable
 * new Variable(this, "region", {
 *   type: "string",
 *   default: "us-west-2",
 *   description: "The AWS region to deploy to",
 * });
 *
 * // Sensitive variable with validation
 * new Variable(this, "api_key", {
 *   type: "string",
 *   sensitive: true,
 *   description: "API key for external service",
 *   validations: [
 *     {
 *       condition: "length(var.api_key) > 0",
 *       errorMessage: "API key cannot be empty",
 *     },
 *   ],
 * });
 * ```
 */
export class Variable extends Block<typeof Variable> {
  /**
   * Configuration properties for a Variable block.
   *
   * Defines the schema for input variable configuration including type constraints,
   * default values, validation rules, and metadata.
   */
  static override readonly Props = class extends Block.Props {
    /**
     * The type constraint for the variable value.
     *
     * Specifies what value types are accepted for the variable. Can be primitive
     * types (string, number, bool) or complex types (list, map, object, set, tuple).
     *
     * @example
     * ```typescript
     * type: "string"
     * type: "number"
     * type: "list(string)"
     * type: "map(number)"
     * type: "object({ name = string, age = number })"
     * ```
     */
    type = new Block.Input<string | undefined>();

    /**
     * The default value for the variable.
     *
     * If present, the variable is considered optional and this value will be used
     * if no value is provided when calling the module or running Terraform.
     *
     * @example
     * ```typescript
     * default: "us-west-2"
     * default: 8080
     * default: true
     * ```
     */
    default = new Block.Input<string | undefined>();

    /**
     * Human-readable description of the variable's purpose.
     *
     * Used in generated documentation and when prompting for the variable value
     * in the Terraform CLI.
     *
     * @example
     * ```typescript
     * description: "The AWS region where resources will be created"
     * ```
     */
    description = new Block.Input<string | undefined>();

    /**
     * Whether the variable contains sensitive information.
     *
     * When set to true, Terraform will hide the variable value in logs and console
     * output to prevent accidentally exposing secrets.
     *
     * @default false
     *
     * @example
     * ```typescript
     * sensitive: true  // For passwords, API keys, tokens, etc.
     * ```
     */
    sensitive = new Block.Input<boolean | undefined>();

    /**
     * Whether the variable value is ephemeral (transient).
     *
     * Ephemeral values exist only during plan and apply operations and are not
     * persisted to state. Useful for temporary credentials or one-time tokens.
     *
     * @default false
     *
     * @example
     * ```typescript
     * ephemeral: true  // For temporary authentication tokens
     * ```
     */
    ephemeral = new Block.Input<boolean | undefined>();

    /**
     * Whether the variable can be set to null.
     *
     * When false, the variable cannot be explicitly set to null, and must either
     * have a value or use the default. When true, null is a valid value.
     *
     * @default true
     *
     * @example
     * ```typescript
     * nullable: false  // Require explicit value or default
     * ```
     */
    nullable = new Block.Input<boolean | undefined>();

    /**
     * Custom validation rules for the variable value.
     *
     * Each validation consists of a condition expression that must evaluate to true
     * and an error message to display when the condition fails.
     *
     * @example
     * ```typescript
     * validations: [
     *   {
     *     condition: "length(var.name) > 3",
     *     errorMessage: "Name must be longer than 3 characters",
     *   },
     *   {
     *     condition: "can(regex(\"^[a-z][a-z0-9-]*$\", var.name))",
     *     errorMessage: "Name must start with a letter and contain only lowercase letters, numbers, and hyphens",
     *   },
     * ]
     * ```
     */
    validations = new Block.Input<
      {
        condition: string;
        errorMessage: string;
      }[] | undefined
    >();
  };

  /**
   * Returns the reference string for this variable.
   *
   * This reference can be used in other parts of the configuration to access
   * the variable's value.
   *
   * @returns The variable reference in the form `var.<label>`
   *
   * @example
   * ```typescript
   * const region = new Variable(this, "region", { ... });
   * // region.ref returns "var.region"
   * ```
   */
  override get ref() {
    return `var.${this.label}`;
  }

  /**
   * Creates a new Variable block.
   *
   * @param parent - The parent construct (typically a Stack)
   * @param label - The variable name (used as the identifier in Terraform)
   * @param inputs - Configuration properties for the variable
   *
   * @example
   * ```typescript
   * new Variable(this, "environment", {
   *   type: "string",
   *   default: "development",
   *   description: "The deployment environment",
   * });
   * ```
   */
  constructor(parent: Construct, readonly label: string, inputs?: Variable["inputs"]) {
    super(parent, "variable", [label], inputs);

    for (const validation of inputs?.validations ?? []) {
      new Block(this, "validation", [], {
        condition: validation.condition,
        error_message: validation.errorMessage,
      });
    }
  }

  /**
   * Maps variable inputs to HCL format.
   *
   * Transforms the input properties before converting to HCL, excluding the
   * `validations` property since it's handled separately as nested validation blocks.
   *
   * @returns The transformed inputs object for HCL serialization
   * @internal
   */
  protected override mapInputsForHcl(): unknown {
    const inputs = this.inputs;
    if (inputs) {
      delete inputs["validations"];
    }
    return inputs;
  }
}
