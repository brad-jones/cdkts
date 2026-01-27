import { Resource, Stack, Terraform } from "@brad-jones/cdkts/constructs";

export default class MyStack extends Stack<typeof MyStack> {
  static override readonly Props = class extends Stack.Props {
    filename = new Stack.Input();
    content = new Stack.Input();
    contentHash = new Stack.Output();
  };

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

    const myFile = new Resource(this, "local_file", "hello", {
      filename: this.inputs.filename,
      content: this.inputs.content,
    });

    this.outputs = {
      contentHash: myFile.outputs.content_sha256,
    };
  }
}
