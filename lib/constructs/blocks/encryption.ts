import type { Construct } from "../construct.ts";
import { RawHcl } from "../rawhcl.ts";
import { snakeCaseKeys } from "../utils.ts";
import type { AzurermBackend } from "./backends/azurerm_backend.ts";
import type { GcsBackend } from "./backends/gcs_backend.ts";
import type { S3Backend } from "./backends/s3_backend.ts";
import { Block } from "./block.ts";

// ---------------------------------------------------------------------------
// Shared auth option types derived from the corresponding backend input types.
// Per the OpenTofu docs, key provider auth options are "identical to the
// [corresponding] backend excluding any deprecated options".
// ---------------------------------------------------------------------------

/**
 * AWS authentication and configuration options shared between the S3 backend
 * and the AWS KMS key provider.
 *
 * All S3-storage-specific fields are excluded (bucket, key, acl, encrypt,
 * kmsKeyId, sseCustomerKey, usePathStyle, forcePathStyle, workspaceKeyPrefix,
 * useLockfile, skipS3Checksum, and deprecated endpoint/dynamodb fields).
 */
export type AwsAuthOptions = Omit<
  NonNullable<S3Backend["inputs"]>,
  | "bucket"
  | "key"
  | "acl"
  | "encrypt"
  | "kmsKeyId"
  | "sseCustomerKey"
  | "usePathStyle"
  | "forcePathStyle"
  | "workspaceKeyPrefix"
  | "useLockfile"
  | "endpoint"
  | "iamEndpoint"
  | "stsEndpoint"
  | "dynamodbEndpoint"
  | "dynamodbTable"
  | "skipS3Checksum"
  | "sharedCredentialsFile"
>;

/**
 * GCP authentication options shared between the GCS backend and the GCP KMS
 * key provider.
 *
 * Only the auth-relevant fields are included; GCS storage-specific fields
 * (bucket, prefix, encryptionKey, kmsEncryptionKey, storageCustomEndpoint)
 * are excluded.
 */
export type GcpAuthOptions = Pick<
  NonNullable<GcsBackend["inputs"]>,
  "credentials" | "accessToken" | "impersonateServiceAccount" | "impersonateServiceAccountDelegates"
>;

/**
 * Azure authentication options shared between the AzureRM backend and the
 * Azure Vault key provider.
 *
 * The Azure Vault key provider always uses Entra ID authentication; storage-
 * specific fields (storageAccountName, containerName, key, snapshotEnabled,
 * lookupBlobEndpoint, subscriptionId, resourceGroupName) and non-Entra auth
 * methods (accessKey, sasToken) are excluded.
 */
export type AzureAuthOptions = Omit<
  NonNullable<AzurermBackend["inputs"]>,
  | "storageAccountName"
  | "containerName"
  | "key"
  | "snapshotEnabled"
  | "lookupBlobEndpoint"
  | "subscriptionId"
  | "resourceGroupName"
  | "accessKey"
  | "sasToken"
>;

// ---------------------------------------------------------------------------
// Key provider configuration interfaces
// ---------------------------------------------------------------------------

/**
 * Configuration for the `pbkdf2` key provider.
 *
 * Derives an encryption key from a passphrase using PBKDF2.
 *
 * @see https://opentofu.org/docs/language/state/encryption/#pbkdf2-key-provider
 */
export interface Pbkdf2KeyProviderConfig {
  /** The passphrase to derive the key from. */
  passphrase?: string;
  /**
   * HCL reference to another key provider whose output is used as the
   * passphrase (e.g. `"key_provider.aws_kms.my_key"`).
   */
  chain?: string;
  /** The length of the derived key in bytes. Defaults to 32. */
  keyLength?: number;
  /** The number of PBKDF2 iterations. Higher values increase security. */
  iterations?: number;
  /** The length of the salt in bytes. */
  saltLength?: number;
  /** The hash function to use. Defaults to `"sha256"`. */
  hashFunction?: "sha256" | "sha512";
  /**
   * An alias for the encrypted metadata block stored alongside the state.
   * Required when chaining key providers.
   */
  encryptedMetadataAlias?: string;
}

/**
 * Configuration for the `aws_kms` key provider.
 *
 * Uses AWS Key Management Service to generate and decrypt data keys.
 * Authentication options are identical to the S3 backend (excluding
 * deprecated options).
 *
 * @see https://opentofu.org/docs/language/state/encryption/#aws-kms-key-provider
 */
