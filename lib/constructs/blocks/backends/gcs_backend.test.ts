import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { Stack, Terraform } from "../../mod.ts";

Deno.test("GcsBackend - default (empty)", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            gcs: {},
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "gcs" {

      }
    }
  `);
});

Deno.test("GcsBackend - with bucket and prefix", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            gcs: {
              bucket: "tf-state-prod",
              prefix: "terraform/state",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "gcs" {
        bucket = "tf-state-prod"
        prefix = "terraform/state"
      }
    }
  `);
});

Deno.test("GcsBackend - with encryption key", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            gcs: {
              bucket: "tf-state-prod",
              kmsEncryptionKey: "projects/my-project/locations/global/keyRings/my-ring/cryptoKeys/my-key",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "gcs" {
        bucket             = "tf-state-prod"
        kms_encryption_key = "projects/my-project/locations/global/keyRings/my-ring/cryptoKeys/my-key"
      }
    }
  `);
});

Deno.test("GcsBackend - with impersonation", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            gcs: {
              bucket: "tf-state-prod",
              impersonateServiceAccount: "terraform@my-project.iam.gserviceaccount.com",
              impersonateServiceAccountDelegates: ["delegate@my-project.iam.gserviceaccount.com"],
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "gcs" {
        bucket                                = "tf-state-prod"
        impersonate_service_account           = "terraform@my-project.iam.gserviceaccount.com"
        impersonate_service_account_delegates = ["delegate@my-project.iam.gserviceaccount.com"]
      }
    }
  `);
});
