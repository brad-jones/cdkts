import type { Construct } from "../../construct.ts";
import { Backend } from "./backend.ts";

/**
 * HTTP backend configuration for storing Terraform/OpenTofu state using a REST client.
 *
 * The http backend stores state using a simple REST client. State is fetched via GET,
 * updated via POST (configurable), and purged with DELETE. This backend optionally
 * supports state locking using LOCK and UNLOCK requests.
 *
 * When locking is enabled, the endpoint should return 423 (Locked) or 409 (Conflict)
 * with the holding lock info when the lock is already taken, and 200 (OK) for success.
 *
 * @see https://developer.hashicorp.com/terraform/language/backend/http
 *
 * @example
 * ```typescript
 * // Basic configuration
 * new HttpBackend(terraform, {
 *   address: "http://myrest.api.com/foo",
 * });
 *
 * // With locking endpoints
 * new HttpBackend(terraform, {
 *   address: "http://myrest.api.com/foo",
 *   lockAddress: "http://myrest.api.com/foo",
 *   unlockAddress: "http://myrest.api.com/foo",
 * });
 *
 * // With basic authentication
 * new HttpBackend(terraform, {
 *   address: "http://myrest.api.com/foo",
 *   username: "admin",
 *   password: "secret",
 * });
 * ```
 */
export class HttpBackend extends Backend<typeof HttpBackend> {
  static override readonly Props = class extends Backend.Props {
    /**
     * (Required) The address of the REST endpoint.
     *
     * Can also be set via the `TF_HTTP_ADDRESS` environment variable.
     */
    address = new Backend.Input<string | undefined>();

    /**
     * (Optional) HTTP method to use when updating state.
     *
     * Defaults to `POST`. Can also be set via the `TF_HTTP_UPDATE_METHOD`
     * environment variable.
     */
    updateMethod = new Backend.Input<string | undefined>({ hclName: "update_method" });

    /**
     * (Optional) The address of the lock REST endpoint.
     *
     * Defaults to disabled. Can also be set via the `TF_HTTP_LOCK_ADDRESS`
     * environment variable.
     */
    lockAddress = new Backend.Input<string | undefined>({ hclName: "lock_address" });

    /**
     * (Optional) The HTTP method to use when locking.
     *
     * Defaults to `LOCK`. Can also be set via the `TF_HTTP_LOCK_METHOD`
     * environment variable.
     */
    lockMethod = new Backend.Input<string | undefined>({ hclName: "lock_method" });

    /**
     * (Optional) The address of the unlock REST endpoint.
     *
     * Defaults to disabled. Can also be set via the `TF_HTTP_UNLOCK_ADDRESS`
     * environment variable.
     */
    unlockAddress = new Backend.Input<string | undefined>({ hclName: "unlock_address" });

    /**
     * (Optional) The HTTP method to use when unlocking.
     *
     * Defaults to `UNLOCK`. Can also be set via the `TF_HTTP_UNLOCK_METHOD`
     * environment variable.
     */
    unlockMethod = new Backend.Input<string | undefined>({ hclName: "unlock_method" });

    /**
     * (Optional) The username for HTTP basic authentication.
     *
     * Can also be set via the `TF_HTTP_USERNAME` environment variable.
     */
    username = new Backend.Input<string | undefined>();

    /**
     * (Optional) The password for HTTP basic authentication.
     *
     * Can also be set via the `TF_HTTP_PASSWORD` environment variable.
     */
    password = new Backend.Input<string | undefined>();

    /**
     * (Optional) Whether to skip TLS verification.
     *
     * Defaults to `false`.
     */
    skipCertVerification = new Backend.Input<boolean | undefined>({ hclName: "skip_cert_verification" });

    /**
     * (Optional) The number of HTTP request retries.
     *
     * Defaults to `2`. Can also be set via the `TF_HTTP_RETRY_MAX`
     * environment variable.
     */
    retryMax = new Backend.Input<number | undefined>({ hclName: "retry_max" });

    /**
     * (Optional) The minimum time in seconds to wait between HTTP request attempts.
     *
     * Defaults to `1`. Can also be set via the `TF_HTTP_RETRY_WAIT_MIN`
     * environment variable.
     */
    retryWaitMin = new Backend.Input<number | undefined>({ hclName: "retry_wait_min" });

    /**
     * (Optional) The maximum time in seconds to wait between HTTP request attempts.
     *
     * Defaults to `30`. Can also be set via the `TF_HTTP_RETRY_WAIT_MAX`
     * environment variable.
     */
    retryWaitMax = new Backend.Input<number | undefined>({ hclName: "retry_wait_max" });

    /**
     * (Optional) A PEM-encoded certificate used by the server to verify the client
     * during mutual TLS (mTLS) authentication.
     *
     * Can also be set via the `TF_HTTP_CLIENT_CERTIFICATE_PEM` environment variable.
     */
    clientCertificatePem = new Backend.Input<string | undefined>({ hclName: "client_certificate_pem" });

    /**
     * (Optional) A PEM-encoded private key, required if `clientCertificatePem` is specified.
     *
     * Can also be set via the `TF_HTTP_CLIENT_PRIVATE_KEY_PEM` environment variable.
     */
    clientPrivateKeyPem = new Backend.Input<string | undefined>({ hclName: "client_private_key_pem" });

    /**
     * (Optional) A PEM-encoded CA certificate chain used by the client to verify
     * server certificates during TLS authentication.
     *
     * Can also be set via the `TF_HTTP_CLIENT_CA_CERTIFICATE_PEM` environment variable.
     */
    clientCaCertificatePem = new Backend.Input<string | undefined>({ hclName: "client_ca_certificate_pem" });
  };

  /**
   * Creates a new HTTP backend configuration block.
   *
   * @param parent - The parent construct (typically a Terraform block)
   * @param inputs - Optional configuration inputs for the HTTP backend
   */
  constructor(parent: Construct, inputs?: HttpBackend["inputs"]) {
    super(parent, "http", inputs);
  }
}
