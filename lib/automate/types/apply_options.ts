export interface ApplyOptions {
  quiet?: boolean;

  /**
   * Skip interactive approval of plan before applying.
   */
  autoApprove?: true;

  /**
   * Path to backup the existing state file before modifying. Defaults to the
   * "-state-out" path with ".backup" extension. Set to "-" to disable backup.
   */
  backup?: string;

  /**
   * If Terraform produces any warnings that are not accompanied by errors, show
   * them in a more compact form that includes only the summary messages.
   */
  compactWarnings?: boolean;

  /**
   * Destroy Terraform-managed infrastructure. The command "terraform destroy" is
   * a convenience alias for this option.
   */
  destroy?: true;

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
   * Ask for input for variables if not directly set.
   */
  input?: boolean;

  /**
   * If specified, output won't contain any color.
   */
  noColor?: boolean;

  /**
   * Limit the number of parallel resource operations. Defaults to 10.
   */
  parallelism?: number;

  /**
   * Force replacement of a particular resource instance using its resource address.
   * If apply would've normally produced an update or no-op action for this instance,
   * Terraform will replace it instead. You can use this option multiple times to
   * replace more than one object.
   */
  replace?: string[];

  /**
   * Path to read and save state (unless state-out is specified). Defaults to
   * "terraform.tfstate". Legacy option for the local backend only. See the local
   * backend's documentation for more information.
   */
  state?: string;

  /**
   * Path to write state to that is different than "-state". This can be used to
   * preserve the old state. Legacy option for the local backend only. See the local
   * backend's documentation for more information.
   */
  stateOut?: string;

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
}
