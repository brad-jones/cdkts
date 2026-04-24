import type { Construct } from "../../construct.ts";
import { Backend } from "./backend.ts";

/**
 * Consul backend configuration for storing Terraform/OpenTofu state in the Consul KV store.
 *
 * The consul backend stores state in the Consul KV store at a given path. This backend
 * supports state locking. Note that for access credentials, HashiCorp recommends using
 * a partial configuration or environment variables.
 *
 * @see https://developer.hashicorp.com/terraform/language/backend/consul
 *
 * @example
 * ```typescript
 * // Basic configuration
 * new ConsulBackend(terraform, {
 *   address: "consul.example.com",
 *   scheme: "https",
 *   path: "full/path",
 * });
 *
 * // Minimal configuration (relies on local agent)
 * new ConsulBackend(terraform, {
 *   path: "terraform/state",
 * });
 *
 * // With gzip compression
 * new ConsulBackend(terraform, {
 *   path: "terraform/state",
 *   gzip: true,
 * });
 * ```
 */
export class ConsulBackend extends Backend<typeof ConsulBackend> {
  static override readonly Props = class extends Backend.Props {
    /**
     * (Required) Path in the Consul KV store.
     */
    path = new Backend.Input<string | undefined>();

    /**
     * (Required) Consul access token.
     *
     * Can also be set via the `CONSUL_HTTP_TOKEN` environment variable.
     */
    accessToken = new Backend.Input<string | undefined>({ hclName: "access_token" });

    /**
     * (Optional) DNS name and port of the Consul endpoint in the format `dnsname:port`.
     *
     * Defaults to the local agent HTTP listener. Can also be set via the
     * `CONSUL_HTTP_ADDR` environment variable.
     */
    address = new Backend.Input<string | undefined>();

    /**
     * (Optional) Protocol to use when talking to the given address, either `http` or `https`.
     *
     * SSL support can also be triggered by setting the `CONSUL_HTTP_SSL`
     * environment variable to `true`.
     */
    scheme = new Backend.Input<string | undefined>();

    /**
     * (Optional) The datacenter to use.
     *
     * Defaults to that of the agent.
     */
    datacenter = new Backend.Input<string | undefined>();

    /**
     * (Optional) HTTP Basic Authentication credentials to be used when communicating
     * with Consul, in the format of either `user` or `user:pass`.
     *
     * Can also be set via the `CONSUL_HTTP_AUTH` environment variable.
     */
    httpAuth = new Backend.Input<string | undefined>({ hclName: "http_auth" });

    /**
     * (Optional) `true` to compress the state data using gzip, or `false` (the default)
     * to leave it uncompressed.
     */
    gzip = new Backend.Input<boolean | undefined>();

    /**
     * (Optional) `false` to disable locking.
     *
     * Defaults to `true`, but requires session permissions with Consul and
     * at least kv write permissions on `$path/.lock`.
     */
    lock = new Backend.Input<boolean | undefined>();

    /**
     * (Optional) A path to a PEM-encoded certificate authority used to verify
     * the remote agent's certificate.
     *
     * Can also be set via the `CONSUL_CACERT` environment variable.
     */
    caFile = new Backend.Input<string | undefined>({ hclName: "ca_file" });

    /**
     * (Optional) A path to a PEM-encoded certificate provided to the remote agent.
     *
     * Requires use of `keyFile`. Can also be set via the `CONSUL_CLIENT_CERT`
     * environment variable.
     */
    certFile = new Backend.Input<string | undefined>({ hclName: "cert_file" });

    /**
     * (Optional) A path to a PEM-encoded private key, required if `certFile` is specified.
     *
     * Can also be set via the `CONSUL_CLIENT_KEY` environment variable.
     */
    keyFile = new Backend.Input<string | undefined>({ hclName: "key_file" });
  };

  /**
   * Creates a new Consul backend configuration block.
   *
   * @param parent - The parent construct (typically a Terraform block)
   * @param inputs - Optional configuration inputs for the Consul backend
   */
  constructor(parent: Construct, inputs?: ConsulBackend["inputs"]) {
    super(parent, "consul", inputs);
  }
}
