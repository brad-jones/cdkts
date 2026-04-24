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

Deno.test("provider_meta - single provider", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          providerMeta: {
            "my-provider": {
              hello: "world",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      provider_meta "my-provider" {
        hello = "world"
      }
    }
  `);
});

Deno.test("provider_meta - multiple providers", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          providerMeta: {
            "provider-a": {
              module_id: "abc-123",
            },
            "provider-b": {
              tracking: "enabled",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      provider_meta "provider-a" {
        module_id = "abc-123"
      }

      provider_meta "provider-b" {
        tracking = "enabled"
      }
    }
  `);
});

Deno.test("provider_meta - with other terraform options", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          requiredVersion: ">=1.0",
          requiredProviders: {
            "my-provider": {
              source: "example/my-provider",
              version: "1.0.0",
            },
          },
          providerMeta: {
            "my-provider": {
              module_id: "abc-123",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      required_version = ">=1.0"
      required_providers {
        my-provider = {
          source  = "example/my-provider"
          version = "1.0.0"
        }
      }

      provider_meta "my-provider" {
        module_id = "abc-123"
      }
    }
  `);
});
