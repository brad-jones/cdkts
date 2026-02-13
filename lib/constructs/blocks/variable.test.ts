import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { Stack, Variable } from "../mod.ts";

Deno.test("Variable - basic", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Variable(this, "example", {
          type: "string",
          default: "hello",
          description: "An example variable",
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    variable "example" {
      type        = "string"
      default     = "hello"
      description = "An example variable"
    }
  `);
});

Deno.test("Variable - with validation", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Variable(this, "name", {
          type: "string",
          validations: [
            {
              condition: "length(var.name) > 3",
              errorMessage: "Name must be longer than 3 characters",
            },
          ],
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    variable "name" {
      type = "string"
      validation {
        condition     = "length(var.name) > 3"
        error_message = "Name must be longer than 3 characters"
      }
    }
  `);
});

Deno.test("Variable - sensitive and nullable", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Variable(this, "api_key", {
          type: "string",
          sensitive: true,
          nullable: false,
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    variable "api_key" {
      type      = "string"
      sensitive = true
      nullable  = false
    }
  `);
});
