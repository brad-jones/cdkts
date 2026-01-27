# Inline Stack Example

This example shows how to use the `@brad-jones/cdkts/constructs` &
`@brad-jones/cdkts/automate` together to create a self applying
infrastructure stack.

Just execute the script: `deno run -A ./my_stack.ts`.

```txt
$ deno run -A ./my_stack.ts
Downloading OpenTofu 1.11.3 from https://github.com/opentofu/opentofu/releases/download/v1.11.3/tofu_1.11.3_windows_amd64.zip

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

Do you want to perform these actions?
  OpenTofu will perform the actions described above.
  Only 'yes' will be accepted to approve.

  Enter a value: yes

local_file.hello: Creating...
local_file.hello: Creation complete after 0s [id=0a4d55a8d778e5022fab701977c5d840bbc486d0]

Apply complete! Resources: 1 added, 0 changed, 0 destroyed.
```

_NB: To destroy run `CDKTS_DESTROY=1 deno run -A ./my_stack.ts`_

## Concept: Project

The `Project` class from `@brad-jones/cdkts/automate` is a wrapper around the
Terraform or OpenTofu binary. Its primary purpose is to take a `Stack` instance
and execute various Terraform commands against it:

```ts
const project = new Project({
  stack: new MyStack(),
});

await project.init(); // terraform init
await project.plan(); // terraform plan
await project.apply(); // terraform apply
await project.destroy(); // terraform destroy
```

In this example, we're using an inline stack with immediate execution:

```ts
await new Project({
  projectDir: `${import.meta.dirname}/out`,
  stack: new (class MyStack extends Stack<typeof MyStack> {
    // ... stack definition ...
  })(),
}).apply();
```

This creates a `Project`, passes it an anonymous `Stack` class instance, and immediately calls `.apply()` to provision the infrastructure.

### Project Directory

To operate, the `Project` class needs a directory where it can synthesize your
TypeScript `Stack` into HCL code and then execute Terraform or OpenTofu commands
against it.

By default, this project directory is automatically created in your system's
temporary directory with a deterministic name based on your stack's ID:

```txt
{TEMP}/cdkts-project-{sha256-hash-of-stack-id}/
```

For example, if your stack ID is `file:///path/to/my_stack.ts#MyStack`, the project directory might be:

```txt
/tmp/cdkts-project-a1b2c3d4e5f6...7890/
```

This directory contains:

- `main.tf` - Your synthesized HCL code
- `.terraform/` - Downloaded provider plugins
- `.terraform.lock.hcl` - Provider dependency lock file
- `.tfplan` - Binary plan files (during planning)
- `terraform.tfstate` - State file (if using local backend)

#### Why Deterministic Paths?

Using a hash-based directory name provides several benefits:

- **Caching**: Provider plugins are reused across runs
- **Performance**: Avoids re-downloading providers unnecessarily
- **Predictability**: Same stack always uses the same directory

#### Custom Project Directories

For advanced use cases, you can specify a custom project directory:

```ts
const project = new Project({
  stack: new MyStack(),
  projectDir: "./my-custom-project",
});
```

This is useful when you want to:

- Inspect the generated HCL code
- Debug infrastructure issues
- Use version control for the generated files
- Share the project directory with team members
- Integrate with existing Terraform workflows

Under normal operation, the project directory is an implementation detail you
don't need to worry about. The `Project` class automatically handles creation,
synthesis, and execution. However, having the ability to control this location
gives you flexibility when you need it.
