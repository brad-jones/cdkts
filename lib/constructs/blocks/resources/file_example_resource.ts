import type { Construct } from "../../construct.ts";
import { DenoResource } from "./deno_resource.ts";
import type { Resource } from "./resource.ts";

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
    super(parent, label, { path: import.meta.url, props, ...options });
  }
}
