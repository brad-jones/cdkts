import type { Construct } from "../../construct.ts";
import { Backend } from "./backend.ts";

/**
 * @see https://developer.hashicorp.com/terraform/language/backend/local
 */
export class LocalBackend extends Backend<typeof LocalBackend> {
  static override readonly Props = class extends Backend.Props {
    /**
     * (Optional) The path to the tfstate file.
     * This defaults to "terraform.tfstate" relative to the root module by default.
     */
    path = new Backend.Input<string | undefined>();

    /**
     * (Optional) The path to non-default workspaces.
     */
    workspaceDir = new Backend.Input<string | undefined>();
  };

  constructor(parent: Construct, inputs?: LocalBackend["inputs"]) {
    super(parent, "local", inputs);
  }
}
