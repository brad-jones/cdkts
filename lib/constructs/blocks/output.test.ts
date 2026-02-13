import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { Output, Resource, Stack } from "../mod.ts";

Deno.test("Output - basic", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Output(this, "example", {
          value: "hello-world",
          description: "An example output",
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    output "example" {
      value       = "hello-world"
      description = "An example output"
    }
  `);
});

Deno.test("Output - with depends_on", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        const res = new Resource(this, "local_file", "test", {
          filename: "test.txt",
          content: "test",
        });

        new Output(this, "file_size", {
          value: res.outputs.size,
          dependsOn: [res],
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    resource "local_file" "test" {
      filename = "test.txt"
      content  = "test"
    }

    output "file_size" {
      value      = resource.local_file.test.size
      depends_on = [resource.local_file.test]
    }
  `);
});

Deno.test("Output - sensitive", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Output(this, "secret", {
          value: "my-secret-value",
          sensitive: true,
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    output "secret" {
      value     = "my-secret-value"
      sensitive = true
    }
  `);
});

Deno.test("Output - with preconditions", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Output(this, "validated", {
          value: "test-value",
          preconditions: [
            {
              condition: "length(self.value) > 0",
              errorMessage: "Value must not be empty",
            },
          ],
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    output "validated" {
      value = "test-value"
      precondition {
        condition     = "length(self.value) > 0"
        error_message = "Value must not be empty"
      }
    }
  `);
});
