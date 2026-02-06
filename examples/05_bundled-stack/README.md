# Bundled Stack Example

This example shows off the `StackBundler` functionality that enables one to create
completely self-contained single file binaries that can be dropped into air-gapped
environments (ie: no or limited internet access) & still deploy your infra.

## 🎉 New: DenoBridge Provider Support

As of the latest release, the bundler now **fully supports stacks that use the denobridge provider**!

This means you can bundle stacks that include custom TypeScript-based provider logic written with the denobridge provider. The bundler will:

- Automatically detect if your stack uses the `DenoBridgeProvider`
- Download and embed the appropriate Deno runtime binary for your target platform(s)
- Copy all denobridge script files (actions, data sources, resources, ephemeral resources) into the bundle
- Reconfigure paths so everything works in the compiled standalone binary

**The result?** A truly self-contained executable that includes:

- The OpenTofu/Terraform binary
- All required providers (including the denobridge provider)
- The Deno runtime for executing your TypeScript provider logic
- Your denobridge script implementations
- Your infrastructure stack configuration

This creates a completely unified TypeScript infrastructure-as-code solution that can run anywhere, even in air-gapped environments with zero external dependencies.

> _Note: Yes, it might seem unusual to bundle Deno inside a compiled Deno binary, but since the denobridge provider needs to `deno run` your custom scripts at runtime, we need the actual Deno binary included._

### ⚠️ Important Caveat: Remote Modules and Air-Gapped Deployments

When using denobridge providers from **remote sources** (such as JSR modules like `https://jsr.io/@brad-jones/cdkts-provider-local/0.0.1/lib/local_file_resource.ts`), there is an important limitation to understand:

- **Construct Portion:** The TypeScript code that defines your infrastructure constructs _will_ be compiled into the bundle by `deno compile`.
- **Provider Portion:** The actual provider implementation scripts _will NOT_ be compiled or embedded in the bundle.

This happens because the denobridge provider uses `import.meta.url` for the `path` property. When you import a remote module, the synthesized HCL will instruct denobridge to execute the HTTP URL of that module directly (e.g., `https://jsr.io/@brad-jones/...`).

**What this means:**

- ✅ The bundle will work if you have network access to download the remote module at deployment time
- ❌ The bundle is **not truly air-gapped** when using remote denobridge providers

**For truly air-gapped deployments with denobridge providers:**

You must use **local provider scripts only**. Local TypeScript files are included as standard files within the `deno compile` binary, which we can extract at runtime and provide to denobridge for execution. This ensures all provider logic is embedded in the bundle and requires no external network access.

## Deno Compilation

This technology is built on top of `deno compile`.

see: <https://docs.deno.com/runtime/reference/cli/compile/>

_Gotcha: Avoid `import.meta.url|dirname|filename` due to <https://github.com/denoland/deno/issues/28918>_

### The Easy Way

#### Via CLI

```txt
$ cdkts bundle ./my_stack.ts
generating .terraform.lock.hcl for C:\Users\BradJones\Projects\Personal\cdkts\examples\04_bundled\my_stack.ts
- Fetching hashicorp/local 2.6.1 for windows_amd64...
- Retrieved hashicorp/local 2.6.1 for windows_amd64 (signed, key ID 0C0AF313E5FD9F80)
- Obtained hashicorp/local checksums for windows_amd64; This was a new provider and the checksums for this platform are now tracked in the lock file

Success! OpenTofu has updated the lock file.

Review the changes in .terraform.lock.hcl and then commit to your
version control system to retain the new checksums.

downloading providers:x86_64-pc-windows-msvc for C:\Users\BradJones\Projects\Personal\cdkts\examples\04_bundled\my_stack.ts
- Mirroring hashicorp/local...
  - Selected v2.6.1 to match dependency lock file
  - Downloading package for windows_amd64...
  - Package authenticated: signed


Check examples/04_bundled/my_stack.ts
Check file:///C:/Users/BRADJO~1/AppData/Local/Temp/cdkts-project-ca7cf5c11e3d10fdb5dbd66b951c7fd60c2adfd06190d04c3610cc687bab6b47/x86_64-pc-windows-msvc/tf-mirror/registry.opentofu.org/hashicorp/local/2.6.1.json
Check file:///C:/Users/BRADJO~1/AppData/Local/Temp/cdkts-project-ca7cf5c11e3d10fdb5dbd66b951c7fd60c2adfd06190d04c3610cc687bab6b47/x86_64-pc-windows-msvc/tf-mirror/registry.opentofu.org/hashicorp/local/index.json
Compile examples/04_bundled/my_stack.ts to examples/04_bundled/my_stack_x86_64-pc-windows-msvc.exe

Embedded Files

my_stack_x86_64-pc-windows-msvc.exe
├─┬ .deno_compile_node_modules (1.56MB - 1.56MB unique)
│ └─┬ localhost (1.56MB - 1.56MB unique)
│   ├── @cdktf/hcl-tools/* (1.46MB - 1.46MB unique)
│   ├── fs-extra/11.3.3/* (58.07KB - 57.99KB unique)
│   ├── graceful-fs/4.2.11/* (32.29KB - 32.25KB unique)
│   ├── jsonfile/6.2.0/* (11.17KB)
│   └── universalify/2.0.1/* (5.1KB)
├─┬ BradJones (153.36KB)
│ └─┬ Projects (153.36KB)
│   └─┬ Personal (153.36KB)
│     └─┬ cdkts (153.36KB)
│       ├── examples/04_bundled/my_stack.ts (3.67KB)
│       └─┬ lib (149.69KB)
│         ├─┬ automate (82.62KB)
│         │ ├─┬ downloader (36.82KB)
│         │ │ ├── opentofu.ts (19.17KB)
│         │ │ └── terraform.ts (17.64KB)
│         │ ├── mod.ts (80B)
│         │ ├── project.ts (31.07KB)
│         │ ├── stack_bundler/* (11.64KB)
│         │ └── utils.ts (3.02KB)
│         └─┬ constructs (67.06KB)
│           ├─┬ blocks (53.28KB)
│           │ ├─┬ actions (13.66KB)
│           │ │ ├── action.ts (4.89KB)
│           │ │ └── deno_action.ts (8.77KB)
│           │ ├── backends/* (6.93KB)
│           │ ├── block.ts (6.42KB)
│           │ ├── datasources/datasource.ts (3.18KB)
│           │ ├── output.ts (2.69KB)
│           │ ├── providers/* (2.54KB)
│           │ ├─┬ resources (9.74KB)
│           │ │ ├── deno_resource.ts (1.48KB)
│           │ │ ├── file_example_resource.ts (1.51KB)
│           │ │ └── resource.ts (6.74KB)
│           │ ├── terraform.ts (5.04KB)
│           │ └── variable.ts (3.08KB)
│           ├── construct.ts (1.44KB)
│           ├── input_output/* (3.08KB)
│           ├── mod.ts (735B)
│           ├── stack.ts (5.15KB)
│           └── utils.ts (3.39KB)
└─┬ BRADJO~1 (116.68MB)
  └─┬ AppData (116.68MB)
    └─┬ Local (116.68MB)
      └─┬ Temp (116.68MB)
        ├── cdkts/opentofu/windows/amd64/1.11.4/tofu.exe (110.55MB)
        └─┬ cdkts-project-ca7cf5c11e3d10fdb5dbd66b951c7fd60c2adfd06190d04c3610cc687bab6b47 (6.13MB)
          ├── .terraform.lock.hcl (951B)
          └── x86_64-pc-windows-msvc/* (6.13MB)

Files: 118.41MB
Metadata: 3.07KB
Remote modules: 1.86MB

downloading providers:x86_64-apple-darwin for C:\Users\BradJones\Projects\Personal\cdkts\examples\04_bundled\my_stack.ts
etc...
```

