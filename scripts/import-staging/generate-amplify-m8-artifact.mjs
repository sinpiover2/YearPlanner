#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { COURSE, UNITS } from "./amplify-m8-source.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const EXTRACTION = "Curriculm/M8/M8_Curriculum_Extraction.md";
const OUTPUT = "data/import-staging/amplify-m8.json";
export const SCHEMA_VERSION = "2.0.0";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const unitId = (number) => `AMP-M8-U${number}`;

function buildItem(unitNumber, item, flexibleIndex) {
  const fixed = item.order !== null;
  return {
    itemId: fixed
      ? `${unitId(unitNumber)}-I${String(item.order).padStart(2, "0")}`
      : `${unitId(unitNumber)}-F${flexibleIndex}`,
    ...item,
  };
}

export function buildArtifact() {
  const extractionPath = path.join(REPO_ROOT, EXTRACTION);
  const sourceDocumentSha256 = sha256(readFileSync(extractionPath));
  return {
    schemaVersion: SCHEMA_VERSION,
    validationProfile: "amplify-m8",
    generator: {
      script: "scripts/import-staging/generate-amplify-m8-artifact.mjs",
      sourceTranscription: "scripts/import-staging/amplify-m8-source.mjs",
      extraction: EXTRACTION,
      extractionSha256: sourceDocumentSha256,
      suppliedUnitsFullyExtracted: true,
      authoritativeCourseCompleteness: "unconfirmed",
    },
    course: COURSE,
    units: UNITS.map((unit) => {
      let flexibleIndex = 0;
      return {
        unitId: unitId(unit.unitNumber),
        unitNumber: unit.unitNumber,
        title: unit.title,
        purpose: unit.purpose,
        requiredDays: unit.requiredDays,
        optionalDays: unit.optionalDays,
        items: unit.items.map((item) => buildItem(
          unit.unitNumber,
          item,
          item.order === null ? ++flexibleIndex : flexibleIndex,
        )),
      };
    }),
  };
}

export const serializeArtifact = (artifact) => `${JSON.stringify(artifact, null, 2)}\n`;

function main() {
  const outputPath = path.join(REPO_ROOT, OUTPUT);
  const serialized = serializeArtifact(buildArtifact());
  if (process.argv.includes("--check")) {
    if (!existsSync(outputPath) || readFileSync(outputPath, "utf8") !== serialized) {
      console.error("FAIL: Math 8 artifact is missing or differs from deterministic regeneration.");
      process.exitCode = 1;
      return;
    }
    console.log("OK: Math 8 artifact matches deterministic regeneration (no drift).");
    return;
  }
  writeFileSync(outputPath, serialized, "utf8");
  console.log(`Wrote ${outputPath} (${Buffer.byteLength(serialized)} bytes).`);
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")) main();
