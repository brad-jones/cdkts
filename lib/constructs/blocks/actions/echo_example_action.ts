import type { Construct } from "../../construct.ts";
import type { Action } from "./action.ts";
import { DenoAction, type DenoActionConfig } from "./deno_action.ts";

export interface EchoExampleActionProps {
  /**
   * A message that will be echoed back to you.
   */
  message: string;

  /**
   * The number of times the message should be echoed.
   *
   * Default: 3
   */
  count?: number;

  /**
   * How many seconds should the action wait before sending the message again.
   *
   * Default: 1
   */
  delaySec?: number;
}

/**
 * A working example of a DenoAction.
 *
 * Given a message this will repeat it back to you based on the settings provided.
 *
 * @example
 *
 * ```ts
 * import { Stack, EchoDenoAction } from "jsr:@brad-jones/cdkts/constructs";
 *
 * class MyStack extends Stack {
 *   constructor() {
 *     super(`${import.meta.url}#${MyStack.name}`);
 *
 *     new EchoDenoAction(this, "Example", {
 *       message: "Hello World"
 *     });
 *   }
 * }
 * ```
 */
export class EchoExampleAction extends DenoAction<typeof EchoExampleAction> {
  static override readonly Props = class extends DenoAction.Props {
    override config = new DenoAction.Input<DenoActionConfig<EchoExampleActionProps>>();
  };

  constructor(parent: Construct, label: string, props: EchoExampleActionProps, options?: Action["inputs"]) {
    super(parent, label, {
      ...options,
      config: {
        props: {
          count: 3,
          delaySec: 1,
          ...props,
        },
        path: import.meta.url,
        permissions: {
          all: true,
        },
      },
    });
  }
}
