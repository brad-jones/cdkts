<div align="center">

### 🚀 CDKTS - CDK for Terraform/OpenTofu

_A modern alternative to HashiCorp's deprecated CDK-TF library, built on top of Deno._

[![Built with Deno](https://img.shields.io/badge/Built%20with-Deno-00ADD8?style=flat&logo=deno)](https://deno.com/)
[![JSR Version](https://img.shields.io/jsr/v/%40brad-jones/cdkts?style=flat&logo=jsr)](https://jsr.io/@brad-jones/cdkts)
[![Terraform](https://img.shields.io/badge/Terraform-844FBA?style=flat&logo=terraform&logoColor=white)](https://registry.terraform.io/providers/brad-jones/denobridge/latest)
[![OpenTofu](https://img.shields.io/badge/OpenTofu-FFDA18?style=flat&logo=opentofu&logoColor=black)](https://search.opentofu.org/provider/brad-jones/denobridge/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://opensource.org/licenses/MIT)

---

</div>

## Why CDKTS?

HashiCorp's [terraform-cdk](https://github.com/hashicorp/terraform-cdk) (CDK-TF) has been **deprecated**, leaving a gap for developers who want to define infrastructure using TypeScript instead of HCL. CDKTS fills this gap with a modern, streamlined approach that leverages Deno's capabilities and provides:

- 🎯 **True TypeScript-first experience** - No generated bindings required
- 🚀 **Built for Deno** - Modern runtime, built-in TypeScript, secure by default
- 📦 **Zero Node.js dependencies** - No npm install, no node_modules
- 🔧 **Direct HCL synthesis** - Clean, readable Terraform/OpenTofu configurations
- 🌐 **Native provider support** - Work with any Terraform provider
- 🔥 **Deno Bridge Provider** - Write custom providers in TypeScript, not Go
- 📦 **Standalone compilation** - Bundle stacks into single executables
- 🎨 **Type-safe inputs/outputs** - Catch errors at compile time

## Features

### Core Capabilities

- **Type-Safe Stack Definition**: Define stacks with compile-time type safety for inputs and outputs
- **HCL Synthesis**: Generate clean, readable Terraform/OpenTofu configurations
- **Automation API**: Programmatically init, plan, apply, and destroy infrastructure
- **CLI Tool**: Familiar terraform/opentofu-like CLI experience with TypeScript stacks
- **Multiple Stack Support**: Coordinate multiple stacks with dependencies
- **Binary Management**: Automatically download and cache Terraform/OpenTofu binaries

### Advanced Features

- **Inline Stacks**: Execute stacks directly without separate files
- **Bundled Stacks**: Compile stacks to standalone executables (includes binaries!)
- **Deno Bridge Provider**: Implement provider logic in TypeScript using the [terraform-provider-denobridge](https://github.com/brad-jones/terraform-provider-denobridge)
- **Custom Resources**: Define resources with full CRUD lifecycle in TypeScript
- **Custom Data Sources**: Implement data sources in TypeScript
- **Custom Actions**: Run TypeScript code during terraform lifecycle events
- **Ephemeral Resources**: Support for temporary resources during operations

## Installation

### Using JSR Package

```bash
# Add to your deno.json imports
deno add jsr:@brad-jones/cdkts
```

```typescript
// And import using the import map
import { Stack } from "@brad-jones/cdkts/constructs";
import { Project } from "@brad-jones/cdkts/automate";

// Or import directly without any deno config
import { Stack } from "jsr:@brad-jones/cdkts/constructs";
import { Project } from "jsr:@brad-jones/cdkts/automate";
```

### Using the CLI

The CLI is actually a Go binary with Deno embedded inside it.
To install it, run the following.

```bash
deno run -A jsr:@brad-jones/cdkts/cli-installer

# set a custom version to download instead of the version encoded into the installer
deno run -A jsr:@brad-jones/cdkts/cli-installer --version 1.2.3

# set a custom installation directory
deno run -A jsr:@brad-jones/cdkts/cli-installer --dir ~/.local/bin
```

This will download the compiled binary from Github Releases and place it into
the same directory that `deno install` would have used. eg: $HOME/.deno/bin

_Do not use `deno install`, you will likely encounter issues due to missing import maps, etc._

We use this over the normal `deno install` approach because it allows us to
inject any deno config files of the imported stackfile.

To do what our CLI does, you would need to run a command like this:

```bash
deno run --config /path/to/config/for/stackfile/deno.json jsr:@brad-jones/cdkts/cli apply /path/to/stackfile.ts
```

In contrast `deno install` creates shell scripts that execute commands like:

```bash
deno run --no-config jsr:@brad-jones/cdkts/cli apply /path/to/stackfile.ts
```

And then your import map for `stackfile.ts` won't be found and the whole thing blows up.

The other advantage is that our CLI can be used inside CI pipelines and similar environments,
without requiring you to also install deno _(or terraform / tofu for that matter)_.

Commands like this should work as you would expect: `cdkts apply https://acme.co/mystack.ts`

## Quick Start

### 1. Create Your First Stack

Create `my_stack.ts`:

```typescript
import { Resource, Stack, Terraform } from "@brad-jones/cdkts/constructs";

export default class MyStack extends Stack<typeof MyStack> {
  constructor() {
    super(`${import.meta.url}#${MyStack.name}`);

    new Terraform(this, {
      requiredVersion: ">=1,<2.0",
      requiredProviders: {
        local: {
          source: "hashicorp/local",
          version: "2.6.1",
        },
      },
    });

    new Resource(this, "local_file", "hello", {
      filename: "${path.module}/message.txt",
      content: "Hello World",
    });
  }
}
```

### 2. Apply Your Stack

```bash
cdkts apply ./my_stack.ts
```

That's it! CDKTS will:

1. Synthesize your TypeScript to HCL
2. Download OpenTofu (or Terraform)
3. Initialize the project
4. Apply the configuration

## Core Concepts

### Stack

A `Stack` is the fundamental unit in CDKTS. It represents a complete Terraform/OpenTofu configuration:

```typescript
export default class MyStack extends Stack<typeof MyStack> {
  static override readonly Props = class extends Stack.Props {
    // Define inputs
    filename = new Stack.Input();
    // Define outputs
    contentHash = new Stack.Output();
  };

  constructor() {
    super(`${import.meta.url}#${MyStack.name}`);

    // Add resources, providers, etc.
    const file = new Resource(this, "local_file", "hello", {
      filename: this.inputs.filename,
      content: "Hello World",
    });

    this.outputs = {
      contentHash: file.outputs.content_sha256,
    };
  }
}
```

### Type-Safe Inputs and Outputs

CDKTS provides compile-time type safety for stack inputs and outputs:

```typescript
static override readonly Props = class extends Stack.Props {
  // String input (default type)
  filename = new Stack.Input();

  // Typed input
  port = new Stack.Input<number>({ default: 8080 });

  // Optional input with description
  region = new Stack.Input({
    default: "us-west-2",
    description: "AWS region"
  });

  // Outputs
  instanceId = new Stack.Output<string>({
    description: "The EC2 instance ID",
    sensitive: true
  });
};
```

### Resources

Define any Terraform resource using the generic `Resource` construct:

```typescript
new Resource(this, "aws_instance", "web", {
  ami: "ami-12345678",
  instance_type: "t3.micro",
  tags: {
    Name: "WebServer",
  },
});
```

### Project (Automation API)

The `Project` class provides programmatic control over the Terraform/OpenTofu lifecycle:

```typescript
import { Project } from "@brad-jones/cdkts/automate";
import MyStack from "./my_stack.ts";

const project = new Project({
  stack: new MyStack(),
});

// Initialize
await project.init();

// Plan
const plan = await project.plan();

// Apply
const state = await project.apply(plan);
console.log(state.values?.outputs);

// Destroy
await project.destroy();
```

## Examples

The [`examples/`](examples) directory contains progressively more advanced examples:

1. **[Hello World](examples/01_hello-world)** - Basic stack with a single resource
2. **[Inputs and Outputs](examples/02_inputs-and-outputs)** - Type-safe parameterization
3. **[Deno Bridge Provider](examples/03_deno-bridge-provider)** - Custom providers in TypeScript
4. **[Inline Stack](examples/04_inline-stack)** - Execute without separate stack files
5. **[Bundled Stack](examples/05_bundled-stack)** - Compile to standalone executable
6. **[Multiple Stacks](examples/06_multiple-stacks)** - Coordinate dependent stacks

## CLI Usage

CDKTS provides a CLI that wraps Terraform/OpenTofu with TypeScript stack support:

### Common Commands

```bash
# Initialize a stack
cdkts init ./my_stack.ts

# Plan changes
cdkts plan ./my_stack.ts

# Apply configuration
cdkts apply ./my_stack.ts

# Destroy infrastructure
cdkts destroy ./my_stack.ts

# Validate configuration
cdkts validate ./my_stack.ts

# View outputs
cdkts output ./my_stack.ts
```

### Pass-Through Arguments

All commands support pass-through arguments using `--`:

```bash
# Pass flags to terraform/opentofu
cdkts plan ./my_stack.ts -- -var="instance_type=t3.micro" -out=tfplan
cdkts apply ./my_stack.ts -- -auto-approve -parallelism=10
```

### Environment Variables

Configure CDKTS behavior via environment variables:

```bash
# Use Terraform instead of OpenTofu
export CDKTS_FLAVOR=terraform

# Use a specific binary
export CDKTS_TF_BINARY_PATH=/usr/local/bin/terraform

# Specify version to download
export CDKTS_TF_VERSION=1.11.4

# Set project directory
export CDKTS_PROJECT_DIR=./build/terraform
```

### Escape Hatch

Execute any Terraform/OpenTofu command not explicitly wrapped:

```bash
cdkts show ./my_stack.ts
cdkts state list ./my_stack.ts
cdkts console ./my_stack.ts
```

## Advanced Usage

### Multiple Stacks with Dependencies

Coordinate multiple stacks and pass outputs between them:

```typescript
import { Project } from "@brad-jones/cdkts/automate";
import Stack1 from "./stack_1.ts";
import Stack2 from "./stack_2.ts";

// Apply first stack
const state1 = await new Project({ stack: new Stack1() }).apply();

// Pass outputs to second stack
await new Project({
  stack: new Stack2({
    dbEndpoint: state1.values!.outputs!.dbEndpoint.value,
  }),
}).apply();
```

### Bundled Stacks (Standalone Executables)

Compile your stack into a single executable that includes everything:

```typescript
import { StackBundler } from "@brad-jones/cdkts/automate";

await new StackBundler({
  stackFilePath: "./my_stack.ts",
  outputPath: "./dist/my_stack",
  targets: ["linux-x86_64", "darwin-aarch64", "windows-x86_64"],
  tfVersion: "1.11.4",
  flavor: "tofu",
}).bundle();
```

This creates executables that:

- Include the compiled TypeScript stack
- Embed the Terraform/OpenTofu binary
- Embed the .terraform.lock.hcl lock file
- As well as the providers that match the lock file
- Requiring no external dependencies
- Can be shipped as single files

_Also available via the CLI @ `cdkts bundle`_

### Deno Bridge Provider

<https://github.com/brad-jones/terraform-provider-denobridge>

Write custom Terraform providers in TypeScript:

```typescript
import { DenoResource } from "@brad-jones/cdkts/constructs";
import { ZodResourceProvider } from "@brad-jones/terraform-provider-denobridge";
import { z } from "@zod/zod";

// >>> Define your type safe schemas (Zod is optional but recommend)
// -----------------------------------------------------------------
const Props = z.object({
  path: z.string(),
  content: z.string(),
});

const State = z.object({
  mtime: z.number(),
});

// >>> Define the Construct class that you use in your Stack
// -----------------------------------------------------------------
export class FileResource extends DenoResource<typeof FileResource> {
  static override readonly Props = class extends DenoResource.Props {
    override props = new DenoResource.ZodInput(Props);
    override state = new DenoResource.ZodOutput(State);
  };

  constructor(parent: Construct, label: string, props: z.infer<typeof Props>) {
    super(parent, label, {
      props,
      path: import.meta.url, // <<<--- This is the key, it tells the denobridge provider to run this same script.
      permissions: { all: true },
    });
  }
}

// >>> Define the Provider for the Construct (runs via JSON-RPC)
// -----------------------------------------------------------------
if (import.meta.main) {
  new ZodResourceProvider(Props, State, {
    async create({ path, content }) {
      await Deno.writeTextFile(path, content);
      return {
        id: path,
        state: { mtime: (await Deno.stat(path)).mtime!.getTime() },
      };
    },
    async read({ id }) {
      const stat = await Deno.stat(id);
      return { state: { mtime: stat.mtime!.getTime() } };
    },
    async update({ id, props: { content } }) {
      await Deno.writeTextFile(id, content);
      return { state: { mtime: (await Deno.stat(id)).mtime!.getTime() } };
    },
    async delete({ id }) {
      await Deno.remove(id);
    },
  });
}
```

See the [Deno Bridge example](examples/03_deno-bridge-provider) for complete examples of resources, data sources, actions, and ephemeral resources.

## API Overview

### Constructs

- **`Construct`**: Base class for all constructs
  - **`Stack`**: Base class for defining stacks. Is the _"root"_ Construct.
  - **`Block`**: Extends the Construct to express any valid HCL block
    - **`Terraform`**: Extends Block, to provide the Terraform settings block
      - **`Backend`**: Extends Block, to provide a generic `backend` block
        - **`LocalBackend`**: Extends Backend, to provide a type safe local backend block
        - **`RemoteBackend`**: Extends Backend, to provide a type safe remote backend block
        - TODO: remaining backends but you can still express any backend with the base Backend block.
    - **`Provider`**: Extends Block, to provide a generic `provider` block
      - **`DenoBridgeProvider`**: Extends Provider, to provide a type safe `denobridge` provider block.
    - **`Action`** - Extends Block, to provide a generic `action` block
      - **`DenoAction`**: Extends Action, to provide a generic `denobridge_action` block.
    - **`Resource`** - Extends Block, to provide a generic `resource` block
      - **`DenoResource`**: Extends Resource, to provide a generic `denobridge_resource` block.
    - **`EphemeralResource`** - Extends Block, to provide a generic `ephemeral` block
      - **`DenoEphemeralResource`**: Extends Resource, to provide a generic `denobridge_resource` block.
    - **`DataSource`** - Extends Block, to provide a generic `datasource` block
      - **`DenoDataSource`**: Extends DataSource, to provide a generic `denobridge_datasource` block.
    - **`Variable`** - Input variable
    - **`Output`** - Output value
    - **`Module`** - TODO
    - **`Locals`** - TODO
    - **`Check`** - TODO
    - **`Import`** - TODO
    - **`Moved`** - TODO
    - **`Removed`** - TODO

_Remember any block that is currently not implemented can still be expressed directly with the Block class!_

### Automation

- **`Project`** - Lifecycle management (init, plan, apply, destroy)
- **`StackBundler`** - Compile stacks to executables
