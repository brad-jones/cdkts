# Multiple Stacks Example

This example demonstrates how to work with multiple stacks in a single deployment using custom TypeScript scripts and the Project API directly.

The example creates two stacks where the second stack depends on outputs from the first:

1. **Stack 1** - Creates a file and outputs its SHA256 hash
2. **Stack 2** - Takes the hash as input and writes it to a separate file

```txt
$ deno run -A ./project.ts
Initializing the backend...

Initializing provider plugins...
- Finding hashicorp/local versions matching "2.6.1"...
- Installing hashicorp/local v2.6.1...
- Installed hashicorp/local v2.6.1 (signed, key ID 0C0AF313E5FD9F80)

Providers are signed by their developers.
If you'd like to know more about provider signing, you can read about it here:
https://opentofu.org/docs/cli/plugins/signing/

OpenTofu has created a lock file .terraform.lock.hcl to record the provider
selections it made above. Include this file in your version control repository
so that OpenTofu can guarantee to make the same selections by default when
you run "tofu init" in the future.

OpenTofu has been successfully initialized!

You may now begin working with OpenTofu. Try running "tofu plan" to see
any changes that are required for your infrastructure. All OpenTofu commands
should now work.

If you ever set or change modules or backend configuration for OpenTofu,
rerun this command to reinitialize your working directory. If you forget, other
commands will detect it and remind you to do so if necessary.

OpenTofu used the selected providers to generate the following execution plan. Resource actions are indicated with the following symbols:
  + create

OpenTofu will perform the following actions:

  # local_file.hello will be created
  + resource "local_file" "hello" {
      + content              = "Hello World"
      + content_base64sha256 = (known after apply)
      + content_base64sha512 = (known after apply)
      + content_md5          = (known after apply)
      + content_sha1         = (known after apply)
      + content_sha256       = (known after apply)
      + content_sha512       = (known after apply)
      + directory_permission = "0777"
      + file_permission      = "0777"
      + filename             = "./message.txt"
      + id                   = (known after apply)
    }

Plan: 1 to add, 0 to change, 0 to destroy.

Changes to Outputs:
  + specialId = (known after apply)

Do you want to perform these actions?
  OpenTofu will perform the actions described above.
  Only 'yes' will be accepted to approve.

  Enter a value: yes

local_file.hello: Creating...
local_file.hello: Creation complete after 0s [id=0a4d55a8d778e5022fab701977c5d840bbc486d0]

Apply complete! Resources: 1 added, 0 changed, 0 destroyed.

Outputs:

specialId = "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
Initializing the backend...

Initializing provider plugins...
- Finding hashicorp/local versions matching "2.6.1"...
- Installing hashicorp/local v2.6.1...
- Installed hashicorp/local v2.6.1 (signed, key ID 0C0AF313E5FD9F80)

Providers are signed by their developers.
If you'd like to know more about provider signing, you can read about it here:
https://opentofu.org/docs/cli/plugins/signing/

OpenTofu has created a lock file .terraform.lock.hcl to record the provider
selections it made above. Include this file in your version control repository
so that OpenTofu can guarantee to make the same selections by default when
you run "tofu init" in the future.

OpenTofu has been successfully initialized!

You may now begin working with OpenTofu. Try running "tofu plan" to see
any changes that are required for your infrastructure. All OpenTofu commands
should now work.

If you ever set or change modules or backend configuration for OpenTofu,
rerun this command to reinitialize your working directory. If you forget, other
commands will detect it and remind you to do so if necessary.

OpenTofu used the selected providers to generate the following execution plan. Resource actions are indicated with the following symbols:
  + create

OpenTofu will perform the following actions:

  # local_file.hello_hash will be created
  + resource "local_file" "hello_hash" {
      + content              = "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
      + content_base64sha256 = (known after apply)
      + content_base64sha512 = (known after apply)
      + content_md5          = (known after apply)
      + content_sha1         = (known after apply)
      + content_sha256       = (known after apply)
      + content_sha512       = (known after apply)
      + directory_permission = "0777"
      + file_permission      = "0777"
      + filename             = "./message.txt.sha256"
      + id                   = (known after apply)
    }

Plan: 1 to add, 0 to change, 0 to destroy.

Do you want to perform these actions?
  OpenTofu will perform the actions described above.
  Only 'yes' will be accepted to approve.

  Enter a value: yes

local_file.hello_hash: Creating...
local_file.hello_hash: Creation complete after 0s [id=706f09f831b03579db3b6e8e10aaafb1cd61eebc]

Apply complete! Resources: 1 added, 0 changed, 0 destroyed.
```

## ⚠️ Important: Advanced Use Case Only

**Multiple stacks are currently an advanced use case with limited tooling support:**

- ❌ The `cdkts` CLI has **no concept of multiple stacks**
  - Commands like `cdkts apply`, `cdkts plan`, etc. only work with a single stack file
  - You cannot use the CLI to orchestrate multiple stacks
- ❌ The `StackBundler` does **not support multiple stacks**
  - `cdkts bundle` only works with a single stack file
  - You cannot create a bundled executable that manages multiple stacks
- ✅ You **must** use the `Project` API directly in custom TypeScript scripts
- ✅ You **must** execute with `deno run`

### Future Possibilities

This limitation may change in future versions. Possible improvements could include:

- Allowing stack files to export multiple stacks instead of just a single default export
- Adding CLI commands to orchestrate multiple stacks from a project file
- Supporting multiple stacks in the bundler

But for now, if you need multiple stacks, you're working at a lower level and need to write your own orchestration scripts using the Project API.

## Concept: Stack Orchestration

The real power of custom project scripts is the ability to orchestrate complex multi-stack deployments:

```ts
// Get outputs from first stack
const stack1State = await new Project({ stack: stack1 }).apply();

// Pass outputs as inputs to dependent stack
await new Project({
  stack: new Stack2({
    specialId: stack1State.values!.outputs!.specialId.value,
  }),
}).apply();
```

This pattern enables:

- **Sequential deployments** - Deploy stacks in a specific order
- **Output chaining** - Pass data from one stack to another
- **Conditional logic** - Deploy stacks based on runtime conditions
- **Error handling** - Implement custom error handling and rollback strategies
- **Complex workflows** - Combine planning, applying, and validation in custom ways

## Why Use Multiple Stacks?

Multiple stacks are useful when you need to:

1. **Separate concerns** - Different parts of your infrastructure managed independently
2. **Share data** - One stack creates resources that another stack consumes
3. **Control blast radius** - Changes in one stack don't risk unintended changes in another
4. **Manage dependencies** - Explicitly order deployments when resources depend on each other
5. **Different lifecycles** - Core infrastructure deployed separately from applications

## When to Use Single vs Multiple Stacks

**Use a single stack when:**

- Your infrastructure is simple and cohesive
- All resources can be managed together
- You want to use the convenience of the `cdkts` CLI
- You want to create bundled executables

**Use multiple stacks when:**

- You need to separate concerns across different infrastructure layers
- You want to control deployment order explicitly
- Different parts of your infrastructure have different lifecycles
- You need to share outputs between independently managed resources
- You're comfortable writing custom orchestration scripts
