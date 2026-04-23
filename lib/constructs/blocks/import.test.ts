import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { Import, Provider, Resource, Stack } from "../mod.ts";

Deno.test("Import - basic with id", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        const file = new Resource(this, "local_file", "hello", {
          filename: "hello.txt",
          content: "Hello",
        });

        new Import(this, {
          to: file,
          id: "hello.txt",
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    resource "local_file" "hello" {
      filename = "hello.txt"
      content  = "Hello"
    }

    import {
      to = resource.local_file.hello
      id = "hello.txt"
    }
  `);
});

Deno.test("Import - with identity", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        const bucket = new Resource(this, "aws_s3_bucket", "this", {});

        new Import(this, {
          to: bucket,
          identity: {
            account_id: "123456789012",
            bucket: "my-bucket",
            region: "us-east-1",
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    resource "aws_s3_bucket" "this" {

    }

    import {
      to = resource.aws_s3_bucket.this
      identity = {
        account_id = "123456789012"
        bucket     = "my-bucket"
        region     = "us-east-1"
      }
    }
  `);
});

Deno.test("Import - with forEach", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        const bucket = new Resource(this, "aws_s3_bucket", "this", {
          forEach: { staging: "bucket1", prod: "bucket2" },
        });

        new Import(this, {
          to: bucket,
          forEach: { staging: "bucket1", prod: "bucket2" },
          id: "each.value",
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    resource "aws_s3_bucket" "this" {
      for_each = {
        staging = "bucket1"
        prod    = "bucket2"
      }
    }

    import {
      to = resource.aws_s3_bucket.this
      id = "each.value"
      for_each = {
        staging = "bucket1"
        prod    = "bucket2"
      }
    }
  `);
});

Deno.test("Import - with provider", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        const instance = new Resource(this, "aws_instance", "web", {});

        const awsEast = new Provider(this, "aws", {
          alias: "east",
          region: "us-east-1",
        });

        new Import(this, {
          to: instance,
          id: "i-096fba6d03d36d262",
          provider: awsEast,
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    provider "aws" {
      alias  = "east"
      region = "us-east-1"
    }

    resource "aws_instance" "web" {

    }

    import {
      to       = resource.aws_instance.web
      id       = "i-096fba6d03d36d262"
      provider = aws.east
    }
  `);
});
