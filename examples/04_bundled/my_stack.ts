import { Project } from "@brad-jones/cdkts/automate";
import { Resource, Stack, Terraform } from "@brad-jones/cdkts/constructs";
import { dirname } from "@std/path";

// A compiled stack must also be a "Stack File".
// ie: Have a default export of a class that extends Stack
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

// And then you execute the project only when this is the main module.
//
// NB: If you forget to add this section, CDKTS will generate it for you.
//     You only bother to add this section if you wanted to do something custom.
if (import.meta.main) {
  // To ensure the project directory is always relative to your
  // stack script (or it's compiled binary) this is the code you can use.
  //
  // Or not set the projectDir at all and let CDKTS create it in the systems
  // TEMP dir if you don't care to see it.
  const rootDir = Deno.build.standalone
    ? dirname(Deno.execPath()) // Used when compiled
    : import.meta.dirname; // Used when executed with "deno run"

  await new Project({ projectDir: `${rootDir}/out`, stack: new MyStack() }).apply();
}
