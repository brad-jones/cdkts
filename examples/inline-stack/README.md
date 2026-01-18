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

## Compiling

Of course one can use `deno compile` to create a binary that doesn't even need Deno to run.

```txt
$ deno compile -A ./my_stack.ts
Check my_stack.ts
Compile my_stack.ts to my_stack
...
```

see: <https://docs.deno.com/runtime/reference/cli/compile/>

_NB: Avoid `import.meta.url|dirname|filename` due to <https://github.com/denoland/deno/issues/28918>_

### Truly Self Contained

Keep in mind that cdkts requires either `opentofu` or `terraform` to actually
deploy your stacks, by default the `@brad-jones/cdkts/automate` library downloads
the latest version, instead of this functionality you can embed the tooling into
your compiled binary.

Compile with: `deno compile --include "$(which tofu)" -A ./my_stack.ts`

#### Cross Compilation

Cross compilation can be achieved by including a binary where:

- `{{FLAVOR}}` is `tofu` or `terraform` depending on what engine you are using.
- `{{TARGET}}` is one of:
  - `x86_64-pc-windows-msvc`
  - `x86_64-apple-darwin`
  - `aarch64-apple-darwin`
  - `x86_64-unknown-linux-gnu`
  - `aarch64-unknown-linux-gnu`

```txt
deno compile --target {{TARGET}} --include ./{{FLAVOR}}_{{TARGET}} -A ./my_stack.ts
```

see: <https://docs.deno.com/runtime/reference/cli/compile/#cross-compilation>

TODO: Add a command to the cdkts cli to automate this cross compilation process. Something like `cdkts compile ./my_stack.ts`
TODO: What about embedding the providers as well? Would need to run `{{FLAVOR}} init` for each compilation target before actually compiling.
TODO: Then the Project init method would need have logic to extract the embedded .terraform dir to the projectDir
