import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { Stack, Terraform } from "../../mod.ts";

Deno.test("PgBackend - default (empty)", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            pg: {},
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "pg" {

      }
    }
  `);
});

Deno.test("PgBackend - with conn_str", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            pg: {
              connStr: "postgres://user:pass@db.example.com/terraform_backend",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "pg" {
        conn_str = "postgres://user:pass@db.example.com/terraform_backend"
      }
    }
  `);
});

Deno.test("PgBackend - with schema_name", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            pg: {
              connStr: "postgres://db.example.com/terraform_backend",
              schemaName: "my_terraform_state",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "pg" {
        conn_str    = "postgres://db.example.com/terraform_backend"
        schema_name = "my_terraform_state"
      }
    }
  `);
});

Deno.test("PgBackend - with all skip options", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            pg: {
              connStr: "postgres://db.example.com/terraform_backend",
              skipSchemaCreation: true,
              skipTableCreation: true,
              skipIndexCreation: true,
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "pg" {
        conn_str             = "postgres://db.example.com/terraform_backend"
        skip_schema_creation = true
        skip_table_creation  = true
        skip_index_creation  = true
      }
    }
  `);
});
