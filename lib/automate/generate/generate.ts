/**
 * Orchestrator for the `generate` command.
 *
 * Extracts a Terraform provider schema and generates typed TypeScript bindings.
 *
 * @module
 */

import { pascalCase } from "@mesqueeb/case-anything";
import { ensureDir } from "@std/fs";
import { join } from "@std/path";
import { Project } from "../project.ts";
import {
  type ConstructKind,
  generateBlockCode,
  generateModFile,
  generateProviderCode,
  generateRootModFile,
} from "./code_gen.ts";
import { generateDenoJson } from "./deno_json_gen.ts";
import type { ProviderSchema } from "./schema_types.ts";

/**
 * Options for the generate command.
 */
export interface GenerateOptions {
  /** The terraform provider source address (e.g., "hashicorp/aws") */
  providerSource: string;

  /** Provider version constraint (e.g., "5.82.0", "~> 5.0") */
  version?: string;

  /** Output directory for generated files */
  outputDir?: string;

  /** IaC flavor to use */
  flavor?: "tofu" | "terraform";

  /** JSR scope (default: "@cdkts-providers") */
  jsrScope?: string;

  /** JSR package name override */
  jsrName?: string;

  /** JSR package version override */
  jsrVersion?: string;

  /** Whether to publish to JSR after generating */
  publish?: boolean;
}

/**
 * Parsed provider source address.
 */
interface ParsedSource {
  /** Registry hostname (e.g., "registry.terraform.io") */
  hostname: string;
  /** Provider namespace (e.g., "hashicorp") */
  namespace: string;
  /** Provider type (e.g., "aws") */
  type: string;
  /** The local name used in terraform config */
  localName: string;
  /** Full source address (e.g., "hashicorp/aws") */
  source: string;
}

/**
 * Parse a Terraform provider source address into its components.
 *
 * Accepts formats:
 * - `type` (e.g., "aws" → "hashicorp/aws")
 * - `namespace/type` (e.g., "hashicorp/aws")
 * - `hostname/namespace/type` (e.g., "registry.terraform.io/hashicorp/aws")
 */
export function parseProviderSource(source: string): ParsedSource {
  const parts = source.split("/");

  if (parts.length === 1) {
    return {
      hostname: "registry.terraform.io",
      namespace: "hashicorp",
      type: parts[0],
      localName: parts[0],
      source: `hashicorp/${parts[0]}`,
    };
  }

  if (parts.length === 2) {
    return {
      hostname: "registry.terraform.io",
      namespace: parts[0],
      type: parts[1],
      localName: parts[1],
      source: `${parts[0]}/${parts[1]}`,
    };
  }

  if (parts.length === 3) {
    return {
      hostname: parts[0],
      namespace: parts[1],
      type: parts[2],
      localName: parts[2],
      source: `${parts[0]}/${parts[1]}/${parts[2]}`,
    };
  }

  throw new Error(`Invalid provider source address: "${source}"`);
}

/**
 * Main entry point for the generate command.
 *
 * Extracts the provider schema, generates TypeScript bindings,
 * formats them, and optionally publishes to JSR.
 */
export async function generate(options: GenerateOptions): Promise<void> {
  const parsed = parseProviderSource(options.providerSource);
  const version = options.version;
  const outputDir = options.outputDir ?? `./${parsed.type}`;
  const jsrScope = options.jsrScope ?? "@cdkts-providers";
  const jsrName = options.jsrName ?? parsed.type;
  const jsrVersion = options.jsrVersion ?? normalizeVersion(version ?? "0.0.0");
  const flavor = options.flavor ?? "tofu";

  // Step 1: Extract the provider schema
  const versionLabel = version ?? "latest";
  console.log(`Extracting schema for provider ${parsed.source}@${versionLabel}...`);
  const schema = await extractProviderSchema(parsed, version, flavor);

  // Find the provider schema entry
  const providerKey = findProviderKey(schema, parsed);
  if (!providerKey) {
    throw new Error(
      `Provider schema not found for ${parsed.source}. Available: ${Object.keys(schema.provider_schemas).join(", ")}`,
    );
  }
  const providerEntry = schema.provider_schemas[providerKey];

  // Step 2: Generate TypeScript files
  console.log(`Generating TypeScript bindings to ${outputDir}...`);
  await ensureDir(outputDir);

  const hasResources = Object.keys(providerEntry.resource_schemas).length > 0;
  const hasDataSources = Object.keys(providerEntry.data_source_schemas).length > 0;
  const hasEphemeral = providerEntry.ephemeral_resource_schemas
    ? Object.keys(providerEntry.ephemeral_resource_schemas).length > 0
    : false;

  // Generate provider
  const providerCode = generateProviderCode(parsed.localName, providerEntry.provider);
  await Deno.writeTextFile(join(outputDir, "provider.ts"), providerCode);

  // Generate resources
  if (hasResources) {
    await generateCategory(
      outputDir,
      "resources",
      "resource",
      providerEntry.resource_schemas,
    );
  }

  // Generate data sources
  if (hasDataSources) {
    await generateCategory(
      outputDir,
      "datasources",
      "datasource",
      providerEntry.data_source_schemas,
    );
  }

  // Generate ephemeral resources
  if (hasEphemeral && providerEntry.ephemeral_resource_schemas) {
    await generateCategory(
      outputDir,
      "ephemeral",
      "ephemeral",
      providerEntry.ephemeral_resource_schemas,
    );
  }

  // Generate root mod.ts
  const rootMod = generateRootModFile({ hasProvider: true, hasResources, hasDataSources, hasEphemeral });
  await Deno.writeTextFile(join(outputDir, "mod.ts"), rootMod);

  // Step 3: Generate deno.json
  const denoJson = generateDenoJson({
    jsrScope,
    jsrName,
    jsrVersion,
    hasResources,
    hasDataSources,
    hasEphemeral,
  });
  await Deno.writeTextFile(join(outputDir, "deno.json"), denoJson);

  // Step 4: Format the generated code
  console.log("Formatting generated code...");
  await runDenoCommand(["lint", "--fix"], outputDir);
  await runDenoCommand(["fmt"], outputDir);

  console.log(`Generated TypeScript bindings in ${outputDir}`);

  // Step 5: Optionally publish
  if (options.publish) {
    console.log("Publishing to JSR...");
    await runDenoCommand(["publish", "--allow-dirty"], outputDir, { throwOnError: true });
    console.log("Published successfully!");
  }
}

