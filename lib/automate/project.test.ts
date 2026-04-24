import { assertRejects } from "@std/assert";
import { Stack, Terraform } from "../constructs/mod.ts";
import { Project } from "./project.ts";

class EncryptedStack extends Stack<typeof EncryptedStack> {
  constructor(id: string) {
    super(id);
    new Terraform(this, {
      encryption: {
        keyProviders: {
          pbkdf2: { my_key: { passphrase: "correct-horse-battery-staple" } },
        },
        methods: {
          aesGcm: { my_method: { keys: "key_provider.pbkdf2.my_key" } },
        },
        state: { method: "method.aes_gcm.my_method" },
      },
    });
  }
}

class PlainStack extends Stack<typeof PlainStack> {
  constructor(id: string) {
    super(id);
    new Terraform(this, { requiredVersion: ">=1.0" });
  }
}

Deno.test(
  "project - throws when flavor is 'terraform' and encryption is configured",
  async () => {
    const stack = new EncryptedStack(`${import.meta.url}#terraform-encryption-error`);
    await using project = new Project({
      flavor: "terraform",
      stack,
      projectDir: await Deno.makeTempDir({ prefix: "cdkts-project-test-" }),
    });
    await assertRejects(
      () => project.preInit(),
      Error,
      "State encryption is an OpenTofu-only feature",
    );
  },
);

Deno.test(
  "project - does not throw when flavor is 'tofu' and encryption is configured",
  async () => {
    const stack = new EncryptedStack(`${import.meta.url}#tofu-encryption-ok`);
    const projectDir = await Deno.makeTempDir({ prefix: "cdkts-project-test-" });
    await using project = new Project({
      flavor: "tofu",
      stack,
      projectDir,
    });
    await project.preInit();
    await Deno.remove(projectDir, { recursive: true });
  },
);

Deno.test(
  "project - does not throw when flavor is 'terraform' and no encryption is configured",
  async () => {
    const stack = new PlainStack(`${import.meta.url}#terraform-no-encryption-ok`);
    const projectDir = await Deno.makeTempDir({ prefix: "cdkts-project-test-" });
    await using project = new Project({
      flavor: "terraform",
      stack,
      projectDir,
    });
    await project.preInit();
    await Deno.remove(projectDir, { recursive: true });
  },
);
