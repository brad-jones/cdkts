export interface ValidateOptions {
  /**
   * Additional untyped arguments that will be passed through to the underlying
   * terraform binary as is. Use this as an escape hatch for any functionality
   * that CDKTS has yet to fully model in TypeScript.
   */
  passThroughArgs?: string[];

  /**
   * Produce output in a machine-readable JSON format, suitable for use in text editor
   * integrations and other automated systems. Always disables color.
   */
  json?: boolean;
}
