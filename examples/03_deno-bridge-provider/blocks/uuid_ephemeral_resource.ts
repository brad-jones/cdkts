// deno-lint-ignore-file require-await

import { type Construct, DenoEphemeralResource, type EphemeralResource } from "@brad-jones/cdkts/constructs";
import { ZodEphemeralResourceProvider } from "@brad-jones/terraform-provider-denobridge";
import { z } from "@zod/zod";

const Props = z.object({
  type: z.enum(["v4"]),
});

const Result = z.object({
  uuid: z.uuid(),
});

export class UuidExampleEphemeralResource extends DenoEphemeralResource<typeof UuidExampleEphemeralResource> {
  static override readonly Props = class extends DenoEphemeralResource.Props {
    override props = new DenoEphemeralResource.ZodInput(Props);
    override result = new DenoEphemeralResource.ZodOutput(Result);
  };

  constructor(
    parent: Construct,
    label: string,
    props: z.infer<typeof Props>,
    options?: EphemeralResource["inputs"],
  ) {
    super(parent, label, {
      path: import.meta.url,
      props,
      permissions: {
        all: true,
      },
      ...options,
    });
  }
}

if (import.meta.main) {
  // TODO: Make the private data schema optional
  const privateData = z.never();

  new ZodEphemeralResourceProvider(Props, Result, privateData, {
    async open({ type }) {
      if (type != "v4") {
        return {
          diagnostics: [{
            severity: "error",
            summary: "Unsupported UUID type",
            detail: "This resource only supports v4 UUIDs",
          }],
        };
      }

      return { result: { uuid: crypto.randomUUID() } };
    },
  });
}
