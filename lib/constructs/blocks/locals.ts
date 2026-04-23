import { outdent } from "@cspotcode/outdent";
import type { Construct } from "../construct.ts";
import { fmtHcl, toHcl as valueToHcl } from "../utils.ts";
import { Block } from "./block.ts";

/**
 * Represents a single Terraform/OpenTofu local value.
 *
 * Local values let you assign a name to an expression so it can be used
 * multiple times within a configuration without repetition. Each `Local`
 * instance produces a `locals {}` block containing a single named attribute.
 *
 * @see https://developer.hashicorp.com/terraform/language/values/locals
 *
 * @example
 * ```typescript
 * // Simple string local
 * const env = new Local(this, "environment", { value: "production" });
 * // env.ref === "local.environment"
 *
 * // Object local
 * const tags = new Local(this, "common_tags", {
 *   value: { environment: "production", project: "myapp" },
 * });
 * // tags.ref === "local.common_tags"
 * ```
 */
export class Local extends Block<typeof Local> {
  /**
   * Configuration properties for a Local value.
   */
  static override readonly Props = class extends Block.Props {
    /**
     * The value to assign to the local.
     *
     * Can be any expression: a literal primitive, an object, an array,
     * a reference to another resource/variable, or a raw HCL expression
     * via `RawHcl`.
     *
     * @example
     * ```typescript
     * value: "us-west-2"
     * value: 8080
     * value: { env: "production", project: "myapp" }
     * value: resource.outputs.id
     * value: new RawHcl("var.region")
     * ```
     */
    // deno-lint-ignore no-explicit-any
    value = new Block.Input<any>();
  };

  /**
   * Returns the reference string for this local value.
   *
   * @returns The local reference in the form `local.<label>`
   *
   * @example
   * ```typescript
   * const env = new Local(this, "environment", { value: "production" });
   * // env.ref === "local.environment"
   * ```
   */
  override get ref() {
    return `local.${this.label}`;
  }

  /**
   * Creates a new Local value.
   *
   * @param parent - The parent construct (typically a Stack)
   * @param label - The local value name (must be a valid Terraform identifier)
   * @param inputs - Configuration including the value to assign
   *
   * @throws {Error} If `label` is not a valid Terraform identifier
   * @throws {Error} If `inputs.value` is undefined
   *
   * @example
   * ```typescript
   * const region = new Local(this, "region", { value: "us-west-2" });
   * ```
   */
  constructor(parent: Construct, readonly label: string, inputs: Local["inputs"]) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(label)) {
      throw new Error(
        `Invalid local name "${label}": must start with a letter or underscore and contain only letters, digits, underscores, and hyphens.`,
      );
    }

    if (inputs?.value === undefined) {
      throw new Error(`Local "${label}": value is required.`);
    }

    // Pass label as a block label purely for unique construct IDs (ID = "locals.label").
    // toHcl() is overridden to generate the correct labelless HCL format.
    super(parent, "locals", [label], inputs);
  }

  /**
   * Generates the HCL representation of this local value.
   *
   * Produces a `locals {}` block with the named attribute set to the configured value.
   *
   * @param fmt - Whether to format the HCL output (defaults to `true`)
   * @returns A promise resolving to the HCL string
   *
   * @example
   * ```typescript
   * const env = new Local(stack, "environment", { value: "production" });
   * await env.toHcl();
   * // locals {
   * //   environment = "production"
   * // }
   * ```
   */
  override async toHcl(fmt = true): Promise<string> {
    if (this.children.some((_) => _ instanceof Block)) {
      throw new Error(`Local "${this.label}" cannot contain nested blocks.`);
    }

    return await fmtHcl(
      outdent`
        locals {
          ${this.label} = ${valueToHcl(this.inputs?.value, false)}
        }
      `,
      fmt,
    );
  }
}
