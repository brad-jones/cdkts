import { Resource, Stack, Terraform } from "@brad-jones/cdkts/constructs";

export default class MyStack extends Stack<typeof MyStack> {
  constructor() {
    super(`${import.meta.url}#${MyStack.name}`);

    new Terraform(this, {
      requiredVersion: ">=1,<2.0",
      requiredProviders: {
        local: {
          source: "hashicorp/local",
          version: "2.6.1",
        },
      },
    });

    new Resource(this, "local_file", "hello", {
      filename: "${path.module}/message.txt",
      content: "Hello World",
    });
  }
}
