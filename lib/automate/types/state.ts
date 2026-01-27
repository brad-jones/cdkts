// https://developer.hashicorp.com/terraform/internals/json-format#state-representation
export interface State<Outputs> {
  /** Format version for the state JSON structure */
  format_version?: string;

  /** Version of Terraform that produced this state */
  terraform_version: string;

  /** The values representation derived from the state */
  values?: ValuesRepresentation<Outputs>;
}

/**
 * Values representation describes the current state or planned state
 * https://developer.hashicorp.com/terraform/internals/json-format#values-representation
 */
export interface ValuesRepresentation<Outputs> {
  /** Outputs from the root module */
  outputs?: { [K in keyof Outputs]: OutputValue<Outputs[K]> };

  /** Resources and child modules in the root module */
  root_module?: ModuleRepresentation;
}

export interface OutputValue<Value> {
  /** The output value */
  value: Value;

  /** Type of the output value (e.g., "string", "number", ["map","string"]) */
  type?: string | unknown[];

  /** Whether the output is marked as sensitive */
  sensitive: boolean;
}

export interface ModuleRepresentation {
  /** Resources in this module */
  resources?: ResourceRepresentation[];

  /** Child modules nested within this module */
  child_modules?: ChildModuleRepresentation[];
}

export interface ChildModuleRepresentation extends ModuleRepresentation {
  /** Absolute module address */
  address: string;
}

export interface ResourceRepresentation {
  /** Absolute resource address */
  address: string;

  /** Resource mode: "managed" for resources, "data" for data resources */
  mode: "managed" | "data";

  /** Resource type (e.g., "aws_instance") */
  type: string;

  /** Resource name */
  name: string;

  /** Instance index for count or for_each resources */
  index?: number | string;

  /** Name of the provider responsible for this resource */
  provider_name: string;

  /** Schema version that the values property conforms to */
  schema_version: number;

  /** Attribute values of the resource */
  values: Record<string, unknown>;

  /** Sensitivity information for the resource's attributes */
  sensitive_values?: Record<string, unknown>;

  /** For data resources that have not yet been read, the dependencies that must be applied first */
  depends_on?: string[];

  /** Indicates whether this is a tainted resource */
  tainted?: boolean;

  /** The key of a deposed object if this represents a deposed object */
  deposed_key?: string;
}
