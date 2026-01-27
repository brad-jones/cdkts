import type { Construct } from "../../construct.ts";
import { Provider } from "./provider.ts";

export class DenoBridgeProvider extends Provider<typeof DenoBridgeProvider> {
  static override Props = class extends Provider.Props {
    denoBinaryPath = new Provider.Input<string | undefined>({ default: Deno.execPath() });
    denoVersion = new Provider.Input<string | undefined>();
  };

  constructor(parent: Construct, inputs?: DenoBridgeProvider["inputs"]) {
    super(parent, "denobridge", inputs);
  }
}
