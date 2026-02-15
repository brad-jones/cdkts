// deno-lint-ignore-file no-explicit-any

import { DatasourceProvider } from "@brad-jones/terraform-provider-denobridge";
import { decodeBase64, encodeBase64 } from "@std/encoding";
import { minifySync } from "oxc-minify";
import type { Construct } from "../../construct.ts";
import { Attribute } from "../../input_output/attribute.ts";
import { Stack } from "../../stack.ts";
import type { DataSource } from "./datasource.ts";
import { DenoDataSource } from "./deno_datasource.ts";

/**
 * Properties for creating a {@linkcode DenoFormat} data source.
 *
 * @template TArgs - Tuple type of the arguments passed to the formatter function
 */
export interface DenoFormatProps<TArgs extends unknown[] = unknown[]> {
  /** The arguments to pass to the formatter function (typically construct output references). */
  args: TArgs;
  /** A function that will be serialized and executed by the Deno bridge provider at plan/apply time. */
  formatter: (...args: TArgs) => string | Promise<string>;
}

/** The result type returned by a {@linkcode DenoFormat} data source or the {@linkcode format} function. */
export type DenoFormatResult = string;

/**
 * Convenience function for creating a {@linkcode DenoFormat} data source.
 *
 * Inspects `args` to find an {@linkcode Attribute} reference. Walks the
 * construct tree from that Attribute's source to locate the enclosing Stack, then
 * creates a `DenoFormat` data source attached to it.
 *
 * **Note:** At least one argument must be an Attribute instance (i.e., a construct
 * output reference). If all values are already resolved, this function will throw
 * an error. In that case, execute the formatter directly instead of using this function.
 *
 * @param formatter - A function that will be serialized and executed by the Deno bridge provider
 * @param args - Arguments to pass to the formatter (at least one must be an Attribute reference)
 * @returns The formatted result attribute reference
 * @throws {Error} If none of the args are Attribute instances
 *
 * @example
 * ```typescript
 * new Resource(this, "foo", "bar", {
 *   baz: format((r, g) => `${r} + ${g}`, red.outputs.rgbValue, green.outputs.rgbValue),
 * });
 * ```
 */
export function format<TArgs extends unknown[] = unknown[]>(
  formatter: (...args: TArgs) => string | Promise<string>,
  ...args: TArgs
): DenoFormatResult {
  const attr = findAttribute(args);

  if (!attr?.source) {
    throw new Error(`
    At least one argument must be a construct output reference (i.e., an Attribute instance).
    If this was intentional and all values are already resolved, execute the formatter directly to get the result string.
    We probably shouldn't execute it for you because it could be asynchronous, and you can't use 'await' in a constructor.
    You likely made your formatter function asynchronous to dynamically import some module at runtime,
    but if you only need to format some already-resolved values, you can just do that directly without using this 'format' function at all.
  `);
  }

  return new DenoFormat(Stack.of(attr.source), `deno_format_${generateId()}`, { args, formatter }).outputs.result;
}

/**
 * A Terraform data source that serializes and executes a TypeScript formatter function
 * via the Deno bridge provider.
 *
 * This construct is useful for performing string interpolation that depends on
 * Terraform-managed values (i.e., {@linkcode Attribute} references) which are only
 * resolved at plan/apply time. The formatter function is minified, base64-encoded,
 * and shipped to the Deno bridge provider for execution.
 *
 * For a more ergonomic API, prefer the {@linkcode format} convenience function.
 *
 * @template TArgs - Tuple type of the arguments passed to the formatter function
 *
 * @example
 * ```typescript
 * const redPlusGreen = new DenoFormat(this, crypto.randomUUID(), {
 *   args: [red.outputs.rgbValue, green.outputs.rgbValue],
 *   formatter: (r, g) => `${r} + ${g}`,
 * });
 *
 * new Resource(this, "foo", "bar", {
 *   baz: redPlusGreen.outputs.result,
 * });
 * ```
 */
