/**
 * Result of a Terraform validate command with JSON output.
 * Based on Terraform CLI JSON output format.
 *
 * @see https://developer.hashicorp.com/terraform/cli/commands/validate#json-output-format
 */
export interface ValidateResult {
  /**
   * The format version of the JSON output.
   * As of Terraform 1.1.0, this is "1.0".
   */
  format_version?: string;

  /**
   * Indicates whether the configuration is valid.
   * true if valid, false if errors were detected.
   */
  valid: boolean;

  /**
   * The number of errors detected.
   * If valid is true, this will be 0.
   */
  error_count: number;

  /**
   * The number of warnings detected.
   * Warnings do not make a configuration invalid.
   */
  warning_count: number;

  /**
   * Array of diagnostic messages (errors and warnings).
   */
  diagnostics: Diagnostic[];
}

/**
 * A diagnostic message from Terraform validation.
 */
export interface Diagnostic {
  /**
   * The severity of the diagnostic: "error" or "warning".
   */
  severity: "error" | "warning" | string;

  /**
   * A short description of the problem.
   */
  summary: string;

  /**
   * Optional additional details about the problem.
   */
  detail?: string;

  /**
   * Optional reference to the source code location related to the diagnostic.
   */
  range?: SourceRange;

  /**
   * Optional snippet of configuration source code related to the diagnostic.
   */
  snippet?: Snippet;
}

/**
 * A reference to a portion of configuration source code.
 */
export interface SourceRange {
  /**
   * The filename as a relative path from the current working directory.
   */
  filename: string;

  /**
   * The start position of the range (inclusive).
   */
  start: SourcePosition;

  /**
   * The end position of the range (exclusive).
   */
  end: SourcePosition;
}

/**
 * A position in a source file.
 */
export interface SourcePosition {
  /**
   * A zero-based byte offset into the file.
   */
  byte: number;

  /**
   * A one-based line number.
   */
  line: number;

  /**
   * A one-based count of Unicode characters from the start of the line.
   */
  column: number;
}

/**
 * An excerpt of configuration source code related to a diagnostic.
 */
export interface Snippet {
  /**
   * Optional summary of the root context of the diagnostic.
   * For example, the resource block containing the expression.
   */
  context?: string | null;

  /**
   * A snippet of Terraform configuration source code.
   */
  code: string;

  /**
   * A one-based line count for where the code excerpt begins in the source file.
   */
  start_line: number;

  /**
   * A zero-based character offset into the code string, pointing at the start of the diagnostic expression.
   */
  highlight_start_offset: number;

  /**
   * A zero-based character offset into the code string, pointing at the end of the diagnostic expression.
   */
  highlight_end_offset: number;

  /**
   * Expression values that may help understand the source of the diagnostic.
   */
  values?: ExpressionValue[];
}

/**
 * Additional information about a value in an expression that triggered a diagnostic.
 */
export interface ExpressionValue {
  /**
   * An HCL-like traversal string (e.g., "var.instance_count").
   * Intended for human readability.
   */
  traversal: string;

  /**
   * A short English-language description of the expression value.
   * Intended for human readability.
   */
  statement: string;
}
