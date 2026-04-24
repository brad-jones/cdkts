import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { Stack, Terraform } from "../../mod.ts";

Deno.test("KubernetesBackend - default (empty)", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            kubernetes: {},
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "kubernetes" {

      }
    }
  `);
});

Deno.test("KubernetesBackend - with secret_suffix and config_path", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            kubernetes: {
              secretSuffix: "state",
              configPath: "~/.kube/config",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "kubernetes" {
        secret_suffix = "state"
        config_path   = "~/.kube/config"
      }
    }
  `);
});

Deno.test("KubernetesBackend - with in-cluster config", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            kubernetes: {
              secretSuffix: "state",
              inClusterConfig: true,
              namespace: "terraform",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "kubernetes" {
        namespace         = "terraform"
        secret_suffix     = "state"
        in_cluster_config = true
      }
    }
  `);
});

Deno.test("KubernetesBackend - with exec nested block", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          backend: {
            kubernetes: {
              secretSuffix: "state",
              exec: {
                apiVersion: "client.authentication.k8s.io/v1beta1",
                command: "aws",
                args: ["eks", "get-token", "--cluster-name", "my-cluster"],
              },
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      backend "kubernetes" {
        secret_suffix = "state"
        exec {
          api_version = "client.authentication.k8s.io/v1beta1"
          command     = "aws"
          args        = ["eks", "get-token", "--cluster-name", "my-cluster"]
        }
      }
    }
  `);
});
