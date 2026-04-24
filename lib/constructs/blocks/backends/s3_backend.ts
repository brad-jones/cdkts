import type { Construct } from "../../construct.ts";
import { Block } from "../block.ts";
import { Backend } from "./backend.ts";
import { snakeCaseKeys } from "../../utils.ts";

/**
 * S3 backend configuration for storing Terraform/OpenTofu state in Amazon S3.
 *
 * The s3 backend stores state as a given key in a given bucket on Amazon S3. This
 * backend supports state locking which can be enabled by setting `useLockfile` to
 * `true`. It is highly recommended to enable Bucket Versioning on the S3 bucket to
 * allow for state recovery in the case of accidental deletions and human error.
 *
 * @see https://developer.hashicorp.com/terraform/language/backend/s3
 *
 * @example
 * ```typescript
 * // Basic configuration
 * new S3Backend(terraform, {
 *   bucket: "mybucket",
 *   key: "path/to/my/key",
 *   region: "us-east-1",
 * });
 *
 * // With state locking
 * new S3Backend(terraform, {
 *   bucket: "mybucket",
 *   key: "terraform.tfstate",
 *   region: "us-east-1",
 *   useLockfile: true,
 *   encrypt: true,
 * });
 *
 * // With assume role
 * new S3Backend(terraform, {
 *   bucket: "mybucket",
 *   key: "terraform.tfstate",
 *   region: "us-east-1",
 *   assumeRole: {
 *     roleArn: "arn:aws:iam::PRODUCTION-ACCOUNT-ID:role/Terraform",
 *   },
 * });
 * ```
 */
