import { DENOBRIDGE_VERSION } from "@brad-jones/terraform-provider-denobridge";
import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { Stack } from "../../stack.ts";
import { DenoAction } from "./deno_action.ts";

Deno.test("stack with DenoAction automatically adds DenoBridgeProvider and Terraform block", async () => {
  const stack = new class MyStack extends Stack<typeof MyStack> {
    constructor() {
      super(`${import.meta.url}#${MyStack.name}`);

      new DenoAction(this, "test_action", {
        config: {
          path: "https://example.com/action.ts",
          props: { message: "hello" },
          permissions: { all: true },
        },
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
