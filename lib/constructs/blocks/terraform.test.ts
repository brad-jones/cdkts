import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { Stack, Terraform } from "../mod.ts";

Deno.test("required_version", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          requiredVersion: ">=1,<2.0",
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      required_version = ">=1,<2.0"
    }
  `);
});

Deno.test("required_providers", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          requiredProviders: {
            local: {
              source: "hashicorp/local",
              version: "2.6.1",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      required_providers {
        local = {
          source  = "hashicorp/local"
          version = "2.6.1"
        }
      }
    }
  `);
});

Deno.test("provider_meta - single provider", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          providerMeta: {
            "my-provider": {
              hello: "world",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      provider_meta "my-provider" {
        hello = "world"
      }
    }
  `);
});

Deno.test("provider_meta - multiple providers", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          providerMeta: {
            "provider-a": {
              module_id: "abc-123",
            },
            "provider-b": {
              tracking: "enabled",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      provider_meta "provider-a" {
        module_id = "abc-123"
      }

      provider_meta "provider-b" {
        tracking = "enabled"
      }
    }
  `);
});

Deno.test("provider_meta - with other terraform options", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          requiredVersion: ">=1.0",
          requiredProviders: {
            "my-provider": {
              source: "example/my-provider",
              version: "1.0.0",
            },
          },
          providerMeta: {
            "my-provider": {
              module_id: "abc-123",
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      required_version = ">=1.0"
      required_providers {
        my-provider = {
          source  = "example/my-provider"
          version = "1.0.0"
        }
      }

      provider_meta "my-provider" {
        module_id = "abc-123"
      }
    }
  `);
});

Deno.test("encryption - pbkdf2 key provider with aes_gcm method, state and plan", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          encryption: {
            keyProviders: {
              pbkdf2: { my_key: { passphrase: "correct-horse-battery-staple" } },
            },
            methods: {
              aesGcm: { my_method: { keys: "key_provider.pbkdf2.my_key" } },
            },
            state: { method: "method.aes_gcm.my_method", enforced: true },
            plan: { method: "method.aes_gcm.my_method" },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      encryption {
        key_provider "pbkdf2" "my_key" {
          passphrase = "correct-horse-battery-staple"
        }

        method "aes_gcm" "my_method" {
          keys = key_provider.pbkdf2.my_key
        }

        state {
          method   = method.aes_gcm.my_method
          enforced = true
        }

        plan {
          method = method.aes_gcm.my_method
        }
      }
    }
  `);
});

Deno.test("encryption - pbkdf2 chain with encrypted_metadata_alias", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          encryption: {
            keyProviders: {
              pbkdf2: {
                root: { passphrase: "correct-horse-battery-staple" },
                chained: { chain: "key_provider.pbkdf2.root", encryptedMetadataAlias: "pbkdf2_meta" },
              },
            },
            methods: {
              aesGcm: { my_method: { keys: "key_provider.pbkdf2.chained" } },
            },
            state: { method: "method.aes_gcm.my_method" },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      encryption {
        key_provider "pbkdf2" "root" {
          passphrase = "correct-horse-battery-staple"
        }

        key_provider "pbkdf2" "chained" {
          chain                    = key_provider.pbkdf2.root
          encrypted_metadata_alias = "pbkdf2_meta"
        }

        method "aes_gcm" "my_method" {
          keys = key_provider.pbkdf2.chained
        }

        state {
          method = method.aes_gcm.my_method
        }
      }
    }
  `);
});

Deno.test("encryption - state fallback and unencrypted method", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          encryption: {
            keyProviders: {
              pbkdf2: { my_key: { passphrase: "correct-horse-battery-staple" } },
            },
            methods: {
              aesGcm: { new_method: { keys: "key_provider.pbkdf2.my_key" } },
              unencrypted: { default: {} },
            },
            state: {
              method: "method.aes_gcm.new_method",
              fallback: { method: "method.unencrypted.default" },
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      encryption {
        key_provider "pbkdf2" "my_key" {
          passphrase = "correct-horse-battery-staple"
        }

        method "aes_gcm" "new_method" {
          keys = key_provider.pbkdf2.my_key
        }

        method "unencrypted" "default" {

        }

        state {
          method = method.aes_gcm.new_method
          fallback {
            method = method.unencrypted.default
          }
        }
      }
    }
  `);
});

