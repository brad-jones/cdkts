import type { Construct } from "../../construct.ts";
import { Backend } from "./backend.ts";

/**
 * Azure Blob Storage (azurerm) backend configuration for storing Terraform/OpenTofu state.
 *
 * The azurerm backend stores state as a Blob with the given Key within the Blob Container
 * within the Blob Storage Account. This backend supports state locking and consistency
 * checking with Azure Blob Storage native capabilities.
 *
 * The backend supports multiple authentication methods: Microsoft Entra ID (recommended),
 * SAS Token, Access Key, and Access Key Lookup. Microsoft Entra ID supports OIDC/Workload
 * Identity, Managed Identity, Azure CLI, Client Secret, and Client Certificate.
 *
 * @see https://developer.hashicorp.com/terraform/language/backend/azurerm
 *
 * @example
 * ```typescript
 * // Entra ID with OIDC (recommended)
 * new AzurermBackend(terraform, {
 *   useOidc: true,
 *   useAzureadAuth: true,
 *   tenantId: "00000000-0000-0000-0000-000000000000",
 *   clientId: "00000000-0000-0000-0000-000000000000",
 *   storageAccountName: "abcd1234",
 *   containerName: "tfstate",
 *   key: "prod.terraform.tfstate",
 * });
 *
 * // Access Key authentication
 * new AzurermBackend(terraform, {
 *   accessKey: "abcdefghijklmnopqrstuvwxyz...",
 *   storageAccountName: "abcd1234",
 *   containerName: "tfstate",
 *   key: "prod.terraform.tfstate",
 * });
 *
 * // Azure CLI authentication
 * new AzurermBackend(terraform, {
 *   useCli: true,
 *   useAzureadAuth: true,
 *   tenantId: "00000000-0000-0000-0000-000000000000",
 *   storageAccountName: "abcd1234",
 *   containerName: "tfstate",
 *   key: "prod.terraform.tfstate",
 * });
 * ```
 */
