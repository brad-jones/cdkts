export interface InitOptions {
  /**
   * Additional untyped arguments that will be passed through to the underlying
   * terraform binary as is. Use this as an escape hatch for any functionality
   * that CDKTS has yet to fully model in TypeScript.
   */
  passThroughArgs?: string[];

  /**
   * If set to true then the .terraform directory & any .terraform.lock.hcl file
   * are deleted from the projectDir before running the init command.
   */
  reInit?: true;
}
