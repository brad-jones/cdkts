import { DENOBRIDGE_VERSION } from "@brad-jones/terraform-provider-denobridge";
import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import type { Construct } from "../../construct.ts";
import { Stack } from "../../stack.ts";
import type { DataSource } from "./datasource.ts";
import { DenoDataSource } from "./deno_datasource.ts";

Deno.test("stack with DenoDataSource automatically adds DenoBridgeProvider and Terraform block", async () => {
  const stack = new class MyStack extends Stack<typeof MyStack> {
    constructor() {
      super(`${import.meta.url}#${MyStack.name}`);

      new DenoDataSource(this, "test_data", {
        path: "https://example.com/datasource.ts",
        props: { foo: "bar" },
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

Deno.test("sensitive DenoDataSource references are re-written", async () => {
  interface Props {
    bar: string;
  }

  interface Result {
    notSecret: string;
    sensitive: {
      secretValue: string;
    };
  }

  class MyDataSource extends DenoDataSource<typeof MyDataSource> {
    static override readonly Props = class extends DenoDataSource.Props {
      override props = new DenoDataSource.Input<Props>();
      override result = new DenoDataSource.Output<Result>();
    };

    constructor(
      parent: Construct,
      label: string,
      props: Props,
      options?: DataSource["inputs"],
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

      const myData = new MyDataSource(this, "my_data", {
        bar: "baz",
      });

      this.outputs = {
        notSecret: myData.outputs.result.notSecret,
        secretValue: myData.outputs.result.sensitive.secretValue,
      };
    }
  }();

  const hcl = await stack.toHcl();
  if (Deno.env.get("DEBUG")) console.log(hcl);

  expect(hcl).toContain(outdent`
    output "notSecret" {
      value = data.denobridge_datasource.my_data.result.notSecret
    }
  `);

  expect(hcl).toContain(outdent`
    output "secretValue" {
      value = data.denobridge_datasource.my_data.sensitive_result.secretValue
    }
  `);
});
