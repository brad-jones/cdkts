import { Project } from "@brad-jones/cdkts/automate";
import { Resource, Stack, Terraform } from "@brad-jones/cdkts/constructs";

await new Project({
  projectDir: `${import.meta.dirname}/out`,
  stack: new (class MyStack extends Stack<typeof MyStack> {
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
  })(),
}).apply();
