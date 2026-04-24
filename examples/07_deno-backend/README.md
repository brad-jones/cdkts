# Deno Backend Example

This example demonstrates the `DenoBackend` construct, which lets you implement a
Terraform/OpenTofu state backend entirely in TypeScript.

Instead of configuring an external HTTP server for the
[HTTP backend](https://developer.hashicorp.com/terraform/language/backend/http),
`DenoBackend` automatically starts a local HTTPS server that routes state
operations to your handler functions.

## What It Does

The stack defines four handler methods:

- **`getState`** — Reads `terraform.tfstate` from disk (or returns `null` if it doesn't exist)
- **`updateState`** — Writes the state bytes to `terraform.tfstate`
- **`deleteState`** — Removes the state file
- **`lock` / `unlock`** — File-based locking using `terraform.tfstate.lock`

Under the hood, `DenoBackend`:

1. Generates a self-signed TLS certificate for localhost
2. Generates random basic auth credentials
3. Starts an HTTPS server that maps HTTP methods to your handlers
4. Injects the server address and credentials into Terraform via `TF_HTTP_*` env vars
5. Shuts down the server during project cleanup

```txt
$ cdkts apply ./my_stack.ts

...

Apply complete! Resources: 1 added, 0 changed, 0 destroyed.
```

## Why?

The `DenoBackend` is a foundation for building custom state backends in TypeScript.
While this example uses simple file I/O, you could implement handlers that store
state in any system — a database, cloud storage, a custom API, etc.

Higher-level abstractions can extend `DenoBackend` to provide pre-built handler
implementations, giving you the full power of TypeScript for state management
without writing HTTP server code yourself.
