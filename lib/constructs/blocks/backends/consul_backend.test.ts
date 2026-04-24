import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { Stack, Terraform } from "../../mod.ts";

Deno.test("ConsulBackend - default (empty)", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            consul: {},
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "consul" {

      }
    }
  `);
});

Deno.test("ConsulBackend - with path", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            consul: {
              path: "terraform/state",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "consul" {
        path = "terraform/state"
      }
    }
  `);
});

Deno.test("ConsulBackend - with address, scheme, and TLS", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            consul: {
              address: "consul.example.com:8500",
              scheme: "https",
              path: "full/path",
              caFile: "/etc/ssl/certs/ca.pem",
              certFile: "/etc/ssl/certs/client.pem",
              keyFile: "/etc/ssl/private/client-key.pem",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "consul" {
        address   = "consul.example.com:8500"
        scheme    = "https"
        path      = "full/path"
        ca_file   = "/etc/ssl/certs/ca.pem"
        cert_file = "/etc/ssl/certs/client.pem"
        key_file  = "/etc/ssl/private/client-key.pem"
      }
    }
  `);
});

Deno.test("ConsulBackend - with gzip and lock disabled", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            consul: {
              path: "terraform/state",
              gzip: true,
              lock: false,
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "consul" {
        path = "terraform/state"
        gzip = true
        lock = false
      }
    }
  `);
});
