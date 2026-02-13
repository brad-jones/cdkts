import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { Action, Stack } from "../../mod.ts";

Deno.test("Action - basic", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Action(this, "my_provider_action", "my_action", {
          config: { key: "value" },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    action "my_provider_action" "my_action" {

      config {
        key = "value"
      }
    }
  `);
});

Deno.test("Action - with count", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Action(this, "my_provider_action", "my_action", {
          config: { key: "value" },
          count: 3,
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    action "my_provider_action" "my_action" {
      count = 3
      config {
        key = "value"
      }
    }
  `);
});

Deno.test("Action - with for_each", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Action(this, "my_provider_action", "my_action", {
          config: { command: "${each.value}" },
          forEach: ["run", "test", "deploy"],
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    action "my_provider_action" "my_action" {
      for_each = ["run", "test", "deploy"]
      config {
        command = "\${each.value}"
      }
    }
  `);
});

Deno.test("Action - with multiple config properties", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Action(this, "my_provider_action", "my_action", {
          config: {
            command: "echo hello",
            timeout: 30,
            enabled: true,
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    action "my_provider_action" "my_action" {

      config {
        command = "echo hello"
        timeout = 30
        enabled = true
      }
    }
  `);
});
