import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { Block, Construct, Stack } from "../lib/constructs/mod.ts";

Deno.test("empty stack", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);
      }
    }().toHcl(),
  ).toBe("");
});

Deno.test("stack with block", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Block(this, "foo", ["bar"], {
          baz: "qux",
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    foo "bar" {
      baz = "qux"
    }
  `);
});

Deno.test("stack with multiple blocks", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Block(this, "foo1", ["bar"], {
          baz: "qux",
        });

        new Block(this, "foo2", ["bar"], {
          baz: "qux",
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    foo1 "bar" {
      baz = "qux"
    }

    foo2 "bar" {
      baz = "qux"
    }
  `);
});

Deno.test("stack with block with block", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Block(this, "foo1", ["bar"], {
          baz: "qux",
        }, (b) => {
          new Block(b, "foo2", ["bar"], {
            baz: "qux",
          });
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    foo1 "bar" {
      baz = "qux"
      foo2 "bar" {
        baz = "qux"
      }
    }
  `);
});

Deno.test("stack with nested constructs", async () => {
  class MyInnerConstruct extends Construct {
    constructor(parent: Construct | undefined, id: string, props: { color: string; size: string }) {
      super(parent, id);

      new Block(this, "foo", ["bar", id], {
        color: props.color,
        size: props.size,
      });
    }
  }

  class MyOuterConstruct extends Construct {
    constructor(parent: Construct | undefined, id: string, props: { color: string }) {
      super(parent, id);

      new MyInnerConstruct(this, `large_colored_thing_${id}`, { color: props.color, size: "large" });
      new MyInnerConstruct(this, `small_colored_thing_${id}`, { color: props.color, size: "small" });
    }
  }

  const stack = new class MyStack extends Stack<typeof MyStack> {
    constructor() {
      super(`${import.meta.url}#${MyStack.name}`);

      new MyOuterConstruct(this, "abc", { color: "red" });
      new MyOuterConstruct(this, "xyz", { color: "green" });
    }
  }();

  console.log(stack);

  expect(await stack.toHcl()).toBe(outdent`
    foo "bar" "large_colored_thing_abc" {
      color = "red"
      size  = "large"
    }

    foo "bar" "small_colored_thing_abc" {
      color = "red"
      size  = "small"
    }

    foo "bar" "large_colored_thing_xyz" {
      color = "green"
      size  = "large"
    }

    foo "bar" "small_colored_thing_xyz" {
      color = "green"
      size  = "small"
    }
  `);
});
