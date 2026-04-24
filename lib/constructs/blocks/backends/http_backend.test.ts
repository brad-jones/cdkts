import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { Stack, Terraform } from "../../mod.ts";

Deno.test("HttpBackend - default (empty)", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            http: {},
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "http" {

      }
    }
  `);
});

Deno.test("HttpBackend - with address", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            http: {
              address: "http://myrest.api.com/foo",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "http" {
        address = "http://myrest.api.com/foo"
      }
    }
  `);
});

Deno.test("HttpBackend - with locking endpoints", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            http: {
              address: "http://myrest.api.com/foo",
              lockAddress: "http://myrest.api.com/foo/lock",
              unlockAddress: "http://myrest.api.com/foo/unlock",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "http" {
        address        = "http://myrest.api.com/foo"
        lock_address   = "http://myrest.api.com/foo/lock"
        unlock_address = "http://myrest.api.com/foo/unlock"
      }
    }
  `);
});

Deno.test("HttpBackend - with basic auth and retry", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            http: {
              address: "http://myrest.api.com/foo",
              username: "admin",
              password: "secret",
              retryMax: 5,
              retryWaitMin: 2,
              retryWaitMax: 60,
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "http" {
        address        = "http://myrest.api.com/foo"
        username       = "admin"
        password       = "secret"
        retry_max      = 5
        retry_wait_min = 2
        retry_wait_max = 60
      }
    }
  `);
});
