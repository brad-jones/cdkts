import { Construct } from "../../../construct.ts";
import { EphemeralResource, EphemeralResourceInputs } from "./ephemeral_resource.ts";

// deno-lint-ignore no-explicit-any
export interface DenoEphemeralResourceInputs<Props extends any = any> extends EphemeralResourceInputs {
  path: string;
  props: Props;
  permissions?: DenoPermissions;
}

// deno-lint-ignore no-explicit-any
export interface DenoEphemeralResourceOutputs<Result extends any = any> {
  result: Result;
}

export interface DenoPermissions {
  all?: boolean;
  allow?: string[];
  deny?: string[];
}

// deno-lint-ignore no-explicit-any
export class DenoEphemeralResource<Props extends any = any, Result extends any = any>
  extends EphemeralResource<DenoEphemeralResourceInputs<Props>, DenoEphemeralResourceOutputs<Result>> {
  constructor(parent: Construct, label: string, inputs: DenoEphemeralResourceInputs<Props>) {
    super(parent, "denobridge_ephemeral_resource", label, inputs);
  }
}
