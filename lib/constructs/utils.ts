import { format } from "@cdktf/hcl-tools";
import { snakeCase } from "@mesqueeb/case-anything";
import { Block } from "./blocks/block.ts";
import { Attribute } from "./input_output/attribute.ts";
import { RawHcl } from "./rawhcl.ts";

export async function fmtHcl(hcl: string, enabled = true): Promise<string> {
  return enabled ? await format(hcl) : hcl;
}

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
    .replace(/\t/g, "\\t") // Tab
    .replace(/\$/g, "\\$") // Dollar sign (prevents interpolation)
    .replace(/%/g, "\\%"); // Percent sign (prevents directives)

  // Restore interpolations as HCL syntax
  return escaped.replace(
    // deno-lint-ignore no-control-regex
    /\u0001INTERPOLATION_(\d+)\u0001/g,
    (_, index) => `\${${interpolations[parseInt(index)]}}`,
  );
}

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
      .map(([k, v]) => `${snakeCase(k)} = ${toHcl(v, false)}`) // TODO: Can we get away with this global snakeCase transform?
      .join("\n");
    return root ? hcl : `{\n${hcl}\n}`;
  }

  throw new Error(`unhandled type: ${JSON.stringify(obj)}`);
}
