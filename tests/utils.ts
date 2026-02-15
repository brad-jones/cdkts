/**
 * Creates a RegExp from a template string with wildcards.
 *
 * - Use `*` as a wildcard to match any content
 * - Whitespace is normalized to match any amount of whitespace
 * - All other regex special characters are escaped
 */
export function wildCard(template: string): RegExp {
  // Trim leading and trailing whitespace
  let pattern = template.trim();

  // Escape regex special characters except *
  pattern = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");

  // Replace * with .*? (non-greedy wildcard)
  pattern = pattern.replace(/\*/g, ".*?");

  // Normalize whitespace: replace consecutive whitespace with \s+
  pattern = pattern.replace(/\s+/g, "\\s+");

  return new RegExp(pattern);
}
