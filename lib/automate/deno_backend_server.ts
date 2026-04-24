import type { DenoBackendHandlers, LockInfo } from "../constructs/blocks/backends/deno_backend.ts";

/**
 * Configuration for the Deno backend HTTPS server.
 */
export interface DenoBackendServerConfig {
  handlers: DenoBackendHandlers;
  cert: string;
  key: string;
  username: string;
  password: string;
  port?: number;
  hostname?: string;
}

/**
 * HTTPS server that serves Terraform/OpenTofu HTTP backend requests.
 *
 * Routes requests by HTTP method to user-provided handler functions.
 * Enforces basic auth on every request.
 */
export class DenoBackendServer {
  #handlers: DenoBackendHandlers;
  #cert: string;
  #key: string;
  #username: string;
  #password: string;
  #port: number;
  #hostname: string;
  #server?: Deno.HttpServer;

  constructor(config: DenoBackendServerConfig) {
    this.#handlers = config.handlers;
    this.#cert = config.cert;
    this.#key = config.key;
    this.#username = config.username;
    this.#password = config.password;
    this.#port = config.port ?? 0;
    this.#hostname = config.hostname ?? "localhost";
  }

  /**
   * Starts the HTTPS server and returns the actual bound address.
   */
  async start(): Promise<{ port: number; hostname: string }> {
    const { promise: listening, resolve: onListening } = Promise.withResolvers<
      { port: number; hostname: string }
    >();

    this.#server = Deno.serve({
      port: this.#port,
      hostname: this.#hostname,
      cert: this.#cert,
      key: this.#key,
      onListen: (addr) => {
        onListening({ port: addr.port, hostname: addr.hostname });
      },
    }, (req) => this.#handleRequest(req));

    return await listening;
  }

  /**
   * Gracefully shuts down the server.
   */
  async stop(): Promise<void> {
    if (this.#server) {
      await this.#server.shutdown();
      this.#server = undefined;
    }
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.stop();
  }

  async #handleRequest(req: Request): Promise<Response> {
    // Validate basic auth
    if (!this.#checkAuth(req)) {
      return new Response("Unauthorized", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="cdkts"' },
      });
    }

    try {
      switch (req.method) {
        case "GET":
          return await this.#handleGet();
        case "POST":
          return await this.#handlePost(req);
        case "DELETE":
          return await this.#handleDelete();
        case "LOCK":
          return await this.#handleLock(req);
        case "UNLOCK":
          return await this.#handleUnlock(req);
        default:
          return new Response("Method Not Allowed", { status: 405 });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return new Response(message, { status: 500 });
    }
  }

  #checkAuth(req: Request): boolean {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Basic ")) return false;

    const decoded = atob(auth.slice(6));
    const [username, password] = decoded.split(":");
    return username === this.#username && password === this.#password;
  }

  async #handleGet(): Promise<Response> {
    const state = await this.#handlers.getState();
    if (state === null) {
      return new Response(null, { status: 204 });
    }
    return new Response(state as BodyInit, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  async #handlePost(req: Request): Promise<Response> {
    const body = new Uint8Array(await req.arrayBuffer());
    await this.#handlers.updateState(body);
    return new Response(null, { status: 200 });
  }

  async #handleDelete(): Promise<Response> {
    await this.#handlers.deleteState();
    return new Response(null, { status: 200 });
  }

  async #handleLock(req: Request): Promise<Response> {
    if (!this.#handlers.lock) {
      return new Response("Locking not supported", { status: 400 });
    }

    const info: LockInfo = await req.json();
    try {
      const acquired = await this.#handlers.lock(info);
      if (acquired) {
        return new Response(null, { status: 200 });
      }
      return new Response("Lock acquisition returned false", { status: 423 });
    } catch (err) {
      // Terraform expects 423 with the existing lock info in the body
      const message = err instanceof Error ? err.message : String(err);
      return new Response(message, { status: 423 });
    }
  }

  async #handleUnlock(req: Request): Promise<Response> {
    if (!this.#handlers.unlock) {
      return new Response("Unlocking not supported", { status: 400 });
    }

    const info: LockInfo = await req.json();
    await this.#handlers.unlock(info);
    return new Response(null, { status: 200 });
  }
}
