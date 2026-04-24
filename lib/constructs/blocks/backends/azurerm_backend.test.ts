import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { Stack, Terraform } from "../../mod.ts";

Deno.test("AzurermBackend - default (empty)", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            azurerm: {},
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "azurerm" {

      }
    }
  `);
});

Deno.test("AzurermBackend - with storage account and access key", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            azurerm: {
              storageAccountName: "abcd1234",
              containerName: "tfstate",
              key: "prod.terraform.tfstate",
              accessKey: "abcdefghijklmnop==",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "azurerm" {
        key                  = "prod.terraform.tfstate"
        storage_account_name = "abcd1234"
        container_name       = "tfstate"
        access_key           = "abcdefghijklmnop=="
      }
    }
  `);
});

Deno.test("AzurermBackend - with Entra ID OIDC auth", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            azurerm: {
              storageAccountName: "abcd1234",
              containerName: "tfstate",
              key: "prod.terraform.tfstate",
              useAzureadAuth: true,
              useOidc: true,
              tenantId: "00000000-0000-0000-0000-000000000000",
              clientId: "11111111-1111-1111-1111-111111111111",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "azurerm" {
        key                  = "prod.terraform.tfstate"
        storage_account_name = "abcd1234"
        container_name       = "tfstate"
        use_azuread_auth     = true
        tenant_id            = "00000000-0000-0000-0000-000000000000"
        client_id            = "11111111-1111-1111-1111-111111111111"
        use_oidc             = true
      }
    }
  `);
});

Deno.test("AzurermBackend - with MSI auth", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            azurerm: {
              storageAccountName: "abcd1234",
              containerName: "tfstate",
              key: "prod.terraform.tfstate",
              useAzureadAuth: true,
              useMsi: true,
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "azurerm" {
        key                  = "prod.terraform.tfstate"
        storage_account_name = "abcd1234"
        container_name       = "tfstate"
        use_azuread_auth     = true
        use_msi              = true
      }
    }
  `);
});
