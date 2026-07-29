#!/usr/bin/env node
// Deterministically builds data/import-staging/amplify-im1.json from the
// hand-transcribed source in amplify-im1-source.mjs. No network access, no
// PDF re-parsing — the extraction document (already verified against the
// Amplify PDFs) is the approved source, and amplify-im1-source.mjs is a
// direct, one-time transcription of it (see that file's header).
//
// Deterministic and idempotent: re-running this script against an unchanged
// source produces a byte-identical file. No wall-clock timestamp is written
// into the artifact's content; the only provenance signal is a SHA-256 of
// the extraction document's current bytes, which only changes when that
// document changes.
//
// Usage: node scripts/import-staging/generate-artifact.mjs [--check]
//   --check   Do not write the file; exit non-zero if regenerating it would
//             produce different bytes than what's currently on disk (used by
//             the determinism check in the final validation pass).

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { COURSE, UNITS } from "./amplify-im1-source.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SOURCE_DOCUMENT_PATH = path.join(
  REPO_ROOT,
  "Curriculm/M1/IM1_Curriculum_Extraction.md",
);
const OUTPUT_PATH = path.join(
  REPO_ROOT,
  "data/import-staging/amplify-im1.json",
);

export const SCHEMA_VERSION = "1.0.0";

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function padOrder(order) {
  return String(order).padStart(2, "0");
}

function buildUnitId(unitNumber) {
  return `AMP-IM1-U${unitNumber}`;
}

function buildFixedItemId(unitNumber, order) {
  return `${buildUnitId(unitNumber)}-I${padOrder(order)}`;
}

function buildFlexibleItemId(unitNumber, index) {
  return `${buildUnitId(unitNumber)}-F${index}`;
}

function buildFixedItem(unitNumber, item) {
  return {
    itemId: buildFixedItemId(unitNumber, item.order),
    order: item.order,
    placementRule: null,
    type: item.type,
    title: item.title,
    subtitle: item.subtitle ?? null,
    isOptional: item.isOptional,
    optionalityBasis: item.optionalityBasis ?? null,
    summary: item.summary,
    provenanceNote: item.provenanceNote ?? null,
  };
}

function buildFlexibleItem(unitNumber, item, index) {
  return {
    itemId: buildFlexibleItemId(unitNumber, index),
    order: null,
    placementRule: item.placementRule,
    type: item.type,
    title: item.title,
    subtitle: item.subtitle ?? null,
    isOptional: item.isOptional,
    optionalityBasis: item.optionalityBasis ?? null,
    summary: item.summary,
    provenanceNote: item.provenanceNote ?? null,
  };
}

function buildUnit(unit) {
  const fixedItems = unit.items.map((item) => buildFixedItem(unit.unitNumber, item));
  const flexibleItems = unit.flexibleItems.map((item, index) =>
    buildFlexibleItem(unit.unitNumber, item, index + 1),
  );

  return {
    unitId: buildUnitId(unit.unitNumber),
    unitNumber: unit.unitNumber,
    title: unit.title,
    purpose: unit.purpose,
    requiredDays: unit.requiredDays,
    optionalDays: unit.optionalDays,
    // Flexible items are listed after fixed items but are NOT assigned a
    // fabricated position — order stays null, placementRule carries the
    // publisher's own placement text. See CURRICULUM_INFORMATION_MODEL.md §6.
    items: [...fixedItems, ...flexibleItems],
  };
}

export function buildArtifact() {
  if (!existsSync(SOURCE_DOCUMENT_PATH)) {
    throw new Error(`Source document not found at ${SOURCE_DOCUMENT_PATH}`);
  }
  const sourceDocumentBytes = readFileSync(SOURCE_DOCUMENT_PATH);

  return {
    schemaVersion: SCHEMA_VERSION,
    generator: {
      script: "scripts/import-staging/generate-artifact.mjs",
      sourceTranscription: "scripts/import-staging/amplify-im1-source.mjs",
      sourceDocument: "Curriculm/M1/IM1_Curriculum_Extraction.md",
      sourceDocumentSha256: sha256(sourceDocumentBytes),
    },
    course: COURSE,
    units: UNITS.map(buildUnit),
  };
}

function serialize(artifact) {
  return JSON.stringify(artifact, null, 2) + "\n";
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const artifact = buildArtifact();
  const serialized = serialize(artifact);

  if (checkOnly) {
    if (!existsSync(OUTPUT_PATH)) {
      console.error(`FAIL: ${OUTPUT_PATH} does not exist yet.`);
      process.exit(1);
    }
    const onDisk = readFileSync(OUTPUT_PATH, "utf8");
    if (onDisk !== serialized) {
      console.error(
        "FAIL: regenerating the artifact produced different bytes than what's on disk. " +
          "Run without --check to regenerate, then review the diff.",
      );
      process.exit(1);
    }
    console.log("OK: artifact on disk matches a fresh deterministic regeneration (no diff).");
    return;
  }

  writeFileSync(OUTPUT_PATH, serialized, "utf8");
  console.log(`Wrote ${OUTPUT_PATH} (${serialized.length} bytes).`);
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")) {
  main();
}
