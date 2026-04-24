import type { SchemaType } from "./schema_types.ts";

/**
 * Maps a Terraform schema type to a TypeScript type string.
 *
 * Handles both simple types (string, number, bool, dynamic) and complex types
 * encoded as JSON arrays (list, set, map, object, tuple).
 */
export function terraformTypeToTs(schemaType: SchemaType): string {
  if (typeof schemaType === "string") {
    switch (schemaType) {
      case "string":
        return "string";
      case "number":
        return "number";
      case "bool":
        return "boolean";
      case "dynamic":
        return "unknown";
      default:
        return "unknown";
    }
  }

  if (!Array.isArray(schemaType) || schemaType.length < 2) {
    return "unknown";
  }

  const [kind, inner] = schemaType;

  switch (kind) {
    case "list":
    case "set":
      return `${wrapComplex(terraformTypeToTs(inner as SchemaType))}[]`;

    case "map":
      return `Record<string, ${terraformTypeToTs(inner as SchemaType)}>`;

    case "object": {
      const fields = inner as Record<string, SchemaType>;
      const entries = Object.entries(fields).map(([key, val]) => {
        const tsKey = isValidIdentifier(key) ? key : `"${key}"`;
        return `${tsKey}: ${terraformTypeToTs(val)}`;
      });
      if (entries.length === 0) return "Record<string, unknown>";
      return `{ ${entries.join("; ")} }`;
    }

    case "tuple": {
      const elements = inner as SchemaType[];
      const types = elements.map((el) => terraformTypeToTs(el));
      return `[${types.join(", ")}]`;
    }

    default:
      return "unknown";
  }
}

/**
 * Wraps a type string in parentheses if it's a complex type (union/object)
 * before appending `[]` for array notation.
 */
function wrapComplex(ts: string): string {
  if (ts.includes("|") || ts.includes("{")) {
    return `(${ts})`;
  }
  return ts;
}

/**
 * Checks if a string is a valid JavaScript identifier (safe to use unquoted).
 */
function isValidIdentifier(name: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);
}
