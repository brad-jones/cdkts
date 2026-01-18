import { Construct } from "../../construct.ts";
import { DenoResource } from "./deno_resource.ts";

export interface FileProps {
  path: string;
  content: string;
}

export interface FileState {
  mtime: number;
}

export class FileResource extends DenoResource<FileProps, FileState> {
  constructor(parent: Construct, label: string, props: FileProps) {
    super(parent, label, { props, path: import.meta.url, permissions: { allow: ["read", "write"] } });
  }
}
