import { Construct } from "../../construct.ts";
import { Provider, ProviderInputs } from "./provider.ts";

export interface DenoBridgeInputs extends ProviderInputs {
  denoBinaryPath?: string;
  denoVersion?: string;
}

export class DenoBridge extends Provider<DenoBridgeInputs> {
  constructor(parent: Construct, inputs?: DenoBridgeInputs) {
    super(parent, "denobridge", inputs!);
  }

  protected override mapInputsForHcl(): unknown {
    const inputs = { denoBinaryPath: Deno.execPath(), ...this.inputs };
    return {
      deno_binary_path: inputs.denoBinaryPath,
      deno_version: inputs.denoVersion,
    };
  }
}
