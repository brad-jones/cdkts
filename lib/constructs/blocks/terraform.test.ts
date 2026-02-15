import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { Stack, Terraform } from "../mod.ts";

Deno.test("required_version", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          requiredVersion: ">=1,<2.0",
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      required_version = ">=1,<2.0"
    }
  `);
});

Deno.test("required_providers", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          requiredProviders: {
            local: {
              source: "hashicorp/local",
              version: "2.6.1",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      required_providers {
        local = {
          source  = "hashicorp/local"
          version = "2.6.1"
        }
      }
    }
  `);
});
