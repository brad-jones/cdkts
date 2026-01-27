// deno-lint-ignore-file no-explicit-any

import type { Construct } from "../../construct.ts";
import { Resource } from "./resource.ts";

export class DenoResource<Self = typeof DenoResource> extends Resource<Self> {
  static override readonly Props = class extends Resource.Props {
    id = new Resource.Output<string>();
    props = new Resource.Input<any>();
    state = new Resource.Output<any>();
    path = new Resource.Input<string>();
    permissions = new Resource.Input<
      {
        all?: boolean;
        allow?: string[];
        deny?: string[];
      } | undefined
    >();
  };

  constructor(parent: Construct, label: string, inputs: DenoResource["inputs"]) {
    super(parent, "denobridge_resource", label, inputs);
  }
}
