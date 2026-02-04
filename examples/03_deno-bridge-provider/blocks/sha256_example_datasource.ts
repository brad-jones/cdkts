import { type Construct, type DataSource, DenoDataSource } from "@brad-jones/cdkts/constructs";
import { ZodDatasourceProvider } from "@brad-jones/terraform-provider-denobridge";
import { z } from "@zod/zod";

const Props = z.object({
  value: z.string(),
});

const Result = z.object({
  hash: z.string(),
});

export class Sha256ExampleDataSource extends DenoDataSource<typeof Sha256ExampleDataSource> {
  static override readonly Props = class extends DenoDataSource.Props {
    override props = new DenoDataSource.ZodInput(Props);
    override result = new DenoDataSource.ZodOutput(Result);
  };

  constructor(
    parent: Construct,
    label: string,
    props: z.infer<typeof Props>,
    options?: DataSource["inputs"],
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
  new ZodDatasourceProvider(Props, Result, {
    async read({ value }) {
      const encoder = new TextEncoder();
      const data = encoder.encode(value);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      return { hash };
    },
  });
}
