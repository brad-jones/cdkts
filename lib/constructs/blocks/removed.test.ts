import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { Removed, Resource, Stack } from "../mod.ts";

Deno.test("Removed - basic with string address (destroy defaults to true)", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Removed(this, {
          from: "aws_instance.old_server",
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    removed {
      from = aws_instance.old_server
      lifecycle {
        destroy = true
      }
    }
  `);
});

Deno.test("Removed - with destroy false", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Removed(this, {
          from: "aws_s3_bucket.legacy",
          destroy: false,
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    removed {
      from = aws_s3_bucket.legacy
      lifecycle {
        destroy = false
      }
    }
  `);
});

Deno.test("Removed - with Block reference", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        const file = new Resource(this, "local_file", "old", {
          filename: "old.txt",
          content: "old",
        });

        new Removed(this, {
          from: file,
          destroy: false,
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    resource "local_file" "old" {
      filename = "old.txt"
      content  = "old"
    }

    removed {
      from = resource.local_file.old
      lifecycle {
        destroy = false
      }
    }
  `);
});

Deno.test("Removed - multiple removed blocks", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Removed(this, {
          from: "aws_instance.server_a",
        });

        new Removed(this, {
          from: "aws_instance.server_b",
          destroy: false,
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    removed {
      from = aws_instance.server_a
      lifecycle {
        destroy = true
      }
    }

    removed {
      from = aws_instance.server_b
      lifecycle {
        destroy = false
      }
    }
  `);
});
