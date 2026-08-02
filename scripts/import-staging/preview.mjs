#!/usr/bin/env node
// Read-only preview CLI for the Amplify IM1 staging artifact. Reads the
// artifact, validates it, builds an import plan against a destination
// snapshot (a fixture by default — this sprint does not read production
// Sheets at all), and prints a human-readable summary plus a structured
// JSON report. PERFORMS ZERO WRITES ANYWHERE — no spreadsheet, no Apps
// Script call, no mutation of any file this script reads.
//
// Usage:
//   node scripts/import-staging/preview.mjs [options]
//
// Options:
//   --artifact <path>      Path to the staging artifact JSON.
//                          Default: data/import-staging/amplify-im1.json
//   --destination <path>   Path to a destination fixture (units/lessons
//                          snapshot). Default:
//                          scripts/import-staging/fixtures/empty-destination.json
//   --out <path>           Also write the full JSON report to this path.
//   --quiet                Suppress the human-readable summary (JSON only).

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { validateArtifact } from "./validate-artifact.mjs";
import { buildImportPlan } from "./build-import-plan.mjs";
import { buildAmplifyM8ImportPlan } from "./build-amplify-m8-import-plan.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");

function parseArgs(argv) {
  const args = { quiet: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--artifact") args.artifact = argv[++i];
    else if (arg === "--destination") args.destination = argv[++i];
    else if (arg === "--out") args.out = argv[++i];
    else if (arg === "--quiet") args.quiet = true;
  }
  return args;
}

function readJson(relativeOrAbsolutePath) {
  const resolved = path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : path.join(REPO_ROOT, relativeOrAbsolutePath);
  return JSON.parse(readFileSync(resolved, "utf8"));
}

function countItems(units) {
  return units.reduce((total, unit) => total + unit.items.length, 0);
}

function summarizeNullEvidence(artifact) {
  if (artifact.validationProfile !== "amplify-m8") return null;
  const summary = {};
  for (const item of artifact.units.flatMap((unit) => unit.items)) {
    for (const field of ["type", "title", "subtitle", "summary", "isOptional"]) {
      if (item[field] !== null) continue;
      const status = item[`${field}Status`];
      const key = `${field}:${status}`;
      summary[key] = (summary[key] ?? 0) + 1;
    }
  }
  return summary;
}

export function buildHumanSummary(report) {
  const lines = [];
  const isM8 = report.artifact.validationProfile === "amplify-m8";
  lines.push(`${isM8 ? "AMPLIFY MATH 8" : "AMPLIFY IM1"} STAGED IMPORT — PREVIEW`);
  lines.push("This preview performed zero writes. No spreadsheet, file, or production data was modified.");
  lines.push("");

  lines.push(`Artifact path: ${report.artifactPath}`);
  lines.push(`Artifact schema version: ${report.artifact.schemaVersion}`);
  lines.push(`Validation profile: ${report.artifact.validationProfile ?? "amplify-im1"}`);
  lines.push(`Source document: ${report.artifact.generator.sourceDocument ?? report.artifact.generator.extraction}`);
  lines.push(`Extraction SHA-256: ${report.artifact.generator.sourceDocumentSha256 ?? report.artifact.generator.extractionSha256}`);
  lines.push(`Units in artifact: ${report.artifact.units.length}`);
  lines.push(`Instructional Items in artifact: ${countItems(report.artifact.units)}`);
  if (report.nullEvidenceSummary) lines.push(`Null publisher fields (field:evidence-status=count; never coerced): ${Object.entries(report.nullEvidenceSummary).map(([key, value]) => `${key}=${value}`).join(", ")}`);
  lines.push("");

  lines.push(`Validation: ${report.validation.valid ? "PASSED" : "FAILED"}`);
  if (report.validation.errors.length > 0) {
    lines.push(`  Errors (${report.validation.errors.length}):`);
    report.validation.errors.forEach((e) => lines.push(`    - ${e}`));
  }
  if (report.validation.warnings.length > 0) {
    lines.push(`  Warnings (${report.validation.warnings.length}):`);
    report.validation.warnings.forEach((w) => lines.push(`    - ${w}`));
  }
  lines.push("");

  lines.push(`Destination: ${report.destinationPath}`);
  if (report.destinationIdentity) lines.push(`Destination identity: ${report.destinationIdentity}`);
  lines.push(`Import plan blocked overall: ${report.plan.blocked}`);
  if (report.plan.blockers.length > 0) {
    lines.push(`  Blockers (${report.plan.blockers.length}):`);
    report.plan.blockers.forEach((b) => lines.push(`    - ${b}`));
  }
  lines.push("");

  lines.push("Unit classifications: " + JSON.stringify(report.plan.summary.units));
  lines.push("Item classifications: " + JSON.stringify(report.plan.summary.items));
  if (report.plan.protectedLegacy) lines.push(`Protected legacy rows: ${report.plan.protectedLegacy.total} (${report.plan.protectedLegacy.units} units, ${report.plan.protectedLegacy.items} items)`);
  lines.push(`Writes performed: ${report.plan.writesPerformed ?? 0}`);
  lines.push("");

  lines.push("Sample rows (first 3 units):");
  report.plan.units.slice(0, 3).forEach((unit) => {
    lines.push(`  ${unit.unitId} "${unit.title}" — ${unit.classification}` + (unit.reasons?.length ? ` [${unit.reasons.join(", ")}]` : ""));
    unit.items.slice(0, 3).forEach((item) => {
      lines.push(`    - ${item.itemId} "${item.title}" — ${item.classification}` + (item.reasons?.length ? ` [${item.reasons.join(", ")}]` : ""));
    });
    if (unit.items.length > 3) lines.push(`    ... (${unit.items.length - 3} more items in this unit)`);
  });
  if (report.plan.units.length > 3) lines.push(`  ... (${report.plan.units.length - 3} more units)`);
  lines.push("");

  lines.push("No data was written. This report is a preview only.");
  return lines.join("\n");
}

export function runPreview({ artifactPath, destinationPath }) {
  const artifact = readJson(artifactPath);
  const destination = readJson(destinationPath);

  const validation = validateArtifact(artifact);
  const plan = artifact.validationProfile === "amplify-m8"
    ? buildAmplifyM8ImportPlan(artifact, destination)
    : buildImportPlan(artifact, destination);

  return {
    generatedAt: new Date().toISOString(),
    artifactPath,
    destinationPath,
    destinationIdentity: destination.identity ?? destination.description ?? null,
    nullEvidenceSummary: summarizeNullEvidence(artifact),
    artifact,
    validation,
    plan,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const artifactPath = args.artifact ?? "data/import-staging/amplify-im1.json";
  const destinationPath = args.destination ?? "scripts/import-staging/fixtures/empty-destination.json";

  const report = runPreview({ artifactPath, destinationPath });

  if (!args.quiet) {
    console.log(buildHumanSummary(report));
  }

  if (args.out) {
    const outPath = path.isAbsolute(args.out) ? args.out : path.join(REPO_ROOT, args.out);
    writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n", "utf8");
    console.log(`\nFull JSON report written to ${args.out} (report generation only — no production data touched).`);
  } else if (args.quiet) {
    console.log(JSON.stringify(report, null, 2));
  }
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")) {
  main();
}
