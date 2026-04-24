import { assertEquals } from "@std/assert";
import { terraformTypeToTs } from "./type_mapper.ts";
import { generateBlockCode, generateModFile, generateProviderCode, generateRootModFile } from "./code_gen.ts";
import { generateDenoJson } from "./deno_json_gen.ts";
import { parseProviderSource } from "./generate.ts";
import type { SchemaRepresentation } from "./schema_types.ts";

// ---------------------------------------------------------------------------
// Type mapper tests
// ---------------------------------------------------------------------------

Deno.test("type_mapper - maps simple string types", () => {
  assertEquals(terraformTypeToTs("string"), "string");
  assertEquals(terraformTypeToTs("number"), "number");
  assertEquals(terraformTypeToTs("bool"), "boolean");
  assertEquals(terraformTypeToTs("dynamic"), "unknown");
  assertEquals(terraformTypeToTs("something_else"), "unknown");
});

Deno.test("type_mapper - maps list and set types", () => {
  assertEquals(terraformTypeToTs(["list", "string"]), "string[]");
  assertEquals(terraformTypeToTs(["set", "number"]), "number[]");
  assertEquals(terraformTypeToTs(["list", ["list", "string"]]), "string[][]");
});

Deno.test("type_mapper - maps map types", () => {
  assertEquals(terraformTypeToTs(["map", "string"]), "Record<string, string>");
  assertEquals(
    terraformTypeToTs(["map", ["list", "number"]]),
    "Record<string, number[]>",
  );
});

Deno.test("type_mapper - maps object types", () => {
  assertEquals(
    terraformTypeToTs(["object", { name: "string", count: "number" }]),
    "{ name: string; count: number }",
  );
  assertEquals(
    terraformTypeToTs(["object", {}]),
    "Record<string, unknown>",
  );
});

Deno.test("type_mapper - maps tuple types", () => {
  assertEquals(
    terraformTypeToTs(["tuple", ["string", "number"]]),
    "[string, number]",
  );
});

Deno.test("type_mapper - wraps complex inner types in arrays", () => {
  assertEquals(
    terraformTypeToTs(["list", ["object", { a: "string" }]]),
    "({ a: string })[]",
  );
});

// ---------------------------------------------------------------------------
// Provider source parser tests
// ---------------------------------------------------------------------------

Deno.test("parseProviderSource - single part defaults to hashicorp", () => {
  const parsed = parseProviderSource("aws");
  assertEquals(parsed.namespace, "hashicorp");
  assertEquals(parsed.type, "aws");
  assertEquals(parsed.source, "hashicorp/aws");
  assertEquals(parsed.localName, "aws");
});

Deno.test("parseProviderSource - two parts", () => {
  const parsed = parseProviderSource("kreuzwerker/docker");
  assertEquals(parsed.namespace, "kreuzwerker");
  assertEquals(parsed.type, "docker");
  assertEquals(parsed.source, "kreuzwerker/docker");
  assertEquals(parsed.localName, "docker");
});

Deno.test("parseProviderSource - three parts with hostname", () => {
  const parsed = parseProviderSource("registry.terraform.io/hashicorp/aws");
  assertEquals(parsed.hostname, "registry.terraform.io");
  assertEquals(parsed.namespace, "hashicorp");
  assertEquals(parsed.type, "aws");
  assertEquals(parsed.source, "registry.terraform.io/hashicorp/aws");
});

// ---------------------------------------------------------------------------
// Code gen tests
// ---------------------------------------------------------------------------

Deno.test("code_gen - generates resource with required, optional, and computed attrs", () => {
  const schema: SchemaRepresentation = {
    version: 0,
    block: {
      attributes: {
        name: { type: "string", required: true },
        description: { type: "string", optional: true },
        arn: { type: "string", computed: true },
        tags: { type: ["map", "string"], optional: true, computed: true },
      },
    },
  };

  const code = generateBlockCode("resource", "aws_instance", schema);

  // Check class declaration
  assertEquals(code.includes("class AwsInstance extends Resource<typeof AwsInstance>"), true);

  // Check required input
  assertEquals(code.includes("name = new Resource.Input<string>()"), true);

  // Check optional input
  assertEquals(code.includes("description = new Resource.Input<string | undefined>()"), true);

  // Check computed output
  assertEquals(code.includes("arn = new Resource.Output<string>()"), true);

  // Check optional+computed as input
  assertEquals(
    code.includes("tags = new Resource.Input<Record<string, string> | undefined>()"),
    true,
  );

  // Check constructor
  assertEquals(code.includes('super(parent, "aws_instance", label, inputs)'), true);
});

