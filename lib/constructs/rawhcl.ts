/**
 * A wrapper class for raw HCL (HashiCorp Configuration Language) syntax.
 *
 * This class allows you to output raw HCL identifiers or expressions without
 * any escaping, quoting, or transformation. When serialized, the wrapped value
 * is output directly as-is.
 *
 * @example
 * ```typescript
 * // Output HCL identifier without quotes
 * new RawHcl("pre")  // Outputs: pre
 *
 * // Output HCL expression
 * new RawHcl("${var.example}")  // Outputs: ${var.example}
 * ```
 */
export class RawHcl {
  /**
   * Creates a new RawHcl wrapper.
   *
   * @param value - The raw HCL syntax to output without transformation
   */
  constructor(readonly value: string) {}
}
