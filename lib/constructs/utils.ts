import { format } from "@cdktf/hcl-tools";
import type { DenoAction } from "./blocks/actions/deno_action.ts";
import { Block } from "./blocks/block.ts";
import type { DenoDataSource } from "./blocks/datasources/deno_datasource.ts";
import type { DenoResource } from "./blocks/resources/deno_resource.ts";
import type { DenoEphemeralResource } from "./blocks/resources/ephemeral/deno_ephemeral_resource.ts";
import type { Construct } from "./construct.ts";
import { Attribute } from "./input_output/attribute.ts";
import { RawHcl } from "./rawhcl.ts";

/**
 * Union type representing all Deno Bridge block types.
 *
 * Deno Bridge blocks allow executing Deno/TypeScript code within Terraform/OpenTofu configurations.
 */
export type DenoBridgeBlock = DenoAction | DenoDataSource | DenoResource | DenoEphemeralResource;

/**
 * Type guard to check if a construct is any type of Deno Bridge block.
 *
 * @param value - The construct to check.
 * @returns True if the value is a DenoAction, DenoDataSource, DenoResource, or DenoEphemeralResource.
 */
export const isDenoBridgeBlock = (value: Construct): value is DenoBridgeBlock =>
  "__type" in value && typeof value["__type"] === "string" &&
  ["DenoAction", "DenoDataSource", "DenoResource", "DenoEphemeralResource"].includes(value["__type"]);

/**
 * Type guard to check if a construct is a DenoAction.
 *
 * @param value - The construct to check.
 * @returns True if the value is a DenoAction.
 */
export const isDenoAction = (value: Construct): value is DenoAction =>
  "__type" in value && value["__type"] === "DenoAction";

/**
 * Type guard to check if a construct is a DenoDataSource.
 *
 * @param value - The construct to check.
 * @returns True if the value is a DenoDataSource.
 */
export const isDenoDataSource = (value: Construct): value is DenoDataSource =>
  "__type" in value && value["__type"] === "DenoDataSource";

/**
 * Type guard to check if a construct is a DenoResource.
 *
 * @param value - The construct to check.
 * @returns True if the value is a DenoResource.
 */
export const isDenoResource = (value: Construct): value is DenoResource =>
  "__type" in value && value["__type"] === "DenoResource";

/**
 * Type guard to check if a construct is a DenoEphemeralResource.
 *
 * @param value - The construct to check.
 * @returns True if the value is a DenoEphemeralResource.
 */
export const isDenoEphemeralResource = (value: Construct): value is DenoEphemeralResource =>
  "__type" in value && value["__type"] === "DenoEphemeralResource";

/**
 * Formats HCL (HashiCorp Configuration Language) code.
 *
 * @param hcl - The HCL code string to format.
 * @param enabled - Whether formatting is enabled. Defaults to true.
 * @returns A promise that resolves to the formatted HCL string, or the original string if formatting is disabled.
 */
export async function fmtHcl(hcl: string, enabled = true): Promise<string> {
  return enabled ? await format(hcl) : hcl;
}

/**
 * Escapes a string for use in HCL syntax.
 *
 * Handles special characters like backslashes, quotes, newlines, and interpolation markers.
 * Preserves CDKTS interpolation markers while escaping other special characters.
 *
 * @param str - The string to escape.
 * @returns The escaped string safe for use in HCL.
 */
export function escapeHclString(str: string): string {
  // Extract interpolation markers and replace with placeholders
  const interpolations: string[] = [];
  const withPlaceholders = str.replace(
    // deno-lint-ignore no-control-regex
    /\u0000__CDKTS_INTERPOLATION_START__(.+?)__CDKTS_INTERPOLATION_END__\u0000/g,
    (_, id) => {
      interpolations.push(id);
      return `INTERPOLATION_${interpolations.length - 1}`;
    },
  );

  // Escape the string normally
  const escaped = withPlaceholders
    .replace(/\\/g, "\\\\") // Backslash must be first
    .replace(/"/g, '\\"') // Double quote
    .replace(/\n/g, "\\n") // Newline
    .replace(/\r/g, "\\r") // Carriage return
    .replace(/\t/g, "\\t"); // Tab

  /*
    NB: In general HCL syntax outside of the format function, the % symbol is
    not a special operator like the dollar sign ($) used for string interpolation
    (${...}) or the asterisk (*) for splat expressions. Therefore, it can typically
    be used as a literal character within strings without special escaping.

    TODO: We might introduce a special format helper function if we ever
    find ourselves needing to do native tf string formatting. My hope is we
    can just use ES string templates, everywhere format would have been
    used in traditional HCL.

    Similarly we do not actually need to escape the $. HCL only treats ${} as special.
    And since in JavaScript we can use string templates as well as normal strings
    we can easily decide if we want to interpolate using JavaScript or HCL.
  */

  // Restore interpolations as HCL syntax
  return escaped.replace(
    // deno-lint-ignore no-control-regex
    /\u0001INTERPOLATION_(\d+)\u0001/g,
    (_, index) => `\${${interpolations[parseInt(index)]}}`,
  );
}

/**
 * Converts a JavaScript/TypeScript object to HCL syntax.
 *
 * Handles various data types including primitives, arrays, objects, and special CDKTS types.
 * - Converts object keys from camelCase to snake_case
 * - Handles RawHcl, Block, and Attribute instances specially
 * - Recursively processes nested structures
 *
 * @param obj - The object to convert to HCL.
 * @param root - Whether this is a root-level object. Defaults to true.
 * @returns The HCL string representation of the object.
 * @throws {Error} If an unhandled type is encountered.
 */
export function toHcl(obj: unknown, root = true): string {
  if (obj === null || typeof obj === "undefined") {
    return "null";
  }

  if (typeof obj === "string") {
    return `"${escapeHclString(obj)}"`;
  }

  if (typeof obj === "boolean") {
    return obj ? "true" : "false";
  }

  if (typeof obj === "number") {
    return `${obj}`;
  }

  if (Array.isArray(obj)) {
    return `[${obj.map((item) => toHcl(item, false)).join(",")}]`;
  }

  if (obj instanceof RawHcl) {
    return obj.value;
  }

  if (obj instanceof Block) {
    return obj.ref;
  }

  if (obj instanceof Attribute) {
    return obj.id;
  }

  if (typeof obj === "object") {
    const hcl = Object.entries(obj)
      .filter(([_, v]) => typeof v !== "undefined")
      .map(([k, v]) => `${k} = ${toHcl(v, false)}`)
      .join("\n");
    return root ? hcl : `{\n${hcl}\n}`;
  }

  throw new Error(`unhandled type: ${JSON.stringify(obj)}`);
}