export class DenoFormat<TArgs extends unknown[] = unknown[]> extends DenoDataSource<typeof DenoFormat> {
  static override readonly Props = class extends DenoDataSource.Props {
    override props = new DenoDataSource.Input<DenoFormatProps<unknown[]>>();
    override result = new DenoDataSource.Output<DenoFormatResult>();
  };

  constructor(
    parent: Construct,
    label: string,
    props: DenoFormatProps<TArgs>,
    options?: DataSource["inputs"] & {
      /**
       * Optional path to a Deno configuration file (e.g., `deno.json` or `deno.jsonc`).
       *
       * If specified, the Deno script will be executed with the settings from this
       * config file. This allows you to define compiler options, import maps, and
       * other Deno configurations in a separate file.
       */
      configFile?: string;

      /**
       * Deno runtime permissions for the script.
       *
       * Controls what system resources the Deno script can access at runtime.
       * Following Deno's security model, scripts have no permissions by default.
       *
       * @see {@link https://registry.terraform.io/providers/brad-jones/denobridge/latest/docs/guides/deno-permissions | Deno Permissions Guide}
       * @see {@link https://docs.deno.com/runtime/fundamentals/security/#permissions | Deno Security Documentation}
       *
       * @example
       * ```ts
       * // Grant all permissions (use with caution!)
       * permissions: { all: true }
       *
       * // Fine-grained control
       * permissions: {
       *   allow: [
       *     "read",                    // --allow-read (all paths)
       *     "write=/tmp",              // --allow-write=/tmp
       *     "net=example.com:443",     // --allow-net=example.com:443
       *     "env=HOME,USER",           // --allow-env=HOME,USER
       *     "run=curl,whoami",         // --allow-run=curl,whoami
       *   ]
       * }
       *
       * // Deny specific permissions (deny takes precedence over allow)
       * permissions: {
       *   allow: ["net"],              // Allow all network access
       *   deny: ["net=evil.com"]       // Except evil.com
       * }
       * ```
       */
      permissions?: {
        /** Grant all permissions to the Deno script (maps to `--allow-all`). Use with caution. */
        all?: boolean;

        /** List of permissions to allow (e.g., `read`, `write=/tmp`, `net=example.com:443`). */
        allow?: string[];

        /** List of permissions to deny. Deny rules take precedence over allow rules. */
        deny?: string[];
      };
    },
  ) {
    super(parent, label, {
      path: import.meta.url,
      props: {
        args: props.args,
        formatterString: serializeFunc(props.formatter),
      },
      ...options,
    });
  }
}

if (import.meta.main) {
  new DatasourceProvider<{ args: unknown[]; formatterString: string }, DenoFormatResult>({
    async read({ args, formatterString }) {
      return await parseFunc(formatterString)(...args);
    },
  });
}

function findAttribute(args: unknown[]): Attribute | undefined {
  for (const arg of args) {
    if (arg instanceof Attribute) return arg;
    if (Array.isArray(arg)) {
      const found = findAttribute(arg);
      if (found) return found;
    }
  }
  return undefined;
}

function generateId(
  length = 16,
  charset: string = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
): string {
  return Array.from(Array(length)).reduce((prev, curr) => {
    curr = prev + charset[Math.floor(Math.random() * charset.length)];
    return curr;
  }, "");
}

function serializeFunc(func: (...args: any[]) => any) {
  // Assign the function so that it is not tree shaken it's self
  const funcString = `const func = ${func.toString()};`;

  // Minify the function source
  const result = minifySync("func.js", funcString);
  if (result.errors.length > 0) {
    throw result.errors;
  }

  // Strip the variable assignment to get just the function expression
  const minifiedFunc = result.code.replace(/^const \w+=/, "").replace(/;$/, "");

  // Encode with base64 and return
  return encodeBase64(new TextEncoder().encode(minifiedFunc));
}

function parseFunc<T extends (...args: any[]) => any = (...args: any[]) => any>(base64EncodedFunc: string): T {
  return new Function(`return ${new TextDecoder().decode(decodeBase64(base64EncodedFunc))}`)();
}
