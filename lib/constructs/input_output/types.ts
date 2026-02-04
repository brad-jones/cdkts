// deno-lint-ignore-file no-explicit-any

import type { z } from "@zod/zod";

export class Input<ValueType = string> {
  declare readonly __type: ValueType;
  declare readonly __kind: "input";
  constructor(readonly metadata?: any) {}
}

export class Output<ValueType = string> {
  declare readonly __type: ValueType;
  declare readonly __kind: "output";
  constructor(readonly metadata?: any) {}
}

export type PropsOf<T> = T extends { Props: infer P } ? P : T;

export type InstanceTypeOf<T> = T extends abstract new (...args: any) => infer R ? R : T;

export type InferInputs<T> = _inferInputs<T> & Record<string, any>;

export type InferOutputs<T> = _inferOutputs<T> & Record<string, any>;

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
