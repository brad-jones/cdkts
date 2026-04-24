import type { Construct } from "../../construct.ts";
import { Backend } from "./backend.ts";

/**
 * Google Cloud Storage (GCS) backend configuration for storing Terraform/OpenTofu state.
 *
 * The gcs backend stores state as an object in a configurable prefix in a pre-existing
 * bucket on Google Cloud Storage. The bucket must exist prior to configuring the backend.
 * This backend supports state locking.
 *
 * It is highly recommended to enable Object Versioning on the GCS bucket to allow
 * for state recovery in the case of accidental deletions and human error.
 *
 * @see https://developer.hashicorp.com/terraform/language/backend/gcs
 *
 * @example
 * ```typescript
 * // Basic configuration
 * new GcsBackend(terraform, {
 *   bucket: "tf-state-prod",
 *   prefix: "terraform/state",
 * });
 *
 * // With customer-managed encryption key
 * new GcsBackend(terraform, {
 *   bucket: "tf-state-prod",
 *   prefix: "terraform/state",
 *   kmsEncryptionKey: "projects/my-project/locations/global/keyRings/my-ring/cryptoKeys/my-key",
 * });
 *
 * // With service account impersonation
 * new GcsBackend(terraform, {
 *   bucket: "tf-state-prod",
 *   impersonateServiceAccount: "terraform@my-project.iam.gserviceaccount.com",
 * });
 * ```
 */
export class GcsBackend extends Backend<typeof GcsBackend> {
  static override readonly Props = class extends Backend.Props {
    /**
     * (Required) The name of the GCS bucket. This name must be globally unique.
     *
     * @see https://cloud.google.com/storage/docs/bucketnaming.html#requirements
     */
    bucket = new Backend.Input<string | undefined>();

    /**
     * (Optional) Local path to Google Cloud Platform account credentials in JSON format.
     *
     * If unset, uses Google Application Default Credentials. The provided credentials
     * must have the Storage Object Admin role on the bucket.
     *
     * Can also be set via `GOOGLE_BACKEND_CREDENTIALS` or `GOOGLE_CREDENTIALS`
     * environment variables.
     */
    credentials = new Backend.Input<string | undefined>();

    /**
     * (Optional) A temporary OAuth 2.0 access token obtained from the Google
     * Authorization server.
     *
     * This is an alternative to `credentials`. If both are specified,
     * `accessToken` will be used over `credentials`.
     */
    accessToken = new Backend.Input<string | undefined>({ hclName: "access_token" });

    /**
     * (Optional) GCS prefix inside the bucket.
     *
     * Named states for workspaces are stored in an object called
     * `<prefix>/<name>.tfstate`.
     */
    prefix = new Backend.Input<string | undefined>();

    /**
     * (Optional) A 32 byte base64 encoded customer-supplied encryption key used
     * when reading and writing state files in the bucket.
     *
     * Can also be set via the `GOOGLE_ENCRYPTION_KEY` environment variable.
     *
     * @see https://cloud.google.com/storage/docs/encryption/customer-supplied-keys
     */
    encryptionKey = new Backend.Input<string | undefined>({ hclName: "encryption_key" });

    /**
     * (Optional) A Cloud KMS key (customer-managed encryption key) used when reading
     * and writing state files in the bucket.
     *
     * Format: `projects/{{project}}/locations/{{location}}/keyRings/{{keyRing}}/cryptoKeys/{{name}}`
     *
     * Can also be set via the `GOOGLE_KMS_ENCRYPTION_KEY` environment variable.
     *
     * @see https://cloud.google.com/storage/docs/encryption/customer-managed-keys
     */
    kmsEncryptionKey = new Backend.Input<string | undefined>({ hclName: "kms_encryption_key" });

    /**
     * (Optional) The service account to impersonate for accessing the State Bucket.
     *
     * You must have `roles/iam.serviceAccountTokenCreator` on that account.
     * If using a delegation chain, specify it with `impersonateServiceAccountDelegates`.
     *
     * Can also be set via `GOOGLE_BACKEND_IMPERSONATE_SERVICE_ACCOUNT` or
     * `GOOGLE_IMPERSONATE_SERVICE_ACCOUNT` environment variables.
     */
    impersonateServiceAccount = new Backend.Input<string | undefined>({
      hclName: "impersonate_service_account",
    });

    /**
     * (Optional) The delegation chain for impersonating a service account.
     *
     * @see https://cloud.google.com/iam/docs/creating-short-lived-service-account-credentials#sa-credentials-delegated
     */
    impersonateServiceAccountDelegates = new Backend.Input<string[] | undefined>({
      hclName: "impersonate_service_account_delegates",
    });

    /**
     * (Optional) A URL containing the protocol, DNS name pointing to a Private
     * Service Connect endpoint, and the path for the Cloud Storage API.
     *
     * Can also be set via `GOOGLE_BACKEND_STORAGE_CUSTOM_ENDPOINT` or
     * `GOOGLE_STORAGE_CUSTOM_ENDPOINT` environment variables.
     */
    storageCustomEndpoint = new Backend.Input<string | undefined>({ hclName: "storage_custom_endpoint" });
  };

  /**
   * Creates a new GCS backend configuration block.
   *
   * @param parent - The parent construct (typically a Terraform block)
   * @param inputs - Optional configuration inputs for the GCS backend
   */
  constructor(parent: Construct, inputs?: GcsBackend["inputs"]) {
    super(parent, "gcs", inputs);
  }
}
