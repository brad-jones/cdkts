/**
 * Terraform resource mode
 */
export type ResourceMode = "managed" | "data";

/**
 * Valid Terraform plan action values
 */
export type PlanAction =
  | ["no-op"]
  | ["create"]
  | ["read"]
  | ["update"]
  | ["delete", "create"]
  | ["create", "delete"]
  | ["delete"];

/**
 * Action reason codes that explain why certain actions were selected
 */
export type ActionReason =
  | "replace_because_tainted"
  | "replace_because_cannot_update"
  | "replace_by_request"
  | "delete_because_no_resource_config"
  | "delete_because_no_module"
  | "delete_because_wrong_repetition"
  | "delete_because_count_index"
  | "delete_because_each_key"
  | "read_because_config_unknown"
  | "read_because_dependency_pending";

/**
 * Represents a change to an object in the plan
 * See: https://developer.hashicorp.com/terraform/internals/json-format#change-representation
 */
export interface ChangeRepresentation {
  /** Actions that will be taken on the object */
  actions: PlanAction;
  /** Object value before the action */
  before?: unknown;
  /** Object value after the action (may be incomplete for unknown values) */
  after?: unknown;
  /** Object with unknown leaf values replaced with true */
  after_unknown?: Record<string, unknown>;
  /** Object with sensitive leaf values replaced with true */
  before_sensitive?: Record<string, unknown>;
  /** Object with sensitive leaf values replaced with true */
  after_sensitive?: Record<string, unknown>;
  /** Paths into the object that resulted in the replace action */
  replace_paths?: (string | number)[][];
  /** Present only when the object is being imported */
  importing?: {
    /** Import ID of the object being imported */
    id: string;
  };
}

/**
 * Represents a resource or output change in the plan
 */
export interface ResourceChange {
  /** Full absolute address of the resource instance */
  address: string;
  /** Previous address if the address has changed (e.g., via moved block) */
  previous_address?: string;
  /** Module portion of the address (omitted for root module) */
  module_address?: string;
  /** Resource mode: managed or data */
  mode: ResourceMode;
  /** Resource type */
  type: string;
  /** Resource name */
  name: string;
  /** Instance index (for count or for_each) */
  index?: number | string;
  /** Opaque key for deposed objects */
  deposed?: string;
  /** The change that will be made to this resource */
  change: ChangeRepresentation;
  /** Optional context about why the actions were selected */
  action_reason?: ActionReason;
}

/**
 * Represents an attribute that contributed to changes in the plan
 */
export interface RelevantAttribute {
  /** Resource address */
  resource: string;
  /** Attribute path */
  attribute: (string | number)[];
}

/**
 * State representation
 * See: https://developer.hashicorp.com/terraform/internals/json-format#state-representation
 */
export interface StateRepresentation {
  /** Values representation derived from the state */
  values?: unknown;
  /** Terraform version string */
  terraform_version?: string;
}

/**
 * Plan JSON object structure
 * See: https://developer.hashicorp.com/terraform/internals/json-format#plan-representation
 */
export interface PlanJsonObject {
  /** Format version of the JSON output */
  format_version: string;
  /** Prior state that the configuration is being applied to */
  prior_state?: StateRepresentation;
  /** Indicates if the plan is applyable */
  applyable?: boolean;
  /** Indicates if the plan is complete */
  complete?: boolean;
  /** Indicates whether planning failed */
  errored?: boolean;
  /** Configuration representation being applied */
  configuration?: unknown;
  /** Planned values in the standard value representation */
  planned_values?: unknown;
  /** Representation of potentially-unknown attributes */
  proposed_unknown?: unknown;
  /** Variables provided for the plan */
  variables?: Record<string, { value: unknown }>;
  /** Individual change actions that Terraform plans to use */
  resource_changes?: ResourceChange[];
  /** Changes detected when comparing most recent state to prior state */
  resource_drift?: ResourceChange[];
  /** Sources of all values contributing to changes in the plan */
  relevant_attributes?: RelevantAttribute[];
  /** Planned changes to output values of the root module */
  output_changes?: Record<string, { change: ChangeRepresentation }>;
  /** Partial results for checkable objects */
  checks?: unknown;
}

export interface Plan {
  /**
   * The path to the binary representation of the plan.
   */
  binaryPlanFilePath: string;

  /**
   * Terraform plan JSON representation.
   *
   * See: https://developer.hashicorp.com/terraform/internals/json-format#plan-representation
   */
  planJsonObject: PlanJsonObject;
}
