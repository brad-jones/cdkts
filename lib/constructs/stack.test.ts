import { DENOBRIDGE_VERSION } from "@brad-jones/terraform-provider-denobridge";
import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { DenoAction } from "./blocks/actions/deno_action.ts";
import { DenoDataSource } from "./blocks/datasources/deno_datasource.ts";
import { DenoBridgeProvider } from "./blocks/providers/denobridge.ts";
import { DenoResource } from "./blocks/resources/deno_resource.ts";
import { DenoEphemeralResource } from "./blocks/resources/ephemeral/deno_ephemeral_resource.ts";
import { Terraform } from "./blocks/terraform.ts";
import { Block, Construct, Stack } from "./mod.ts";

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

Deno.test("stack with DenoDataSource automatically adds DenoBridgeProvider and Terraform block", async () => {
  const stack = new class MyStack extends Stack<typeof MyStack> {
    constructor() {
      super(`${import.meta.url}#${MyStack.name}`);

      new DenoDataSource(this, "test_data", {
        path: "https://example.com/datasource.ts",
        props: { foo: "bar" },
        permissions: { all: true },
      });
    }
  }();

  const hcl = await stack.toHcl();

  expect(hcl).toContain("terraform {");
  expect(hcl).toContain('source  = "brad-jones/denobridge"');
  expect(hcl).toContain(`version = "${DENOBRIDGE_VERSION}"`);
  expect(hcl).toContain('provider "denobridge" {');
  expect(hcl).toContain('data "denobridge_datasource" "test_data" {');
});

Deno.test("stack with DenoResource automatically adds DenoBridgeProvider and Terraform block", async () => {
  const stack = new class MyStack extends Stack<typeof MyStack> {
    constructor() {
      super(`${import.meta.url}#${MyStack.name}`);

      new DenoResource(this, "test_resource", {
        path: "https://example.com/resource.ts",
        props: { name: "test" },
        permissions: { allow: ["read"] },
      });
    }
  }();

  const hcl = await stack.toHcl();

  expect(hcl).toContain("terraform {");
  expect(hcl).toContain('source  = "brad-jones/denobridge"');
  expect(hcl).toContain(`version = "${DENOBRIDGE_VERSION}"`);
  expect(hcl).toContain('provider "denobridge" {');
  expect(hcl).toContain('resource "denobridge_resource" "test_resource" {');
});

Deno.test("stack with DenoAction automatically adds DenoBridgeProvider and Terraform block", async () => {
  const stack = new class MyStack extends Stack<typeof MyStack> {
    constructor() {
      super(`${import.meta.url}#${MyStack.name}`);

      new DenoAction(this, "test_action", {
        config: {
          path: "https://example.com/action.ts",
          props: { message: "hello" },
          permissions: { all: true },
        },
      });
    }
  }();

  const hcl = await stack.toHcl();

  expect(hcl).toContain("terraform {");
  expect(hcl).toContain('source  = "brad-jones/denobridge"');
  expect(hcl).toContain(`version = "${DENOBRIDGE_VERSION}"`);
  expect(hcl).toContain('provider "denobridge" {');
  expect(hcl).toContain('action "denobridge_action" "test_action" {');
});

Deno.test("stack with DenoEphemeralResource automatically adds DenoBridgeProvider and Terraform block", async () => {
  const stack = new class MyStack extends Stack<typeof MyStack> {
    constructor() {
      super(`${import.meta.url}#${MyStack.name}`);

      new DenoEphemeralResource(this, "test_ephemeral", {
        path: "https://example.com/ephemeral.ts",
        props: { type: "v4" },
        permissions: { all: true },
      });
    }
  }();

  const hcl = await stack.toHcl();

  expect(hcl).toContain("terraform {");
  expect(hcl).toContain('source  = "brad-jones/denobridge"');
  expect(hcl).toContain(`version = "${DENOBRIDGE_VERSION}"`);
  expect(hcl).toContain('provider "denobridge" {');
  expect(hcl).toContain('ephemeral "denobridge_ephemeral_resource" "test_ephemeral" {');
});

Deno.test("stack with Deno construct and existing DenoBridgeProvider does not duplicate provider", async () => {
  const stack = new class MyStack extends Stack<typeof MyStack> {
    constructor() {
      super(`${import.meta.url}#${MyStack.name}`);

      new DenoBridgeProvider(this, { denoBinaryPath: "/custom/deno" });

      new DenoDataSource(this, "test_data", {
        path: "https://example.com/datasource.ts",
        props: { foo: "bar" },
        permissions: { all: true },
      });
    }
  }();

  const hcl = await stack.toHcl();

  // Count occurrences of provider block
  const providerMatches = hcl.match(/provider "denobridge"/g);
  expect(providerMatches?.length).toBe(1);

  // Verify custom config is preserved (HCL uses snake_case)
  expect(hcl).toContain('deno_binary_path = "/custom/deno"');
});

Deno.test("stack with Deno construct and existing Terraform block adds denobridge to requiredProviders", async () => {
  const stack = new class MyStack extends Stack<typeof MyStack> {
    constructor() {
      super(`${import.meta.url}#${MyStack.name}`);

      new Terraform(this, {
        requiredVersion: ">=1.0",
        requiredProviders: {
          local: {
            source: "hashicorp/local",
            version: "2.0.0",
          },
        },
      });

      new DenoDataSource(this, "test_data", {
        path: "https://example.com/datasource.ts",
        props: { foo: "bar" },
        permissions: { all: true },
      });
    }
  }();

  const hcl = await stack.toHcl();

  // Should have both providers
  expect(hcl).toContain('source  = "hashicorp/local"');
  expect(hcl).toContain('version = "2.0.0"');
  expect(hcl).toContain('source  = "brad-jones/denobridge"');
  expect(hcl).toContain(`version = "${DENOBRIDGE_VERSION}"`);
  expect(hcl).toContain('required_version = ">=1.0"');

  // Count terraform blocks - should only be one
  const terraformMatches = hcl.match(/terraform \{/g);
  expect(terraformMatches?.length).toBe(1);
});

Deno.test("stack with Deno construct and Terraform block already containing denobridge does not duplicate", async () => {
  const stack = new class MyStack extends Stack<typeof MyStack> {
    constructor() {
      super(`${import.meta.url}#${MyStack.name}`);

      new Terraform(this, {
        requiredProviders: {
          denobridge: {
            source: "brad-jones/denobridge",
            version: "0.2.7",
          },
        },
      });

      new DenoBridgeProvider(this);

      new DenoDataSource(this, "test_data", {
        path: "https://example.com/datasource.ts",
        props: { foo: "bar" },
        permissions: { all: true },
      });
    }
  }();

  const hcl = await stack.toHcl();

  // Count occurrences of "denobridge = {" in required_providers
  const requiredProviderMatches = hcl.match(/denobridge\s*=\s*\{/g);
  expect(requiredProviderMatches?.length).toBe(1);

  // Count provider blocks
  const providerBlockMatches = hcl.match(/provider\s+"denobridge"/g);
  expect(providerBlockMatches?.length).toBe(1);
});

Deno.test("stack without Deno constructs does not add DenoBridge configuration", async () => {
  const stack = new class MyStack extends Stack<typeof MyStack> {
    constructor() {
      super(`${import.meta.url}#${MyStack.name}`);

      new Block(this, "resource", ["local_file", "test"], {
        filename: "/tmp/test.txt",
        content: "hello world",
      });
    }
  }();

  const hcl = await stack.toHcl();

  expect(hcl).not.toContain("terraform {");
  expect(hcl).not.toContain("denobridge");
  expect(hcl).toContain('resource "local_file" "test" {');
});
