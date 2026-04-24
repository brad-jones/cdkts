import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { Stack, Terraform } from "../../mod.ts";

Deno.test("OssBackend - default (empty)", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            oss: {},
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "oss" {

      }
    }
  `);
});

Deno.test("OssBackend - with bucket and region", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            oss: {
              bucket: "bucket-for-terraform-state",
              region: "cn-beijing",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "oss" {
        bucket = "bucket-for-terraform-state"
        region = "cn-beijing"
      }
    }
  `);
});

Deno.test("OssBackend - with prefix and key", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            oss: {
              bucket: "bucket-for-terraform-state",
              prefix: "path/mystate",
              key: "version-1.tfstate",
              region: "cn-beijing",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "oss" {
        bucket = "bucket-for-terraform-state"
        prefix = "path/mystate"
        key    = "version-1.tfstate"
        region = "cn-beijing"
      }
    }
  `);
});

Deno.test("OssBackend - with TableStore locking", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            oss: {
              bucket: "bucket-for-terraform-state",
              region: "cn-beijing",
              tablestoreEndpoint: "https://terraform-remote.cn-hangzhou.ots.aliyuncs.com",
              tablestoreTable: "statelock",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "oss" {
        bucket              = "bucket-for-terraform-state"
        region              = "cn-beijing"
        tablestore_endpoint = "https://terraform-remote.cn-hangzhou.ots.aliyuncs.com"
        tablestore_table    = "statelock"
      }
    }
  `);
});
