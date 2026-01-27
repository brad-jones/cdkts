import { DenoBridgeProvider, Stack, Terraform } from "@brad-jones/cdkts/constructs";
import { FileExampleResource } from "./blocks/file_example_resource.ts";
import { Sha256ExampleDataSource } from "./blocks/sha256_example_datasource.ts";

export default class MyStack extends Stack<typeof MyStack> {
  constructor() {
    super(`${import.meta.url}#${MyStack.name}`);

    new Terraform(this, {
      requiredVersion: ">=1,<2.0",
      requiredProviders: {
        denobridge: {
          source: "brad-jones/denobridge",
          version: "0.1.1",
        },
      },
    });

    new DenoBridgeProvider(this);

    //const foo = new Sha256ExampleDataSource(this, "foo", { value: "bar" });

    new FileExampleResource(this, "hello", {
      path: `${import.meta.dirname}/message.txt`,
      //content: `hash: ${foo.outputs.result.hash}`,
      content: "hello",
    });
  }
}
