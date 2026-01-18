export interface PlanOptions {
  quiet?: boolean;

  /**
   * Select the "destroy" planning mode, which creates a plan to destroy all
   * objects currently managed by this Terraform configuration instead of the
   * usual behavior.
   */
  destroy?: true;

  /**
   * Select the "refresh only" planning mode, which checks whether remote objects
   * still match the outcome of the most recent Terraform apply but does not propose
   * any actions to undo any changes made outside of Terraform.
   */
  refreshOnly?: true;

  /**
   * Skip checking for external changes to remote objects while creating the plan.
   * This can potentially make planning faster, but at the expense of possibly planning
   * against a stale record of the remote system state.
   */
  refresh?: boolean;

  /**
   * Force replacement of a particular resource instance using its resource address.
   * If the plan would've normally produced an update or no-op action for this instance,
   * Terraform will plan to replace it instead. You can use this option multiple times
   * to replace more than one object.
   */
  replace?: string[];

  /**
   * Limit the planning operation to only the given module, resource, or resource
   * instance and all of its dependencies. You can use this option multiple times to
   * include more than one object. This is for exceptional use only.
   */
  target?: string[];

  /**
   * Set a value for one of the input variables in the root module of the configuration.
   * Use this option more than once to set more than one variable.
   */
  var?: Record<string, string>;

  /**
   * Load variable values from the given file, in addition to the default files
   * terraform.tfvars and *.auto.tfvars. Use this option more than once to include
   * more than one variables file.
   */
  varFile?: string[];

  /**
   * If Terraform produces any warnings that are not accompanied by errors, shows
   * them in a more compact form that includes only the summary messages.
   */
  compactWarnings?: boolean;

  /**
   * Return detailed exit codes when the command exits. This will change the meaning
   * of exit codes to:
   * 0 - Succeeded, diff is empty (no changes)
   * 1 - Errored
   * 2 - Succeeded, there is a diff
   */
  detailedExitcode?: boolean;

  /**
   * (Experimental) If import blocks are present in configuration, instructs Terraform
   * to generate HCL for any imported resources not already present. The configuration
   * is written to a new file at PATH, which must not already exist. Terraform may
   * still attempt to write configuration if the plan errors.
   */
  generateConfigOut?: string;

  /**
   * Ask for input for variables if not directly set.
   */
  input?: boolean;

  /**
   * Don't hold a state lock during the operation. This is dangerous if others might
   * concurrently run commands against the same workspace.
   */
  lock?: boolean;

  /**
   * Duration to retry a state lock.
   */
  lockTimeout?: string;

  /**
   * If specified, output won't contain any color.
   */
  noColor?: boolean;

  /**
   * Limit the number of concurrent operations. Defaults to 10.
   */
  parallelism?: number;

  /**
   * A legacy option used for the local backend only. See the local backend's
   * documentation for more information.
   */
  state?: string;
}
