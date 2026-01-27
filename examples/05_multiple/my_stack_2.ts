import { Resource, Stack, Terraform } from "@brad-jones/cdkts/constructs";

export default class MyStack2 extends Stack<typeof MyStack2> {
  static override readonly Props = class extends Stack.Props {
    specialId = new Stack.Input();
  };

  constructor(inputs: MyStack2["inputs"]) {
    super(`${import.meta.url}#${MyStack2.name}`, inputs);

    new Terraform(this, {
      requiredVersion: ">=1,<2.0",
      requiredProviders: {
        local: {
          source: "hashicorp/local",
          version: "2.6.1",
        },
      },
    });

    new Resource(this, "local_file", "hello_hash", {
      filename: "${path.module}/message.txt.sha256",
      content: this.inputs.specialId,
    });
  }
}