Deno.test("code_gen - generates resource with nested blocks", () => {
  const schema: SchemaRepresentation = {
    version: 0,
    block: {
      attributes: {
        name: { type: "string", required: true },
      },
      block_types: {
        ebs_block_device: {
          nesting_mode: "list",
          block: {
            attributes: {
              device_name: { type: "string", required: true },
              volume_size: { type: "number", optional: true },
            },
          },
        },
      },
    },
  };

  const code = generateBlockCode("resource", "aws_instance", schema);

  // Check interface is generated
  assertEquals(code.includes("export interface AwsInstanceEbsBlockDevice"), true);
  assertEquals(code.includes("deviceName: string;"), true);
  assertEquals(code.includes("volumeSize?: number;"), true);

  // Check nested block input
  assertEquals(
    code.includes("ebsBlockDevice = new Resource.Input<AwsInstanceEbsBlockDevice[] | undefined>"),
    true,
  );

  // Check constructor creates child blocks
  assertEquals(code.includes("for (const ebsBlockDeviceItem of inputs.ebsBlockDevice)"), true);
  assertEquals(code.includes('new Block(this, "ebs_block_device"'), true);

  // Check mapInputsForHcl deletes nested block key
  assertEquals(code.includes('delete inputs["ebs_block_device"]'), true);
});

