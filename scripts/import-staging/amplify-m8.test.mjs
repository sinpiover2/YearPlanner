import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildArtifact, serializeArtifact } from "./generate-amplify-m8-artifact.mjs";
import { M8_EXPECTED_UNIT_COUNTS, M8_TYPES, validateArtifact } from "./validate-artifact.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const clone = (value) => structuredClone(value);
const unit = (artifact, number) => artifact.units.find((entry) => entry.unitNumber === number);

test("two in-memory Math 8 builds are byte-identical", () => {
  assert.equal(serializeArtifact(buildArtifact()), serializeArtifact(buildArtifact()));
});

test("artifact has 8 units, 163 items, and approved per-unit fixed/flexible counts", () => {
  const artifact = buildArtifact();
  assert.equal(artifact.units.length, 8);
  assert.equal(artifact.units.flatMap((entry) => entry.items).length, 163);
  let fixedTotal = 0;
  let flexibleTotal = 0;
  for (const entry of artifact.units) {
    const fixed = entry.items.filter((item) => item.order !== null).length;
    const flexible = entry.items.length - fixed;
    assert.deepEqual({ fixed, flexible }, M8_EXPECTED_UNIT_COUNTS[entry.unitNumber]);
    fixedTotal += fixed;
    flexibleTotal += flexible;
  }
  assert.deepEqual({ fixedTotal, flexibleTotal }, { fixedTotal: 161, flexibleTotal: 2 });
});

test("extraction SHA-256 and completeness metadata match approved evidence", () => {
  const artifact = buildArtifact();
  const bytes = readFileSync(path.join(ROOT, artifact.generator.extraction));
  assert.equal(artifact.generator.extractionSha256, createHash("sha256").update(bytes).digest("hex"));
  assert.equal(artifact.generator.suppliedUnitsFullyExtracted, true);
  assert.equal(artifact.generator.authoritativeCourseCompleteness, "unconfirmed");
});

test("real Math 8 artifact passes its explicit validation profile", () => {
  assert.deepEqual(validateArtifact(buildArtifact()), { valid: true, errors: [], warnings: [] });
});

test("IDs and fixed orders are unique", () => {
  const artifact = buildArtifact();
  assert.equal(new Set(artifact.units.map((entry) => entry.unitId)).size, 8);
  const ids = artifact.units.flatMap((entry) => entry.items.map((item) => item.itemId));
  assert.equal(new Set(ids).size, 163);
  for (const entry of artifact.units) {
    const orders = entry.items.filter((item) => item.order !== null).map((item) => item.order);
    assert.equal(new Set(orders).size, orders.length);
  }
});

test("literal Math 8 Types are preserved and no End-of-Unit Assessment item exists", () => {
  const items = buildArtifact().units.flatMap((entry) => entry.items);
  assert.deepEqual(new Set(items.filter((item) => item.type !== null).map((item) => item.type)), M8_TYPES);
  assert.ok(items.every((item) => item.type !== "End-of-Unit Assessment" && item.title !== "End-of-Unit Assessment"));
});

test("Unit 1 Getting to Know Each Other has only the approved absent Type", () => {
  const artifact = buildArtifact();
  const item = unit(artifact, 1).items[0];
  assert.equal(item.title, "Getting to Know Each Other");
  assert.equal(item.type, null);
  assert.equal(item.typeStatus, "confirmed_absent");
  const invalid = clone(artifact);
  invalid.units[0].items[0].typeStatus = "value_provided";
  assert.equal(validateArtifact(invalid).valid, false);
});

test("Unit 6 missing Practice Day stays order 12 and Quiz stays order 13", () => {
  const artifact = buildArtifact();
  const practice = unit(artifact, 6).items.find((item) => item.order === 12);
  assert.equal(practice.type, "Practice Day");
  assert.equal(practice.placementRule, null);
  for (const field of ["title", "subtitle", "summary", "isOptional"]) {
    assert.equal(practice[field], null);
    assert.equal(practice[`${field}Status`], "not_found_in_reviewable_source");
  }
  assert.match(practice.provenance.evidence, /no dedicated item page/);
  assert.equal(unit(artifact, 6).items.find((item) => item.order === 13).type, "Sub-Unit Quiz");
});

test("Unit 8 duplicate source cards yield one logical Lesson 9 and Lesson 14 with both occurrences cited", () => {
  const entry = unit(buildArtifact(), 8);
  for (const order of [13, 18]) {
    const item = entry.items.find((candidate) => candidate.order === order);
    assert.match(item.provenance.evidence, /pp\. (14-15|20-21)/);
  }
  assert.equal(entry.items.length, 21);
});

test("both Investigate placement rules are exact", () => {
  const artifact = buildArtifact();
  assert.equal(unit(artifact, 5).items.find((item) => item.type === "Investigate").placementRule, "Use anytime in this course after Unit 5, Lesson 15.");
  assert.equal(unit(artifact, 6).items.find((item) => item.type === "Investigate").placementRule, "Use anytime in this grade after Unit 6, Lesson 9.");
});

test("illegal status/value combinations fail validation", () => {
  const artifact = clone(buildArtifact());
  artifact.units[0].items[1].title = null;
  assert.ok(validateArtifact(artifact).errors.some((error) => error.includes("titleStatus is value_provided")));
});

test("unresolved fields without provenance fail validation", () => {
  const artifact = clone(buildArtifact());
  artifact.units[5].items.find((item) => item.order === 12).provenance = null;
  assert.ok(validateArtifact(artifact).errors.some((error) => error.includes("requires provenance")));
});

test("absent or unresolved optionality is null, never false", () => {
  const items = buildArtifact().units.flatMap((entry) => entry.items);
  assert.ok(items.every((item) => item.isOptional === true || item.isOptional === null));
});
