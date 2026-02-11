import type { Construct } from "../../construct.ts";
import { RawHcl } from "../../rawhcl.ts";
import type { Action } from "../actions/action.ts";
import { Block } from "../block.ts";
import type { Provider } from "../providers/provider.ts";

/**
 * Represents a Terraform/OpenTofu resource block.
 *
 * Resources are the most important element in Terraform/OpenTofu configuration. Each resource
 * block describes one or more infrastructure objects, such as virtual networks, compute instances,
 * or DNS records. Resources support comprehensive lifecycle management including creation, updates,
 * deletion, and various meta-arguments for controlling their behavior.
 *
 * @template Self - The concrete resource class type (use `typeof YourResource`)
 *
 * @see https://developer.hashicorp.com/terraform/language/resources
 * @also https://opentofu.org/docs/language/resources
 *
 * @example
 * ```typescript
 * // Basic resource usage
 * new Resource(this, "local_file", "hello", {
 *   filename: "${path.module}/message.txt",
 *   content: "Hello World",
 * });
 *
 * // Resource with lifecycle configuration
 * new Resource(this, "aws_instance", "web", {
 *   ami: "ami-12345678",
 *   instance_type: "t2.micro",
 *   createBeforeDestroy: true,
 *   ignoreChanges: ["tags"],
 * });
 *
 * // Custom resource class extending Resource
 * class FileExampleResource extends DenoResource<typeof FileExampleResource> {
 *   constructor(parent: Construct, label: string, props: { path: string; content: string }) {
 *     super(parent, label, { props, path: import.meta.url });
 *   }
 * }
 * ```
 */
