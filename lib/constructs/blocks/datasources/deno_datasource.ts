import type { Construct } from "../../construct.ts";
import { DataSource } from "./datasource.ts";

export class DenoDataSource<Self = typeof DenoDataSource> extends DataSource<Self> {
  static override readonly Props = class extends DataSource.Props {
    path = new DataSource.Input<string>();
    props = new DataSource.Input<any>();
    permissions = new DataSource.Input<
      {
        all?: boolean;
        allow?: string[];
        deny?: string[];
      } | undefined
    >();
    result = new DataSource.Output<any>();
  };

  constructor(parent: Construct, label: string, inputs: DenoDataSource["inputs"]) {
    super(parent, "denobridge_datasource", label, inputs);
  }
}
