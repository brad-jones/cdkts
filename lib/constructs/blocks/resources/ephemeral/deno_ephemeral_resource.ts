import type { Construct } from "../../../construct.ts";
import { EphemeralResource } from "./ephemeral_resource.ts";

export class DenoEphemeralResource<Self = typeof DenoEphemeralResource> extends EphemeralResource<Self> {
  static override readonly Props = class extends EphemeralResource.Props {
    id = new EphemeralResource.Output<string>();
    props = new EphemeralResource.Input<any>();
    result = new EphemeralResource.Output<any>();
    path = new EphemeralResource.Input<string>();
    permissions = new EphemeralResource.Input<
      {
        all?: boolean;
        allow?: string[];
        deny?: string[];
      } | undefined
    >();
  };

  constructor(parent: Construct, label: string, inputs: DenoEphemeralResource["inputs"]) {
    super(parent, "denobridge_ephemeral_resource", label, inputs);
  }
}
