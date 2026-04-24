import type { Construct } from "../construct.ts";
import { Block } from "./block.ts";

/**
 * Represents a Terraform/OpenTofu `assert` block within a {@link Check} block.
 *
 * Each assertion evaluates a boolean condition after plan and apply operations.
 * When the condition evaluates to `false`, Terraform reports a **warning** using
 * the provided error message and continues the current operation.
 *
 * Assertions must be created inside a {@link Check} block's child-block callback.
 *
 * @see https://developer.hashicorp.com/terraform/language/block/check
 *
 * @example
 * ```typescript
 * new Check(this, "health_check", (c) => {
 *   const api = new DataSource(c, "http", "api", { url: "https://api.example.com/health" });
 *
 *   new Assertion(c, "status_ok", {
 *     condition: `${api.outputs.status_code} == 200`,
 *     errorMessage: "API health check failed",
 *   });
 * });
 * ```
 */
export class Assertion extends Block<typeof Assertion> {
  /**
   * Configuration properties for an Assertion block.
   */
  static override readonly Props = class extends Block.Props {
    /**
     * A boolean expression that Terraform evaluates after plan and apply.
     *
     * When the expression evaluates to `false`, Terraform reports a warning
     * using the `errorMessage`. The condition is written as a Terraform
     * expression string that may reference data sources scoped to the
     * parent check block.
     */
    condition = new Block.Input<string>();

    /**
     * The error message displayed when the condition evaluates to `false`.
     *
     * This message appears as a warning in Terraform's output, helping
     * operators understand what validation failed and why.
     */
    errorMessage = new Block.Input<string>({ hclName: "error_message" });
  };

  /**
   * Creates a new Assertion block.
   *
   * @param parent - The parent construct (must be a {@link Check} block)
   * @param label - A descriptive label for this assertion (used for identification only, does not appear in HCL)
   * @param inputs - The condition and error message for this assertion
   *
   * @example
   * ```typescript
   * new Assertion(c, "deletion_protection", {
   *   condition: "data.aws_lb.app.enable_deletion_protection",
   *   errorMessage: "Load balancer must have deletion protection enabled",
   * });
   * ```
   */
  constructor(
    parent: Construct,
    readonly assertionLabel: string,
    inputs: Assertion["inputs"],
  ) {
    super(parent, "assert", [], inputs);
  }
}
