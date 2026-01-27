import { Resource, Stack, Terraform } from "@brad-jones/cdkts/constructs";

export default class MyStack1 extends Stack<typeof MyStack1> {
  static override readonly Props = class extends Stack.Props {
    specialId = new Stack.Output();
  };

  constructor() {
    super(`${import.meta.url}#${MyStack1.name}`);

    new Terraform(this, {
      requiredVersion: ">=1,<2.0",
      requiredProviders: {
        local: {
          source: "hashicorp/local",
          version: "2.6.1",
        },
      },
    });

    const helloFile = new Resource(this, "local_file", "hello", {
      filename: "${path.module}/message.txt",
      content: "Hello World",
    });

    this.outputs = {
      specialId: helloFile.outputs.content_sha256,
    };
  }
}
