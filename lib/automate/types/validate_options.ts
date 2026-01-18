export interface ValidateOptions {
  /**
   * Produce output in a machine-readable JSON format, suitable for use in text editor
   * integrations and other automated systems. Always disables color.
   */
  json?: boolean;

  /**
   * If specified, output won't contain any color.
   */
  noColor?: boolean;

  /**
   * If specified, Terraform will not validate test files.
   */
  noTests?: boolean;

  /**
   * Set the Terraform test directory, defaults to "tests".
   */
  testDirectory?: string;

  /**
   * If specified, the command will also validate .tfquery.hcl files.
   */
  query?: boolean;
}
