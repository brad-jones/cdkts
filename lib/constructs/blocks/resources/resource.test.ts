import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { Resource, Stack } from "../../mod.ts";

Deno.test("Resource - basic", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Resource(this, "local_file", "example", {
          filename: "test.txt",
          content: "Hello World",
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    resource "local_file" "example" {
      filename = "test.txt"
      content  = "Hello World"
    }
  `);
});

Deno.test("Resource - with for_each", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Resource(this, "local_file", "each", {
          forEach: ["one", "two", "three"],
          filename: "${each.value}.txt",
          content: "Content for ${each.value}",
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    resource "local_file" "each" {
      filename = "\${each.value}.txt"
      content  = "Content for \${each.value}"
      for_each = ["one", "two", "three"]
    }
  `);
});

Deno.test("Resource - with depends_on", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        const file1 = new Resource(this, "local_file", "first", {
          filename: "first.txt",
          content: "First",
        });

        new Resource(this, "local_file", "second", {
          filename: "second.txt",
          content: "Second",
          dependsOn: [file1],
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    resource "local_file" "first" {
      filename = "first.txt"
      content  = "First"
    }

    resource "local_file" "second" {
      filename   = "second.txt"
      content    = "Second"
      depends_on = [resource.local_file.first]
    }
  `);
});

Deno.test("Resource - with lifecycle create_before_destroy", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Resource(this, "local_file", "example", {
          filename: "test.txt",
          content: "Hello",
          createBeforeDestroy: true,
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    resource "local_file" "example" {
      filename = "test.txt"
      content  = "Hello"
      lifecycle {
        create_before_destroy = true
      }
    }
  `);
});

Deno.test("Resource - with lifecycle prevent_destroy", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Resource(this, "local_file", "important", {
          filename: "important.txt",
          content: "Critical data",
          preventDestroy: true,
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    resource "local_file" "important" {
      filename = "important.txt"
      content  = "Critical data"
      lifecycle {
        prevent_destroy = true
      }
    }
  `);
});

Deno.test("Resource - with lifecycle ignore_changes", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Resource(this, "local_file", "example", {
          filename: "test.txt",
          content: "Hello",
          ignoreChanges: ["content"],
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    resource "local_file" "example" {
      filename = "test.txt"
      content  = "Hello"
      lifecycle {
        ignore_changes = ["content"]
      }
    }
  `);
});

Deno.test("Resource - with lifecycle replace_triggered_by", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Resource(this, "local_file", "example", {
          filename: "test.txt",
          content: "Hello",
          replaceTriggeredBy: ["local_file.trigger.id"],
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    resource "local_file" "example" {
      filename = "test.txt"
      content  = "Hello"
      lifecycle {
        replace_triggered_by = ["local_file.trigger.id"]
      }
    }
  `);
});

Deno.test("Resource - with multiple lifecycle options", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Resource(this, "local_file", "example", {
          filename: "test.txt",
          content: "Hello",
          createBeforeDestroy: true,
          ignoreChanges: ["content"],
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    resource "local_file" "example" {
      filename = "test.txt"
      content  = "Hello"
      lifecycle {
        create_before_destroy = true
        ignore_changes        = ["content"]
      }
    }
  `);
});
