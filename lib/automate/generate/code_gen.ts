import { camelCase, pascalCase } from "@mesqueeb/case-anything";
import type { BlockSchema, BlockTypeSchema, SchemaRepresentation } from "./schema_types.ts";
import { terraformTypeToTs } from "./type_mapper.ts";

/** What kind of top-level construct we are generating. */
export type ConstructKind = "resource" | "datasource" | "ephemeral" | "provider";

/** Aggregated result of code generation for a single provider. */
export interface GeneratedFiles {
  /** path relative to output-dir → file content */
  files: Map<string, string>;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates TypeScript source for the provider configuration class.
 */
export function generateProviderCode(
  providerLocalName: string,
  schema: SchemaRepresentation,
): string {
  const className = pascalCase(providerLocalName);
  const { propLines, nestedInterfaces, nestedBlockNames } = generatePropsAndInterfaces(
    className,
    schema.block,
    "Provider",
  );

  const nestedBlockConstructorLines = generateNestedBlockConstructor(className, schema.block);
  const nestedBlockDeleteLines = nestedBlockNames.map(
    (name) => `    delete inputs["${name}"];`,
  );

  const hasNestedBlocks = nestedBlockNames.length > 0;

  const lines: string[] = [
    `// deno-lint-ignore-file no-explicit-any`,
    `import type { Construct } from "@brad-jones/cdkts/constructs";`,
  ];

  const blockImports = new Set(["Provider"]);
  if (hasNestedBlocks) blockImports.add("Block");
  lines.push(
    `import { ${[...blockImports].sort().join(", ")} } from "@brad-jones/cdkts/constructs";`,
  );

  if (hasNestedBlocks) {
    lines.push(`import { snakeCaseKeys } from "@brad-jones/cdkts/constructs";`);
  }

  lines.push(``);
  lines.push(...nestedInterfaces);
  lines.push(`export class ${className} extends Provider<typeof ${className}> {`);
  lines.push(`  static override readonly Props = class extends Provider.Props {`);
  lines.push(...propLines);
  lines.push(`  };`);
  lines.push(``);
  lines.push(`  constructor(parent: Construct, inputs?: ${className}["inputs"]) {`);
  lines.push(`    super(parent, "${providerLocalName}", inputs);`);
  lines.push(...nestedBlockConstructorLines);
  lines.push(`  }`);

  if (hasNestedBlocks) {
    lines.push(``);
    lines.push(`  protected override mapInputsForHcl(): any {`);
    lines.push(`    const inputs = super.mapInputsForHcl();`);
    lines.push(...nestedBlockDeleteLines);
    lines.push(`    return inputs;`);
    lines.push(`  }`);
  }

  lines.push(`}`);
  lines.push(``);

  return lines.join("\n");
}

/**
 * Generates TypeScript source for a resource, data source, or ephemeral resource.
 */
export function generateBlockCode(
  kind: ConstructKind,
  typeName: string,
  schema: SchemaRepresentation,
): string {
  const className = pascalCase(typeName);
  const baseClass = kindToBaseClass(kind);
  const { propLines, nestedInterfaces, nestedBlockNames } = generatePropsAndInterfaces(
    className,
    schema.block,
    baseClass,
  );

  const nestedBlockConstructorLines = generateNestedBlockConstructor(className, schema.block);
  const nestedBlockDeleteLines = nestedBlockNames.map(
    (name) => `    delete inputs["${name}"];`,
  );

  const hasNestedBlocks = nestedBlockNames.length > 0;

  const lines: string[] = [
    `// deno-lint-ignore-file no-explicit-any`,
    `import type { Construct } from "@brad-jones/cdkts/constructs";`,
  ];

  const blockImports = new Set([baseClass]);
  if (hasNestedBlocks) blockImports.add("Block");
  lines.push(
    `import { ${[...blockImports].sort().join(", ")} } from "@brad-jones/cdkts/constructs";`,
  );

  if (hasNestedBlocks) {
    lines.push(`import { snakeCaseKeys } from "@brad-jones/cdkts/constructs";`);
  }

  lines.push(``);
  lines.push(...nestedInterfaces);
  lines.push(`export class ${className} extends ${baseClass}<typeof ${className}> {`);
  lines.push(`  static override readonly Props = class extends ${baseClass}.Props {`);
  lines.push(...propLines);
  lines.push(`  };`);
  lines.push(``);
  lines.push(
    `  constructor(parent: Construct, label: string, inputs${
      hasRequiredInputs(schema.block) ? "" : "?"
    }: ${className}["inputs"]) {`,
  );
  lines.push(`    super(parent, "${typeName}", label, inputs);`);
  lines.push(...nestedBlockConstructorLines);
  lines.push(`  }`);

  if (hasNestedBlocks) {
    lines.push(``);
    lines.push(`  protected override mapInputsForHcl(): any {`);
    lines.push(`    const inputs = super.mapInputsForHcl();`);
    lines.push(...nestedBlockDeleteLines);
    lines.push(`    return inputs;`);
    lines.push(`  }`);
  }

  lines.push(`}`);
  lines.push(``);

  return lines.join("\n");
}

/**
 * Generates a `mod.ts` re-export file for a list of files.
 */
export function generateModFile(exports: { name: string; path: string }[]): string {
  return exports
    .map((e) => `export { ${e.name} } from "./${e.path}";`)
    .join("\n") + "\n";
}

/**
 * Generates the root `mod.ts` that re-exports all categories.
 */
export function generateRootModFile(sections: {
  hasProvider: boolean;
  hasResources: boolean;
  hasDataSources: boolean;
  hasEphemeral: boolean;
}): string {
  const lines: string[] = [];
  if (sections.hasProvider) lines.push(`export * from "./provider.ts";`);
  if (sections.hasResources) lines.push(`export * from "./resources/mod.ts";`);
  if (sections.hasDataSources) lines.push(`export * from "./datasources/mod.ts";`);
  if (sections.hasEphemeral) lines.push(`export * from "./ephemeral/mod.ts";`);
  lines.push(``);
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function kindToBaseClass(kind: ConstructKind): string {
  switch (kind) {
    case "resource":
      return "Resource";
    case "datasource":
      return "DataSource";
    case "ephemeral":
      return "EphemeralResource";
    case "provider":
      return "Provider";
  }
}

/** Returns true if the block has any required attributes or required nested blocks. */
function hasRequiredInputs(block: BlockSchema): boolean {
  if (block.attributes) {
    for (const attr of Object.values(block.attributes)) {
      if (attr.required) return true;
    }
  }
  if (block.block_types) {
    for (const bt of Object.values(block.block_types)) {
      if (bt.min_items && bt.min_items > 0) return true;
    }
  }
  return false;
}

/**
 * Build the constructor argument for Block.Input/Block.Output.
 * Returns empty string when no hclName mapping is needed,
 * or `{ hclName: "snake_case" }` when camelCase differs from the original.
 */
function buildMetaArg(camelName: string, originalName: string): string {
  if (camelName === originalName) return "";
  return `{ hclName: "${originalName}" }`;
}

interface PropsResult {
  propLines: string[];
  nestedInterfaces: string[];
  nestedBlockNames: string[];
}

/**
 * Generate the Props class lines and any nested block interfaces.
 */
function generatePropsAndInterfaces(
  parentClassName: string,
  block: BlockSchema,
  baseClass: string,
): PropsResult {
  const propLines: string[] = [];
  const nestedInterfaces: string[] = [];
  const nestedBlockNames: string[] = [];

  // Sort attributes alphabetically for deterministic output
  if (block.attributes) {
    const sortedAttrs = Object.entries(block.attributes).sort(([a], [b]) => a.localeCompare(b));
    for (const [attrName, attr] of sortedAttrs) {
      // Skip "id" — it's typically a computed attribute provided by terraform
      if (attrName === "id" && attr.computed && !attr.required) continue;

      const camel = camelCase(attrName);
      const tsType = terraformTypeToTs(attr.type);
      const metaArg = buildMetaArg(camel, attrName);

      if (attr.required) {
        propLines.push(
          `    ${camel} = new ${baseClass}.Input<${tsType}>(${metaArg});`,
        );
      } else if (attr.computed && !attr.optional) {
        propLines.push(`    ${camel} = new ${baseClass}.Output<${tsType}>();`);
      } else {
        // optional (possibly also computed)
        propLines.push(
          `    ${camel} = new ${baseClass}.Input<${tsType} | undefined>(${metaArg});`,
        );
      }
    }
  }

  // Nested block types
  if (block.block_types) {
    const sortedBlocks = Object.entries(block.block_types).sort(([a], [b]) => a.localeCompare(b));
    for (const [blockName, blockType] of sortedBlocks) {
      const camel = camelCase(blockName);
      const metaArg = buildMetaArg(camel, blockName);
      const interfaceName = `${parentClassName}${pascalCase(blockName)}`;

      nestedBlockNames.push(blockName);

      // Generate the interface for the nested block
      nestedInterfaces.push(...generateNestedBlockInterface(interfaceName, blockType.block));

      const tsType = nestedBlockTsType(interfaceName, blockType);
      const isRequired = blockType.min_items !== undefined && blockType.min_items > 0;

      if (isRequired) {
        propLines.push(
          `    ${camel} = new ${baseClass}.Input<${tsType}>(${metaArg});`,
        );
      } else {
        propLines.push(
          `    ${camel} = new ${baseClass}.Input<${tsType} | undefined>(${metaArg});`,
        );
      }
    }
  }

  return {
    propLines,
    nestedInterfaces,
    nestedBlockNames,
  };
}

/**
 * Determine the TypeScript type for a nested block based on its nesting mode.
 */
function nestedBlockTsType(interfaceName: string, blockType: BlockTypeSchema): string {
  switch (blockType.nesting_mode) {
    case "single":
    case "group":
      return interfaceName;
    case "list":
    case "set":
      return `${interfaceName}[]`;
    case "map":
      return `Record<string, ${interfaceName}>`;
    default:
      return interfaceName;
  }
}

/**
 * Generates an interface definition for a nested block type.
 */
function generateNestedBlockInterface(interfaceName: string, block: BlockSchema): string[] {
  const lines: string[] = [];
  lines.push(`export interface ${interfaceName} {`);

  if (block.attributes) {
    const sortedAttrs = Object.entries(block.attributes).sort(([a], [b]) => a.localeCompare(b));
    for (const [attrName, attr] of sortedAttrs) {
      // In nested blocks, computed-only attributes are still relevant for the interface
      // but we make them optional since users don't set them
      if (attr.computed && !attr.optional && !attr.required) continue;

      const camel = camelCase(attrName);
      const tsType = terraformTypeToTs(attr.type);
      const optional = attr.required ? "" : "?";
      lines.push(`  ${camel}${optional}: ${tsType};`);
    }
  }

  // Recursive nested blocks within nested blocks
  if (block.block_types) {
    const sortedBlocks = Object.entries(block.block_types).sort(([a], [b]) => a.localeCompare(b));
    for (const [blockName, blockType] of sortedBlocks) {
      const camel = camelCase(blockName);
      const childInterfaceName = `${interfaceName}${pascalCase(blockName)}`;
      const childTsType = nestedBlockTsType(childInterfaceName, blockType);
      const isRequired = blockType.min_items !== undefined && blockType.min_items > 0;
      const optional = isRequired ? "" : "?";
      lines.push(`  ${camel}${optional}: ${childTsType};`);
    }
  }

  lines.push(`}`);
  lines.push(``);

  // Generate child nested block interfaces recursively
  if (block.block_types) {
    const sortedBlocks = Object.entries(block.block_types).sort(([a], [b]) => a.localeCompare(b));
    for (const [blockName, blockType] of sortedBlocks) {
      const childInterfaceName = `${interfaceName}${pascalCase(blockName)}`;
      lines.push(...generateNestedBlockInterface(childInterfaceName, blockType.block));
    }
  }

  return lines;
}

/**
 * Generate constructor lines that create child Block instances from nested block inputs.
 * Handles arbitrary nesting depth by recursively generating child block creation.
 */
function generateNestedBlockConstructor(
  _className: string,
  block: BlockSchema,
): string[] {
  if (!block.block_types) return [];
  return generateNestedBlockLines(block.block_types, "inputs", "this", 4);
}

/**
 * Recursively generates Block construction lines for nested block types.
 * When a block has child block_types, strips those keys from the data
 * before passing to the Block constructor, then recursively creates child Blocks.
 */
function generateNestedBlockLines(
  blockTypes: Record<string, BlockTypeSchema>,
  parentVar: string,
  parentBlockVar: string,
  indent: number,
): string[] {
  const lines: string[] = [];
  const pad = " ".repeat(indent);
  const sortedBlocks = Object.entries(blockTypes).sort(([a], [b]) => a.localeCompare(b));

  for (const [blockName, blockType] of sortedBlocks) {
    const camel = camelCase(blockName);
    const hasChildBlocks = blockType.block.block_types &&
      Object.keys(blockType.block.block_types).length > 0;

    // Names of child block_types that must be stripped from the data
    const childBlockCamelNames = hasChildBlocks
      ? Object.keys(blockType.block.block_types!).map((n) => camelCase(n))
      : [];

    // Helper: generate the inputs expression, stripping child block keys if needed
    const inputsExpr = (dataVar: string): string => {
      if (!hasChildBlocks) {
        return `snakeCaseKeys(${dataVar} as any)`;
      }
      // Destructure to strip nested block keys
      const destructured = childBlockCamelNames.map((n) => `${n}: _${n}`).join(", ");
      return `(() => { const { ${destructured}, ...attrs } = ${dataVar}; return snakeCaseKeys(attrs as any); })()`;
    };

    switch (blockType.nesting_mode) {
      case "single":
      case "group":
        lines.push(`${pad}if (${parentVar}?.${camel}) {`);
        if (hasChildBlocks) {
          lines.push(
            `${pad}  const ${camel}Block = new Block(${parentBlockVar}, "${blockName}", [], ${
              inputsExpr(`${parentVar}.${camel}`)
            });`,
          );
          lines.push(
            ...generateNestedBlockLines(
              blockType.block.block_types!,
              `${parentVar}.${camel}`,
              `${camel}Block`,
              indent + 2,
            ),
          );
        } else {
          lines.push(
            `${pad}  new Block(${parentBlockVar}, "${blockName}", [], ${inputsExpr(`${parentVar}.${camel}`)});`,
          );
        }
        lines.push(`${pad}}`);
        break;

      case "list":
      case "set": {
        const itemVar = `${camel}Item`;
        lines.push(`${pad}if (${parentVar}?.${camel}) {`);
        lines.push(`${pad}  for (const ${itemVar} of ${parentVar}.${camel}) {`);
        if (hasChildBlocks) {
          lines.push(
            `${pad}    const ${camel}Block = new Block(${parentBlockVar}, "${blockName}", [], ${inputsExpr(itemVar)});`,
          );
          lines.push(
            ...generateNestedBlockLines(blockType.block.block_types!, itemVar, `${camel}Block`, indent + 4),
          );
        } else {
          lines.push(
            `${pad}    new Block(${parentBlockVar}, "${blockName}", [], ${inputsExpr(itemVar)});`,
          );
        }
        lines.push(`${pad}  }`);
        lines.push(`${pad}}`);
        break;
      }

      case "map": {
        const itemVar = `${camel}Item`;
        lines.push(`${pad}if (${parentVar}?.${camel}) {`);
        lines.push(`${pad}  for (const [key, ${itemVar}] of Object.entries(${parentVar}.${camel})) {`);
        if (hasChildBlocks) {
          lines.push(
            `${pad}    const ${camel}Block = new Block(${parentBlockVar}, "${blockName}", [key], ${
              inputsExpr(itemVar)
            });`,
          );
          lines.push(
            ...generateNestedBlockLines(blockType.block.block_types!, itemVar, `${camel}Block`, indent + 4),
          );
        } else {
          lines.push(
            `${pad}    new Block(${parentBlockVar}, "${blockName}", [key], ${inputsExpr(itemVar)});`,
          );
        }
        lines.push(`${pad}  }`);
        lines.push(`${pad}}`);
        break;
      }
    }
  }

  return lines;
}
