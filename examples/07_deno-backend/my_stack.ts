import { dirname, fromFileUrl, join } from "@std/path";
import { DenoBackend, RawHcl, Resource, Stack, Terraform } from "@brad-jones/cdkts/constructs";

const stateFile = join(dirname(fromFileUrl(import.meta.url)), "terraform.tfstate");
const lockFile = `${stateFile}.lock`;

export default class MyStack extends Stack<typeof MyStack> {
  constructor() {
    super(`${import.meta.url}#${MyStack.name}`);

    const tf = new Terraform(this, {
      requiredVersion: ">=1,<2.0",
      requiredProviders: {
        local: {
          source: "hashicorp/local",
          version: "2.6.1",
        },
      },
    });

    new DenoBackend(tf, {
      handlers: {
        getState: async () => {
          try {
            return await Deno.readFile(stateFile);
          } catch {
            return null;
          }
        },
        updateState: async (body) => {
          await Deno.writeFile(stateFile, body);
        },
        deleteState: async () => {
          try {
            await Deno.remove(stateFile);
          } catch { /* noop */ }
        },
        lock: async (info) => {
          try {
            // Attempt to create the lock file exclusively
            const file = await Deno.open(lockFile, {
              write: true,
              createNew: true,
            });
            await file.write(new TextEncoder().encode(JSON.stringify(info)));
            file.close();
            return true;
          } catch {
            // Lock is already held — read existing lock info and throw
            const existing = await Deno.readTextFile(lockFile);
            throw new Error(existing);
          }
        },
        unlock: async () => {
          try {
            await Deno.remove(lockFile);
          } catch { /* noop */ }
        },
      },
    });

    new Resource(this, "local_file", "hello", {
      filename: new RawHcl('"${path.module}/message.txt"'),
      content: "Hello from Deno Backend!",
    });
  }
}
