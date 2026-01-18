import { Construct } from "../../construct.ts";
import { Resource, ResourceInputs } from "./resource.ts";

// deno-lint-ignore no-explicit-any
export interface DenoResourceInputs<Props extends any = any> extends ResourceInputs {
  path: string;
  props: Props;
  permissions?: DenoPermissions;
}

// deno-lint-ignore no-explicit-any
export interface DenoResourceOutputs<State extends any = any> {
  id: string;
  state: State;
}

export interface DenoPermissions {
  all?: boolean;
  allow?: string[];
  deny?: string[];
}

// deno-lint-ignore no-explicit-any
export class DenoResource<Props extends any = any, State extends any = any>
  extends Resource<DenoResourceInputs<Props>, DenoResourceOutputs<State>> {
  constructor(parent: Construct, label: string, inputs: DenoResourceInputs<Props>) {
    super(parent, "denobridge_resource", label, inputs);
  }
}
