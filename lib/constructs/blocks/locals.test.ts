import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { assertThrows } from "@std/assert";
import { Local, RawHcl, Resource, Stack } from "../mod.ts";

Deno.test("Local - basic string value", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Local(this, "environment", { value: "production" });
      }
    }().toHcl(),
  ).toBe(outdent`
    locals {
      environment = "production"
    }
  `);
});

Deno.test("Local - number value", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Local(this, "max_instances", { value: 10 });
      }
    }().toHcl(),
  ).toBe(outdent`
    locals {
      max_instances = 10
    }
  `);
});

Deno.test("Local - boolean value", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Local(this, "enable_logging", { value: true });
      }
    }().toHcl(),
  ).toBe(outdent`
    locals {
      enable_logging = true
    }
  `);
});

Deno.test("Local - object/map value", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Local(this, "common_tags", {
          value: { environment: "production", project: "myapp" },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    locals {
      common_tags = {
        environment = "production"
        project     = "myapp"
      }
    }
  `);
});

Deno.test("Local - multiple locals in one stack", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Local(this, "region", { value: "us-west-2" });
        new Local(this, "account_id", { value: "123456789012" });
      }
    }().toHcl(),
  ).toBe(outdent`
    locals {
      region = "us-west-2"
    }

    locals {
      account_id = "123456789012"
    }
  `);
});

Deno.test("Local - ref used in a resource attribute", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        const path = new Local(this, "output_path", { value: "/tmp/output.txt" });

        new Resource(this, "local_file", "example", {
          filename: path.ref,
          content: "hello",
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    locals {
      output_path = "/tmp/output.txt"
    }

    resource "local_file" "example" {
      filename = "local.output_path"
      content  = "hello"
    }
  `);
});

Deno.test("Local - RawHcl expression value", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Local(this, "name_prefix", { value: new RawHcl("var.prefix") });
      }
    }().toHcl(),
  ).toBe(outdent`
    locals {
      name_prefix = var.prefix
    }
  `);
});

Deno.test("Local - throws on invalid label", () => {
  assertThrows(
    () => {
      const stack = new class MyStack extends Stack<typeof MyStack> {
        constructor() {
          super(`${import.meta.url}#${MyStack.name}`);
          new Local(this, "invalid label!", { value: "x" });
        }
      }();
      return stack;
    },
    Error,
    `Invalid local name "invalid label!"`,
  );
});

Deno.test("Local - throws when value is undefined", () => {
  assertThrows(
    () => {
      const stack = new class MyStack extends Stack<typeof MyStack> {
        constructor() {
          super(`${import.meta.url}#${MyStack.name}`);
          // deno-lint-ignore no-explicit-any
          new Local(this, "missing_value", { value: undefined as any });
        }
      }();
      return stack;
    },
    Error,
    `Local "missing_value": value is required.`,
  );
});
