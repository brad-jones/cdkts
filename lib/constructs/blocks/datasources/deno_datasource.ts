import { Stack } from "../../stack.ts";
import { DataSource, DataSourceInputs } from "./datasource.ts";

// deno-lint-ignore no-explicit-any
export interface DenoDataSourceInputs<Props extends any = any> extends DataSourceInputs {
  path: string;
  props: Props;
  permissions?: {
    all?: boolean;
    allow?: string[];
    deny?: string[];
  };
}

// deno-lint-ignore no-explicit-any
export interface DenoDataSourceOutputs<Result extends any = any> {
  result: Result;
}

// deno-lint-ignore no-explicit-any
export class DenoDataSource<Props extends any = any, Result extends any = any>
  extends DataSource<DenoDataSourceInputs<Props>, DenoDataSourceOutputs<Result>> {
  constructor(parent: Stack, label: string, inputs: DenoDataSourceInputs<Props>) {
    super(parent, "denobridge_datasource", label, inputs);
  }
}
