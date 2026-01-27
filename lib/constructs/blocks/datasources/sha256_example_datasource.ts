import type { Construct } from "../../construct.ts";
import type { DataSource } from "./datasource.ts";
import { DenoDataSource } from "./deno_datasource.ts";

export interface Sha256ExampleDataSourceProps {
  value: string;
}

export interface Sha256ExampleDataSourceResult {
  hash: string;
}

export class Sha256ExampleDataSource extends DenoDataSource<typeof Sha256ExampleDataSource> {
  static override readonly Props = class extends DenoDataSource.Props {
    override props = new DenoDataSource.Input<Sha256ExampleDataSourceProps>();
    override result = new DenoDataSource.Output<Sha256ExampleDataSourceResult>();
  };

  constructor(parent: Construct, label: string, props: Sha256ExampleDataSourceProps, options?: DataSource["inputs"]) {
    super(parent, label, { path: import.meta.url, props, ...options });
  }
}
