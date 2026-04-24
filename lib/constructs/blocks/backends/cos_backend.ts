import type { Construct } from "../../construct.ts";
import { Block } from "../block.ts";
import { Backend } from "./backend.ts";
import { snakeCaseKeys } from "../../utils.ts";

/**
 * Tencent Cloud Object Storage (COS) backend configuration for storing Terraform/OpenTofu state.
 *
 * The cos backend stores state as an object in a configurable prefix in a given bucket
 * on Tencent Cloud Object Storage. This backend supports state locking via tags.
 *
 * It is highly recommended to enable Object Versioning on the COS bucket to allow
 * for state recovery in the case of accidental deletions and human error.
 *
 * @see https://developer.hashicorp.com/terraform/language/backend/cos
 *
 * @example
 * ```typescript
 * // Basic configuration
 * new CosBackend(terraform, {
 *   region: "ap-guangzhou",
 *   bucket: "bucket-for-terraform-state-1258798060",
 *   prefix: "terraform/state",
 * });
 *
 * // With assume role
 * new CosBackend(terraform, {
 *   region: "ap-guangzhou",
 *   bucket: "bucket-for-terraform-state-1258798060",
 *   prefix: "terraform/state",
 *   assumeRole: {
 *     roleArn: "qcs::cam::uin/xxx:roleName/yyy",
 *     sessionName: "terraform",
 *     sessionDuration: 3600,
 *   },
 * });
 * ```
 */
export class CosBackend extends Backend<typeof CosBackend> {
  static override readonly Props = class extends Backend.Props {
    /**
     * (Optional) Secret id of Tencent Cloud.
     *
     * Can also be set via the `TENCENTCLOUD_SECRET_ID` environment variable.
     */
    secretId = new Backend.Input<string | undefined>({ hclName: "secret_id" });

    /**
     * (Optional) Secret key of Tencent Cloud.
     *
     * Can also be set via the `TENCENTCLOUD_SECRET_KEY` environment variable.
     */
    secretKey = new Backend.Input<string | undefined>({ hclName: "secret_key" });

    /**
     * (Optional) TencentCloud Security Token of temporary access credentials.
     *
     * Can also be set via the `TENCENTCLOUD_SECURITY_TOKEN` environment variable.
     */
    securityToken = new Backend.Input<string | undefined>({ hclName: "security_token" });

    /**
     * (Optional) The region of the COS bucket.
     *
     * Can also be set via the `TENCENTCLOUD_REGION` environment variable.
     */
    region = new Backend.Input<string | undefined>();

    /**
     * (Required) The name of the COS bucket. You must manually create it first.
     */
    bucket = new Backend.Input<string | undefined>();

    /**
     * (Optional) The directory for saving the state file in bucket.
     *
     * Default to "env:".
     */
    prefix = new Backend.Input<string | undefined>();

    /**
     * (Optional) The path for saving the state file in bucket.
     *
     * Defaults to `terraform.tfstate`.
     */
    key = new Backend.Input<string | undefined>();

    /**
     * (Optional) Whether to enable server side encryption of the state file.
     *
     * If `true`, COS will use 'AES256' encryption algorithm to encrypt state file.
     */
    encrypt = new Backend.Input<boolean | undefined>();

    /**
     * (Optional) Object ACL to be applied to the state file.
     *
     * Allows `private` and `public-read`. Defaults to `private`.
     */
    acl = new Backend.Input<string | undefined>();

    /**
     * (Optional) Whether to enable global Acceleration.
     *
     * Defaults to `false`.
     */
    accelerate = new Backend.Input<boolean | undefined>();

    /**
     * (Optional) The Custom Endpoint for the COS backend.
     *
     * Can also be set via the `TENCENTCLOUD_ENDPOINT` environment variable.
     */
    endpoint = new Backend.Input<string | undefined>();

    /**
     * (Optional) The root domain of the API request.
     *
     * Defaults to `tencentcloudapi.com`. Can also be set via the
     * `TENCENTCLOUD_DOMAIN` environment variable.
     */
    domain = new Backend.Input<string | undefined>();

    /**
     * (Optional) Configuration for assuming a role. If provided, terraform will
     * attempt to assume this role using the supplied credentials.
     */
    assumeRole = new Backend.Input<
      | {
        /**
         * (Required) The ARN of the role to assume.
         *
         * Can also be set via `TENCENTCLOUD_ASSUME_ROLE_ARN`.
         */
        roleArn: string;

        /**
         * (Required) The session name to use when making the AssumeRole call.
         *
         * Can also be set via `TENCENTCLOUD_ASSUME_ROLE_SESSION_NAME`.
         */
        sessionName: string;

        /**
         * (Required) The duration of the session in seconds when making the AssumeRole call.
         *
         * Can also be set via `TENCENTCLOUD_ASSUME_ROLE_SESSION_DURATION`.
         */
        sessionDuration: number;

        /**
         * (Optional) A more restrictive policy when making the AssumeRole call.
         */
        policy?: string;

        /**
         * (Optional) External ID when making the AssumeRole call.
         */
        externalId?: string;
      }
      | undefined
    >({ hclName: "assume_role" });
  };

  /**
   * Creates a new COS backend configuration block.
   *
   * @param parent - The parent construct (typically a Terraform block)
   * @param inputs - Optional configuration inputs for the COS backend
   */
  constructor(parent: Construct, inputs?: CosBackend["inputs"]) {
    super(parent, "cos", inputs);

    if (inputs?.assumeRole) {
      new Block(this, "assume_role", [], snakeCaseKeys(inputs.assumeRole));
    }
  }

  /**
   * Maps inputs for HCL generation by removing properties handled by child blocks.
   *
   * The `assumeRole` property is converted to a nested block in the constructor,
   * so it needs to be excluded from the main block's inputs.
   */
  protected override mapInputsForHcl() {
    const inputs = super.mapInputsForHcl();
    if (inputs) {
      delete inputs["assume_role"];
    }
    return inputs;
  }
}
