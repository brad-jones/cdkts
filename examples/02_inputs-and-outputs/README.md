# Inputs and Outputs Example

This stack demonstrates how to make stacks configurable through inputs and how to expose values through outputs.

The stack creates a file with a configurable filename and content, then outputs the SHA256 hash of that content.

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
var.content
  Enter a value: foo

var.filename
  Enter a value: ./bar.txt


OpenTofu used the selected providers to generate the following execution plan. Resource actions are indicated with the following symbols:
  + create

OpenTofu will perform the following actions:

  # local_file.hello will be created
  + resource "local_file" "hello" {
      + content              = "foo"
      + content_base64sha256 = (known after apply)
      + content_base64sha512 = (known after apply)
      + content_md5          = (known after apply)
      + content_sha1         = (known after apply)
      + content_sha256       = (known after apply)
      + content_sha512       = (known after apply)
      + directory_permission = "0777"
      + file_permission      = "0777"
      + filename             = "./bar.txt"
      + id                   = (known after apply)
    }

Plan: 1 to add, 0 to change, 0 to destroy.

Changes to Outputs:
  + contentHash = (known after apply)

Do you want to perform these actions?
  OpenTofu will perform the actions described above.
  Only 'yes' will be accepted to approve.

  Enter a value: yes

local_file.hello: Creating...
local_file.hello: Creation complete after 0s [id=0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33]

Apply complete! Resources: 1 added, 0 changed, 0 destroyed.

Outputs:

contentHash = "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae"
```

## Concept: Stack Inputs

Stack inputs allow you to parameterize your infrastructure. They're defined using the `Stack.Input` class within a static `Props` class:

```ts
static override readonly Props = class extends Stack.Props {
  filename = new Stack.Input();
  content = new Stack.Input();
};
```

These inputs are then accessible via `this.inputs` in your constructor:

```ts
const myFile = new Resource(this, "local_file", "hello", {
  filename: this.inputs.filename,
  content: this.inputs.content,
});
```

Under the hood, CDKTS generates Terraform variable blocks for each input:

```hcl
variable "filename" {}
variable "content" {}
```

You can pass metadata to configure the generated variable block:

```ts
filename = new Stack.Input({
  description: "The name of the file to create",
  default: "message.txt",
});
```

This generates:

```hcl
variable "filename" {
  description = "The name of the file to create"
  default     = "message.txt"
}
```

_see: <https://developer.hashicorp.com/terraform/language/block/variable>\
also: <https://opentofu.org/docs/language/values/variables>_

## Concept: Stack Outputs

Stack outputs allow you to expose values from your infrastructure. They're defined in the Props class using `Stack.Output`:

```ts
static override readonly Props = class extends Stack.Props {
  contentHash = new Stack.Output();
};
```

You set output values by assigning to `this.outputs` in your constructor:

```ts
this.outputs = {
  contentHash: myFile.outputs.content_sha256,
};
```

CDKTS generates Terraform output blocks for each defined output:

```hcl
output "contentHash" {
  value = local_file.hello.content_sha256
}
```

Like inputs, you can pass metadata to configure the output block:

```ts
contentHash = new Stack.Output({
  description: "SHA256 hash of the file content",
  sensitive: true,
});
```

This generates:

```hcl
output "contentHash" {
  value       = local_file.hello.content_sha256
  description = "SHA256 hash of the file content"
  sensitive   = true
}
```

_see: <https://developer.hashicorp.com/terraform/language/block/output>\
also: <https://opentofu.org/docs/language/values/outputs>_

## Concept: Resource Outputs

Resources expose their attributes through the `outputs` property.
In this example, we access the `content_sha256` attribute from the `local_file` resource:

```ts
const myFile = new Resource(this, "local_file", "hello", {
  filename: this.inputs.filename,
  content: this.inputs.content,
});

this.outputs = {
  contentHash: myFile.outputs.content_sha256,
};
```

The `outputs` object is a proxy that allows you to reference any attribute exported by the resource.
These references are resolved at Terraform runtime, not during TypeScript execution.
