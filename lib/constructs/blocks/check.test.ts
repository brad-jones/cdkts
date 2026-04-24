import { outdent } from "@cspotcode/outdent";
import { expect } from "@std/expect";
import { Assertion, Check, DataSource, Provider, Resource, Stack } from "../mod.ts";

Deno.test("Check - basic assertions only", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Resource(this, "aws_s3_bucket", "main", {
          bucket: "my-bucket",
        });

        new Check(this, "bucket_name", (c) => {
          new Assertion(c, "not_empty", {
            condition: 'aws_s3_bucket.main.bucket != ""',
            errorMessage: "S3 bucket name must not be empty",
          });
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    resource "aws_s3_bucket" "main" {
      bucket = "my-bucket"
    }

    check "bucket_name" {
      assert {
        condition     = "aws_s3_bucket.main.bucket != \\"\\""
        error_message = "S3 bucket name must not be empty"
      }
    }
  `);
});

Deno.test("Check - with scoped data source", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Check(this, "health_check", (c) => {
          // deno-lint-ignore no-explicit-any
          new DataSource(c, "http", "api", { url: "https://api.example.com/health" } as any);

          new Assertion(c, "status_ok", {
            condition: "data.http.api.status_code == 200",
            errorMessage: "API health check failed",
          });
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    check "health_check" {
      data "http" "api" {
        url = "https://api.example.com/health"
      }

      assert {
        condition     = "data.http.api.status_code == 200"
        error_message = "API health check failed"
      }
    }
  `);
});

Deno.test("Check - multiple assertions", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        new Check(this, "service_validation", (c) => {
          // deno-lint-ignore no-explicit-any
          new DataSource(c, "aws_lb", "app", { name: "application-lb" } as any);

          new Assertion(c, "deletion_protection", {
            condition: "data.aws_lb.app.enable_deletion_protection",
            errorMessage: "Load balancer must have deletion protection enabled",
          });

          new Assertion(c, "security_groups", {
            condition: "length(data.aws_lb.app.security_groups) > 0",
            errorMessage: "Load balancer must have at least one security group",
          });
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    check "service_validation" {
      data "aws_lb" "app" {
        name = "application-lb"
      }

      assert {
        condition     = "data.aws_lb.app.enable_deletion_protection"
        error_message = "Load balancer must have deletion protection enabled"
      }

      assert {
        condition     = "length(data.aws_lb.app.security_groups) > 0"
        error_message = "Load balancer must have at least one security group"
      }
    }
  `);
});

Deno.test("Check - data source with depends_on", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        const db = new Resource(this, "aws_db_instance", "main", {
          identifier: "app-db",
          engine: "postgres",
        });

        new Check(this, "database_connection", (c) => {
          new DataSource(c, "postgresql_database", "app_db", {
            // deno-lint-ignore no-explicit-any
            name: "application" as any,
            dependsOn: [db],
          });

          new Assertion(c, "allow_connections", {
            condition: "data.postgresql_database.app_db.allow_connections",
            errorMessage: "Database is not accepting connections",
          });
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    resource "aws_db_instance" "main" {
      identifier = "app-db"
      engine     = "postgres"
    }

    check "database_connection" {
      data "postgresql_database" "app_db" {
        name       = "application"
        depends_on = [resource.aws_db_instance.main]
      }

      assert {
        condition     = "data.postgresql_database.app_db.allow_connections"
        error_message = "Database is not accepting connections"
      }
    }
  `);
});

Deno.test("Check - data source with provider", async () => {
  expect(
    await new class MyStack extends Stack<typeof MyStack> {
      constructor() {
        super(`${import.meta.url}#${MyStack.name}`);

        const awsEast = new Provider(this, "aws", {
          alias: "east",
          region: "us-east-1",
        });

        new Check(this, "ami_check", (c) => {
          new DataSource(c, "aws_ami", "web", {
            // deno-lint-ignore no-explicit-any
            ...{ owners: ["self"], most_recent: true } as any,
            provider: awsEast,
          });

          new Assertion(c, "architecture", {
            condition: 'data.aws_ami.web.architecture == "x86_64"',
            errorMessage: "AMI must be for x86_64 architecture",
          });
        });
      }
    }().toHcl(),
  ).toBe(outdent`
    provider "aws" {
      alias  = "east"
      region = "us-east-1"
    }

    check "ami_check" {
      data "aws_ami" "web" {
        owners      = ["self"]
        most_recent = true
        provider    = aws.east
      }

      assert {
        condition     = "data.aws_ami.web.architecture == \\"x86_64\\""
        error_message = "AMI must be for x86_64 architecture"
      }
    }
  `);
});
