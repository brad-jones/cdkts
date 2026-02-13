import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { EphemeralResource, Resource, Stack } from "../../../mod.ts";

Deno.test("EphemeralResource - basic", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new EphemeralResource(this, "provider_temp_token", "my_token", {
          duration: "1h",
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    ephemeral "provider_temp_token" "my_token" {
      duration = "1h"
    }
  `);
});

Deno.test("EphemeralResource - with count", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new EphemeralResource(this, "provider_temp_token", "tokens", {
          count: 3,
          duration: "1h",
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    ephemeral "provider_temp_token" "tokens" {
      count    = 3
      duration = "1h"
    }
  `);
});

Deno.test("EphemeralResource - with for_each", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new EphemeralResource(this, "provider_temp_token", "tokens", {
          forEach: ["dev", "staging", "prod"],
          duration: "1h",
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    ephemeral "provider_temp_token" "tokens" {
      duration = "1h"
      for_each = ["dev", "staging", "prod"]
    }
  `);
});

Deno.test("EphemeralResource - with depends_on", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        const file = new Resource(this, "local_file", "created", {
          filename: "created.txt",
          content: "Created",
        });

        new EphemeralResource(this, "provider_temp_token", "my_token", {
          duration: "1h",
          dependsOn: [file],
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    resource "local_file" "created" {
      filename = "created.txt"
      content  = "Created"
    }

    ephemeral "provider_temp_token" "my_token" {
      duration   = "1h"
      depends_on = [resource.local_file.created]
    }
  `);
});

Deno.test("EphemeralResource - with lifecycle postcondition", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new EphemeralResource(this, "provider_temp_token", "validated", {
          duration: "1h",
          lifecycles: [
            {
              when: "post",
              condition: "self.token != null",
              errorMessage: "Token must not be null",
            },
          ],
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    ephemeral "provider_temp_token" "validated" {
      duration = "1h"
      lifecycle {

        postcondition {
          condition     = "self.token != null"
          error_message = "Token must not be null"
        }
      }
    }
  `);
});

Deno.test("EphemeralResource - with lifecycle precondition", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new EphemeralResource(this, "provider_temp_token", "checked", {
          duration: "1h",
          lifecycles: [
            {
              when: "pre",
              condition: "var.enable_tokens == true",
              errorMessage: "Token generation must be enabled",
            },
          ],
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    ephemeral "provider_temp_token" "checked" {
      duration = "1h"
      lifecycle {

        precondition {
          condition     = "var.enable_tokens == true"
          error_message = "Token generation must be enabled"
        }
      }
    }
  `);
});
