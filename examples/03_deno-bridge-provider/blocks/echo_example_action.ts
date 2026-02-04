import { type Action, type Construct, DenoAction } from "@brad-jones/cdkts/constructs";
import { ZodActionProvider } from "@brad-jones/terraform-provider-denobridge";
import { z } from "@zod/zod";

const Props = z.object({
  message: z.string(),
  count: z.number().optional().default(3),
  delaySec: z.number().optional().default(1),
});

export class EchoExampleAction extends DenoAction<typeof EchoExampleAction> {
  constructor(
    parent: Construct,
    label: string,
    props: z.input<typeof Props>,
    options?: Omit<Action["inputs"], "config">,
  ) {
    super(parent, label, {
      ...options,
      config: {
        props,
        path: import.meta.url,
        permissions: {
          all: true,
        },
      },
    });
  }
}

if (import.meta.main) {
  new ZodActionProvider(Props, {
    async invoke({ message, count, delaySec }, progressCallback) {
      for (let i = 0; i < count; i++) {
        await progressCallback(`${i}: ${message}`);
        await new Promise((r) => setTimeout(r, delaySec * 1000));
      }
    },
  });
}
