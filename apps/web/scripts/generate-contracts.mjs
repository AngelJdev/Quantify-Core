// Deliberately handles the schema vocabulary used by the canonical contract.
// Fail on unsupported structures instead of silently weakening a DTO to any.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
const contract = JSON.parse(
  readFileSync(
    new URL("../../../packages/contracts/openapi.json", import.meta.url),
    "utf8",
  ),
);
const schemas = contract.components.schemas;
function type(schema) {
  if (schema.$ref) {
    const name = schema.$ref.replace("#/components/schemas/", "");
    if (!schemas[name]) throw new Error("Unsupported ref: " + schema.$ref);
    return name;
  }
  if (schema.enum) return schema.enum.map((v) => JSON.stringify(v)).join(" | ");
  if (Array.isArray(schema.type))
    return schema.type.map((t) => type({ ...schema, type: t })).join(" | ");
  if (schema.type === "null") return "null";
  if (schema.type === "string") return "string";
  if (schema.type === "integer" || schema.type === "number") return "number";
  if (schema.type === "boolean") return "boolean";
  if (schema.type === "array") return `Array<${type(schema.items)}>`;
  if (schema.type === "object") {
    const properties = Object.entries(schema.properties || {}).map(
      ([name, value]) =>
        `${JSON.stringify(name)}${schema.required?.includes(name) ? "" : "?"}: ${type(value)}`,
    );
    if (
      schema.additionalProperties &&
      typeof schema.additionalProperties === "object"
    )
      properties.push(`[key: string]: ${type(schema.additionalProperties)}`);
    return `{ ${properties.join("; ")} }`;
  }
  throw new Error("Unsupported schema: " + JSON.stringify(schema));
}
const output =
  "// Generated from packages/contracts/openapi.json. Do not edit.\n" +
  Object.entries(schemas)
    .map(([name, value]) => `export type ${name} = ${type(value)}\n`)
    .join("");
const target = new URL("../src/shared/api/schema.ts", import.meta.url);
if (process.argv.includes("--check")) {
  if (readFileSync(target, "utf8").replace(/\r\n/g, "\n") !== output)
    throw new Error(
      "Contract types are stale. Run npm run contracts:generate.",
    );
  console.log("Canonical contract types match.");
} else {
  mkdirSync(fileURLToPath(new URL("../src/shared/api/", import.meta.url)), {
    recursive: true,
  });
  writeFileSync(target, output);
}