export interface AwsKmsKeyProviderConfig extends AwsAuthOptions {
  /** (Required) The ARN, ID, or alias of the AWS KMS key. */
  kmsKeyId: string;
  /**
   * (Required) The key spec to use when generating a new data key.
   * Common values: `"AES_128"`, `"AES_256"`.
   */
  keySpec: string;
  /** (Optional) The AWS region where the KMS key resides. */
  region?: string;
  /**
   * An alias for the encrypted metadata block stored alongside the state.
   * Required when chaining key providers.
   */
  encryptedMetadataAlias?: string;
}

/**
 * Configuration for the `gcp_kms` key provider.
 *
 * Uses Google Cloud KMS to generate and decrypt data keys.
 * Authentication options are identical to the GCS backend (excluding
 * deprecated options).
 *
 * @see https://opentofu.org/docs/language/state/encryption/#gcp-kms-key-provider
 */
export interface GcpKmsKeyProviderConfig extends GcpAuthOptions {
  /**
   * (Required) The resource name of the Cloud KMS CryptoKey to use.
   *
   * Format: `projects/{project}/locations/{location}/keyRings/{keyRing}/cryptoKeys/{cryptoKey}`
   */
  kmsEncryptionKey: string;
  /** (Required) Length in bytes of the generated data key. */
  keyLength: number;
  /**
   * An alias for the encrypted metadata block stored alongside the state.
   * Required when chaining key providers.
   */
  encryptedMetadataAlias?: string;
}

/**
 * Configuration for the `azure_vault` key provider.
 *
 * Uses Azure Key Vault to generate and decrypt data keys using Entra ID
 * authentication. Authentication options are identical to the AzureRM backend
 * (excluding storage-specific options, `accessKey`, and `sasToken`).
 *
 * @see https://opentofu.org/docs/language/state/encryption/#azure-key-vault-key-provider
 */
export interface AzureVaultKeyProviderConfig extends AzureAuthOptions {
  /** (Required) The URI of the Azure Key Vault. */
  vaultUri: string;
  /** (Required) The name of the key within the Key Vault. */
  vaultKeyName: string;
  /** (Required) The key length in bytes. */
  keyLength: number;
  /** Whether to use a symmetric key. */
  symmetric?: boolean;
  /** The size of the symmetric key in bytes. */
  symmetricKeySize?: number;
  /**
   * An alias for the encrypted metadata block stored alongside the state.
   * Required when chaining key providers.
   */
  encryptedMetadataAlias?: string;
}

/**
 * Configuration for the `openbao` key provider.
 *
 * Uses OpenBao (an open-source Vault fork) transit secrets engine to generate
 * and decrypt data keys.
 *
 * @see https://opentofu.org/docs/language/state/encryption/#openbao-key-provider
 */
export interface OpenbaoKeyProviderConfig {
  /** (Required) The name of the transit key to use. */
  keyName: string;
  /** The OpenBao token to use for authentication. */
  token?: string;
  /** The address of the OpenBao server. */
  address?: string;
  /** The path of the transit secrets engine. */
  transitEnginePath?: string;
  /** The length of the generated key in bytes. Valid values: `16`, `32`, `64`. */
  keyLength?: 16 | 32 | 64;
  /**
   * An alias for the encrypted metadata block stored alongside the state.
   * Required when chaining key providers.
   */
  encryptedMetadataAlias?: string;
}

// ---------------------------------------------------------------------------
// Method configuration interfaces
// ---------------------------------------------------------------------------

/**
 * Configuration for the `aes_gcm` encryption method.
 *
 * Encrypts data using AES-GCM with keys supplied by a key provider.
 *
 * @see https://opentofu.org/docs/language/state/encryption/#aes-gcm-method
 */
export interface AesGcmMethodConfig {
  /**
   * (Required) HCL reference to the key provider that supplies the data key
   * (e.g. `"key_provider.pbkdf2.my_key"`).
   */
  keys: string;
  /**
   * The Additional Authenticated Data (AAD) function to use.
   * This is included in the encrypted output for integrity verification.
   */
  aadFunction?: string;
  /**
   * An alias for the encrypted metadata block stored alongside the state.
   * Required when chaining methods.
   */
  encryptedMetadataAlias?: string;
}

// ---------------------------------------------------------------------------
// Target and remote state configuration interfaces
// ---------------------------------------------------------------------------

/**
 * Encryption configuration for a single state/plan target or remote state
 * data source.
 */
export interface EncryptionTargetConfig {
  /**
   * (Required) HCL reference to the method to use for encryption/decryption
   * (e.g. `"method.aes_gcm.my_method"` or `"method.unencrypted.default"`).
   */
  method: string;
  /**
   * Whether to enforce encryption. When `true`, OpenTofu will refuse to read
   * or write unencrypted state/plan files.
   */
  enforced?: boolean;
  /**
   * Fallback method used to decrypt state/plan files encrypted with a
   * different (typically old) method. Useful for key rotation.
   */
  fallback?: {
    /**
     * HCL reference to the fallback method
     * (e.g. `"method.aes_gcm.old_method"` or `"method.unencrypted.default"`).
     */
    method: string;
  };
}

