import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { Stack, Terraform } from "../../mod.ts";

Deno.test("S3Backend - default (empty)", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            s3: {},
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "s3" {

      }
    }
  `);
});

Deno.test("S3Backend - with bucket, key, and region", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            s3: {
              bucket: "mybucket",
              key: "path/to/my/key",
              region: "us-east-1",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "s3" {
        bucket = "mybucket"
        key    = "path/to/my/key"
        region = "us-east-1"
      }
    }
  `);
});

Deno.test("S3Backend - with encryption and locking", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            s3: {
              bucket: "mybucket",
              key: "terraform.tfstate",
              region: "us-east-1",
              encrypt: true,
              useLockfile: true,
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "s3" {
        bucket       = "mybucket"
        key          = "terraform.tfstate"
        region       = "us-east-1"
        encrypt      = true
        use_lockfile = true
      }
    }
  `);
});

Deno.test("S3Backend - with assume_role nested block", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            s3: {
              bucket: "mybucket",
              key: "terraform.tfstate",
              region: "us-east-1",
              assumeRole: {
                roleArn: "arn:aws:iam::ACCOUNT-ID:role/Terraform",
                sessionName: "terraform",
              },
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "s3" {
        bucket = "mybucket"
        key    = "terraform.tfstate"
        region = "us-east-1"
        assume_role {
          role_arn     = "arn:aws:iam::ACCOUNT-ID:role/Terraform"
          session_name = "terraform"
        }
      }
    }
  `);
});

Deno.test("S3Backend - with endpoints nested block", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            s3: {
              bucket: "mybucket",
              key: "terraform.tfstate",
              region: "us-east-1",
              endpoints: {
                s3: "http://localhost:4566",
                dynamodb: "http://localhost:4566",
              },
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "s3" {
        bucket = "mybucket"
        key    = "terraform.tfstate"
        region = "us-east-1"
        endpoints {
          s3       = "http://localhost:4566"
          dynamodb = "http://localhost:4566"
        }
      }
    }
  `);
});

Deno.test("S3Backend - with assume_role_with_web_identity nested block", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            s3: {
              bucket: "mybucket",
              key: "terraform.tfstate",
              region: "us-east-1",
              assumeRoleWithWebIdentity: {
                roleArn: "arn:aws:iam::ACCOUNT-ID:role/OIDCRole",
                webIdentityTokenFile: "/var/run/secrets/token",
              },
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "s3" {
        bucket = "mybucket"
        key    = "terraform.tfstate"
        region = "us-east-1"
        assume_role_with_web_identity {
          role_arn                = "arn:aws:iam::ACCOUNT-ID:role/OIDCRole"
          web_identity_token_file = "/var/run/secrets/token"
        }
      }
    }
  `);
});
