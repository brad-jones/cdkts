import type { Construct } from "../../construct.ts";
import { Backend } from "./backend.ts";

/**
 * Alibaba Cloud OSS backend configuration for storing Terraform/OpenTofu state.
 *
 * The oss backend stores state as a given key in a given bucket on Alibaba Cloud
 * Object Storage Service (OSS). This backend also supports state locking and
 * consistency checking via Alibaba Cloud Table Store, which can be enabled by
 * setting the `tablestoreTable` field to an existing TableStore table name.
 *
 * It is highly recommended to enable Object Versioning on the OSS bucket to allow
 * for state recovery in the case of accidental deletions and human error.
 *
 * @see https://developer.hashicorp.com/terraform/language/backend/oss
 *
 * @example
 * ```typescript
 * // Basic configuration
 * new OssBackend(terraform, {
 *   bucket: "bucket-for-terraform-state",
 *   prefix: "path/mystate",
 *   key: "version-1.tfstate",
 *   region: "cn-beijing",
 * });
 *
 * // With TableStore locking
 * new OssBackend(terraform, {
 *   bucket: "bucket-for-terraform-state",
 *   prefix: "terraform/state",
 *   region: "cn-beijing",
 *   tablestoreEndpoint: "https://terraform-remote.cn-hangzhou.ots.aliyuncs.com",
 *   tablestoreTable: "statelock",
 * });
 * ```
 */
