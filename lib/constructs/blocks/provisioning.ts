import type { Construct } from "../construct.ts";
import { RawHcl } from "../rawhcl.ts";
import { snakeCaseKeys } from "../utils.ts";
import { Block } from "./block.ts";

/**
 * Connection settings for provisioners to connect to remote resources.
 *
 * A `connection` block can appear at the resource/removed level (shared across all
 * provisioners) or inside a specific `provisioner` block. Supports SSH and WinRM
 * connections, optionally through bastion hosts or proxies.
 *
 * @see https://developer.hashicorp.com/terraform/language/resources/provisioners/connection
 */
export interface Connection {
  /** Connection type: `"ssh"` or `"winrm"`. Defaults to `"ssh"`. */
  type?: "ssh" | "winrm";
  /** The address of the resource to connect to. Required. */
  host: string;
  /** The user for the connection. Defaults to `"root"` (SSH) or `"Administrator"` (WinRM). */
  user?: string;
  /** The password for the connection. */
  password?: string;
  /** The port to connect to. Defaults to `22` (SSH) or `5985` (WinRM). */
  port?: number;
  /** Timeout for the connection to become available. Defaults to `"5m"`. */
  timeout?: string;
  /** Path on the remote resource where Terraform copies scripts. */
  scriptPath?: string;
  /** Contents of an SSH key for the connection. Takes precedence over `password`. */
  privateKey?: string;
  /** Contents of a signed CA certificate. Requires `privateKey`. */
  certificate?: string;
  /** Set to `false` to disable `ssh-agent` authentication. */
  agent?: boolean;
  /** Preferred identity from the SSH agent. */
  agentIdentity?: string;
  /** Public key from the remote host or signing CA for verification. */
  hostKey?: string;
  /** Target platform: `"unix"` or `"windows"`. Affects default `scriptPath`. */
  targetPlatform?: "unix" | "windows";

  // WinRM-specific
  /** Set to `true` to connect using HTTPS instead of HTTP. */
  https?: boolean;
  /** Set to `true` to skip validating the HTTPS certificate chain. */
  insecure?: boolean;
  /** Set to `true` to use NTLM authentication instead of basic authentication. */
  useNtlm?: boolean;
  /** CA certificate to validate against. */
  cacert?: string;

  // Bastion host
  /** Address of the bastion host to connect through. */
  bastionHost?: string;
  /** Public key from the bastion host or signing CA for verification. */
  bastionHostKey?: string;
  /** Port for the bastion host connection. */
  bastionPort?: number;
  /** User name for connecting to the bastion host. */
  bastionUser?: string;
  /** Password for connecting to the bastion host. */
  bastionPassword?: string;
  /** Contents of an SSH key file for the bastion host. */
  bastionPrivateKey?: string;
  /** Contents of a signed CA certificate for the bastion host. */
  bastionCertificate?: string;

  // Proxy
  /** Proxy protocol: `"http"`, `"https"`, or `"socks5"`. */
  proxyScheme?: "http" | "https" | "socks5";
  /** Address of the proxy host. */
  proxyHost?: string;
  /** Port for the proxy host connection. */
  proxyPort?: number;
  /** User name for proxy authentication. */
  proxyUserName?: string;
  /** Password for proxy authentication. */
  proxyUserPassword?: string;
}

// ---------------------------------------------------------------------------
// Provisioner types for Resource blocks
// ---------------------------------------------------------------------------

interface ProvisionerBase {
  /** Per-provisioner connection settings, overriding the resource-level connection. */
  connection?: Connection;
  /** When to run: `"create"` (default) or `"destroy"`. */
  when?: "create" | "destroy";
  /** Failure behaviour: `"fail"` (default) or `"continue"`. */
  onFailure?: "continue" | "fail";
}

/**
 * Copies files or directories from the local machine to the remote resource.
 *
 * @see https://developer.hashicorp.com/terraform/language/resources/provisioners/file
 */
export interface FileProvisioner extends ProvisionerBase {
  type: "file";
  /** Local path to the source file or directory. Mutually exclusive with `content`. */
  source?: string;
  /** Remote path where the file or directory should be placed. Required. */
  destination: string;
  /** Literal content to upload. Mutually exclusive with `source`. */
  content?: string;
}

/**
 * Invokes a command on the machine where Terraform is running.
 *
 * @see https://developer.hashicorp.com/terraform/language/resources/provisioners/local-exec
 */
export interface LocalExecProvisioner extends ProvisionerBase {
  type: "local-exec";
  /** The command to execute locally. Required. */
  command: string;
  /** Working directory for the command. */
  workingDir?: string;
  /** Interpreter and arguments used to run the command (e.g., `["/bin/bash", "-c"]`). */
  interpreter?: string[];
  /** Environment variables for the command. */
  environment?: Record<string, string>;
  /** Set to `true` to suppress command output in logs. */
  quiet?: boolean;
}

/**
 * Invokes commands on a remote resource over SSH or WinRM.
 *
 * @see https://developer.hashicorp.com/terraform/language/resources/provisioners/remote-exec
 */
