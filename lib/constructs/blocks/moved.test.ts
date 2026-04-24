import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { Module, Moved, Resource, Stack } from "../mod.ts";

Deno.test("Moved - basic rename with string from", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        const instance = new Resource(this, "aws_instance", "web", {
          ami: "ami-12345678",
        });

        new Moved(this, {
          from: "aws_instance.old_name",
          to: instance,
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    resource "aws_instance" "web" {
      ami = "ami-12345678"
    }

    moved {
      from = aws_instance.old_name
      to   = resource.aws_instance.web
    }
  `);
});

Deno.test("Moved - both string addresses", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Moved(this, {
          from: "module.old.aws_instance.example",
          to: "module.new.aws_instance.example",
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    moved {
      from = module.old.aws_instance.example
      to   = module.new.aws_instance.example
    }
  `);
});

Deno.test("Moved - both Block references", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        const oldFile = new Resource(this, "local_file", "old", {
          filename: "old.txt",
          content: "old",
        });

        const newFile = new Resource(this, "local_file", "new", {
          filename: "new.txt",
          content: "new",
        });

        new Moved(this, {
          from: oldFile,
          to: newFile,
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    resource "local_file" "old" {
      filename = "old.txt"
      content  = "old"
    }

    resource "local_file" "new" {
      filename = "new.txt"
      content  = "new"
    }

    moved {
      from = resource.local_file.old
      to   = resource.local_file.new
    }
  `);
});

Deno.test("Moved - module rename", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        const network = new Module(this, "network", {
          source: "./modules/network",
        });

        new Moved(this, {
          from: "module.vpc",
          to: network,
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    module "network" {
      source = "./modules/network"
    }

    moved {
      from = module.vpc
      to   = module.network
    }
  `);
});

Deno.test("Moved - multiple moved blocks", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        const web = new Resource(this, "aws_instance", "web", {
          ami: "ami-12345678",
        });

        const db = new Resource(this, "aws_instance", "database", {
          ami: "ami-87654321",
        });

        new Moved(this, {
          from: "aws_instance.frontend",
          to: web,
        });

        new Moved(this, {
          from: "aws_instance.db",
          to: db,
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    resource "aws_instance" "web" {
      ami = "ami-12345678"
    }

    resource "aws_instance" "database" {
      ami = "ami-87654321"
    }

    moved {
      from = aws_instance.frontend
      to   = resource.aws_instance.web
    }

    moved {
      from = aws_instance.db
      to   = resource.aws_instance.database
    }
  `);
});