export class Resource<Self = typeof Resource> extends Block<Self> {
  /**
   * Defines the input and output properties for Resource blocks.
   *
   * This Props class extends Block.Props and includes Terraform/OpenTofu resource meta-arguments
   * for controlling resource behavior, lifecycle management, and action triggers.
   */
  static override readonly Props = class extends Block.Props {
    /**
     * Creates multiple resource instances based on a numeric count.
     *
     * When set, Terraform creates the specified number of instances of this resource.
     * Each instance is identified by its index, accessible via `count.index`.
     *
     * @see https://developer.hashicorp.com/terraform/language/meta-arguments/count
     *
     * @example
     * ```typescript
     * new Resource(this, "aws_instance", "server", {
     *   count: 3,
     *   ami: "ami-12345678",
     *   instance_type: "t2.micro",
     * });
     * ```
     */
    count = new Block.Input<number | undefined>();

    /**
     * Establishes explicit dependencies between resources.
     *
     * By default, Terraform infers dependencies from attribute references. Use `dependsOn`
     * to create explicit dependencies when implicit ones are insufficient or when you need
     * to ensure a specific order of operations.
     *
     * @see https://developer.hashicorp.com/terraform/language/meta-arguments/depends_on
     *
     * @example
     * ```typescript
     * new Resource(this, "aws_instance", "web", {
     *   dependsOn: ["aws_security_group.example"],
     *   ami: "ami-12345678",
     * });
     * ```
     */
    dependsOn = new Block.Input<Block[] | undefined>();

    /**
     * Creates multiple resource instances by iterating over a collection.
     *
     * Similar to `count`, but allows iteration over a map or set. Each instance is
     * identified by its key, accessible via `each.key` and `each.value`.
     *
     * @see https://developer.hashicorp.com/terraform/language/meta-arguments/for_each
     *
     * @example
     * ```typescript
     * new Resource(this, "aws_instance", "server", {
     *   forEach: { web: "ami-web", api: "ami-api" },
     *   ami: "${each.value}",
     * });
     * ```
     */
    forEach = new Block.Input<Record<string, string> | string[] | undefined>();

    /**
     * Specifies an alternate provider configuration for this resource.
     *
     * By default, resources use the default provider configuration. Use this to select
     * a specific provider instance, useful for multi-region or multi-account deployments.
     *
     * @see https://developer.hashicorp.com/terraform/language/meta-arguments/provider
     *
     * @example
     * ```typescript
     * const awsWest = new Provider(this, "aws", { region: "us-west-2", alias: "west" });
     * new Resource(this, "aws_instance", "server", {
     *   provider: awsWest,
     *   ami: "ami-12345678",
     * });
     * ```
     */
    provider = new Block.Input<Provider | undefined>();

    /**
     * Creates replacement resources before destroying the old ones.
     *
     * When `true`, Terraform creates a new resource before destroying the old one during
     * updates that require replacement. This minimizes downtime but may temporarily use
     * more resources.
     *
     * @see https://developer.hashicorp.com/terraform/language/meta-arguments/lifecycle#create_before_destroy
     *
     * @example
     * ```typescript
     * new Resource(this, "aws_instance", "web", {
     *   createBeforeDestroy: true,
     *   ami: "ami-12345678",
     * });
     * ```
     */
    createBeforeDestroy = new Block.Input<boolean | undefined>();

    /**
     * Prevents accidental destruction of the resource.
     *
     * When `true`, Terraform will error if an operation would destroy this resource,
     * providing a safeguard for critical infrastructure.
     *
     * @see https://developer.hashicorp.com/terraform/language/meta-arguments/lifecycle#prevent_destroy
     *
     * @example
     * ```typescript
     * new Resource(this, "aws_db_instance", "production", {
     *   preventDestroy: true,
     *   identifier: "prod-db",
     * });
     * ```
     */
    preventDestroy = new Block.Input<boolean | undefined>();

    /**
     * Ignores changes to specified attributes.
     *
     * Terraform will not attempt to update these attributes when they change,
     * useful for attributes modified outside of Terraform or that change frequently.
     *
     * @see https://developer.hashicorp.com/terraform/language/meta-arguments/lifecycle#ignore_changes
     *
     * @example
     * ```typescript
     * new Resource(this, "aws_instance", "web", {
     *   ignoreChanges: ["tags", "user_data"],
     *   ami: "ami-12345678",
     * });
     * ```
     */
    ignoreChanges = new Block.Input<string[] | undefined>();

    /**
     * Forces resource replacement when specified references change.
     *
     * Instructs Terraform to replace this resource when any of the referenced
     * resources or attributes change, even if this resource's own attributes haven't changed.
     *
     * @see https://developer.hashicorp.com/terraform/language/meta-arguments/lifecycle#replace_triggered_by
     *
     * @example
     * ```typescript
     * new Resource(this, "aws_instance", "web", {
     *   replaceTriggeredBy: ["aws_security_group.example.id"],
     *   ami: "ami-12345678",
     * });
     * ```
     */
    replaceTriggeredBy = new Block.Input<string[] | undefined>();

    /**
     * Defines lifecycle validation conditions.
     *
     * Preconditions and postconditions validate assumptions before and after resource
     * operations. If a condition fails, Terraform displays the error message and halts.
     *
     * @see https://developer.hashicorp.com/terraform/language/meta-arguments/lifecycle#custom-condition-checks
     *
     * @example
     * ```typescript
     * new Resource(this, "aws_instance", "web", {
     *   lifecycles: [{
     *     when: "pre",
     *     condition: "var.environment == 'production'",
     *     errorMessage: "This resource can only be created in production",
     *   }],
     *   ami: "ami-12345678",
     * });
     * ```
     */
    lifecycles = new Block.Input<{ when: "pre" | "post"; condition: string; errorMessage: string }[] | undefined>();

    /**
     * Defines action triggers for resource lifecycle events.
     *
     * Action triggers execute provider-defined actions at specific points during a resource's
     * lifecycle. Actions can run before or after create/update operations, with optional conditions.
     *
     * @see https://developer.hashicorp.com/terraform/language/resources/action-triggers
     *
     * _NB: Unsupported by OpenTofu <https://github.com/opentofu/opentofu/issues/3309>_
     *
     * @example
     * ```typescript
     * new Resource(this, "aws_instance", "web", {
     *   actionTriggers: [{
     *     events: ["after_create"],
     *     actions: [myNotificationAction],
     *     condition: "self.public_ip != null",
     *   }],
     *   ami: "ami-12345678",
     * });
     * ```
     */
    actionTriggers = new Block.Input<
      {
        events: ("before_create" | "after_create" | "before_update" | "after_update")[];
        actions: Action[];
        condition?: string;
      }[] | undefined
    >();
    // TODO: https://developer.hashicorp.com/terraform/language/block/resource#connection
    // TODO: https://developer.hashicorp.com/terraform/language/block/resource#provisioner
  };

