import { DENOBRIDGE_VERSION } from "@brad-jones/terraform-provider-denobridge";
import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { wildCard } from "../../../../tests/utils.ts";
import type { Construct } from "../../construct.ts";
import { Stack } from "../../stack.ts";
import { DenoResource } from "./deno_resource.ts";
import type { Resource } from "./resource.ts";

Deno.test("stack with DenoResource automatically adds DenoBridgeProvider and Terraform block", async () => {
  const stack = new class MyStack extends Stack<typeof MyStack> {
    constructor() {
      super(`${import.meta.url}#${MyStack.name}`);

      new DenoResource(this, "test_resource", {
        path: "https://example.com/resource.ts",
        props: { name: "test" },
        permissions: { allow: ["read"] },
      });
    }
  }();

  const hcl = await stack.toHcl();
  if (Deno.env.get("DEBUG")) console.log(hcl);

  expect(hcl).toContain(outdent`
    terraform {
      required_providers {
        denobridge = {
          source  = "brad-jones/denobridge"
          version = "${DENOBRIDGE_VERSION}"
        }
      }
    }
  `);
});

Deno.test("sensitive DenoResource references are re-written", async () => {
  interface Props {
    name: string;
  }

  interface State {
    notSecret: string;
    sensitive: {
      secretValue: string;
    };
  }

  class MyResource extends DenoResource<typeof MyResource> {
    static override readonly Props = class extends DenoResource.Props {
      override props = new DenoResource.Input<Props>();
      override state = new DenoResource.Output<State>();
    };

    constructor(
      parent: Construct,
      label: string,
      props: Props,
      options?: Resource["inputs"],
    ) {
      super(parent, label, {
        props,
        path: import.meta.url,
        permissions: {
          all: true,
        },
        ...options,
      });
    }
  }

  const stack = new class MyStack extends Stack<typeof MyStack> {
    static override readonly Props = class extends Stack.Props {
      notSecret = new Stack.Output();
      secretValue = new Stack.Output();
    };

    constructor() {
      super(`${import.meta.url}#${MyStack.name}`);

      const myResource = new MyResource(this, "my_resource", {
        name: "test",
      });

      this.outputs = {
        notSecret: myResource.outputs.state.notSecret,
        secretValue: myResource.outputs.state.sensitive.secretValue,
      };
    }
  }();

  const hcl = await stack.toHcl();
  if (Deno.env.get("DEBUG")) console.log(hcl);

  expect(hcl).toContain(outdent`
    output "notSecret" {
      value = resource.denobridge_resource.my_resource.state.notSecret
    }
  `);

  expect(hcl).toContain(outdent`
    output "secretValue" {
      value = resource.denobridge_resource.my_resource.sensitive_state.secretValue
    }
  `);
});

Deno.test("DenoResource writeOnly props are re-written to write_only_props", async () => {
  interface Props {
    name: string;
    writeOnly: {
      password: string;
      apiKey: string;
    };
  }

  interface State {
    status: string;
  }

  class MyResource extends DenoResource<typeof MyResource> {
    static override readonly Props = class extends DenoResource.Props {
      override props = new DenoResource.Input<Props>();
      override state = new DenoResource.Output<State>();
    };

    constructor(
      parent: Construct,
      label: string,
      props: Props,
      options?: Resource["inputs"],
    ) {
      super(parent, label, {
        props,
        path: import.meta.url,
        permissions: {
          all: true,
        },
        ...options,
      });
    }
  }

  const stack = new class MyStack extends Stack<typeof MyStack> {
    constructor() {
      super(`${import.meta.url}#${MyStack.name}`);

      new MyResource(this, "my_resource", {
        name: "test",
        writeOnly: {
          password: "secret123",
          apiKey: "key456",
        },
      });
    }
  }();

  const hcl = await stack.toHcl();
  if (Deno.env.get("DEBUG")) console.log(hcl);

  expect(hcl).toMatch(
    wildCard(`
      resource "denobridge_resource" "my_resource" {
        props = {
          name = "test"
        }
        path = "file:///*deno_resource.test.ts"
        permissions = {
          all = true
        }
        write_only_props = {
          password = "secret123"
          apiKey   = "key456"
        }
      }
    `),
  );
});
