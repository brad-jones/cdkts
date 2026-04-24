import type { Construct } from "../construct.ts";
import { Block } from "./block.ts";

/**
 * Represents a Terraform/OpenTofu `check` block.
 *
 * The `check` block validates your infrastructure outside of the typical resource
 * lifecycle. It executes as the last step of a plan or apply operation. When a
 * check's assertion fails, Terraform reports a **warning** and continues the
 * current operation — it does not block like preconditions or postconditions.
 *
 * A check block must contain at least one {@link Assertion} and may optionally
 * contain a single scoped data source. The scoped data source can only be
 * referenced within the parent check block.
 *
 * Use the child-block callback to compose the check's contents: create
 * {@link DataSource} and {@link Assertion} instances as children of the check.
 *
 * @see https://developer.hashicorp.com/terraform/language/block/check
 *
 * @example
 * ```typescript
 * // Simple assertion without a data source
 * new Check(this, "bucket_name", (c) => {
 *   new Assertion(c, "not_empty", {
 *     condition: 'aws_s3_bucket.main.bucket != ""',
 *     errorMessage: "S3 bucket name must not be empty",
 *   });
 * });
 *
 * // Health check with a scoped data source
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
export class Check extends Block<typeof Check> {
  /**
   * Whether this block scopes its child blocks in HCL output.
   *
   * Check blocks produce nested HCL where the scoped data source appears inside
   * the check block rather than being flattened to the top level. This prevents
   * child {@link DataSource} instances from prefixing their labels.
   */
  override get scopesChildBlocks(): boolean {
    return true;
  }

  /**
   * Creates a new Check block.
   *
   * The child-block callback receives the check instance as its argument.
   * Inside the callback, create {@link DataSource} and {@link Assertion}
   * constructs as children to define the check's contents.
   *
   * @param parent - The parent construct (typically a Stack)
   * @param label - The check name (used as the identifier in Terraform)
   * @param childBlocks - Callback to create the check's child blocks
   *
   * @example
   * ```typescript
   * new Check(this, "health_check", (c) => {
   *   const api = new DataSource(c, "http", "api", { url: "https://api.example.com/health" });
   *
   *   new Assertion(c, "status_ok", {
   *     condition: `${api.outputs.status_code} == 200`,
   *     errorMessage: "Health check failed",
   *   });
   * });
   * ```
   */
  constructor(
    parent: Construct,
    readonly checkLabel: string,
    childBlocks: (c: Check) => void,
  ) {
    super(parent, "check", [checkLabel], {});
    childBlocks(this);
  }
}
