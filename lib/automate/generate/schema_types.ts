/**
 * TypeScript interfaces for the Terraform/OpenTofu `providers schema -json` output.
 *
 * @see https://developer.hashicorp.com/terraform/internals/json-format#providers-schema-representation
 * @module
 */

/**
 * Root structure of the `providers schema -json` output.
 */
export interface ProviderSchema {
  format_version: string;
  provider_schemas: Record<string, ProviderSchemaEntry>;
}

/**
 * Schema for a single provider, including its configuration,
 * resource schemas, data source schemas, and ephemeral resource schemas.
 */
export interface ProviderSchemaEntry {
  provider: SchemaRepresentation;
  resource_schemas: Record<string, SchemaRepresentation>;
  data_source_schemas: Record<string, SchemaRepresentation>;
  ephemeral_resource_schemas?: Record<string, SchemaRepresentation>;
}

/**
 * A schema representation for a provider, resource, or data source.
 */
export interface SchemaRepresentation {
  version: number;
  block: BlockSchema;
}

/**
 * A block schema describes the attributes and nested block types
 * within a Terraform configuration block.
 */
export interface BlockSchema {
  attributes?: Record<string, AttributeSchema>;
  block_types?: Record<string, BlockTypeSchema>;
  description?: string;
  description_kind?: "plain" | "markdown";
  deprecated?: boolean;
}

/**
 * Schema for a single attribute within a block.
 */
export interface AttributeSchema {
  type: SchemaType;
  description?: string;
  description_kind?: "plain" | "markdown";
  deprecated?: boolean;
  required?: boolean;
  optional?: boolean;
  computed?: boolean;
  sensitive?: boolean;
}

/**
 * Schema for a nested block type within a block.
 */
export interface BlockTypeSchema {
  nesting_mode: "single" | "list" | "set" | "map" | "group";
  block: BlockSchema;
  min_items?: number;
  max_items?: number;
}

/**
 * Terraform schema type representation.
 *
 * Can be a simple string type or a complex type encoded as a JSON array.
 *
 * Simple types: `"string"`, `"number"`, `"bool"`, `"dynamic"`
 * Complex types: `["list", T]`, `["set", T]`, `["map", T]`, `["object", {...}]`, `["tuple", [...]]`
 */
export type SchemaType =
  | string
  | [string, SchemaType]
  | [string, Record<string, SchemaType>]
  | [string, SchemaType[]];
