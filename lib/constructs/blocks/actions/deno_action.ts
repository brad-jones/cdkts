import { Construct } from "../../construct.ts";
import { Action, ActionInputs } from "./action.ts";

// deno-lint-ignore no-explicit-any
export interface DenoActionInputs<Props extends any = any> {
  path: string;
  props: Props;
  permissions?: {
    all?: boolean;
    allow?: string[];
    deny?: string[];
  };
}

// deno-lint-ignore no-explicit-any
export class DenoAction<Props extends any = any> extends Action<DenoActionInputs<Props>> {
  constructor(parent: Construct, label: string, inputs: ActionInputs<DenoActionInputs<Props>>) {
    super(parent, "denobridge_action", label, inputs);
  }
}