export class AzurermBackend extends Backend<typeof AzurermBackend> {
  static override readonly Props = class extends Backend.Props {
    // =========================================================================
    // State Storage
    // =========================================================================

    /**
     * (Required) The name of the storage account to write the state file blob to.
     *
     * Can be passed via `-backend-config="storage_account_name=..."` in the `init` command.
     */
    storageAccountName = new Backend.Input<string | undefined>({ hclName: "storage_account_name" });

    /**
     * (Required) The name of the storage account container to write the state file blob to.
     *
     * Can be passed via `-backend-config="container_name=..."` in the `init` command.
     */
    containerName = new Backend.Input<string | undefined>({ hclName: "container_name" });

    /**
     * (Required) The name of the blob within the storage account container
     * to write the state file to.
     *
     * Can be passed via `-backend-config="key=..."` in the `init` command.
     */
    key = new Backend.Input<string | undefined>();

    /**
     * (Optional) Whether to enable snapshots on the blob.
     */
    snapshotEnabled = new Backend.Input<boolean | undefined>({ hclName: "snapshot" });

    /**
     * (Optional) The Azure cloud environment to use.
     *
     * Can also be set via the `ARM_ENVIRONMENT` environment variable.
     * Defaults to `public`.
     */
    environment = new Backend.Input<string | undefined>();

    // =========================================================================
    // Microsoft Entra ID Authentication
    // =========================================================================

    /**
     * (Optional) Set to `true` to use Microsoft Entra ID authentication to the
     * storage account data plane.
     *
     * Can also be set via the `ARM_USE_AZUREAD` environment variable.
     */
    useAzureadAuth = new Backend.Input<boolean | undefined>({ hclName: "use_azuread_auth" });

    /**
     * (Optional) The tenant ID of the Microsoft Entra ID principal.
     *
     * Required to authenticate to the storage account data plane. If using
     * Azure CLI, this can be inferred from the CLI session.
     *
     * Can also be set via the `ARM_TENANT_ID` environment variable.
     */
    tenantId = new Backend.Input<string | undefined>({ hclName: "tenant_id" });

    /**
     * (Optional) The client ID of the Microsoft Entra ID Service Principal /
     * App Registration or User Assigned Managed Identity.
     *
     * Can also be set via the `ARM_CLIENT_ID` environment variable.
     */
    clientId = new Backend.Input<string | undefined>({ hclName: "client_id" });

    // =========================================================================
    // OIDC / Workload Identity Federation
    // =========================================================================

    /**
     * (Optional) Set to `true` to use OpenID Connect / Workload identity federation
     * to authenticate to the storage account data plane.
     *
     * Can also be set via the `ARM_USE_OIDC` environment variable.
     */
    useOidc = new Backend.Input<boolean | undefined>({ hclName: "use_oidc" });

    /**
     * (Optional) The OIDC request token.
     *
     * Can also be set via the `ARM_OIDC_REQUEST_TOKEN` or
     * `ACTIONS_ID_TOKEN_REQUEST_TOKEN` environment variables.
     */
    oidcRequestToken = new Backend.Input<string | undefined>({ hclName: "oidc_request_token" });

    /**
     * (Optional) The OIDC request URL.
     *
     * Can also be set via the `ARM_OIDC_REQUEST_URL` or
     * `ACTIONS_ID_TOKEN_REQUEST_URL` environment variables.
     */
    oidcRequestUrl = new Backend.Input<string | undefined>({ hclName: "oidc_request_url" });

    /**
     * (Optional) An OIDC token.
     *
     * Can also be set via the `ARM_OIDC_TOKEN` environment variable.
     */
    oidcToken = new Backend.Input<string | undefined>({ hclName: "oidc_token" });

    /**
     * (Optional) Path to a file containing an OIDC token.
     *
     * Can also be set via the `ARM_OIDC_TOKEN_FILE_PATH` environment variable.
     */
    oidcTokenFilePath = new Backend.Input<string | undefined>({ hclName: "oidc_token_file_path" });

    /**
     * (Optional) The Azure DevOps Service Connection ID for OIDC authentication.
     *
     * Can also be set via the `ARM_OIDC_AZURE_SERVICE_CONNECTION_ID` environment variable.
     */
    oidcAzureServiceConnectionId = new Backend.Input<string | undefined>({
      hclName: "oidc_azure_service_connection_id",
    });

    // =========================================================================
    // Managed Identity Authentication
    // =========================================================================

    /**
     * (Optional) Set to `true` to use the managed identity to authenticate
     * to the storage account data plane.
     *
     * Can also be set via the `ARM_USE_MSI` environment variable.
     */
    useMsi = new Backend.Input<boolean | undefined>({ hclName: "use_msi" });

    /**
     * (Optional) The MSI endpoint.
     *
     * Can also be set via the `ARM_MSI_ENDPOINT` environment variable.
     */
    msiEndpoint = new Backend.Input<string | undefined>({ hclName: "msi_endpoint" });

    // =========================================================================
    // Azure CLI Authentication
    // =========================================================================

    /**
     * (Optional) Set to `true` to use the Azure CLI session to authenticate
     * to the storage account data plane.
     *
     * Can also be set via the `ARM_USE_CLI` environment variable.
     */
    useCli = new Backend.Input<boolean | undefined>({ hclName: "use_cli" });

    // =========================================================================
    // Client Secret Authentication
    // =========================================================================

    /**
     * (Optional) The client secret of the Microsoft Entra ID Service Principal.
     *
     * Can also be set via the `ARM_CLIENT_SECRET` environment variable.
     */
    clientSecret = new Backend.Input<string | undefined>({ hclName: "client_secret" });

    // =========================================================================
    // Client Certificate Authentication
    // =========================================================================

    /**
     * (Optional) The path to the client certificate bundle.
     *
     * Can also be set via the `ARM_CLIENT_CERTIFICATE_PATH` environment variable.
     */
    clientCertificatePath = new Backend.Input<string | undefined>({ hclName: "client_certificate_path" });

    /**
     * (Optional) The password for the client certificate bundle.
     *
     * Can also be set via the `ARM_CLIENT_CERTIFICATE_PASSWORD` environment variable.
     */
    clientCertificatePassword = new Backend.Input<string | undefined>({
      hclName: "client_certificate_password",
    });

    // =========================================================================
    // Access Key Authentication
    // =========================================================================

    /**
     * (Optional) The Access Key of the storage account.
     *
     * Can also be set via the `ARM_ACCESS_KEY` environment variable.
     */
    accessKey = new Backend.Input<string | undefined>({ hclName: "access_key" });

    // =========================================================================
    // SAS Token Authentication
    // =========================================================================

    /**
     * (Optional) The SAS Token for the storage account container or blob.
     *
     * Can also be set via the `ARM_SAS_TOKEN` environment variable.
     */
    sasToken = new Backend.Input<string | undefined>({ hclName: "sas_token" });

    // =========================================================================
    // DNS Zone Endpoint Lookup
    // =========================================================================

    /**
     * (Optional) Set to `true` to lookup the storage account data plane URI
     * from the management plane.
     *
     * Required if using the 'Azure DNS zone endpoints' feature. Defaults to `false`.
     *
     * Can also be set via the `ARM_USE_DNS_ZONE_ENDPOINT` environment variable.
     */
    lookupBlobEndpoint = new Backend.Input<boolean | undefined>({ hclName: "lookup_blob_endpoint" });

    /**
     * (Optional) The subscription ID of the storage account.
     *
     * Only required if `lookupBlobEndpoint` is set to `true`. If using Azure CLI,
     * this can be inferred from the CLI session.
     *
     * Can also be set via the `ARM_SUBSCRIPTION_ID` environment variable.
     */
    subscriptionId = new Backend.Input<string | undefined>({ hclName: "subscription_id" });

    /**
     * (Optional) The resource group name of the storage account.
     *
     * Only required if `lookupBlobEndpoint` is set to `true`.
     */
    resourceGroupName = new Backend.Input<string | undefined>({ hclName: "resource_group_name" });
  };

  /**
   * Creates a new AzureRM backend configuration block.
   *
   * @param parent - The parent construct (typically a Terraform block)
   * @param inputs - Optional configuration inputs for the AzureRM backend
   */
  constructor(parent: Construct, inputs?: AzurermBackend["inputs"]) {
    super(parent, "azurerm", inputs);
  }
}
