import type { Construct } from "../construct.ts";
import { LocalBackend } from "./backends/local_backend.ts";
import { RemoteBackend } from "./backends/remote_backend.ts";
import { Block } from "./block.ts";

export class Terraform extends Block<typeof Terraform> {
  static override readonly Props = class extends Block.Props {
    /**
     * Specifies which version of the Terraform CLI is allowed to run the configuration.
     *
     * see: https://developer.hashicorp.com/terraform/language/block/terraform#required_version
     */
    requiredVersion = new Block.Input<string | undefined>();

    /**
     * Specifies all provider plugins required to create and manage resources specified in the configuration.
     *
     * see: https://developer.hashicorp.com/terraform/language/block/terraform#required_providers
     */
    requiredProviders = new Block.Input<Record<string, { version: string; source: string }> | undefined>();

    /**
     * Specifies a mechanism for storing Terraform state files.
     *
     * see: https://developer.hashicorp.com/terraform/language/block/terraform#backend
     */
    backend = new Block.Input<
      | Record<"local", LocalBackend["inputs"]>
      | Record<"remote", RemoteBackend["inputs"]>
      | undefined
    >();

    /**
     * Specifies a list of experimental feature names that you want to opt into.
     *
     * see: https://developer.hashicorp.com/terraform/language/block/terraform#experiments
     */
    experiments = new Block.Input<string[] | undefined>();

    // TODO: https://developer.hashicorp.com/terraform/language/block/terraform#provider_meta
    // TODO: https://developer.hashicorp.com/terraform/language/block/terraform#cloud
  };

  constructor(parent: Construct, inputs: Terraform["inputs"], childBlocks?: (b: Block) => void) {
    super(parent, "terraform", [], inputs, childBlocks);

    if (inputs?.requiredProviders) {
      new Block(this, "required_providers", [], inputs.requiredProviders);
    }

    if (inputs?.backend) {
      if ("local" in inputs.backend) {
        new LocalBackend(this, inputs.backend.local);
      } else if ("remote" in inputs.backend) {
        new RemoteBackend(this, inputs.backend.remote);
      }
    }
  }

  protected override mapInputsForHcl(): unknown {
    const inputs = this.inputs;
    if (inputs) {
      delete inputs["backend"];
      delete inputs["requiredProviders"];
    }
    return inputs;
  }
}
