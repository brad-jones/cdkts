// deno-lint-ignore-file no-unused-vars require-await

import { type Construct, DenoResource, type Resource } from "@brad-jones/cdkts/constructs";
import { ZodResourceProvider } from "@brad-jones/terraform-provider-denobridge";
import { z } from "@zod/zod";

const Props = z.object({
  path: z.string(),
  content: z.string(),
});

const State = z.object({
  mtime: z.number(),
});

export class FileExampleResource extends DenoResource<typeof FileExampleResource> {
  static override readonly Props = class extends DenoResource.Props {
    override props = new DenoResource.ZodInput(Props);
    override state = new DenoResource.ZodOutput(State);
  };

  constructor(
    parent: Construct,
    label: string,
    props: z.infer<typeof Props>,
    options?: Resource["inputs"],
  ) {
    super(parent, label, {
      props,
      path: import.meta.url,
      permissions: {
        all: true,
      },
      ...options,
    });
  }
}

if (import.meta.main) {
  new ZodResourceProvider(Props, State, {
    async create({ path, content }) {
      await Deno.writeTextFile(path, content);
      return {
        id: path,
        state: {
          mtime: (await Deno.stat(path)).mtime!.getTime(),
        },
      };
    },

    async read(id, props) {
      try {
        const content = await Deno.readTextFile(id);
        return {
          props: { path: id, content },
          state: {
            mtime: (await Deno.stat(id)).mtime!.getTime(),
          },
        };
      } catch (e) {
        if (e instanceof Deno.errors.NotFound) {
          // In the event we can no longer locate the resource we should signal
          // to tf to remove the resource from state. This will cause tf to re-create
          // the resource on the next plan.
          return { exists: false };
        }
        throw e;
      }
    },

    async update(id, nextProps, currentProps, currentState) {
      if (nextProps.path !== currentProps.path) {
        throw new Error("can not update a file with a different path, must be replaced");
      }

      await Deno.writeTextFile(id, nextProps.content);

      return {
        mtime: (await Deno.stat(id)).mtime!.getTime(),
      };
    },

    async delete(id, props, state) {
      try {
        await Deno.remove(id);
      } catch (e) {
        if (e instanceof Deno.errors.NotFound) {
          return;
        }
        throw e;
      }
    },

    async modifyPlan(id, planType, nextProps, currentProps, currentState) {
      if (planType !== "update") return undefined;
      return { requiresReplacement: currentProps?.path !== nextProps?.path };
    },
  });
}
