/**
 * Generates a `deno.json` configuration file for the generated provider package.
 *
 * @module
 */

export interface DenoJsonOptions {
  /** JSR scope (e.g., `@cdkts-providers`) */
  jsrScope: string;
  /** JSR package name (e.g., `aws`) */
  jsrName: string;
  /** Package version */
  jsrVersion: string;
  /** Whether the package has resources */
  hasResources: boolean;
  /** Whether the package has data sources */
  hasDataSources: boolean;
  /** Whether the package has ephemeral resources */
  hasEphemeral: boolean;
}

/**
 * Generates the content of a `deno.json` file for JSR publishing.
 */
export function generateDenoJson(options: DenoJsonOptions): string {
  const exports: Record<string, string> = {
    ".": "./mod.ts",
  };

  if (options.hasResources) {
    exports["./resources"] = "./resources/mod.ts";
  }
  if (options.hasDataSources) {
    exports["./datasources"] = "./datasources/mod.ts";
  }
  if (options.hasEphemeral) {
    exports["./ephemeral"] = "./ephemeral/mod.ts";
  }

  const config = {
    name: `${options.jsrScope}/${options.jsrName}`,
    version: options.jsrVersion,
    license: "MIT",
    exports,
    imports: {
      "@brad-jones/cdkts/constructs": "jsr:@brad-jones/cdkts/constructs",
    },
    publish: {
      include: ["**/*.ts", "deno.json", "README.md"],
    },
    lint: {
      rules: {
        exclude: ["no-slow-types"],
      },
    },
  };

  return JSON.stringify(config, null, 2) + "\n";
}
