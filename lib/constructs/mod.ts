/**
 * Core constructs for defining infrastructure as code
 *
 * This module provides the fundamental building blocks for defining infrastructure
 * using CDKTS. It includes constructs for stacks, resources, providers, data sources,
 * backends, and more. All constructs are type-safe and synthesize to clean HCL.
 *
 * @example
 * ```ts
 * import { Stack, Resource, Terraform } from "@brad-jones/cdkts/constructs";
 *
 * export default class MyStack extends Stack<typeof MyStack> {
 *   constructor() {
 *     super(`${import.meta.url}#${MyStack.name}`);
 *
 *     new Terraform(this, {
 *       requiredProviders: {
 *         local: { source: "hashicorp/local", version: "2.6.1" }
 *       }
 *     });
 *
 *     new Resource(this, "local_file", "hello", {
 *       filename: "${path.module}/message.txt",
 *       content: "Hello World"
 *     });
 *   }
 * }
 * ```
 *
 * @module
 */

export * from "./blocks/actions/action.ts";
export * from "./blocks/actions/deno_action.ts";
export * from "./blocks/backends/backend.ts";
export * from "./blocks/backends/local_backend.ts";
export * from "./blocks/backends/remote_backend.ts";
export * from "./blocks/block.ts";
export * from "./blocks/datasources/datasource.ts";
export * from "./blocks/datasources/deno_datasource.ts";
export * from "./blocks/providers/denobridge.ts";
export * from "./blocks/providers/provider.ts";
export * from "./blocks/resources/deno_resource.ts";
export * from "./blocks/resources/ephemeral/deno_ephemeral_resource.ts";
export * from "./blocks/resources/ephemeral/ephemeral_resource.ts";
export * from "./blocks/resources/resource.ts";
export * from "./blocks/terraform.ts";
export * from "./construct.ts";
export * from "./input_output/attribute.ts";
export * from "./stack.ts";
