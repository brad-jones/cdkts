// deno-lint-ignore-file no-explicit-any

import { Hono } from "@hono/hono";
import type { Construct } from "../../construct.ts";
import { Resource } from "./resource.ts";

export interface DenoResourceProvider<Props, State> {
  create(
    request: { props: Props },
  ): Promise<
    | { id: string; state?: State }
    | { error: string; type: "bad-request" | "unexpected" }
  >;

  read(
    request: { id: string; props: Props },
  ): Promise<
    | { props: Props; state?: State }
    | { exists: false }
    | { error: string; type: "bad-request" | "unexpected" }
  >;

  update(request: {
    id: string;
    currentProps: Props;
    nextProps: Props;
    currentState?: State;
  }): Promise<
    | { state?: State }
    | { error: string; type: "bad-request" | "unexpected" | "requires-replacement" }
  >;

  delete(
    request: { id: string; props: Props; state?: State },
  ): Promise<
    | void
    | { error: string; type: "bad-request" | "unexpected" }
  >;

  modifyPlan?(
    request: {
      id: string;
      planType: "create" | "update" | "delete";
      nextProps?: Props;
      currentProps?: Props;
      currentState?: State;
    },
  ): Promise<
    | void
    | {
      modifiedProps?: Props;
      requiresReplacement?: boolean;
      diagnostics?: { severity: "error" | "warning"; summary: string; detail: string; propName?: string }[];
    }
    | { error: string; type: "bad-request" | "unexpected" }
  >;
}

export class DenoResource<Self = typeof DenoResource> extends Resource<Self> {
  static override readonly Props = class extends Resource.Props {
    id = new Resource.Output<string>();
    props = new Resource.Input<any>();
    state = new Resource.Output<any>();
    path = new Resource.Input<string>();
    permissions = new Resource.Input<
      {
        all?: boolean;
        allow?: string[];
        deny?: string[];
      } | undefined
    >();
  };

  constructor(parent: Construct, label: string, inputs: DenoResource["inputs"]) {
    super(parent, "denobridge_resource", label, inputs);
  }

  static provider<Props, State>(provider: DenoResourceProvider<Props, State>): Deno.ServeDefaultExport {
    const app = new Hono();

    app.get("/health", (c) => c.body(null, 204));

    app.post("/create", async (c) => {
      const response = await provider.create(await c.req.json());

      if ("error" in response) {
        return c.json(
          { error: response.error },
          response.type === "bad-request" ? 400 : 500,
        );
      }

      return c.json(response);
    });

    app.post("/read", async (c) => {
      const response = await provider.read(await c.req.json());

      if ("error" in response) {
        return c.json(
          { error: response.error },
          response.type === "bad-request" ? 400 : 500,
        );
      }

      return c.json(response);
    });

    app.post("/update", async (c) => {
      const response = await provider.update(await c.req.json());

      if ("error" in response) {
        return c.json(
          { error: response.error },
          response.type === "requires-replacement" ? 422 : response.type === "bad-request" ? 400 : 500,
        );
      }

      if (response.state) {
        return c.json(response);
      }

      return c.body(null, 204);
    });

    app.post("/delete", async (c) => {
      const response = await provider.delete(await c.req.json());

      if (response && "error" in response) {
        return c.json(
          { error: response.error },
          response.type === "bad-request" ? 400 : 500,
        );
      }

      return c.body(null, 204);
    });

    app.post("/modify-plan", async (c) => {
      if (!provider.modifyPlan) {
        return c.notFound();
      }

      const response = await provider.modifyPlan(await c.req.json());

      if (response && "error" in response) {
        return c.json(
          { error: response.error },
          response.type === "bad-request" ? 400 : 500,
        );
      }

      if (response) {
        return c.json(response);
      }

      return c.body(null, 204);
    });

    return app;
  }
}
