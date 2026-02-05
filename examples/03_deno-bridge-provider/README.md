# Deno Bridge Provider Example

This example showcases one of the **primary reasons CDKTS was created**:
providing a fully unified TypeScript experience for defining _both_ your
infrastructure configuration _and_ the underlying provider logic.

## 🌟 The Vision: Pure TypeScript Infrastructure

Traditional Terraform/OpenTofu providers are written in Go. While this works well, it creates a barrier:

- You need Go expertise to write custom provider logic
- You switch between languages (HCL for config, Go for providers)
- You can't leverage the TypeScript/Deno ecosystem for infrastructure

**CDKTS + Denobridge changes this.**

The [terraform-provider-denobridge](https://github.com/brad-jones/terraform-provider-denobridge)
enables you to implement Terraform provider logic in TypeScript/Deno instead of Go.
Your TypeScript code runs as a Deno process, communicating with Terraform via JSON-RPC 2.0 over stdin/stdout.

CDKTS takes this further by providing type-safe, Zod-validated constructs that generate both:

1. The Terraform configuration (HCL)
2. The TypeScript provider implementation (Deno scripts)

All in one cohesive codebase. **Everything is TypeScript.**

## 🎯 What This Example Demonstrates

This stack shows off four types of blocks you can create with the denobridge provider:

### 1. **Resources** - Full CRUD Lifecycle Management

[`FileExampleResource`](examples/03_deno-bridge-provider/blocks/file_example_resource.ts) manages a text file on disk:

```ts
const file = new FileExampleResource(this, "hello", {
  path: `${import.meta.dirname}/message.txt`,
  content: `hash: ${fooData.outputs.result.hash}`,
});
```

This resource implements the complete lifecycle:

- **Create**: Write the file to disk
- **Read**: Check if the file exists and read its contents
- **Update**: Modify the file content
- **Delete**: Remove the file
- **ModifyPlan**: Determine when replacement is required (path changes)

### 2. **Data Sources** - Read-Only Data Fetching

[`Sha256ExampleDataSource`](examples/03_deno-bridge-provider/blocks/sha256_example_datasource.ts) computes a SHA256 hash:

```ts
const fooData = new Sha256ExampleDataSource(this, "foo", { value: "bar" });

// Use the result in other resources
content: `hash: ${fooData.outputs.result.hash}`;
```

Data sources are read-only and don't manage state. They're perfect for:

- Fetching external data
- Performing computations
- Looking up values from APIs

### 3. **Actions** - Execute Operations

[`EchoExampleAction`](examples/03_deno-bridge-provider/blocks/echo_example_action.ts) demonstrates action triggers:

```ts
const echoAction = new EchoExampleAction(this, "echo", {
  message: `Hello World`,
});

new FileExampleResource(this, "hello", {
  path: `${import.meta.dirname}/message.txt`,
  content: `hash: ${fooData.outputs.result.hash}`,
}, {
  actionTriggers: [
    { actions: [echoAction], events: ["after_create", "after_update"] },
  ],
});
```

Actions execute operations that don't manage resources:

- Send notifications
- Trigger webhooks
- Perform validations
- Execute workflows

They support streaming progress callbacks for long-running operations.

### 4. **Ephemeral Resources** - Short-Lived Temporary Resources

**⚠️ Note: This functionality is currently limited due to missing write-only prop support in the denobridge provider.**

[`UuidExampleEphemeralResource`](examples/03_deno-bridge-provider/blocks/uuid_ephemeral_resource.ts) generates temporary UUIDs:

```ts
const specialId = new UuidExampleEphemeralResource(this, "special_id", { type: "v4" });
```

Ephemeral resources are perfect for:

- Temporary credentials
- Session tokens
- One-time passwords
- Build-time secrets

They exist only during Terraform operations and can be renewed or closed when no longer needed.

**We apologize for the incomplete demonstration here.** The denobridge provider doesn't yet support write-only properties, which are essential for consuming ephemeral resources (you wouldn't want sensitive credentials stored in state). Once this feature is added, we'll provide a complete example showing how ephemeral resources integrate with regular resources.

## 🔒 Zod Input & Output Validation

