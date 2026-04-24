import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { DenoBackend, HttpBackend, Stack, Terraform } from "../../mod.ts";

const stubHandlers = {
  getState: () => Promise.resolve(null),
  updateState: (_body: Uint8Array) => Promise.resolve(),
  deleteState: () => Promise.resolve(),
};

Deno.test("DenoBackend - HCL outputs only skip_cert_verification", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        const tf = new Terraform(this, {});
        new DenoBackend(tf, { handlers: stubHandlers });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "http" {
        skip_cert_verification = true
      }
    }
  `);
});

Deno.test("DenoBackend - is instanceof HttpBackend", () => {
  const stack = new class MyStack extends Stack<typeof MyStack> {
    constructor() {
      super(`${import.meta.url}#${MyStack.name}`);
      const tf = new Terraform(this, {});
      new DenoBackend(tf, { handlers: stubHandlers });
    }
  }();

  const backend = stack.descendants.find((c) => c instanceof DenoBackend);
  expect(backend).toBeDefined();
  expect(backend).toBeInstanceOf(DenoBackend);
  expect(backend).toBeInstanceOf(HttpBackend);
});

Deno.test("DenoBackend - stores handlers as runtime property", () => {
  const stack = new class MyStack extends Stack<typeof MyStack> {
    constructor() {
      super(`${import.meta.url}#${MyStack.name}`);
      const tf = new Terraform(this, {});
      new DenoBackend(tf, { handlers: stubHandlers });
    }
  }();

  const backend = stack.descendants.find((c) => c instanceof DenoBackend) as DenoBackend;
  expect(backend.handlers).toBe(stubHandlers);
  expect(backend.serverPort).toBe(0);
  expect(backend.serverHostname).toBe("localhost");
});

Deno.test("DenoBackend - custom port and hostname", () => {
  const stack = new class MyStack extends Stack<typeof MyStack> {
    constructor() {
      super(`${import.meta.url}#${MyStack.name}`);
      const tf = new Terraform(this, {});
      new DenoBackend(tf, {
        handlers: stubHandlers,
        port: 8080,
        hostname: "0.0.0.0",
      });
    }
  }();

  const backend = stack.descendants.find((c) => c instanceof DenoBackend) as DenoBackend;
  expect(backend.serverPort).toBe(8080);
  expect(backend.serverHostname).toBe("0.0.0.0");
});