export class S3Backend extends Backend<typeof S3Backend> {
  static override readonly Props = class extends Backend.Props {
    // =========================================================================
    // S3 State Storage (Required)
    // =========================================================================

    /**
     * (Required) Name of the S3 Bucket.
     */
    bucket = new Backend.Input<string | undefined>();

    /**
     * (Required) Path to the state file inside the S3 Bucket.
     *
     * When using a non-default workspace, the state path will be
     * `<workspace_key_prefix>/<workspace_name>/<key>`.
     */
    key = new Backend.Input<string | undefined>();

    /**
     * (Required) AWS Region of the S3 Bucket and DynamoDB Table (if used).
     *
     * Can also be sourced from `AWS_DEFAULT_REGION` and `AWS_REGION`
     * environment variables.
     */
    region = new Backend.Input<string | undefined>();

    // =========================================================================
    // S3 State Storage (Optional)
    // =========================================================================

    /**
     * (Optional) Canned ACL to be applied to the state and lock files.
     *
     * @see https://docs.aws.amazon.com/AmazonS3/latest/userguide/acl-overview.html#canned-acl
     */
    acl = new Backend.Input<string | undefined>();

    /**
     * (Optional) Enable server side encryption of the state and lock files.
     *
     * @see https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingServerSideEncryption.html
     */
    encrypt = new Backend.Input<boolean | undefined>();

    /**
     * (Optional) Amazon Resource Name (ARN) of a KMS Key to use for encrypting
     * the state and lock files.
     *
     * Requires `kms:Encrypt`, `kms:Decrypt` and `kms:GenerateDataKey` permissions.
     */
    kmsKeyId = new Backend.Input<string | undefined>({ hclName: "kms_key_id" });

    /**
     * (Optional) The key to use for encrypting state and lock files with
     * Server-Side Encryption with Customer-Provided Keys (SSE-C).
     *
     * This is the base64-encoded value of the key, which must decode to 256 bits.
     * Can also be sourced from the `AWS_SSE_CUSTOMER_KEY` environment variable.
     */
    sseCustomerKey = new Backend.Input<string | undefined>({ hclName: "sse_customer_key" });

    /**
     * (Optional) Enable path-style S3 URLs (`https://<HOST>/<BUCKET>` instead
     * of `https://<BUCKET>.<HOST>`).
     */
    usePathStyle = new Backend.Input<boolean | undefined>({ hclName: "use_path_style" });

    /**
     * (Optional, **Deprecated**) Enable path-style S3 URLs.
     *
     * Use `usePathStyle` instead.
     *
     * @deprecated Use usePathStyle instead.
     */
    forcePathStyle = new Backend.Input<boolean | undefined>({ hclName: "force_path_style" });

    /**
     * (Optional) Prefix applied to the state path inside the bucket.
     *
     * Only relevant when using a non-default workspace. Defaults to `env:`.
     */
    workspaceKeyPrefix = new Backend.Input<string | undefined>({ hclName: "workspace_key_prefix" });

    /**
     * (Optional) Whether to use a lockfile for locking the state file.
     *
     * Defaults to `false`.
     */
    useLockfile = new Backend.Input<boolean | undefined>({ hclName: "use_lockfile" });

    // =========================================================================
    // Authentication
    // =========================================================================

    /**
     * (Optional) AWS access key. If configured, must also configure `secretKey`.
     *
     * Can also be sourced from `AWS_ACCESS_KEY_ID`, AWS shared credentials file,
     * or AWS shared configuration file.
     */
    accessKey = new Backend.Input<string | undefined>({ hclName: "access_key" });

    /**
     * (Optional) AWS secret access key. If configured, must also configure `accessKey`.
     *
     * Can also be sourced from `AWS_SECRET_ACCESS_KEY`, AWS shared credentials file,
     * or AWS shared configuration file.
     */
    secretKey = new Backend.Input<string | undefined>({ hclName: "secret_key" });

    /**
     * (Optional) Multi-Factor Authentication (MFA) token.
     *
     * Can also be sourced from the `AWS_SESSION_TOKEN` environment variable.
     */
    token = new Backend.Input<string | undefined>();

    /**
     * (Optional) Name of AWS profile in AWS shared credentials file or shared
     * configuration file to use for credentials.
     *
     * Can also be sourced from the `AWS_PROFILE` environment variable.
     */
    profile = new Backend.Input<string | undefined>();

    /**
     * (Optional) List of paths to AWS shared configuration files.
     *
     * Defaults to `~/.aws/config`.
     */
    sharedConfigFiles = new Backend.Input<string[] | undefined>({ hclName: "shared_config_files" });

    /**
     * (Optional, **Deprecated**) Path to the AWS shared credentials file.
     *
     * Use `sharedCredentialsFiles` instead. Defaults to `~/.aws/credentials`.
     *
     * @deprecated Use sharedCredentialsFiles instead.
     */
    sharedCredentialsFile = new Backend.Input<string | undefined>({ hclName: "shared_credentials_file" });

    /**
     * (Optional) List of paths to AWS shared credentials files.
     *
     * Defaults to `~/.aws/credentials`.
     */
    sharedCredentialsFiles = new Backend.Input<string[] | undefined>({ hclName: "shared_credentials_files" });

    /**
     * (Optional) List of allowed AWS account IDs to prevent potential destruction
     * of a live environment. Conflicts with `forbiddenAccountIds`.
     */
    allowedAccountIds = new Backend.Input<string[] | undefined>({ hclName: "allowed_account_ids" });

    /**
     * (Optional) List of forbidden AWS account IDs to prevent potential destruction
     * of a live environment. Conflicts with `allowedAccountIds`.
     */
    forbiddenAccountIds = new Backend.Input<string[] | undefined>({ hclName: "forbidden_account_ids" });

    // =========================================================================
    // Network / Proxy
    // =========================================================================

    /**
     * (Optional) File containing custom root and intermediate certificates.
     *
     * Can also be set using the `AWS_CA_BUNDLE` environment variable.
     */
    customCaBundle = new Backend.Input<string | undefined>({ hclName: "custom_ca_bundle" });

    /**
     * (Optional) URL of a proxy to use for HTTP requests.
     *
     * Can also be set using `HTTP_PROXY` or `http_proxy` environment variables.
     */
    httpProxy = new Backend.Input<string | undefined>({ hclName: "http_proxy" });

    /**
     * (Optional) URL of a proxy to use for HTTPS requests.
     *
     * Can also be set using `HTTPS_PROXY` or `https_proxy` environment variables.
     */
    httpsProxy = new Backend.Input<string | undefined>({ hclName: "https_proxy" });

    /**
     * (Optional) Comma-separated list of hosts that should not use HTTP or HTTPS proxies.
     *
     * Can also be set using `NO_PROXY` or `no_proxy` environment variables.
     */
    noProxy = new Backend.Input<string | undefined>({ hclName: "no_proxy" });

    /**
     * (Optional) Whether to explicitly allow "insecure" SSL requests.
     *
     * Defaults to `false`.
     */
    insecure = new Backend.Input<boolean | undefined>();

    // =========================================================================
    // Metadata & Retry
    // =========================================================================

    /**
     * (Optional) Custom endpoint URL for the EC2 Instance Metadata Service (IMDS) API.
     *
     * Can also be set with the `AWS_EC2_METADATA_SERVICE_ENDPOINT` environment variable.
     */
    ec2MetadataServiceEndpoint = new Backend.Input<string | undefined>({
      hclName: "ec2_metadata_service_endpoint",
    });

    /**
     * (Optional) Mode to use in communicating with the metadata service.
     *
     * Valid values are `IPv4` and `IPv6`. Can also be set with the
     * `AWS_EC2_METADATA_SERVICE_ENDPOINT_MODE` environment variable.
     */
    ec2MetadataServiceEndpointMode = new Backend.Input<string | undefined>({
      hclName: "ec2_metadata_service_endpoint_mode",
    });

    /**
     * (Optional) Skip credentials validation via the STS API.
     *
     * Useful for testing and for AWS API implementations that do not have STS available.
     */
    skipCredentialsValidation = new Backend.Input<boolean | undefined>({
      hclName: "skip_credentials_validation",
    });

    /**
     * (Optional) Skip validation of provided region name.
     */
    skipRegionValidation = new Backend.Input<boolean | undefined>({ hclName: "skip_region_validation" });

    /**
     * (Optional) Whether to skip requesting the account ID.
     *
     * Useful for AWS API implementations that do not have the IAM, STS API,
     * or metadata API.
     */
    skipRequestingAccountId = new Backend.Input<boolean | undefined>({
      hclName: "skip_requesting_account_id",
    });

    /**
     * (Optional) Skip usage of EC2 Metadata API.
     */
    skipMetadataApiCheck = new Backend.Input<boolean | undefined>({ hclName: "skip_metadata_api_check" });

    /**
     * (Optional) Do not include checksum when uploading S3 Objects.
     *
     * Useful for some S3-Compatible APIs.
     */
    skipS3Checksum = new Backend.Input<boolean | undefined>({ hclName: "skip_s3_checksum" });

    /**
     * (Optional) The maximum number of times an AWS API request is retried on
     * retryable failure. Defaults to 5.
     */
    maxRetries = new Backend.Input<number | undefined>({ hclName: "max_retries" });

    /**
     * (Optional) Specifies how retries are attempted.
     *
     * Valid values are `standard` and `adaptive`. Can also be configured using
     * the `AWS_RETRY_MODE` environment variable.
     */
    retryMode = new Backend.Input<string | undefined>({ hclName: "retry_mode" });

    /**
     * (Optional) AWS region for STS. If unset, AWS will use the same region
     * for STS as other non-STS operations.
     */
    stsRegion = new Backend.Input<string | undefined>({ hclName: "sts_region" });

    /**
     * (Optional) Force the backend to resolve endpoints with DualStack capability.
     *
     * Can also be set with `AWS_USE_DUALSTACK_ENDPOINT` environment variable.
     */
    useDualstackEndpoint = new Backend.Input<boolean | undefined>({ hclName: "use_dualstack_endpoint" });

    /**
     * (Optional) Force the backend to resolve endpoints with FIPS capability.
     *
     * Can also be set with `AWS_USE_FIPS_ENDPOINT` environment variable.
     */
    useFipsEndpoint = new Backend.Input<boolean | undefined>({ hclName: "use_fips_endpoint" });

    // =========================================================================
    // Deprecated Standalone Endpoints
    // =========================================================================

    /**
     * (Optional, **Deprecated**) Custom endpoint URL for the AWS S3 API.
     *
     * Use `endpoints.s3` instead.
     *
     * @deprecated Use the endpoints block instead.
     */
    endpoint = new Backend.Input<string | undefined>();

    /**
     * (Optional, **Deprecated**) Custom endpoint URL for the AWS IAM API.
     *
     * Use `endpoints.iam` instead.
     *
     * @deprecated Use the endpoints block instead.
     */
    iamEndpoint = new Backend.Input<string | undefined>({ hclName: "iam_endpoint" });

    /**
     * (Optional, **Deprecated**) Custom endpoint URL for the AWS STS API.
     *
     * Use `endpoints.sts` instead.
     *
     * @deprecated Use the endpoints block instead.
     */
    stsEndpoint = new Backend.Input<string | undefined>({ hclName: "sts_endpoint" });

    /**
     * (Optional, **Deprecated**) Custom endpoint URL for the AWS DynamoDB API.
     *
     * Use `endpoints.dynamodb` instead.
     *
     * @deprecated Use the endpoints block instead.
     */
    dynamodbEndpoint = new Backend.Input<string | undefined>({ hclName: "dynamodb_endpoint" });

    /**
     * (Optional, **Deprecated**) Name of the DynamoDB Table to use for state
     * locking and consistency.
     *
     * The table must have a partition key named `LockID` with a type of `String`.
     *
     * @deprecated Use useLockfile for S3-native locking instead.
     */
    dynamodbTable = new Backend.Input<string | undefined>({ hclName: "dynamodb_table" });

    // =========================================================================
    // Nested Blocks
    // =========================================================================

    /**
     * (Optional) Custom endpoint URLs for overriding AWS API endpoints.
     */
    endpoints = new Backend.Input<
      | {
        /**
         * (Optional) Custom endpoint URL for the AWS S3 API.
         *
         * Can also be sourced from `AWS_ENDPOINT_URL_S3`.
         */
        s3?: string;

        /**
         * (Optional, **Deprecated**) Custom endpoint URL for the AWS DynamoDB API.
         *
         * Can also be sourced from `AWS_ENDPOINT_URL_DYNAMODB`.
         */
        dynamodb?: string;

        /**
         * (Optional) Custom endpoint URL for the AWS IAM API.
         *
         * Can also be sourced from `AWS_ENDPOINT_URL_IAM`.
         */
        iam?: string;

        /**
         * (Optional) Custom endpoint URL for the AWS IAM Identity Center API.
         *
         * Can also be sourced from `AWS_ENDPOINT_URL_SSO`.
         */
        sso?: string;

        /**
         * (Optional) Custom endpoint URL for the AWS STS API.
         *
         * Can also be sourced from `AWS_ENDPOINT_URL_STS`.
         */
        sts?: string;
      }
      | undefined
    >();

    /**
     * (Optional) Configuration for assuming an IAM role.
     *
     * Multiple `assumeRole` values can be specified and the roles will be assumed in order.
     */
    assumeRole = new Backend.Input<
      | {
        /**
         * (Required) Amazon Resource Name (ARN) of the IAM Role to assume.
         */
        roleArn: string;

        /**
         * (Optional) Duration individual credentials will be valid.
         *
         * Format: `<hours>h<minutes>m<seconds>s`. Must be between 15m and 12h.
         */
        duration?: string;

        /**
         * (Optional) External identifier to use when assuming the role.
         */
        externalId?: string;

        /**
         * (Optional) IAM Policy JSON further restricting permissions for the assumed role.
         */
        policy?: string;

        /**
         * (Optional) Set of IAM Policy ARNs further restricting permissions for the assumed role.
         */
        policyArns?: string[];

        /**
         * (Optional) Session name to use when assuming the role.
         */
        sessionName?: string;

        /**
         * (Optional) Source identity specified by the principal assuming the role.
         */
        sourceIdentity?: string;

        /**
         * (Optional) Map of assume role session tags.
         */
        tags?: Record<string, string>;

        /**
         * (Optional) Set of assume role session tag keys to pass to subsequent sessions.
         */
        transitiveTagKeys?: string[];
      }
      | {
        /**
         * (Required) Amazon Resource Name (ARN) of the IAM Role to assume.
         */
        roleArn: string;

        /**
         * (Optional) Duration individual credentials will be valid.
         *
         * Format: `<hours>h<minutes>m<seconds>s`. Must be between 15m and 12h.
         */
        duration?: string;

        /**
         * (Optional) External identifier to use when assuming the role.
         */
        externalId?: string;

        /**
         * (Optional) IAM Policy JSON further restricting permissions for the assumed role.
         */
        policy?: string;

        /**
         * (Optional) Set of IAM Policy ARNs further restricting permissions for the assumed role.
         */
        policyArns?: string[];

        /**
         * (Optional) Session name to use when assuming the role.
         */
        sessionName?: string;

        /**
         * (Optional) Source identity specified by the principal assuming the role.
         */
        sourceIdentity?: string;

        /**
         * (Optional) Map of assume role session tags.
         */
        tags?: Record<string, string>;

        /**
         * (Optional) Set of assume role session tag keys to pass to subsequent sessions.
         */
        transitiveTagKeys?: string[];
      }[]
      | undefined
    >({ hclName: "assume_role" });

    /**
     * (Optional) Configuration for assuming an IAM role with web identity (OIDC).
     */
    assumeRoleWithWebIdentity = new Backend.Input<
      | {
        /**
         * (Required) Amazon Resource Name (ARN) of the IAM Role to assume.
         *
         * Can also be set with `AWS_ROLE_ARN` environment variable.
         */
        roleArn: string;

        /**
         * (Optional) Duration individual credentials will be valid.
         *
         * Format: `<hours>h<minutes>m<seconds>s`. Must be between 15m and 12h.
         */
        duration?: string;

        /**
         * (Optional) IAM Policy JSON further restricting permissions for the assumed role.
         */
        policy?: string;

        /**
         * (Optional) Set of IAM Policy ARNs further restricting permissions for the assumed role.
         */
        policyArns?: string[];

        /**
         * (Optional) Session name to use when assuming the role.
         *
         * Can also be set with `AWS_ROLE_SESSION_NAME` environment variable.
         */
        sessionName?: string;

        /**
         * (Optional) The value of a web identity token from an OIDC or OAuth provider.
         *
         * One of `webIdentityToken` or `webIdentityTokenFile` is required.
         */
        webIdentityToken?: string;

        /**
         * (Optional) File containing a web identity token from an OIDC or OAuth provider.
         *
         * One of `webIdentityTokenFile` or `webIdentityToken` is required.
         * Can also be set with `AWS_WEB_IDENTITY_TOKEN_FILE` environment variable.
         */
        webIdentityTokenFile?: string;
      }
      | undefined
    >({ hclName: "assume_role_with_web_identity" });
  };

