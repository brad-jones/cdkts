import { Construct } from "../../construct.ts";
import { Action } from "../actions/action.ts";
import { Block } from "../block.ts";
import { Provider } from "../providers/provider.ts";

export interface ResourceInputs {
  count?: number;
  depends_on?: string[];
  forEach?: Record<string, string> | string[];
  provider?: Provider;
  lifecycles?: { when: "pre" | "post"; condition: string; errorMessage: string }[];
  actionTriggers?: {
    events: ("before_create" | "after_create" | "before_update" | "after_update")[];
    actions: Action[];
    condition?: string;
  }[];
  createBeforeDestroy?: boolean;
  preventDestroy?: boolean;
  ignoreChanges?: string[];
  replaceTriggeredBy?: string[];
  // TODO: https://developer.hashicorp.com/terraform/language/block/resource#connection
  // TODO: https://developer.hashicorp.com/terraform/language/block/resource#provisioner
  [x: string]: unknown;
}

// deno-lint-ignore no-explicit-any
export class Resource<Inputs extends ResourceInputs = ResourceInputs, Outputs extends any = any>
  extends Block<Inputs, Outputs> {
  constructor(
    parent: Construct,
    readonly typeName: string,
    readonly label: string,
    inputs: Inputs,
    childBlocks?: (b: Block) => void,
  ) {
    super(parent, "resource", [typeName, label], inputs, childBlocks);

    if (
      typeof inputs.createBeforeDestroy !== "undefined" ||
      typeof inputs.preventDestroy !== "undefined" ||
      inputs.ignoreChanges && inputs.ignoreChanges.length > 0 ||
      inputs.replaceTriggeredBy && inputs.replaceTriggeredBy.length > 0 ||
      inputs.lifecycles && inputs.lifecycles.length > 0 ||
      inputs.actionTriggers && inputs.actionTriggers.length > 0
    ) {
      new Block(this, "lifecycle", [], {
        create_before_destroy: inputs.createBeforeDestroy,
        prevent_destroy: inputs.preventDestroy,
        ignore_changes: inputs.ignoreChanges,
        replace_triggered_by: inputs.replaceTriggeredBy,
      }, (b) => {
        for (const trigger of inputs!.actionTriggers!) {
          new Block(b, "action_trigger", [], {
            events: trigger.events,
            condition: trigger.condition,
            actions: trigger.actions.map((_) => _.id),
          });
        }

        for (const lifecycle of inputs!.lifecycles!) {
          new Block(b, `${lifecycle.when}condition`, [], {
            condition: lifecycle.condition,
            error_message: lifecycle.errorMessage,
          });
        }
      });
    }
  }

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
