import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { Module, Provider, Resource, Stack } from "../mod.ts";

Deno.test("Module - basic local source", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Module(this, "vpc", {
          source: "./modules/vpc",
          cidr_block: "10.0.0.0/16",
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    module "vpc" {
      source     = "./modules/vpc"
      cidr_block = "10.0.0.0/16"
    }
  `);
});

Deno.test("Module - registry source with version", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Module(this, "consul", {
          source: "hashicorp/consul/aws",
          version: "0.1.0",
          num_servers: 3,
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    module "consul" {
      source      = "hashicorp/consul/aws"
      version     = "0.1.0"
      num_servers = 3
    }
  `);
});

Deno.test("Module - with count", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Module(this, "worker", {
          source: "./modules/worker",
          count: 3,
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    module "worker" {
      source = "./modules/worker"
      count  = 3
    }
  `);
});

Deno.test("Module - with for_each map", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Module(this, "bucket", {
          source: "./modules/bucket",
          forEach: { staging: "bucket-staging", prod: "bucket-prod" },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    module "bucket" {
      source = "./modules/bucket"
      for_each = {
        staging = "bucket-staging"
        prod    = "bucket-prod"
      }
    }
  `);
});

Deno.test("Module - with depends_on", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        const vpc = new Resource(this, "aws_vpc", "main", {
          cidr_block: "10.0.0.0/16",
        });

        new Module(this, "app", {
          source: "./modules/app",
          dependsOn: [vpc],
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    resource "aws_vpc" "main" {
      cidr_block = "10.0.0.0/16"
    }

    module "app" {
      source     = "./modules/app"
      depends_on = [resource.aws_vpc.main]
    }
  `);
});

Deno.test("Module - with providers (Provider instances)", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        const awsWest = new Provider(this, "aws", {
          alias: "west",
          region: "us-west-2",
        });

        new Module(this, "backend", {
          source: "./modules/backend",
          providers: { aws: awsWest },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    provider "aws" {
      alias  = "west"
      region = "us-west-2"
    }

    module "backend" {
      source = "./modules/backend"
      providers = {
        aws = aws.west
      }
    }
  `);
});

Deno.test("Module - output reference used in resource", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        const network = new Module(this, "network", {
          source: "./modules/network",
        });

        new Resource(this, "aws_instance", "web", {
          subnet_id: network.outputs.subnet_id,
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    module "network" {
      source = "./modules/network"
    }

    resource "aws_instance" "web" {
      subnet_id = module.network.subnet_id
    }
  `);
});

Deno.test("Module - source only (minimal)", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Module(this, "empty", {
          source: "./modules/empty",
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    module "empty" {
      source = "./modules/empty"
    }
  `);
});
