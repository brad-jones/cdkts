/**
 * Provider binding generation for CDKTS.
 *
 * Generates typed TypeScript bindings from Terraform provider schemas.
 *
 * @module
 */

export { generate, parseProviderSource } from "./generate.ts";
export type { GenerateOptions } from "./generate.ts";
export type * from "./schema_types.ts";
