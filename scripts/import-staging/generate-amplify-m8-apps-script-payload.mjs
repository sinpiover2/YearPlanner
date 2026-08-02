#!/usr/bin/env node
// Deterministically embeds the canonical schema-2 Math 8 artifact for Apps Script.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const ARTIFACT_PATH = path.join(ROOT, "data/import-staging/amplify-m8.json");
const OUTPUT_PATH = path.join(ROOT, "apps-script-planning/AmplifyM8ImportData.js");
const sha256 = (text) => createHash("sha256").update(text).digest("hex");

export function buildGeneratedFile() {
  if (!existsSync(ARTIFACT_PATH)) throw new Error(`Canonical artifact not found: ${ARTIFACT_PATH}`);
  const artifactText = readFileSync(ARTIFACT_PATH, "utf8");
  const artifact = JSON.parse(artifactText);
  const artifactSha256 = sha256(artifactText);
  const unitCount = artifact.units.length;
  const itemCount = artifact.units.reduce((sum, unit) => sum + unit.items.length, 0);
  const fixedItemCount = artifact.units.flatMap((unit) => unit.items).filter((item) => item.order !== null).length;
  const flexibleItemCount = itemCount - fixedItemCount;
  const confirmationPhrase = `IMPORT_AMPLIFY_M8_${artifactSha256.slice(0, 12)}_${unitCount}_${itemCount}`;
  const metadata = {
    schemaVersion: artifact.schemaVersion,
    profile: "amplify-m8",
    artifactPath: "data/import-staging/amplify-m8.json",
    artifactSha256,
    extraction: artifact.generator.extraction,
    extractionSha256: artifact.generator.extractionSha256,
    unitCount, itemCount, fixedItemCount, flexibleItemCount, confirmationPhrase,
  };
  return [
    "// GENERATED FILE — DO NOT HAND-EDIT.",
    "// Generated deterministically by scripts/import-staging/generate-amplify-m8-apps-script-payload.mjs",
    `const AMPLIFY_M8_IMPORT_PAYLOAD = Object.freeze(${artifactText.trimEnd()});`,
    "",
    `const AMPLIFY_M8_IMPORT_METADATA = Object.freeze(${JSON.stringify(metadata, null, 2)});`,
    "",
    "if (typeof module !== \"undefined\" && module.exports) {",
    "  module.exports = { AMPLIFY_M8_IMPORT_PAYLOAD, AMPLIFY_M8_IMPORT_METADATA };",
    "}",
    "",
  ].join("\n");
}

export function runCli(args = process.argv.slice(2)) {
  const generated = buildGeneratedFile();
  if (args.includes("--check")) {
    if (!existsSync(OUTPUT_PATH) || readFileSync(OUTPUT_PATH, "utf8") !== generated) {
      console.error("FAIL: AmplifyM8ImportData.js differs from deterministic generation.");
      process.exitCode = 1;
      return;
    }
    console.log("OK: AmplifyM8ImportData.js matches deterministic generation.");
  } else {
    writeFileSync(OUTPUT_PATH, generated, "utf8");
    console.log(`Wrote ${OUTPUT_PATH} (${generated.length} bytes).`);
  }
}

const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectExecution) runCli();