Deno.test("encryption - remote_state_data_sources with default and named source", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          encryption: {
            keyProviders: {
              pbkdf2: { my_key: { passphrase: "correct-horse-battery-staple" } },
            },
            methods: {
              aesGcm: { my_method: { keys: "key_provider.pbkdf2.my_key" } },
            },
            remoteStateSources: {
              default: { method: "method.aes_gcm.my_method" },
              sources: { vpc: { method: "method.aes_gcm.my_method" } },
            },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      encryption {
        key_provider "pbkdf2" "my_key" {
          passphrase = "correct-horse-battery-staple"
        }

        method "aes_gcm" "my_method" {
          keys = key_provider.pbkdf2.my_key
        }

        remote_state_data_sources {
          default {
            method = method.aes_gcm.my_method
          }

          remote_state_data_source "vpc" {
            method = method.aes_gcm.my_method
          }
        }
      }
    }
  `);
});

Deno.test("encryption - gcp_kms key provider", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          encryption: {
            keyProviders: {
              gcpKms: {
                my_key: {
                  kmsEncryptionKey: "projects/my-project/locations/global/keyRings/my-ring/cryptoKeys/my-key",
                  keyLength: 32,
                },
              },
            },
            methods: {
              aesGcm: { my_method: { keys: "key_provider.gcp_kms.my_key" } },
            },
            state: { method: "method.aes_gcm.my_method" },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      encryption {
        key_provider "gcp_kms" "my_key" {
          kms_encryption_key = "projects/my-project/locations/global/keyRings/my-ring/cryptoKeys/my-key"
          key_length         = 32
        }

        method "aes_gcm" "my_method" {
          keys = key_provider.gcp_kms.my_key
        }

        state {
          method = method.aes_gcm.my_method
        }
      }
    }
  `);
});

Deno.test("encryption - aws_kms key provider", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          encryption: {
            keyProviders: {
              awsKms: {
                my_key: {
                  kmsKeyId: "arn:aws:kms:us-east-1:123456789012:key/my-key",
                  keySpec: "AES_256",
                  region: "us-east-1",
                },
              },
            },
            methods: {
              aesGcm: { my_method: { keys: "key_provider.aws_kms.my_key" } },
            },
            state: { method: "method.aes_gcm.my_method" },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      encryption {
        key_provider "aws_kms" "my_key" {
          kms_key_id = "arn:aws:kms:us-east-1:123456789012:key/my-key"
          key_spec   = "AES_256"
          region     = "us-east-1"
        }

        method "aes_gcm" "my_method" {
          keys = key_provider.aws_kms.my_key
        }

        state {
          method = method.aes_gcm.my_method
        }
      }
    }
  `);
});

Deno.test("encryption - openbao key provider", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Terraform(this, {
          encryption: {
            keyProviders: {
              openbao: {
                my_key: {
                  keyName: "my-transit-key",
                  address: "https://bao.example.com",
                  token: "s.abc123",
                },
              },
            },
            methods: {
              aesGcm: { my_method: { keys: "key_provider.openbao.my_key" } },
            },
            state: { method: "method.aes_gcm.my_method" },
          },
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    terraform {
      encryption {
        key_provider "openbao" "my_key" {
          key_name = "my-transit-key"
          address  = "https://bao.example.com"
          token    = "s.abc123"
        }

        method "aes_gcm" "my_method" {
          keys = key_provider.openbao.my_key
        }

        state {
          method = method.aes_gcm.my_method
        }
      }
    }
  `);
});
