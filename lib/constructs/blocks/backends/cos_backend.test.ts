import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { Stack, Terraform } from "../../mod.ts";

Deno.test("CosBackend - default (empty)", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            cos: {},
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "cos" {

      }
    }
  `);
});

Deno.test("CosBackend - with bucket and region", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            cos: {
              bucket: "bucket-for-terraform-state-1258798060",
              region: "ap-guangzhou",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "cos" {
        bucket = "bucket-for-terraform-state-1258798060"
        region = "ap-guangzhou"
      }
    }
  `);
});

Deno.test("CosBackend - with encryption and prefix", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            cos: {
              bucket: "bucket-for-terraform-state-1258798060",
              region: "ap-guangzhou",
              prefix: "terraform/state",
              encrypt: true,
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "cos" {
        bucket  = "bucket-for-terraform-state-1258798060"
        region  = "ap-guangzhou"
        prefix  = "terraform/state"
        encrypt = true
      }
    }
  `);
});

Deno.test("CosBackend - with assume_role nested block", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            cos: {
              bucket: "bucket-for-terraform-state-1258798060",
              region: "ap-guangzhou",
              assumeRole: {
                roleArn: "qcs::cam::uin/xxx:roleName/yyy",
                sessionName: "terraform",
                sessionDuration: 3600,
              },
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "cos" {
        bucket = "bucket-for-terraform-state-1258798060"
        region = "ap-guangzhou"
        assume_role {
          role_arn         = "qcs::cam::uin/xxx:roleName/yyy"
          session_name     = "terraform"
          session_duration = 3600
        }
      }
    }
  `);
});
