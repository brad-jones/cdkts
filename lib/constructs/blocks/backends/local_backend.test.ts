import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { Stack, Terraform } from "../../mod.ts";

Deno.test("LocalBackend - default", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            local: {},
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "local" {

      }
    }
  `);
});

Deno.test("LocalBackend - with path", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            local: {
              path: "custom-terraform.tfstate",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "local" {
        path = "custom-terraform.tfstate"
      }
    }
  `);
});

Deno.test("LocalBackend - with workspace_dir", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            local: {
              workspaceDir: "terraform-workspaces",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "local" {
        workspace_dir = "terraform-workspaces"
      }
    }
  `);
});

Deno.test("LocalBackend - with both path and workspace_dir", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            local: {
              path: "state/terraform.tfstate",
              workspaceDir: "state/workspaces",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "local" {
        path          = "state/terraform.tfstate"
        workspace_dir = "state/workspaces"
      }
    }
  `);
});
