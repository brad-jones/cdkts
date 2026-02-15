import { DenoBridgeProvider, Stack, Terraform } from "@brad-jones/cdkts/constructs";
import { DENOBRIDGE_VERSION } from "@brad-jones/terraform-provider-denobridge";
import { EchoExampleAction } from "./blocks/echo_example_action.ts";
import { FileExampleResource } from "./blocks/file_example_resource.ts";
import { Sha256ExampleDataSource } from "./blocks/sha256_example_datasource.ts";
import { UuidExampleEphemeralResource } from "./blocks/uuid_ephemeral_resource.ts";

export default class MyStack extends Stack<typeof MyStack> {
  constructor() {
    super(`${import.meta.url}#${MyStack.name}`);

    new Terraform(this, {
      requiredVersion: ">=1,<2.0",
      requiredProviders: {
        // NB: This is optional, CDKTS will automatically add this
        // if your stack uses any of the DenoBridge constructs.
        // Only add it if you need to specify a custom version or source.
        denobridge: {
          source: "brad-jones/denobridge",
          version: DENOBRIDGE_VERSION,
        },
      },
    });

    // NB: Similarly, this is optional - CDKTS will automatically add a DenoBridgeProvider.
    // Only add it if you need to configure it with custom options.
    new DenoBridgeProvider(this);

    const fooData = new Sha256ExampleDataSource(this, "foo", { value: "bar" });

    const specialId = new UuidExampleEphemeralResource(this, "special_id", { type: "v4" });

    const echoAction = new EchoExampleAction(this, "echo", {
      message: `Hello World`,
    });

    new FileExampleResource(this, "hello", {
      path: `${import.meta.dirname}/message.txt`,
      content: `hash: ${fooData.outputs.result.hash}`,
      writeOnly: {
        specialId: specialId.outputs.result.uuid,
      },
    }, {
      actionTriggers: [
        { actions: [echoAction], events: ["after_create", "after_update"] },
      ],
    });
  }
}