Building on [Example 02](examples/02_inputs-and-outputs/README.md), this example demonstrates **Zod-based validation for block inputs and outputs**.

### Block Inputs with Zod

Each block defines its props schema using Zod:

```ts
const Props = z.object({
  path: z.string(),
  content: z.string(),
});

export class FileExampleResource extends DenoResource<typeof FileExampleResource> {
  static override readonly Props = class extends DenoResource.Props {
    override props = new DenoResource.ZodInput(Props);
    override state = new DenoResource.ZodOutput(State);
  };
}
```

This provides:

- **Type safety**: TypeScript knows exactly what props are required
- **Runtime validation**: Zod validates the data at runtime
- **Auto-completion**: Your IDE provides intelligent suggestions
- **Documentation**: The schema self-documents the expected inputs

### Block Outputs with Zod

Outputs are also typed and validated:

```ts
const Result = z.object({
  hash: z.string(),
});

export class Sha256ExampleDataSource extends DenoDataSource<typeof Sha256ExampleDataSource> {
  static override readonly Props = class extends DenoDataSource.Props {
    override props = new DenoDataSource.ZodInput(Props);
    override result = new DenoDataSource.ZodOutput(Result);
  };
}
```

When you access outputs, TypeScript knows the shape:

```ts
const fooData = new Sha256ExampleDataSource(this, "foo", { value: "bar" });
fooData.outputs.result.hash; // TypeScript knows this is a string!
```

### The Unified Pattern

Notice how each block file is both:

1. **A TypeScript class** that defines the construct (used in your stack)
2. **A Deno script** that implements the provider logic (runs via denobridge)

```ts
export class FileExampleResource extends DenoResource<typeof FileExampleResource> {
  // ... class definition for use in stacks
}

if (import.meta.main) {
  // ... provider implementation that runs when called by denobridge
  new ZodResourceProvider(Props, State, {
    async create({ path, content }) {
      await Deno.writeTextFile(path, content);
      return { id: path, state: { mtime: (await Deno.stat(path)).mtime!.getTime() } };
    },
    // ... other lifecycle methods
  });
}
```

This pattern keeps everything together: the configuration API and its implementation, all type-safe, all validated, all TypeScript.

## 🛡️ Deno Permissions

The denobridge provider respects Deno's security model. Each block specifies what permissions it needs:

```ts
super(parent, label, {
  props,
  path: import.meta.url,
  permissions: {
    all: true, // For simplicity in examples
    // In production, use fine-grained permissions:
    // allow: ["read=/tmp", "write=/tmp", "net=api.example.com"]
  },
});
```

This provides:

- **Security by default**: Code can only access what it needs
- **Explicit permissions**: No hidden system access
- **Fine-grained control**: Specify exact paths, domains, and capabilities

_See the [Deno permissions documentation](https://docs.deno.com/runtime/fundamentals/security/#permissions) for details._

## 📦 How It All Works Together

1. You define your infrastructure using TypeScript classes ([my_stack.ts](examples/03_deno-bridge-provider/my_stack.ts))
2. CDKTS generates Terraform configuration (HCL) referencing denobridge resources
3. When Terraform runs, it invokes the denobridge provider
4. The denobridge provider spawns Deno processes running your TypeScript implementation
5. Your TypeScript code executes with type safety and Zod validation
6. Results flow back through JSON-RPC to Terraform

**The result?** Infrastructure as code where _everything_ is TypeScript, type-safe, and validated.

## 🚀 Learn More

- [Denobridge Provider GitHub](https://github.com/brad-jones/terraform-provider-denobridge)
- [Denobridge Provider Registry](https://registry.terraform.io/providers/brad-jones/denobridge/latest/docs)
- [Deno Runtime](https://deno.com/)
- [Zod Validation](https://zod.dev/)

## 📝 Next Steps

Try modifying the example:

- Create a new data source that fetches data from an API
- Implement a resource that manages a different type of file (JSON, YAML)
- Add more complex validation rules to the Zod schemas
- Create an action that sends a webhook notification

The possibilities are endless when you have the full power of TypeScript and Deno at your fingertips!