/**
 * Extract the provider schema by creating a temp project with a minimal main.tf.
 */
async function extractProviderSchema(
  parsed: ParsedSource,
  version: string | undefined,
  flavor: "tofu" | "terraform",
): Promise<ProviderSchema> {
  const projectDir = await Deno.makeTempDir({ prefix: "cdkts-generate-" });

  try {
    // Write a minimal main.tf with just the required_providers block
    const versionLine = version ? `\n      version = "${version}"` : "";
    const mainTf = `
terraform {
  required_providers {
    ${parsed.localName} = {
      source  = "${parsed.source}"${versionLine}
    }
  }
}
`;
    await Deno.writeTextFile(join(projectDir, "main.tf"), mainTf);

    // Use Project to init (downloads provider) and extract schema
    const project = new Project({ flavor, projectDir });
    await project.init();
    const schema = await project.exec<ProviderSchema>(
      ["providers", "schema", "-json"],
      { json: true },
    );

    return schema;
  } finally {
    try {
      await Deno.remove(projectDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Find the provider key in the schema output.
 *
 * The key format is typically "registry.terraform.io/namespace/type".
 */
function findProviderKey(schema: ProviderSchema, parsed: ParsedSource): string | undefined {
  // Try exact match with hostname
  const fullKey = `${parsed.hostname}/${parsed.namespace}/${parsed.type}`;
  if (schema.provider_schemas[fullKey]) return fullKey;

  // Try without hostname
  const shortKey = `${parsed.namespace}/${parsed.type}`;
  for (const key of Object.keys(schema.provider_schemas)) {
    if (key.endsWith(shortKey)) return key;
  }

  // Try just type name
  for (const key of Object.keys(schema.provider_schemas)) {
    if (key.endsWith(`/${parsed.type}`)) return key;
  }

  return undefined;
}

/**
 * Generate a category of blocks (resources, datasources, or ephemeral).
 */
async function generateCategory(
  outputDir: string,
  subDir: string,
  kind: ConstructKind,
  schemas: Record<string, { version: number; block: import("./schema_types.ts").BlockSchema }>,
): Promise<void> {
  const categoryDir = join(outputDir, subDir);
  await ensureDir(categoryDir);

  const exports: { name: string; path: string }[] = [];

  for (const [typeName, schema] of Object.entries(schemas).sort(([a], [b]) => a.localeCompare(b))) {
    const code = generateBlockCode(kind, typeName, schema);
    const fileName = `${typeName}.ts`;
    await Deno.writeTextFile(join(categoryDir, fileName), code);

    exports.push({ name: pascalCase(typeName), path: fileName });
  }

  const modCode = generateModFile(exports);
  await Deno.writeTextFile(join(categoryDir, "mod.ts"), modCode);
}

/**
 * Normalize a version constraint into a semver-like version for JSR.
 *
 * Strips constraint operators like `~>`, `>=`, etc.
 * If the version is `*` or can't be parsed, returns "0.0.0".
 */
function normalizeVersion(version: string): string {
  if (version === "*") return "0.0.0";

  // Strip common constraint operators
  const cleaned = version.replace(/^[~^>=<!\s]+/, "").trim();

  // Validate it looks like a semver
  if (/^\d+\.\d+\.\d+/.test(cleaned)) {
    // Extract just the major.minor.patch
    const match = cleaned.match(/^(\d+\.\d+\.\d+)/);
    return match ? match[1] : "0.0.0";
  }

  if (/^\d+\.\d+$/.test(cleaned)) {
    return `${cleaned}.0`;
  }

  if (/^\d+$/.test(cleaned)) {
    return `${cleaned}.0.0`;
  }

  return "0.0.0";
}

/**
 * Run a deno command in the given working directory.
 */
async function runDenoCommand(
  args: string[],
  cwd: string,
  options?: { throwOnError?: boolean },
): Promise<void> {
  const command = new Deno.Command("deno", {
    args,
    cwd,
    stdout: "piped",
    stderr: "piped",
  });

  const output = await command.output();
  if (!output.success) {
    const stderr = new TextDecoder().decode(output.stderr);
    if (options?.throwOnError) {
      throw new Error(`deno ${args.join(" ")} failed: ${stderr}`);
    }
    console.warn(`deno ${args.join(" ")} had issues: ${stderr}`);
  }
}
