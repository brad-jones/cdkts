import type { Construct } from "../../construct.ts";
import { Block } from "../block.ts";
import { Backend } from "./backend.ts";
import { snakeCaseKeys } from "../../utils.ts";

/**
 * Kubernetes backend configuration for storing Terraform/OpenTofu state in a Kubernetes secret.
 *
 * The kubernetes backend stores state in a Kubernetes secret. This backend supports
 * state locking, with locking done using a Lease resource. The user/service account
 * running Terraform must have permissions to read/write secrets in the namespace used
 * to store the secret.
 *
 * @see https://developer.hashicorp.com/terraform/language/backend/kubernetes
 *
 * @example
 * ```typescript
 * // Using kubeconfig file
 * new KubernetesBackend(terraform, {
 *   secretSuffix: "state",
 *   configPath: "~/.kube/config",
 * });
 *
 * // In-cluster configuration
 * new KubernetesBackend(terraform, {
 *   secretSuffix: "state",
 *   inClusterConfig: true,
 * });
 *
 * // With exec-based credential plugin
 * new KubernetesBackend(terraform, {
 *   secretSuffix: "state",
 *   exec: {
 *     apiVersion: "client.authentication.k8s.io/v1beta1",
 *     command: "aws",
 *     args: ["eks", "get-token", "--cluster-name", "my-cluster"],
 *   },
 * });
 * ```
 */
export class KubernetesBackend extends Backend<typeof KubernetesBackend> {
  static override readonly Props = class extends Backend.Props {
    /**
     * (Required) Suffix used when creating the secret.
     *
     * The secret will be named `tfstate-{workspace}-{secret_suffix}`. The backend may
     * append a numeric index when chunking large state files into multiple secrets.
     */
    secretSuffix = new Backend.Input<string | undefined>({ hclName: "secret_suffix" });

    /**
     * (Optional) Map of additional labels to be applied to the secret and lease.
     */
    labels = new Backend.Input<Record<string, string> | undefined>();

    /**
     * (Optional) Namespace to store the secret and lease in.
     *
     * Can be sourced from `KUBE_NAMESPACE`.
     */
    namespace = new Backend.Input<string | undefined>();

    /**
     * (Optional) Used to authenticate to the cluster from inside a pod.
     *
     * Can be sourced from `KUBE_IN_CLUSTER_CONFIG`.
     */
    inClusterConfig = new Backend.Input<boolean | undefined>({ hclName: "in_cluster_config" });

    /**
     * (Optional) The hostname (in form of URI) of Kubernetes master.
     *
     * Can be sourced from `KUBE_HOST`. Defaults to `https://localhost`.
     */
    host = new Backend.Input<string | undefined>();

    /**
     * (Optional) The username to use for HTTP basic authentication when accessing
     * the Kubernetes master endpoint.
     *
     * Can be sourced from `KUBE_USER`.
     */
    username = new Backend.Input<string | undefined>();

    /**
     * (Optional) The password to use for HTTP basic authentication when accessing
     * the Kubernetes master endpoint.
     *
     * Can be sourced from `KUBE_PASSWORD`.
     */
    password = new Backend.Input<string | undefined>();

    /**
     * (Optional) Whether server should be accessed without verifying the TLS certificate.
     *
     * Can be sourced from `KUBE_INSECURE`. Defaults to `false`.
     */
    insecure = new Backend.Input<boolean | undefined>();

    /**
     * (Optional) PEM-encoded client certificate for TLS authentication.
     *
     * Can be sourced from `KUBE_CLIENT_CERT_DATA`.
     */
    clientCertificate = new Backend.Input<string | undefined>({ hclName: "client_certificate" });

    /**
     * (Optional) PEM-encoded client certificate key for TLS authentication.
     *
     * Can be sourced from `KUBE_CLIENT_KEY_DATA`.
     */
    clientKey = new Backend.Input<string | undefined>({ hclName: "client_key" });

    /**
     * (Optional) PEM-encoded root certificates bundle for TLS authentication.
     *
     * Can be sourced from `KUBE_CLUSTER_CA_CERT_DATA`.
     */
    clusterCaCertificate = new Backend.Input<string | undefined>({ hclName: "cluster_ca_certificate" });

    /**
     * (Optional) Path to the kube config file.
     *
     * Can be sourced from `KUBE_CONFIG_PATH`.
     */
    configPath = new Backend.Input<string | undefined>({ hclName: "config_path" });

    /**
     * (Optional) List of paths to kube config files.
     *
     * Can be sourced from `KUBE_CONFIG_PATHS`.
     */
    configPaths = new Backend.Input<string[] | undefined>({ hclName: "config_paths" });

    /**
     * (Optional) Context to choose from the config file.
     *
     * Can be sourced from `KUBE_CTX`.
     */
    configContext = new Backend.Input<string | undefined>({ hclName: "config_context" });

    /**
     * (Optional) Authentication info context of the kube config.
     *
     * Can be sourced from `KUBE_CTX_AUTH_INFO`.
     */
    configContextAuthInfo = new Backend.Input<string | undefined>({ hclName: "config_context_auth_info" });

    /**
     * (Optional) Cluster context of the kube config.
     *
     * Can be sourced from `KUBE_CTX_CLUSTER`.
     */
    configContextCluster = new Backend.Input<string | undefined>({ hclName: "config_context_cluster" });

    /**
     * (Optional) Token of your service account.
     *
     * Can be sourced from `KUBE_TOKEN`.
     */
    token = new Backend.Input<string | undefined>();

    /**
     * (Optional) Configuration block to use an exec-based credential plugin,
     * e.g. call an external command to receive user credentials.
     *
     * @see https://kubernetes.io/docs/reference/access-authn-authz/authentication/#client-go-credential-plugins
     */
    exec = new Backend.Input<
      | {
        /**
         * (Required) API version to use when decoding the ExecCredentials resource,
         * e.g. `client.authentication.k8s.io/v1beta1`.
         */
        apiVersion: string;

        /**
         * (Required) Command to execute.
         */
        command: string;

        /**
         * (Optional) List of arguments to pass when executing the plugin.
         */
        args?: string[];

        /**
         * (Optional) Map of environment variables to set when executing the plugin.
         */
        env?: Record<string, string>;
      }
      | undefined
    >();
  };

  /**
   * Creates a new Kubernetes backend configuration block.
   *
   * @param parent - The parent construct (typically a Terraform block)
   * @param inputs - Optional configuration inputs for the Kubernetes backend
   */
  constructor(parent: Construct, inputs?: KubernetesBackend["inputs"]) {
    super(parent, "kubernetes", inputs);

    if (inputs?.exec) {
      new Block(this, "exec", [], snakeCaseKeys(inputs.exec));
    }
  }

  /**
   * Maps inputs for HCL generation by removing properties handled by child blocks.
   *
   * The `exec` property is converted to a nested block in the constructor,
   * so it needs to be excluded from the main block's inputs.
   */
  protected override mapInputsForHcl() {
    const inputs = super.mapInputsForHcl();
    if (inputs) {
      delete inputs["exec"];
    }
    return inputs;
  }
}
