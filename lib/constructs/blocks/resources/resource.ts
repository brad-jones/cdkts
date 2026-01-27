import type { Construct } from "../../construct.ts";
import type { Action } from "../actions/action.ts";
import { Block } from "../block.ts";
import type { Provider } from "../providers/provider.ts";

export class Resource<Self = typeof Resource> extends Block<Self> {
  static override readonly Props = class extends Block.Props {
    count = new Block.Input<number | undefined>();
    dependsOn = new Block.Input<string[] | undefined>();
    forEach = new Block.Input<Record<string, string> | string[] | undefined>();
    provider = new Block.Input<Provider | undefined>();
    createBeforeDestroy = new Block.Input<boolean | undefined>();
    preventDestroy = new Block.Input<boolean | undefined>();
    ignoreChanges = new Block.Input<string[] | undefined>();
    replaceTriggeredBy = new Block.Input<string[] | undefined>();
    lifecycles = new Block.Input<{ when: "pre" | "post"; condition: string; errorMessage: string }[] | undefined>();
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