// ---------------------------------------------------------------------------
// Top-level encryption configuration interface
// ---------------------------------------------------------------------------

/**
 * Full encryption configuration for an OpenTofu `encryption` block.
 *
 * This is an OpenTofu-only feature — Terraform does not support state
 * encryption. Setting this on a {@link Terraform} block when the project
 * flavor is `"terraform"` will throw an error.
 *
 * @see https://opentofu.org/docs/language/state/encryption
 *
 * @example
 * ```typescript
 * // Encrypt state with a passphrase-derived key
 * new Terraform(this, {
 *   encryption: {
 *     keyProviders: {
 *       pbkdf2: {
 *         my_key: { passphrase: "correct-horse-battery-staple" },
 *       },
 *     },
 *     methods: {
 *       aesGcm: {
 *         my_method: { keys: "key_provider.pbkdf2.my_key" },
 *       },
 *     },
 *     state: {
 *       method: "method.aes_gcm.my_method",
 *       enforced: true,
 *     },
 *   },
 * });
 * ```
 */
export interface EncryptionConfig {
  /**
   * Key provider configurations.
   *
   * Each key in the nested record is the instance name of that provider
   * (e.g. `pbkdf2: { my_key: { ... } }` generates
   * `key_provider "pbkdf2" "my_key" { ... }`).
   */
  keyProviders?: {
    pbkdf2?: Record<string, Pbkdf2KeyProviderConfig>;
    awsKms?: Record<string, AwsKmsKeyProviderConfig>;
    gcpKms?: Record<string, GcpKmsKeyProviderConfig>;
    azureVault?: Record<string, AzureVaultKeyProviderConfig>;
    openbao?: Record<string, OpenbaoKeyProviderConfig>;
  };
  /**
   * Encryption method configurations.
   *
   * Each key in the nested record is the instance name of that method
   * (e.g. `aesGcm: { my_method: { ... } }` generates
   * `method "aes_gcm" "my_method" { ... }`).
   */
  methods?: {
    aesGcm?: Record<string, AesGcmMethodConfig>;
    /**
     * The `unencrypted` pseudo-method explicitly marks data as plaintext.
     * Useful as a fallback target during migration or testing.
     */
    unencrypted?: Record<string, Record<never, never>>;
  };
  /** Encryption configuration for the Terraform state file. */
  state?: EncryptionTargetConfig;
  /** Encryption configuration for Terraform plan files. */
  plan?: EncryptionTargetConfig;
  /**
   * Encryption configuration for remote state data sources read by this
   * configuration.
   */
  remoteStateSources?: {
    /**
     * Default decryption method applied to all remote state data sources
     * that do not have an explicit entry.
     */
    default?: { method: string };
    /**
     * Per-source decryption method keyed by the data source name
     * (the label used in the `data "terraform_remote_state" "<name>"` block).
     */
    sources?: Record<string, { method: string }>;
  };
}

// ---------------------------------------------------------------------------
// HCL type name maps
// ---------------------------------------------------------------------------

/** Maps TypeScript camelCase key provider keys to their HCL block type labels. */
const KEY_PROVIDER_TYPE: Record<string, string> = {
  pbkdf2: "pbkdf2",
  awsKms: "aws_kms",
  gcpKms: "gcp_kms",
  azureVault: "azure_vault",
  openbao: "openbao",
};

/** Maps TypeScript camelCase method keys to their HCL block type labels. */
const METHOD_TYPE: Record<string, string> = {
  aesGcm: "aes_gcm",
  unencrypted: "unencrypted",
};

// ---------------------------------------------------------------------------
// Encryption block class
// ---------------------------------------------------------------------------

/**
 * Represents an OpenTofu `encryption` block inside a `terraform` block.
 *
 * This block configures state and plan encryption using key providers and
 * methods. It is an **OpenTofu-only** feature — instantiating this block
 * (via the `encryption` option on {@link Terraform}) when the project
 * flavor is `"terraform"` will throw an error during `Project.preInit()`.
 *
 * All child blocks (key providers, methods, state, plan, remote state data
 * sources) are created automatically from the provided {@link EncryptionConfig}.
 * HCL reference values (`method`, `keys`, `chain`) are automatically wrapped
 * in {@link RawHcl} so they are emitted as unquoted identifiers rather than
 * quoted strings.
 *
 * @see https://opentofu.org/docs/language/state/encryption
 *
 * @example
 * ```typescript
 * // Passed as the `encryption` option on Terraform, not constructed directly.
 * new Terraform(this, {
 *   encryption: {
 *     keyProviders: {
 *       pbkdf2: { my_key: { passphrase: "correct-horse-battery-staple" } },
 *     },
 *     methods: {
 *       aesGcm: { my_method: { keys: "key_provider.pbkdf2.my_key" } },
 *     },
 *     state: { method: "method.aes_gcm.my_method", enforced: true },
 *     plan:  { method: "method.aes_gcm.my_method" },
 *   },
 * });
 * ```
 */
