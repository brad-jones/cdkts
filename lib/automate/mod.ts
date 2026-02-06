/**
 * Automation API for CDKTS - programmatically manage infrastructure
 *
 * This module provides the automation API for CDKTS, allowing you to
 * programmatically initialize, plan, apply, and destroy infrastructure.
 * It includes the Project class for managing Terraform/OpenTofu projects
 * and StackBundler for compiling stacks into standalone executables.
 *
 * @example
 * ```ts
 * import { Project } from "@brad-jones/cdkts/automate";
 * import MyStack from "./my_stack.ts";
 *
 * const project = new Project({ stack: new MyStack() });
 * await project.init();
 * const plan = await project.plan();
 * await project.apply(plan);
 * ```
 *
 * @module
 */

export * from "./project.ts";
export * from "./stack_bundler/stack_bundler.ts";
