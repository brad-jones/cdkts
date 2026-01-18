import { format } from "@cdktf/hcl-tools";
import { Attribute } from "./attribute.ts";

export async function fmtHcl(hcl: string, enabled = true): Promise<string> {
  return enabled ? await format(hcl) : hcl;
}

export function toHcl(obj: unknown, root = true): string {
  if (obj === null || typeof obj === "undefined") {
    return "null";
  }

  if (typeof obj === "string") {
    return `"${obj}"`;
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