  /**
   * Creates a new S3 backend configuration block.
   *
   * @param parent - The parent construct (typically a Terraform block)
   * @param inputs - Optional configuration inputs for the S3 backend
   */
  constructor(parent: Construct, inputs?: S3Backend["inputs"]) {
    super(parent, "s3", inputs);

    if (inputs?.endpoints) {
      new Block(this, "endpoints", [], inputs.endpoints);
    }

    if (inputs?.assumeRole) {
      const roles = Array.isArray(inputs.assumeRole) ? inputs.assumeRole : [inputs.assumeRole];
      for (const role of roles) {
        new Block(this, "assume_role", [], snakeCaseKeys(role));
      }
    }

    if (inputs?.assumeRoleWithWebIdentity) {
      new Block(
        this,
        "assume_role_with_web_identity",
        [],
        snakeCaseKeys(inputs.assumeRoleWithWebIdentity),
      );
    }
  }

  /**
   * Maps inputs for HCL generation by removing properties handled by child blocks.
   *
   * The `endpoints`, `assumeRole`, and `assumeRoleWithWebIdentity` properties are
   * converted to nested blocks in the constructor, so they need to be excluded
   * from the main block's inputs.
   */
  protected override mapInputsForHcl() {
    const inputs = super.mapInputsForHcl();
    if (inputs) {
      delete inputs["endpoints"];
      delete inputs["assume_role"];
      delete inputs["assume_role_with_web_identity"];
    }
    return inputs;
  }
}
