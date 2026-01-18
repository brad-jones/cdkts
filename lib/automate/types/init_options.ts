export interface InitOptions {
  /**
   * Disable backend or HCP Terraform initialization for this configuration and use
   * what was previously initialized instead.
   */
  backend?: boolean;

  /**
   * Configuration to be merged with what is in the configuration file's 'backend' block.
   * This can be either a path to an HCL file with key/value assignments (same format as
   * terraform.tfvars) or a 'key=value' format, and can be specified multiple times.
   * The backend type must be in the configuration itself.
   */
  backendConfig?: string[];

  /**
   * Suppress prompts about copying state data when initializing a new state backend.
   * This is equivalent to providing a "yes" to all confirmation prompts.
   */
  forceCopy?: true;

  /**
   * Copy the contents of the given module into the target directory before initialization.
   */
  fromModule?: string;

  /**
   * Disable downloading modules for this configuration.
   */
  get?: boolean;

  /**
   * Disable interactive prompts. Note that some actions may require interactive prompts
   * and will error if input is disabled.
   */
  input?: boolean;

  /**
   * Don't hold a state lock during backend migration. This is dangerous if others might
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
   * If specified, machine readable output will be printed in JSON format.
   */
  json?: boolean;

  /**
   * Directory containing plugin binaries. This overrides all default search paths for
   * plugins, and prevents the automatic installation of plugins. This flag can be used
   * multiple times.
   */
  pluginDir?: string[];

  /**
   * Reconfigure a backend, ignoring any saved configuration.
   */
  reconfigure?: true;

  /**
   * Reconfigure a backend, and attempt to migrate any existing state.
   */
  migrateState?: true;

  /**
   * Install the latest module and provider versions allowed within configured constraints,
   * overriding the default behavior of selecting exactly the version recorded in the
   * dependency lockfile.
   */
  upgrade?: true;

  /**
   * Set a dependency lockfile mode. Currently only "readonly" is valid.
   */
  lockfile?: string;

  /**
   * A rare option used for HCP Terraform and the remote backend only. Set this to ignore
   * checking that the local and remote Terraform versions use compatible state representations,
   * making an operation proceed even when there is a potential mismatch.
   */
  ignoreRemoteVersion?: true;

  /**
   * Set the Terraform test directory, defaults to "tests".
   */
  testDirectory?: string;
}
