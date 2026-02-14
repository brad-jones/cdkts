import type { Construct } from "../../construct.ts";
import { Provider } from "./provider.ts";

/**
 * Provider for the Denobridge Terraform provider, enabling pure TypeScript/Deno-based
 * infrastructure as code without needing to write Go.
 *
 * The Denobridge provider allows you to implement Terraform provider logic in TypeScript/Deno
 * instead of Go. This creates a fully unified TypeScript experience where both infrastructure
 * configuration and provider logic are written in the same language.
 *
 * This provider enables four types of constructs:
 * - **Resources**: Full CRUD lifecycle management (create, read, update, delete)
 * - **Data Sources**: Read-only data fetching and computations
 * - **Actions**: Execute operations with lifecycle triggers (e.g., notifications, webhooks)
 * - **Ephemeral Resources**: Short-lived temporary resources
 *
 * The TypeScript provider logic runs as a Deno process and communicates with Terraform
 * via JSON-RPC 2.0 over stdin/stdout.
 *
 * @see https://github.com/brad-jones/terraform-provider-denobridge
 *
 * @example
 * ```typescript
 * import { DenoBridgeProvider, Stack, Terraform } from "@brad-jones/cdkts/constructs";
 *
 * export default class MyStack extends Stack<typeof MyStack> {
 *   constructor() {
 *     super(`${import.meta.url}#${MyStack.name}`);
 *
 *     // Configure Terraform to use the denobridge provider
 *     new Terraform(this, {
 *       requiredVersion: ">=1,<2.0",
 *       requiredProviders: {
 *         denobridge: {
 *           source: "brad-jones/denobridge",
 *           version: "0.2.7",
 *         },
 *       },
 *     });
 *
 *     // Add the provider to your stack
 *     new DenoBridgeProvider(this);
 *
 *     // Now you can use Deno-based resources, data sources, and actions
 *     const data = new DenoDataSource(this, "my_data", { ... });
 *     new DenoResource(this, "my_resource", { ... });
 *   }
 * }
 * ```
 */
export class DenoBridgeProvider extends Provider<typeof DenoBridgeProvider> {
  /**
   * Configuration properties for the DenoBridgeProvider.
   *
   * These settings control how the provider locates and executes Deno for running
   * TypeScript provider logic.
   */
  static override Props = class extends Provider.Props {
    /**
     * Path to an existing Deno binary executable.
     *
     * Mutually exclusive with `denoVersion`. Use this when you want to use a specific
     * Deno installation that's already available on the system.
     *
     * Defaults to the current Deno executable path (`Deno.execPath()`).
     *
     * The Project API may automatically set this when running a bundled stack
     * with an embedded Deno binary to ensure the correct version is used across
     * different environments.
     *
     * @default Deno.execPath()
     *
     * @example
     * ```typescript
     * // Use a specific Deno installation
     * new DenoBridgeProvider(this, {
     *   denoBinaryPath: "/usr/local/bin/deno",
     * });
     * ```
     */
    denoBinaryPath = new Provider.Input<string | undefined>({
      hclName: "deno_binary_path",
      default: Deno.execPath(),
    });

    /**
     * Deno version to download and use.
     *
     * Mutually exclusive with `denoBinaryPath`. Use this when you want the provider to
     * automatically download a specific Deno version rather than using an existing installation.
     *
     * **Download behavior:**
     * - If `denoBinaryPath` is provided: Uses the existing binary, ignores `denoVersion`
     * - If `denoVersion` is provided: Downloads the specified Deno version
     * - If neither is provided: Downloads the latest GA (stable) version of Deno
     *
     * @example
     * ```typescript
     * // Download and use a specific Deno version
     * new DenoBridgeProvider(this, {
     *   denoVersion: "1.40.0",
     * });
     *
     * // Let provider download the latest stable version
     * new DenoBridgeProvider(this);
     * ```
     */
    denoVersion = new Provider.Input<string | undefined>({ hclName: "deno_version" });
  };

  /**
   * Creates a new DenoBridgeProvider instance.
   *
   * @param parent - The parent construct (typically a Stack)
   * @param inputs - Optional configuration properties for the provider
   *
   * @example
   * ```typescript
   * // Use default (downloads latest stable Deno)
   * new DenoBridgeProvider(this);
   *
   * // Use an existing Deno installation
   * new DenoBridgeProvider(this, {
   *   denoBinaryPath: "/usr/local/bin/deno",
   * });
   *
   * // Download a specific Deno version
   * new DenoBridgeProvider(this, {
   *   denoVersion: "1.40.0",
   * });
   * ```
   */
  constructor(parent: Construct, inputs?: DenoBridgeProvider["inputs"]) {
    super(parent, "denobridge", inputs);
  }
}
