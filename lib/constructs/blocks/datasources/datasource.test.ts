import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { DataSource, Resource, Stack } from "../../mod.ts";

Deno.test("DataSource - basic", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new DataSource(this, "local_file", "config", {
          filename: "config.json",
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    data "local_file" "config" {
      filename = "config.json"
    }
  `);
});

Deno.test("DataSource - with count", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new DataSource(this, "local_file", "files", {
          count: 3,
          filename: "file-${count.index}.txt",
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    data "local_file" "files" {
      count    = 3
      filename = "file-\${count.index}.txt"
    }
  `);
});

Deno.test("DataSource - with for_each", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new DataSource(this, "local_file", "configs", {
          forEach: ["dev", "staging", "prod"],
          filename: "\${each.value}.json",
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    data "local_file" "configs" {
      filename = "\${each.value}.json"
      for_each = ["dev", "staging", "prod"]
    }
  `);
});

Deno.test("DataSource - with depends_on", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        const file = new Resource(this, "local_file", "created", {
          filename: "created.txt",
          content: "Created",
        });

        new DataSource(this, "local_file", "read", {
          filename: "created.txt",
          dependsOn: [file],
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    resource "local_file" "created" {
      filename = "created.txt"
      content  = "Created"
    }

    data "local_file" "read" {
      filename   = "created.txt"
      depends_on = [resource.local_file.created]
    }
  `);
});

Deno.test("DataSource - with lifecycle postcondition", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new DataSource(this, "local_file", "validated", {
          filename: "test.txt",
          lifecycles: [
            {
              when: "post",
              condition: "length(self.content) > 0",
              errorMessage: "File content must not be empty",
            },
          ],
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    data "local_file" "validated" {
      filename = "test.txt"
      lifecycle {

        postcondition {
          condition     = "length(self.content) > 0"
          error_message = "File content must not be empty"
        }
      }
    }
  `);
});