export interface RemoteExecProvisioner extends ProvisionerBase {
  type: "remote-exec";
  /** List of commands to execute. Mutually exclusive with `script`/`scripts`. */
  inline?: string[];
  /** Path to a local script to upload and execute. Mutually exclusive with `inline`/`scripts`. */
  script?: string;
  /** List of local scripts to upload and execute. Mutually exclusive with `inline`/`script`. */
  scripts?: string[];
}

/**
 * A provisioner that can be added to a `resource` block.
 *
 * Terraform supports three built-in provisioner types: `file`, `local-exec`, and `remote-exec`.
 *
 * @see https://developer.hashicorp.com/terraform/language/resources/provisioners/syntax
 */
export type Provisioner = FileProvisioner | LocalExecProvisioner | RemoteExecProvisioner;

// ---------------------------------------------------------------------------
// Provisioner types for Removed blocks
// ---------------------------------------------------------------------------

/**
 * A `local-exec` provisioner for use in `removed` blocks.
 *
 * Differs from the resource variant: `when` is required (must be `"destroy"`),
 * and the `environment` argument is not supported.
 *
 * @see https://developer.hashicorp.com/terraform/language/block/removed#provisioner
 */
export interface RemovedLocalExecProvisioner {
  type: "local-exec";
  /** Must be `"destroy"` for provisioners in `removed` blocks. */
  when: "destroy";
  /** The command to execute locally. Required. */
  command: string;
  /** Working directory for the command. */
  workingDir?: string;
  /** Interpreter and arguments used to run the command. */
  interpreter?: string[];
  /** Set to `true` to suppress command output in logs. */
  quiet?: boolean;
  /** Per-provisioner connection settings. */
  connection?: Connection;
  /** Failure behaviour: `"fail"` (default) or `"continue"`. */
  onFailure?: "continue" | "fail";
}

/**
 * A `remote-exec` provisioner for use in `removed` blocks.
 *
 * Differs from the resource variant: `when` is required (must be `"destroy"`).
 *
 * @see https://developer.hashicorp.com/terraform/language/block/removed#provisioner
 */
export interface RemovedRemoteExecProvisioner {
  type: "remote-exec";
  /** Must be `"destroy"` for provisioners in `removed` blocks. */
  when: "destroy";
  /** List of commands to execute. Mutually exclusive with `script`/`scripts`. */
  inline?: string[];
  /** Path to a local script to upload and execute. Mutually exclusive with `inline`/`scripts`. */
  script?: string;
  /** List of local scripts to upload and execute. Mutually exclusive with `inline`/`script`. */
  scripts?: string[];
  /** Per-provisioner connection settings. */
  connection?: Connection;
  /** Failure behaviour: `"fail"` (default) or `"continue"`. */
  onFailure?: "continue" | "fail";
}

/**
 * A provisioner that can be added to a `removed` block.
 *
 * Only `local-exec` and `remote-exec` are supported (no `file` provisioner).
 * The `when` argument is required and must be `"destroy"`.
 *
 * @see https://developer.hashicorp.com/terraform/language/block/removed#provisioner
 */
export type RemovedProvisioner = RemovedLocalExecProvisioner | RemovedRemoteExecProvisioner;

// ---------------------------------------------------------------------------
// Helper functions for building child blocks
// ---------------------------------------------------------------------------

/**
 * Creates a `connection` child block on the given parent construct.
 *
 * @param parent - The parent construct (resource, removed, or provisioner block)
 * @param connection - The connection configuration with camelCase keys
 */
export function buildConnectionBlock(parent: Construct, connection: Connection): void {
  new Block(parent as Block, "connection", [], snakeCaseKeys(connection as unknown as Record<string, unknown>));
}

/**
 * Creates `provisioner` child blocks on the given parent construct.
 *
 * Each provisioner becomes a `provisioner "<TYPE>"` child block. Keyword arguments
 * (`when`, `on_failure`) are wrapped in {@link RawHcl} so they are emitted without
 * quotes. Per-provisioner `connection` blocks are created as nested children.
 *
 * @param parent - The parent construct (resource or removed block)
 * @param provisioners - Array of provisioner configurations
 */
export function buildProvisionerBlocks(
  parent: Construct,
  provisioners: (Provisioner | RemovedProvisioner)[],
): void {
  for (const provisioner of provisioners) {
    const { type, connection, ...rest } = provisioner;
    const hclInputs = snakeCaseKeys(rest as unknown as Record<string, unknown>);

    // Wrap keyword values in RawHcl so they are emitted unquoted
    if (hclInputs["when"]) {
      hclInputs["when"] = new RawHcl(hclInputs["when"] as string);
    }
    if (hclInputs["on_failure"]) {
      hclInputs["on_failure"] = new RawHcl(hclInputs["on_failure"] as string);
    }

    new Block(parent as Block, "provisioner", [type], hclInputs, (b) => {
      if (connection) {
        buildConnectionBlock(b, connection);
      }
    });
  }
}