Deno.test("code_gen - generates nested blocks within nested blocks", () => {
  const schema: SchemaRepresentation = {
    version: 0,
    block: {
      attributes: {},
      block_types: {
        website: {
          nesting_mode: "single",
          block: {
            attributes: {
              index_document: { type: "string", optional: true },
            },
            block_types: {
              routing_rules: {
                nesting_mode: "list",
                block: {
                  attributes: {
                    condition: { type: "string", optional: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  const code = generateBlockCode("resource", "test_resource", schema);

  // Check both interfaces exist
  assertEquals(code.includes("export interface TestResourceWebsite"), true);
  assertEquals(code.includes("export interface TestResourceWebsiteRoutingRules"), true);

  // Check the nested interface has proper typing
  assertEquals(code.includes("routingRules?: TestResourceWebsiteRoutingRules[];"), true);

  // Check recursive block creation
  assertEquals(code.includes('websiteBlock = new Block(this, "website"'), true);
  assertEquals(code.includes('new Block(websiteBlock, "routing_rules"'), true);
});

Deno.test("code_gen - generates provider code", () => {
  const schema: SchemaRepresentation = {
    version: 0,
    block: {
      attributes: {
        region: { type: "string", optional: true },
        access_key: { type: "string", optional: true, sensitive: true },
      },
    },
  };

  const code = generateProviderCode("aws", schema);

  assertEquals(code.includes("class Aws extends Provider<typeof Aws>"), true);
  assertEquals(code.includes('super(parent, "aws", inputs)'), true);
  assertEquals(code.includes('accessKey = new Provider.Input<string | undefined>({ hclName: "access_key" })'), true);
});

Deno.test("code_gen - generates data source code", () => {
  const schema: SchemaRepresentation = {
    version: 0,
    block: {
      attributes: {
        most_recent: { type: "bool", optional: true },
        image_id: { type: "string", computed: true },
      },
    },
  };

  const code = generateBlockCode("datasource", "aws_ami", schema);

  assertEquals(code.includes("class AwsAmi extends DataSource<typeof AwsAmi>"), true);
  assertEquals(code.includes("imageId = new DataSource.Output<string>()"), true);
  assertEquals(
    code.includes('mostRecent = new DataSource.Input<boolean | undefined>({ hclName: "most_recent" })'),
    true,
  );
});

Deno.test("code_gen - generates ephemeral resource code", () => {
  const schema: SchemaRepresentation = {
    version: 0,
    block: {
      attributes: {
        duration: { type: "string", required: true },
        token: { type: "string", computed: true },
      },
    },
  };

  const code = generateBlockCode("ephemeral", "aws_temp_token", schema);

  assertEquals(
    code.includes("class AwsTempToken extends EphemeralResource<typeof AwsTempToken>"),
    true,
  );
  assertEquals(code.includes("duration = new EphemeralResource.Input<string>()"), true);
  assertEquals(code.includes("token = new EphemeralResource.Output<string>()"), true);
});

Deno.test("code_gen - skips computed id attribute", () => {
  const schema: SchemaRepresentation = {
    version: 0,
    block: {
      attributes: {
        id: { type: "string", computed: true, optional: true },
        name: { type: "string", required: true },
      },
    },
  };

  const code = generateBlockCode("resource", "test_resource", schema);
  // id should not appear as a prop
  assertEquals(code.includes("id = new"), false);
  assertEquals(code.includes("name = new Resource.Input<string>()"), true);
});

Deno.test("code_gen - inputs optional when no required attrs", () => {
  const schema: SchemaRepresentation = {
    version: 0,
    block: {
      attributes: {
        name: { type: "string", optional: true },
      },
    },
  };

  const code = generateBlockCode("resource", "test_resource", schema);
  assertEquals(code.includes("inputs?: TestResource"), true);
});

Deno.test("code_gen - inputs required when has required attrs", () => {
  const schema: SchemaRepresentation = {
    version: 0,
    block: {
      attributes: {
        name: { type: "string", required: true },
      },
    },
  };

  const code = generateBlockCode("resource", "test_resource", schema);
  // Should NOT have `?` before the colon
  assertEquals(code.includes("inputs: TestResource"), true);
  assertEquals(code.includes("inputs?: TestResource"), false);
});

// ---------------------------------------------------------------------------
// Mod file tests
// ---------------------------------------------------------------------------

Deno.test("code_gen - generates mod file", () => {
  const mod = generateModFile([
    { name: "AwsInstance", path: "aws_instance.ts" },
    { name: "AwsVpc", path: "aws_vpc.ts" },
  ]);

  assertEquals(mod.includes('export { AwsInstance } from "./aws_instance.ts"'), true);
  assertEquals(mod.includes('export { AwsVpc } from "./aws_vpc.ts"'), true);
});

Deno.test("code_gen - generates root mod file", () => {
  const mod = generateRootModFile({
    hasProvider: true,
    hasResources: true,
    hasDataSources: true,
    hasEphemeral: false,
  });

  assertEquals(mod.includes('export * from "./provider.ts"'), true);
  assertEquals(mod.includes('export * from "./resources/mod.ts"'), true);
  assertEquals(mod.includes('export * from "./datasources/mod.ts"'), true);
  assertEquals(mod.includes("ephemeral"), false);
});

// ---------------------------------------------------------------------------
// deno.json gen tests
// ---------------------------------------------------------------------------

Deno.test("deno_json_gen - generates valid deno.json", () => {
  const json = generateDenoJson({
    jsrScope: "@cdkts-providers",
    jsrName: "aws",
    jsrVersion: "5.82.0",
    hasResources: true,
    hasDataSources: true,
    hasEphemeral: false,
  });

  const parsed = JSON.parse(json);
  assertEquals(parsed.name, "@cdkts-providers/aws");
  assertEquals(parsed.version, "5.82.0");
  assertEquals(parsed.exports["."], "./mod.ts");
  assertEquals(parsed.exports["./resources"], "./resources/mod.ts");
  assertEquals(parsed.exports["./datasources"], "./datasources/mod.ts");
  assertEquals(parsed.exports["./ephemeral"], undefined);
  assertEquals(
    parsed.imports["@brad-jones/cdkts/constructs"],
    "jsr:@brad-jones/cdkts/constructs",
  );
});
