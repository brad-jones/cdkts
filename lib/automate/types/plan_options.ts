export interface PlanOptions {
  /**
   * Additional untyped arguments that will be passed through to the underlying
   * terraform binary as is. Use this as an escape hatch for any functionality
   * that CDKTS has yet to fully model in TypeScript.
   */
  passThroughArgs?: string[];

  /**
   * Set to true to discard any STDOUT from the terraform binary.
   * Otherwise terraform child processes will inherit the current stdio streams.
   */
  quiet?: boolean;

  /**
   * Destroy Terraform-managed infrastructure. The command "terraform destroy" is
   * a convenience alias for this option.
   */
  destroy?: true;
}
