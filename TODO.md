# Project TODO List

- Update the stack bundler to make use of `deno compile --self-extracting`
  see: <https://deno.com/blog/v2.7#deno-compile---self-extracting>

- Solve the caveat around Remote Modules and the fact that they are not supported by the Stack Bundler.
  Can we somehow use <https://github.com/denoland/eszip>?
  Or we could compile each deno bridge module separately and hope it compresses well enough.

  - Consider adding support for creating docker image bundles.
  - Should be able to just run `deno cache` when building the image.

- Add a backend that uses the HTTP Backend to store state in a K8s cluster. eg: In a ConfigMap / Secret.

- Add a backend that automatically creates a new S3 bucket for each stack and
  stores state there to avoid the classic chicken & egg problem of needing to
  create the bucket before being able to deploy the stack.

- Could probably create a generic HTTP backend class that uses Hono to create a simple REST API for storing state. Then we could have multiple implementations of this backend, eg: one that stores state in a K8s cluster, one that stores state in S3, etc.

- Build the generator tooling to allow construct packages to be generated from existing Terraform providers.
  - Then build pipelines / repos to automatically publish all the main providers. eg: AWS, Azure, GCP, etc.

- Consider adding native support for Helm charts. Essentially a `Chart` would
  be at the same level as the `Stack` but instead of synthesizing HCL it would
  synthesize a `values.yaml` and a `Chart.yaml` and the necessary directory structure.

  - Support vanilla Helm but also <https://github.com/werf/nelm>.
  - In a similar way we support both OpenTofu & Terraform.
  - This would provide an alternative to the CDK8s project which is also on its last legs.
