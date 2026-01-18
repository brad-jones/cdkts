import { Construct } from "../construct.ts";
import { LocalBackend, LocalBackendInputs } from "./backends/local_backend.ts";
import { RemoteBackend, RemoteBackendInputs } from "./backends/remote_backend.ts";
import { Block } from "./block.ts";

export interface TerraformInputs {
  /**
   * Specifies which version of the Terraform CLI is allowed to run the configuration.
   *
   * see: https://developer.hashicorp.com/terraform/language/block/terraform#required_version
   */
  requiredVersion?: string;

  /**
   * Specifies all provider plugins required to create and manage resources specified in the configuration.
   *
   * see: https://developer.hashicorp.com/terraform/language/block/terraform#required_providers
   */
  requiredProviders?: Record<string, { version: string; source: string }>;

  /**
   * Specifies a mechanism for storing Terraform state files.
   *
   * see: https://developer.hashicorp.com/terraform/language/block/terraform#backend
   */
  backend?: Record<"local", LocalBackendInputs> | Record<"remote", RemoteBackendInputs>;

  /**
   * Specifies a list of experimental feature names that you want to opt into.
   *
   * see: https://developer.hashicorp.com/terraform/language/block/terraform#experiments
   */
  experiments?: string[];

  // TODO: https://developer.hashicorp.com/terraform/language/block/terraform#provider_meta
  // TODO: https://developer.hashicorp.com/terraform/language/block/terraform#cloud
}

export class Terraform extends Block<TerraformInputs> {
  constructor(parent: Construct, inputs: TerraformInputs, childBlocks?: (b: Block) => void) {
    super(parent, "terraform", [], inputs, childBlocks);

    if (inputs.requiredProviders) {
      new Block(this, "required_providers", [], inputs.requiredProviders);
    }

    if (inputs.backend) {
      switch (Object.keys(inputs.backend)[0]) {
        case "local":
          new LocalBackend(this, Object.values(inputs.backend)[0]);
          break;
        case "remote":
          new RemoteBackend(this, Object.values(inputs.backend)[0]);
          break;
      }
    }
  }

  protected override mapInputsForHcl(): unknown {
    return {
      required_version: this.inputs?.requiredVersion,
    };
  }
}
