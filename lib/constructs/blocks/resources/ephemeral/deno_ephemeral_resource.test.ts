import { DENOBRIDGE_VERSION } from "@brad-jones/terraform-provider-denobridge";
import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import type { Construct } from "../../../construct.ts";
import { Stack } from "../../../stack.ts";
import { DenoEphemeralResource } from "./deno_ephemeral_resource.ts";
import type { EphemeralResource } from "./ephemeral_resource.ts";

Deno.test("stack with DenoEphemeralResource automatically adds DenoBridgeProvider and Terraform block", async () => {
  const stack = new class MyStack extends Stack<typeof MyStack> {
    constructor() {
      super(`${import.meta.url}#${MyStack.name}`);

      new DenoEphemeralResource(this, "test_ephemeral", {
        path: "https://example.com/ephemeral.ts",
        props: { type: "v4" },
        permissions: { all: true },
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

Deno.test("sensitive DenoEphemeralResource references are re-written", async () => {
  interface Props {
    type: string;
  }

  interface Result {
    notSecret: string;
    sensitive: {
      secretValue: string;
    };
  }

  class MyEphemeralResource extends DenoEphemeralResource<typeof MyEphemeralResource> {
    static override readonly Props = class extends DenoEphemeralResource.Props {
      override props = new DenoEphemeralResource.Input<Props>();
      override result = new DenoEphemeralResource.Output<Result>();
    };

    constructor(
      parent: Construct,
      label: string,
      props: Props,
      options?: EphemeralResource["inputs"],
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

      const myEphemeral = new MyEphemeralResource(this, "my_ephemeral", {
        type: "v4",
      });

      this.outputs = {
        notSecret: myEphemeral.outputs.result.notSecret,
        secretValue: myEphemeral.outputs.result.sensitive.secretValue,
      };
    }
  }();

  const hcl = await stack.toHcl();
  if (Deno.env.get("DEBUG")) console.log(hcl);

  expect(hcl).toContain(outdent`
    output "notSecret" {
      value = ephemeral.denobridge_ephemeral_resource.my_ephemeral.result.notSecret
    }
  `);

  expect(hcl).toContain(outdent`
    output "secretValue" {
      value = ephemeral.denobridge_ephemeral_resource.my_ephemeral.sensitive_result.secretValue
    }
  `);
});
