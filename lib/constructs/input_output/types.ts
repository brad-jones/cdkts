// deno-lint-ignore-file no-explicit-any

import type { z } from "@zod/zod";

/**
 * Marker class for defining input properties on Stacks and Blocks.
 *
 * Input properties represent values that can be passed into a Stack or Block
 * (e.g., configuration parameters, variables). When used in a Props class,
 * the `InferInputs` utility type extracts these as typed parameters.
 *
 * @template ValueType - The TypeScript type of the input value. Can be a primitive type,
 *                       a Zod schema (for runtime validation), or any other type.
 *                       Defaults to `string`.
 *
 * @example
 * ```typescript
 * class MyStackProps extends Stack.Props {
 *   // Simple string input
 *   name = new Stack.Input<string>();
 *
 *   // Optional number input
 *   port = new Stack.Input<number | undefined>();
 *
 *   // Input with Zod schema validation
 *   config = new Stack.Input<z.ZodObject<{...}>>();
 * }
 * ```
 */
export class Input<ValueType = string> {
  declare readonly __type: ValueType;
  declare readonly __kind: "input";
  constructor(readonly metadata?: any) {}
}

/**
 * Marker class for defining output properties on Stacks and Blocks.
 *
 * Output properties represent computed or exported values from a Stack or Block
 * (e.g., resource IDs, computed attributes). When used in a Props class,
 * the `InferOutputs` utility type extracts these as typed return values.
 *
 * @template ValueType - The TypeScript type of the output value. Can be a primitive type,
 *                       a Zod schema, or any other type. Defaults to `string`.
 *
 * @example
 * ```typescript
 * class MyStackProps extends Stack.Props {
 *   // Output for a computed resource ID
 *   instanceId = new Stack.Output<string>();
 *
 *   // Output for a complex computed value
 *   metadata = new Stack.Output<Record<string, any>>();
 * }
 * ```
 */
export class Output<ValueType = string> {
  declare readonly __type: ValueType;
  declare readonly __kind: "output";
  constructor(readonly metadata?: any) {}
}

/**
 * Utility type that extracts the Props class from a type.
 *
 * If the type `T` has a static `Props` property, this returns the type of that property.
 * Otherwise, it returns `T` itself. This is used internally to navigate from a Stack/Block
 * class type to its Props definition.
 *
 * @template T - The type to extract Props from (typically `typeof MyStack` or `typeof MyBlock`)
 *
 * @example
 * ```typescript
 * class MyStack extends Stack<typeof MyStack> {
 *   static override readonly Props = class extends Stack.Props {
 *     name = new Stack.Input<string>();
 *   };
 * }
 *
 * type MyStackProps = PropsOf<typeof MyStack>; // typeof MyStack.Props
 * ```
 */
export type PropsOf<T> = T extends { Props: infer P } ? P : T;

/**
 * Utility type that extracts the instance type from a constructor or abstract class.
 *
 * Similar to TypeScript's built-in `InstanceType<T>`, but also works with abstract classes.
 * If `T` is not a constructor, it returns `T` itself.
 *
 * @template T - The constructor type to extract the instance type from
 *
 * @example
 * ```typescript
 * abstract class MyAbstractClass {
 *   value: string;
 * }
 *
 * type Instance = InstanceTypeOf<typeof MyAbstractClass>; // MyAbstractClass
 * ```
 */
export type InstanceTypeOf<T> = T extends abstract new (...args: any) => infer R ? R : T;

/**
 * Infers input property types from a Stack or Block's Props class.
 *
 * This type utility analyzes a Props class and creates a typed object containing
 * all properties marked with `Input<T>`. It:
 * - Extracts the value type from each `Input<ValueType>`
 * - Makes properties required if their value type doesn't include `undefined`
 * - Makes properties optional if their value type includes `undefined`
 * - Unwraps Zod schemas using `z.infer<T>` if the value type is a ZodType
 * - Allows additional string-indexed properties via intersection with `Record<string, any>`
 *
 * @template T - The Stack or Block type (typically `typeof MyStack`)
 *
 * @example
 * ```typescript
 * class MyStackProps extends Stack.Props {
 *   filename = new Stack.Input<string>();           // Required
 *   port = new Stack.Input<number | undefined>();   // Optional
 * }
 *
 * type Inputs = InferInputs<typeof MyStack>;
 * // { filename: string; port?: number; [key: string]: any }
 * ```
 */
export type InferInputs<T> = _inferInputs<T> & Record<string, any>;

/**
 * Infers output property types from a Stack or Block's Props class.
 *
 * This type utility analyzes a Props class and creates a typed object containing
 * all properties marked with `Output<T>`. It:
 * - Extracts the value type from each `Output<ValueType>`
 * - Makes properties required if their value type doesn't include `undefined`
 * - Makes properties optional if their value type includes `undefined`
 * - Unwraps Zod schemas using `z.infer<T>` if the value type is a ZodType
 * - Allows additional string-indexed properties via intersection with `Record<string, any>`
 *
 * @template T - The Stack or Block type (typically `typeof MyStack`)
 *
 * @example
 * ```typescript
 * class MyStackProps extends Stack.Props {
 *   instanceId = new Stack.Output<string>();        // Required
 *   metadata = new Stack.Output<object | undefined>(); // Optional
 * }
 *
 * type Outputs = InferOutputs<typeof MyStack>;
 * // { instanceId: string; metadata?: object; [key: string]: any }
 * ```
 */
export type InferOutputs<T> = _inferOutputs<T> & Record<string, any>;

/**
 * Internal helper type for inferring input properties.
 *
 * Creates a type with two parts:
 * 1. Required properties: Input properties whose value type doesn't include `undefined`
 * 2. Optional properties: Input properties whose value type includes `undefined`
 *
 * @internal
 */
type _inferInputs<T> =
  & {
    [
      K in keyof InstanceTypeOf<PropsOf<T>> as InstanceTypeOf<PropsOf<T>>[K] extends Input<infer V>
        ? (Extract<V, undefined> extends never ? K : never)
        : never
    ]: InstanceTypeOf<PropsOf<T>>[K] extends Input<infer V> ? V extends z.ZodType ? z.infer<V> : V
      : never;
  }
  & {
    [
      K in keyof InstanceTypeOf<PropsOf<T>> as InstanceTypeOf<PropsOf<T>>[K] extends Input<infer V>
        ? (Extract<V, undefined> extends never ? never : K)
        : never
    ]?: InstanceTypeOf<PropsOf<T>>[K] extends Input<infer V> ? V extends z.ZodType ? z.infer<V> : V
      : never;
  };

/**
 * Internal helper type for inferring output properties.
 *
 * Creates a type with two parts:
 * 1. Required properties: Output properties whose value type doesn't include `undefined`
 * 2. Optional properties: Output properties whose value type includes `undefined`
 *
 * @internal
 */
type _inferOutputs<T> =
  & {
    [
      K in keyof InstanceTypeOf<PropsOf<T>> as InstanceTypeOf<PropsOf<T>>[K] extends Output<infer V>
        ? (Extract<V, undefined> extends never ? K : never)
        : never
    ]: InstanceTypeOf<PropsOf<T>>[K] extends Output<infer V> ? V extends z.ZodType ? z.infer<V> : V
      : never;
  }
  & {
    [
      K in keyof InstanceTypeOf<PropsOf<T>> as InstanceTypeOf<PropsOf<T>>[K] extends Output<infer V>
        ? (Extract<V, undefined> extends never ? never : K)
        : never
    ]?: InstanceTypeOf<PropsOf<T>>[K] extends Output<infer V> ? V extends z.ZodType ? z.infer<V> : V
      : never;
  };
