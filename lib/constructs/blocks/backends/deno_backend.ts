import type { Construct } from "../../construct.ts";
import { HttpBackend } from "./http_backend.ts";

/**
 * Lock information structure matching Terraform's lock info format.
 *
 * @see https://developer.hashicorp.com/terraform/language/backend/http
 */
export interface LockInfo {
  ID: string;
  Operation: string;
  Info: string;
  Who: string;
  Version: string;
  Created: string;
  Path: string;
}

/**
 * Handler methods for the Deno backend HTTP server.
 *
 * Implement these methods to provide custom state storage logic.
 * The `lock` and `unlock` handlers are optional — if omitted,
 * state locking will be disabled.
 */
export interface DenoBackendHandlers {
  /** Retrieve the current state. Return the state bytes or `null` if no state exists. */
  getState(): Promise<Uint8Array | null>;
  /** Store updated state. */
  updateState(body: Uint8Array): Promise<void>;
  /** Purge the stored state. */
  deleteState(): Promise<void>;
  /** Acquire a state lock. Return `true` if acquired. Throw with existing lock info JSON if held. */
  lock?(info: LockInfo): Promise<boolean>;
  /** Release a state lock. */
  unlock?(info: LockInfo): Promise<void>;
}

/**
 * Configuration options for the Deno backend.
 */
export interface DenoBackendConfig {
  /**
   * Handler methods for state operations.
   *
   * Implement these to provide custom state storage logic. The `lock` and
   * `unlock` handlers are optional — if omitted, state locking is disabled.
   */
  handlers: DenoBackendHandlers;

  /**
   * (Optional) The port to bind the HTTPS server to.
   *
   * Defaults to `0` (OS-assigned port). Set this if you need a fixed port.
   */
  port?: number;

  /**
   * (Optional) The hostname to bind the HTTPS server to.
   *
   * Defaults to `"localhost"`.
   */
  hostname?: string;
}

/**
 * A Terraform HTTP backend powered by a local Deno HTTPS server.
 *
 * The `DenoBackend` wraps the standard HTTP backend and automatically starts
 * an HTTPS server that routes Terraform state requests to user-provided
 * TypeScript handler methods. Authentication is handled via basic auth
 * with auto-generated credentials, and TLS uses a self-signed certificate.
 *
 * The {@link Project} class detects `DenoBackend` instances in the stack and
 * manages the server lifecycle automatically — starting before terraform
 * commands run and shutting down during cleanup.
 *
 * @see https://developer.hashicorp.com/terraform/language/backend/http
 *
 * @example
 * ```typescript
 * const tf = new Terraform(this, {
 *   requiredVersion: ">=1,<2.0",
 *   requiredProviders: {
 *     local: { source: "hashicorp/local", version: "2.6.1" },
 *   },
 * });
 *
 * new DenoBackend(tf, {
 *   handlers: {
 *     getState: async () => {
 *       try { return await Deno.readFile("./terraform.tfstate"); }
 *       catch { return null; }
 *     },
 *     updateState: async (body) => {
 *       await Deno.writeFile("./terraform.tfstate", body);
 *     },
 *     deleteState: async () => {
 *       try { await Deno.remove("./terraform.tfstate"); } catch { /* noop *\/ }
 *     },
 *   },
 * });
 * ```
 */
export class DenoBackend extends HttpBackend {
  /**
   * The user-provided handler methods for state operations.
   * These are runtime-only and not serialized to HCL.
   */
  readonly handlers: DenoBackendHandlers;

  /**
   * The port to bind the server to. `0` means OS-assigned.
   */
  readonly serverPort: number;

  /**
   * The hostname to bind the server to.
   */
  readonly serverHostname: string;

  /**
   * Creates a new Deno backend configuration.
   *
   * @param parent - The parent construct (typically a Terraform block)
   * @param config - Backend configuration with handler methods and optional server settings
   */
  constructor(parent: Construct, config: DenoBackendConfig) {
    super(parent, {
      skipCertVerification: true,
    });

    this.handlers = config.handlers;
    this.serverPort = config.port ?? 0;
    this.serverHostname = config.hostname ?? "localhost";
  }
}