export class Encryption extends Block<typeof Encryption> {
  static override readonly Props = class extends Block.Props {};

  constructor(parent: Construct, config: EncryptionConfig) {
    super(parent, "encryption", [], undefined);

    this.#buildKeyProviders(config.keyProviders);
    this.#buildMethods(config.methods);
    this.#buildTarget("state", config.state);
    this.#buildTarget("plan", config.plan);
    this.#buildRemoteStateSources(config.remoteStateSources);
  }

  #buildKeyProviders(keyProviders: EncryptionConfig["keyProviders"]): void {
    if (!keyProviders) return;

    for (const [typeKey, providers] of Object.entries(keyProviders)) {
      const hclType = KEY_PROVIDER_TYPE[typeKey] ?? typeKey;
      for (const [name, rawProvider] of Object.entries(providers as Record<string, Record<string, unknown>>)) {
        const inputs = { ...rawProvider };

        if (typeKey === "pbkdf2" && typeof inputs["chain"] === "string") {
          inputs["chain"] = new RawHcl(inputs["chain"]);
        }

        if (typeKey === "awsKms") {
          const endpoints = inputs["endpoints"];
          const assumeRole = inputs["assumeRole"];
          const assumeRoleWithWebIdentity = inputs["assumeRoleWithWebIdentity"];
          delete inputs["endpoints"];
          delete inputs["assumeRole"];
          delete inputs["assumeRoleWithWebIdentity"];

          const kpBlock = new Block(this, "key_provider", [hclType, name], snakeCaseKeys(inputs));

          if (endpoints) {
            new Block(kpBlock, "endpoints", [], endpoints as Record<string, unknown>);
          }
          if (assumeRole) {
            const roles = Array.isArray(assumeRole) ? assumeRole : [assumeRole];
            for (const role of roles) {
              new Block(kpBlock, "assume_role", [], snakeCaseKeys(role as Record<string, unknown>));
            }
          }
          if (assumeRoleWithWebIdentity) {
            new Block(
              kpBlock,
              "assume_role_with_web_identity",
              [],
              snakeCaseKeys(assumeRoleWithWebIdentity as Record<string, unknown>),
            );
          }
        } else {
          new Block(this, "key_provider", [hclType, name], snakeCaseKeys(inputs));
        }
      }
    }
  }

  #buildMethods(methods: EncryptionConfig["methods"]): void {
    if (!methods) return;

    for (const [typeKey, methodGroup] of Object.entries(methods)) {
      const hclType = METHOD_TYPE[typeKey] ?? typeKey;
      for (const [name, rawMethod] of Object.entries(methodGroup as Record<string, Record<string, unknown>>)) {
        const inputs = { ...rawMethod };

        if (typeKey === "aesGcm" && typeof inputs["keys"] === "string") {
          inputs["keys"] = new RawHcl(inputs["keys"]);
        }

        new Block(this, "method", [hclType, name], snakeCaseKeys(inputs));
      }
    }
  }

  #buildTarget(blockType: "state" | "plan", target: EncryptionTargetConfig | undefined): void {
    if (!target) return;

    const { fallback, ...rest } = target;
    const targetInputs: Record<string, unknown> = { method: new RawHcl(rest.method) };
    if (rest.enforced !== undefined) targetInputs["enforced"] = rest.enforced;

    const targetBlock = new Block(this, blockType, [], targetInputs);
    if (fallback) {
      new Block(targetBlock, "fallback", [], { method: new RawHcl(fallback.method) });
    }
  }

  #buildRemoteStateSources(remoteStateSources: EncryptionConfig["remoteStateSources"]): void {
    if (!remoteStateSources) return;

    const rdsBlock = new Block(this, "remote_state_data_sources", [], undefined);

    if (remoteStateSources.default) {
      new Block(rdsBlock, "default", [], { method: new RawHcl(remoteStateSources.default.method) });
    }

    if (remoteStateSources.sources) {
      for (const [name, sourceConfig] of Object.entries(remoteStateSources.sources)) {
        new Block(rdsBlock, "remote_state_data_source", [name], { method: new RawHcl(sourceConfig.method) });
      }
    }
  }
}
