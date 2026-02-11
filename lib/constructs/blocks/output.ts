import type { Construct } from "../construct.ts";
import { Block } from "./block.ts";

/**
 * Represents a Terraform/OpenTofu output value block.
 *
 * Outputs are used to export values from a stack, making them available for
 * inspection or for use in other configurations. They define the values that
 * will be displayed after applying a Terraform configuration.
 *
 * @see https://developer.hashicorp.com/terraform/language/values/outputs
 *
 * @example
 * ```typescript
 * // Basic output
 * new Output(this, "instance_id", {
 *   value: resource.outputs.id,
 *   description: "The ID of the created instance",
 * });
 *
 * // Sensitive output with preconditions
 * new Output(this, "database_password", {
 *   value: dbInstance.outputs.password,
 *   sensitive: true,
 *   description: "The database password",
 *   preconditions: [
 *     {
 *       condition: "length(var.db_password) > 8",
 *       errorMessage: "Password must be longer than 8 characters",
 *     },
 *   ],
 * });
 * ```
 */
export class Output extends Block<typeof Output> {
  /**
   * Configuration properties for an Output block.
   *
   * Defines the schema for output value configuration including the value to export,
   * metadata, and validation settings.
   */
  static override readonly Props = class extends Block.Props {
    /**
     * The value to export from the stack.
     *
     * This can be any expression that evaluates to a value, including resource
     * attributes, computed values, or references to variables.
     *
     * @example
     * ```typescript
     * value: resource.outputs.id
     * value: "${var.prefix}-${local.suffix}"
     * ```
     */
    // deno-lint-ignore no-explicit-any
    value = new Block.Input<any>();

    /**
     * Human-readable description of the output's purpose.
     *
     * This description is shown in documentation and when displaying outputs.
     *
     * @example
     * ```typescript
     * description: "The public IP address of the web server"
     * ```
     */
    description = new Block.Input<string | undefined>();

    /**
     * Whether the output contains sensitive information.
     *
     * When set to true, Terraform will hide the output value in logs and console
     * output to prevent accidentally exposing secrets.
     *
     * @default false
     *
     * @example
     * ```typescript
     * sensitive: true  // For passwords, API keys, etc.
     * ```
     */
    sensitive = new Block.Input<boolean | undefined>();

    /**
     * Whether the output value is ephemeral.
     *
     * Ephemeral outputs are not stored in state and are only available during
     * the apply operation. Useful for temporary values that should not persist.
     *
     * @default false
     *
     * @example
     * ```typescript
     * ephemeral: true  // For temporary credentials or one-time tokens
     * ```
     */
    ephemeral = new Block.Input<boolean | undefined>();

    /**
     * Explicit dependencies for this output.
     *
     * An array of resource/module references that this output depends on.
     * Terraform will ensure these dependencies are created before computing the output.
     *
     * @example
     * ```typescript
     * dependsOn: ["aws_instance.web", "aws_security_group.web_sg"]
     * ```
     */
    dependsOn = new Block.Input<Block[] | undefined>();

    /**
     * Validation preconditions that must be met.
     *
     * An array of conditions that will be checked during plan and apply.
     * If any condition evaluates to false, Terraform will fail with the specified error message.
     *
     * @example
     * ```typescript
     * preconditions: [
     *   {
     *     condition: "length(self.id) > 0",
     *     errorMessage: "Instance ID must not be empty",
     *   },
     * ]
     * ```
     */
    preconditions = new Block.Input<
      {
        condition: string;
        errorMessage: string;
      }[] | undefined
    >();
  };

  /**
   * Creates a new Output block.
   *
   * @param parent - The parent construct (typically a Stack)
   * @param label - The name of the output (used as the output identifier)
   * @param inputs - Configuration properties for the output
   *
   * @example
   * ```typescript
   * new Output(this, "instance_ip", {
   *   value: instance.outputs.public_ip,
   *   description: "The public IP address of the instance",
   * });
   * ```
   */
  constructor(parent: Construct, label: string, inputs: Output["inputs"]) {
    super(parent, "output", [label], inputs);

    // Create precondition blocks for validation
    for (const precondition of inputs?.preconditions ?? []) {
      new Block(this, "precondition", [], {
        condition: precondition.condition,
        error_message: precondition.errorMessage,
      });
    }
  }

  /**
   * Maps inputs for HCL generation.
   *
   * Removes the preconditions array from inputs since preconditions are
   * generated as separate nested blocks rather than as a direct property.
   *
   * @returns The inputs object with preconditions removed
   * @internal
   */
  protected override mapInputsForHcl(): unknown {
    const inputs = this.inputs;
    if (inputs) {
      delete inputs["preconditions"];
    }
    return inputs;
  }
}