export class OssBackend extends Backend<typeof OssBackend> {
  static override readonly Props = class extends Backend.Props {
    /**
     * (Required) The name of the OSS bucket. You must manually create it first.
     */
    bucket = new Backend.Input<string | undefined>();

    /**
     * (Optional) Alibaba Cloud access key.
     *
     * Can also be set via `ALICLOUD_ACCESS_KEY` or `ALIBABA_CLOUD_ACCESS_KEY_ID`
     * environment variables.
     */
    accessKey = new Backend.Input<string | undefined>({ hclName: "access_key" });

    /**
     * (Optional) Alibaba Cloud secret access key.
     *
     * Can also be set via `ALICLOUD_SECRET_KEY` or `ALIBABA_CLOUD_ACCESS_KEY_SECRET`
     * environment variables.
     */
    secretKey = new Backend.Input<string | undefined>({ hclName: "secret_key" });

    /**
     * (Optional) STS access token.
     *
     * Can also be set via `ALICLOUD_SECURITY_TOKEN` or `ALIBABA_CLOUD_SECURITY_TOKEN`
     * environment variables.
     */
    securityToken = new Backend.Input<string | undefined>({ hclName: "security_token" });

    /**
     * (Optional) The RAM Role Name attached on a ECS instance for API operations.
     */
    ecsRoleName = new Backend.Input<string | undefined>({ hclName: "ecs_role_name" });

    /**
     * (Optional) The region of the OSS bucket.
     *
     * Can also be set via `ALICLOUD_REGION` or `ALIBABA_CLOUD_REGION`
     * environment variables.
     */
    region = new Backend.Input<string | undefined>();

    /**
     * (Optional) A custom endpoint for the OSS API.
     *
     * Can also be set via `ALICLOUD_OSS_ENDPOINT` or `ALIBABA_CLOUD_OSS_ENDPOINT`
     * environment variables.
     */
    endpoint = new Backend.Input<string | undefined>();

    /**
     * (Optional) The path directory of the state file will be stored.
     *
     * Default to "env:".
     */
    prefix = new Backend.Input<string | undefined>();

    /**
     * (Optional) The name of the state file.
     *
     * Defaults to `terraform.tfstate`.
     */
    key = new Backend.Input<string | undefined>();

    /**
     * (Optional) A custom endpoint for the TableStore API.
     *
     * Can also be set via `ALICLOUD_TABLESTORE_ENDPOINT` or
     * `ALIBABA_CLOUD_TABLESTORE_ENDPOINT` environment variables.
     */
    tablestoreEndpoint = new Backend.Input<string | undefined>({ hclName: "tablestore_endpoint" });

    /**
     * (Optional) Specifies the name of an instance that TableStore belongs to.
     *
     * By default, Terraform parses the name from `tablestoreEndpoint`. Set this
     * explicitly when the endpoint is a VPC access URL.
     */
    tablestoreInstanceName = new Backend.Input<string | undefined>({ hclName: "tablestore_instance_name" });

    /**
     * (Optional) Name of the TableStore table to use for state locking and consistency.
     *
     * The table must have a primary key named `LockID` of type `String`.
     */
    tablestoreTable = new Backend.Input<string | undefined>({ hclName: "tablestore_table" });

    /**
     * (Optional) Custom endpoint for the AliCloud Security Token Service (STS) API.
     *
     * Can also be set via `ALICLOUD_STS_ENDPOINT` or `ALIBABA_CLOUD_STS_ENDPOINT`
     * environment variables.
     */
    stsEndpoint = new Backend.Input<string | undefined>({ hclName: "sts_endpoint" });

    /**
     * (Optional) Whether to enable server side encryption of the state file.
     *
     * If true, OSS will use 'AES256' encryption algorithm to encrypt state file.
     */
    encrypt = new Backend.Input<boolean | undefined>();

    /**
     * (Optional) Object ACL to be applied to the state file.
     */
    acl = new Backend.Input<string | undefined>();

    /**
     * (Optional) Path to the shared credentials file.
     *
     * Can also be sourced from `ALICLOUD_SHARED_CREDENTIALS_FILE` or
     * `ALIBABA_CLOUD_CREDENTIALS_FILE` environment variables. If not set and a
     * profile is specified, `~/.aliyun/config.json` will be used.
     */
    sharedCredentialsFile = new Backend.Input<string | undefined>({ hclName: "shared_credentials_file" });

    /**
     * (Optional) Alibaba Cloud profile name as set in the shared credentials file.
     *
     * Can also be set via `ALICLOUD_PROFILE` or `ALIBABA_CLOUD_PROFILE`
     * environment variables.
     */
    profile = new Backend.Input<string | undefined>();

    /**
     * (Optional) The ARN of the role to assume.
     *
     * If set to an empty string, it does not perform role switching. Can also be
     * set via `ALICLOUD_ASSUME_ROLE_ARN` or `ALIBABA_CLOUD_ROLE_ARN` environment
     * variables.
     */
    assumeRoleRoleArn = new Backend.Input<string | undefined>({ hclName: "assume_role_role_arn" });

    /**
     * (Optional) A more restrictive policy to apply to the temporary credentials.
     *
     * You cannot use this policy to grant permissions that exceed those of the
     * role being assumed.
     */
    assumeRolePolicy = new Backend.Input<string | undefined>({ hclName: "assume_role_policy" });

    /**
     * (Optional) The session name to use when assuming the role.
     *
     * If omitted, 'terraform' is passed to the AssumeRole call. Can also be set
     * via `ALICLOUD_ASSUME_ROLE_SESSION_NAME` or
     * `ALIBABA_CLOUD_ROLE_SESSION_NAME` environment variables.
     */
    assumeRoleSessionName = new Backend.Input<string | undefined>({ hclName: "assume_role_session_name" });

    /**
     * (Optional) The time after which the established session for assuming role expires.
     *
     * Valid value range: [900-3600] seconds. Default to 3600. Can also be set via
     * `ALICLOUD_ASSUME_ROLE_SESSION_EXPIRATION` environment variable.
     */
    assumeRoleSessionExpiration = new Backend.Input<number | undefined>({ hclName: "assume_role_session_expiration" });
  };

  /**
   * Creates a new OSS backend configuration block.
   *
   * @param parent - The parent construct (typically a Terraform block)
   * @param inputs - Optional configuration inputs for the OSS backend
   */
  constructor(parent: Construct, inputs?: OssBackend["inputs"]) {
    super(parent, "oss", inputs);
  }
}
