import { Construct } from "../../construct.ts";
import { Backend } from "./backend.ts";

export interface RemoteBackendInputs {
  organization: string;
}

export class RemoteBackend extends Backend<RemoteBackendInputs> {
  constructor(parent: Construct, inputs: RemoteBackendInputs) {
    super(parent, "remote", inputs);
  }
}
