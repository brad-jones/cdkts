import { type Construct, DenoResource, type Resource } from "@brad-jones/cdkts/constructs";

export interface FileExampleResourceProps {
  path: string;
  content: string;
}

export interface FileExampleResourceState {
  mtime: number;
}

export class FileExampleResource extends DenoResource<typeof FileExampleResource> {
  static override readonly Props = class extends DenoResource.Props {
    override props = new DenoResource.Input<FileExampleResourceProps>();
    override state = new DenoResource.Output<FileExampleResourceState>();
  };

  constructor(parent: Construct, label: string, props: FileExampleResourceProps, options?: Resource["inputs"]) {
    super(parent, label, { path: import.meta.url, permissions: { all: true }, props, ...options });
  }
}

export default FileExampleResource.provider<FileExampleResourceProps, FileExampleResourceState>({
  async create({ props: { path, content } }) {
    await Deno.writeTextFile(path, content);
    return {
      id: path,
      state: {
        mtime: (await Deno.stat(path)).mtime!.getTime(),
      },
    };
  },

  async read({ id }) {
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
      if (e instanceof Error) {
        return { error: e.message, type: "unexpected" };
      }
      throw e;
    }
  },

  async update({ currentProps: { path: currentPath }, nextProps: { path: nextPath, content: nextContent } }) {
    if (nextPath !== currentPath) {
      return { error: "Cannot change file path", type: "requires-replacement" };
    }

    await Deno.writeTextFile(currentPath, nextContent);

    return {
      state: {
        mtime: (await Deno.stat(currentPath)).mtime!.getTime(),
      },
    };
  },

  async delete({ id }) {
    try {
      await Deno.remove(id);
    } catch (e) {
      if (e instanceof Deno.errors.NotFound) {
        return;
      }
      if (e instanceof Error) {
        return { error: e.message, type: "unexpected" };
      }
      throw e;
    }
  },

  modifyPlan({ planType, currentProps, nextProps }) {
    if (planType !== "update") return Promise.resolve();
    return Promise.resolve({ requiresReplacement: currentProps?.path !== nextProps?.path });
  },
});