  /**
   * Creates a new Terraform/OpenTofu resource block.
   *
   * Resources are the fundamental building blocks of Terraform/OpenTofu infrastructure.
   * This constructor automatically handles lifecycle block creation when lifecycle-related
   * inputs are provided, and sets up nested blocks for action triggers and conditions.
   *
   * @param parent - The parent Construct (typically a Stack) that contains this resource
   * @param typeName - The resource type (e.g., "aws_instance", "local_file")
   * @param label - A unique label to identify this resource instance within its type
   * @param inputs - Configuration inputs including resource-specific attributes and meta-arguments
   * @param childBlocks - Optional function to define nested blocks within this resource
   *
   * @example
   * ```typescript
   * // Basic resource
   * new Resource(this, "local_file", "config", {
   *   filename: "config.json",
   *   content: JSON.stringify({ key: "value" }),
   * });
   *
   * // Resource with lifecycle management
   * new Resource(this, "aws_instance", "web", {
   *   ami: "ami-12345678",
   *   instance_type: "t2.micro",
   *   createBeforeDestroy: true,
   *   preventDestroy: true,
   *   ignoreChanges: ["tags"],
   * });
   *
   * // Resource with action triggers
   * new Resource(this, "aws_lambda", "handler", {
   *   function_name: "my-function",
   *   actionTriggers: [{
   *     events: ["after_create", "after_update"],
   *     actions: [notifyAction],
   *   }],
   * });
   * ```
   */
  constructor(
    parent: Construct,
    readonly typeName: string,
    readonly label: string,
    inputs: Resource["inputs"],
    childBlocks?: (b: Block) => void,
  ) {
    super(parent, "resource", [typeName, label], inputs, childBlocks);

    if (
      typeof inputs?.createBeforeDestroy !== "undefined" ||
      typeof inputs?.preventDestroy !== "undefined" ||
      inputs?.ignoreChanges && inputs.ignoreChanges.length > 0 ||
      inputs?.replaceTriggeredBy && inputs.replaceTriggeredBy.length > 0 ||
      inputs?.lifecycles && inputs.lifecycles.length > 0 ||
      inputs?.actionTriggers && inputs.actionTriggers.length > 0
    ) {
      new Block(this, "lifecycle", [], {
        create_before_destroy: inputs.createBeforeDestroy,
        prevent_destroy: inputs.preventDestroy,
        ignore_changes: inputs.ignoreChanges,
        replace_triggered_by: inputs.replaceTriggeredBy,
      }, (b) => {
        if (Array.isArray(inputs!.actionTriggers!)) {
          for (const trigger of inputs!.actionTriggers!) {
            new Block(b, "action_trigger", [], {
              events: trigger.events.map((_) => new RawHcl(_)),
              condition: trigger.condition,
              actions: trigger.actions,
            });
          }
        }

        if (Array.isArray(inputs!.lifecycles!)) {
          for (const lifecycle of inputs!.lifecycles!) {
            new Block(b, `${lifecycle.when}condition`, [], {
              condition: lifecycle.condition,
              error_message: lifecycle.errorMessage,
            });
          }
        }
      });
    }
  }

  /**
   * Maps input properties to HCL (HashiCorp Configuration Language) format.
   *
   * This method filters out lifecycle-related meta-arguments that are handled separately
   * by the nested lifecycle block. The filtered inputs are then serialized into HCL
   * as the main resource configuration.
   *
   * @returns The input object with lifecycle meta-arguments removed, ready for HCL serialization
   *
   * @internal This method is called automatically during HCL generation
   */
  protected override mapInputsForHcl(): unknown {
    const inputs = { ...this.inputs };
    delete inputs["lifecycles"];
    delete inputs["actionTriggers"];
    delete inputs["createBeforeDestroy"];
    delete inputs["preventDestroy"];
    delete inputs["ignoreChanges"];
    delete inputs["replaceTriggeredBy"];
    return inputs;
  }
}
