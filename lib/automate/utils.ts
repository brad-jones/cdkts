import { readDenoConfigFile } from "@brad-jones/deno-config";
import { ImportMapImporter } from "@lambdalisue/import-map-importer";
import { basename, dirname, join } from "@std/path";
import { toFileUrl } from "@std/path/to-file-url";
import { Stack } from "../constructs/stack.ts";

/**
 * Gets the root directory for Deno compiled executables, where included files are stored.
 *
 * NB: This directory is not actually on the filesystem and is only in memory,
 * you may then read files from here and do what you need to with them.
 * eg: Write them to the real filesystem and execute them.
 *
 * @returns The path to the Deno compile root directory
 */
export function getDenoCompileRootDir(): string {
  return tempDir(`deno-compile-${basename(Deno.execPath())}`);
}

/**
 * Dynamically imports a Stack from a TypeScript file.
 * Validates that the default export is a class that extends Stack.
 *
 * @param stackFilePath - The file system path to the stack module
 * @returns A promise that resolves to an instance of the Stack
 * @throws {Error} If the default export is not a constructor or class
 * @throws {Error} If the instantiated object is not a Stack instance
 */
export async function importStack(stackFilePath: string): Promise<Stack> {
  // Import the stack from the stack file
  const config = await readDenoConfigFile(stackFilePath);
  const importer = new ImportMapImporter({ imports: config?.imports ?? {} });
  // deno-lint-ignore no-explicit-any
  const module = await importer.import<any>(toFileUrl(stackFilePath).toString());
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

/**
 * Gets or creates a temporary directory and optionally joins additional path parts.
 * The temporary directory is determined once and cached for subsequent calls.
 *
 * @param parts - Optional path segments to join to the temp directory
 * @returns The complete path to the temporary directory with joined parts
 */
export function tempDir(...parts: string[]): string {
  if (!_tmpDir) {
    const tmpFile = Deno.makeTempFileSync();
    _tmpDir = dirname(tmpFile);
    Deno.removeSync(tmpFile);
  }
  return join(_tmpDir, ...parts);
}
