import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { Stack, Terraform } from "../mod.ts";

Deno.test("Cloud - organization and workspace name", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          cloud: {
            organization: "my-org",
            workspaces: { name: "my-workspace" },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      cloud {
        organization = "my-org"
        workspaces {
          name = "my-workspace"
        }
      }
    }
  `);
});

Deno.test("Cloud - workspace tags", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          cloud: {
            organization: "my-org",
            workspaces: { tags: ["app", "production"] },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      cloud {
        organization = "my-org"
        workspaces {
          tags = ["app", "production"]
        }
      }
    }
  `);
});

Deno.test("Cloud - all options", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          cloud: {
            organization: "my-org",
            hostname: "terraform.example.com",
            token: "my-token",
            workspaces: {
              tags: ["app"],
              project: "my-project",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      cloud {
        organization = "my-org"
        hostname     = "terraform.example.com"
        token        = "my-token"
        workspaces {
          tags    = ["app"]
          project = "my-project"
        }
      }
    }
  `);
});

Deno.test("Cloud - minimal configuration", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          cloud: {},
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      cloud {

      }
    }
  `);
});

Deno.test("Cloud - mutually exclusive with backend", () => {
  expect(() => {
    new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          cloud: {
            organization: "my-org",
            workspaces: { name: "my-workspace" },
          },
          backend: {
            local: {},
          },
        });
      }
    }();
  }).toThrow("mutually exclusive");
});
