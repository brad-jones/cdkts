import type { Construct } from "../../construct.ts";
import { Backend } from "./backend.ts";

/**
 * PostgreSQL backend configuration for storing Terraform/OpenTofu state in a Postgres database.
 *
 * The pg backend stores state in a Postgres database version 10 or newer. This backend
 * supports state locking using Postgres advisory locks. The database must already exist
 * before initializing the backend with `terraform init`.
 *
 * The backend creates a `states` table in the automatically-managed Postgres schema
 * configured by `schemaName`. The table is keyed by workspace name (defaulting to `default`).
 * Locking uses Postgres advisory locks which automatically unlock when the session is
 * aborted or the connection fails — `force-unlock` is not supported.
 *
 * @see https://developer.hashicorp.com/terraform/language/backend/pg
 *
 * @example
 * ```typescript
 * new PgBackend(terraform, {
 *   connStr: "postgres://user:pass@db.example.com/terraform_backend",
 * });
 *
 * // With custom schema name
 * new PgBackend(terraform, {
 *   connStr: "postgres://db.example.com/terraform_backend",
 *   schemaName: "my_terraform_state",
 * });
 *
 * // Skip automatic schema/table/index creation
 * new PgBackend(terraform, {
 *   connStr: "postgres://db.example.com/terraform_backend",
 *   skipSchemaCreation: true,
 *   skipTableCreation: true,
 *   skipIndexCreation: true,
 * });
 * ```
 */
export class PgBackend extends Backend<typeof PgBackend> {
  static override readonly Props = class extends Backend.Props {
    /**
     * Postgres connection string; a `postgres://` URL.
     *
     * Can also be set via the `PG_CONN_STR` environment variable or standard
     * `libpq` environment variables.
     */
    connStr = new Backend.Input<string | undefined>({ hclName: "conn_str" });

    /**
     * (Optional) Name of the automatically-managed Postgres schema.
     *
     * Defaults to `terraform_remote_state`. Can also be set using the
     * `PG_SCHEMA_NAME` environment variable.
     */
    schemaName = new Backend.Input<string | undefined>({ hclName: "schema_name" });

    /**
     * (Optional) If set to `true`, the Postgres schema must already exist.
     *
     * Can also be set using the `PG_SKIP_SCHEMA_CREATION` environment variable.
     * Useful when the schema has already been created by a database administrator.
     */
    skipSchemaCreation = new Backend.Input<boolean | undefined>({ hclName: "skip_schema_creation" });

    /**
     * (Optional) If set to `true`, the Postgres table must already exist.
     *
     * Can also be set using the `PG_SKIP_TABLE_CREATION` environment variable.
     * Useful when the table has already been created by a database administrator.
     */
    skipTableCreation = new Backend.Input<boolean | undefined>({ hclName: "skip_table_creation" });

    /**
     * (Optional) If set to `true`, the Postgres index must already exist.
     *
     * Can also be set using the `PG_SKIP_INDEX_CREATION` environment variable.
     * Useful when the index has already been created by a database administrator.
     */
    skipIndexCreation = new Backend.Input<boolean | undefined>({ hclName: "skip_index_creation" });
  };

  /**
   * Creates a new PostgreSQL backend configuration block.
   *
   * @param parent - The parent construct (typically a Terraform block)
   * @param inputs - Optional configuration inputs for the PostgreSQL backend
   */
  constructor(parent: Construct, inputs?: PgBackend["inputs"]) {
    super(parent, "pg", inputs);
  }
}
