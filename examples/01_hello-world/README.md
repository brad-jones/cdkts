# Hello World Example

All this stack does is write a file named `message.txt` with the content `Hello World`.

```txt
$ cdkts apply ./my_stack.ts
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

## Concept: Stack File

The first thing to note is that `./my_stack.ts` has a single default export that exports the stack class.

When CDKTS refers to a _"Stack File"_, this is what we mean.

Most of the CDKTS automation uses this pattern to locate `Stack` classes from a given _"Stack File"_ path.

## Concept: Stack ID

Every stack must have a unique ID, while not strictly required, the following pattern is recommended:

```ts
super(`${import.meta.url}#${MyStack.name}`);
```

CDKTS uses the stack ID in a number of situations to create deterministic temporary locations.
Most notably for the main project directory. If the ID is not static & unique you may experience
poor performance due to the invalidation of the caching mechanics, forcing the re-downloading of
terraform providers amongst other potential side effects.

## Concept: Terraform Block

The `Terraform` construct defines the terraform configuration block,
which specifies settings for Terraform itself _(or OpenTofu as the case may be)_.

In our example, we're configuring the required Terraform version and the providers we need:

```ts
new Terraform(this, {
  requiredVersion: ">=1,<2.0",
  requiredProviders: {
    local: {
      source: "hashicorp/local",
      version: "2.6.1",
    },
  },
});
```

This generates the following HCL:

```hcl
terraform {
  required_version = ">=1,<2.0"

  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "2.6.1"
    }
  }
}
```

The `Terraform` block is typically one of the first things you'll add to any stack,
as it defines which provider plugins Terraform needs to download.

_see: <https://developer.hashicorp.com/terraform/language/block/terraform>_

## Concept: Resource Block

The `Resource` construct is the base class for creating any Terraform resource.

It takes three main arguments:

- the type name,
- a unique label,
- and the resource configuration.

In our example:

```ts
new Resource(this, "local_file", "hello", {
  filename: "${path.module}/message.txt",
  content: "Hello World",
});
```

This generates the following HCL:

```hcl
resource "local_file" "hello" {
  filename = "${path.module}/message.txt"
  content  = "Hello World"
}
```

The base `Resource` class serves as a universal escape hatch for any Terraform resource,
even those that CDKTS hasn't specifically modeled yet. While later examples will show
type-safe, provider-specific resource classes, you can always fall back to using `Resource`
directly when needed.

_see: <https://developer.hashicorp.com/terraform/language/block/resource>\
also: <https://opentofu.org/docs/language/resources/syntax>_