> **TIP:** Use `bundle --all` to cross compile your stack for all supported targets.

_Refer to `cdkts bundle --help` for more details._

#### Programmatically

```ts
import { StackBundler } from "@brad-jones/cdkts/automate";

const bundler = new StackBundler();

// Bundle for the current platform (ie: not cross compiled)
await bundler.bundle(`./my_stack.ts`);

// Otherwise provide a list of targets to cross compile
await bundler.bundle(`./my_stack.ts`, [
  "x86_64-pc-windows-msvc",
  "x86_64-apple-darwin",
  "x86_64-unknown-linux-gnu",
]);
```

### The Hard Way

```sh
$ deno compile --target {{TARGET}} \
  --include ./tofu \ # path to a tofu or terraform bin
  --include ./tf-mirror \ # path to a provider mirror dir
  --include ./.terraform.lock.hcl \ # path to a lock file
  -A ./my_stack.ts
```

#### Supported Targets

- Where `{{TARGET}}` is one of:
  - `x86_64-pc-windows-msvc`
  - `x86_64-apple-darwin`
  - `aarch64-apple-darwin`
  - `x86_64-unknown-linux-gnu`
  - `aarch64-unknown-linux-gnu`

see: <https://docs.deno.com/runtime/reference/cli/compile/#supported-targets>

#### Special Included Path Names

Deno doesn't make it very easy for library authors to locate included files.
To our knowledge there is no option to set the path of the included files inside
the virtual in memory file system that Deno creates at runtime.

The path that files end up with inside that virtual in memory file system is based
on the context at the point of compilation, which can obviously be different system to system.

So we locate the additional includes based on their names not the precise
location with-in the virtual in memory file system.

There are 3 special paths we look for:

- **tfBinaryPath:** To locate an embedded terraform binary, we search for a file
  named either `tofu` or `terraform` _(with .exe suffix on Windows)_ based on the
  configured `flavor` of the project.

- **tfMirrorPath:** To locate an embedded provider mirror we search for a directory named `tf-mirror`.

- **tfLockPath:** To locate an embedded lock file we search for the normal name `.terraform.lock.hcl`.

##### An Example

This is to say using something like `--target x86_64-unknown-linux-gnu --include ./tofu_1.11.3_linux_amd64`
wouldn't work as the `@brad-jones/cdkts/automate` library would not be able to locate the included binary.

Where as something like `--target x86_64-unknown-linux-gnu --include ./1.11.3/linux/amd64/tofu` does work.

#### Generating the provider mirror

To get a truly self contained binary you not only need to include the terraform
binary but you also need to include all the providers that your stack requires.

To generate the provider mirror for a given target, run a command like:

```txt
tofu providers mirror -platform={{TARGET}} ./tf-mirror
```

Where `{{TARGET}}` in this case aligns with `GOOS` & `GOARCH` not the Deno Rust based target values.

_NB: This assumes you have already synthesized your stack to HCL somewhere._

#### Generating the provider mirror lock file

Run the following command to generate the `.terraform.lock.hcl` without actually initializing the stack.

```txt
tofu providers lock -platform={{TARGET1}} -platform={{TARGET2}} -platform={{TARGET3}} -platform=etc...
```

You would do this once but include every platform that you intend on building a self-contained binary for.
