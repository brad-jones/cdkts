import { importModule } from "@brad-jones/jsr-dynamic-imports";
import { basename, dirname, join } from "@std/path";
import { toFileUrl } from "@std/path/to-file-url";
import { Stack } from "../constructs/stack.ts";

export function getDenoCompileRootDir(): string {
  return tempDir(`deno-compile-${basename(Deno.execPath())}`);
}

export async function importStack(stackFilePath: string): Promise<Stack> {
  // Import the stack from the stack file
  const module = await importModule(toFileUrl(stackFilePath).toString());
  const defaultValue = module.default;

  // Validate that the default export is a constructor
  if (typeof defaultValue !== "function" || !defaultValue.prototype) {
    throw new Error(
      `The default export from ${stackFilePath} must be a class or constructor function that can be instantiated`,
    );
  }

  // Validate that the newed up value is indeed a stack instance
  const stack = new defaultValue();
  if (!(stack instanceof Stack)) {
    throw new Error(`The default export from ${stackFilePath} must be a class that extends Stack`);
  }

  return stack;
}

let _tmpDir: string | undefined = undefined;

export function tempDir(...parts: string[]): string {
  if (!_tmpDir) {
    const tmpFile = Deno.makeTempFileSync();
    _tmpDir = dirname(tmpFile);
    Deno.removeSync(tmpFile);
  }
  return join(_tmpDir, ...parts);
}
