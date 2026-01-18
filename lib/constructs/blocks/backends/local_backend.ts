import { Construct } from "../../construct.ts";
import { Backend } from "./backend.ts";

export interface LocalBackendInputs {
  path: string;
}

export class LocalBackend extends Backend<LocalBackendInputs> {
  constructor(parent: Construct, inputs: LocalBackendInputs) {
    super(parent, "local", inputs);
  }
}
