import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildArtifact } from "./generate-amplify-m8-artifact.mjs";
import { buildAmplifyM8ImportPlan } from "./build-amplify-m8-import-plan.mjs";
import { buildHumanSummary, runPreview } from "./preview.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const fixture = (name) => JSON.parse(readFileSync(path.join(ROOT, "scripts/import-staging/fixtures", name), "utf8"));
const findItem = (plan, id) => plan.units.flatMap((unit) => unit.items).find((item) => item.itemId === id);

test("empty Math 8 destination plans 8 unit and 163 item creates, including 161 fixed and 2 flexible, with zero writes", () => {
  const artifact = buildArtifact();
  const destination = fixture("amplify-m8-empty-destination.json");
  const before = JSON.stringify({ artifact, destination });
  const plan = buildAmplifyM8ImportPlan(artifact, destination);
  assert.deepEqual(plan.summary.units, { create: 8, "source-update": 0, "no-op": 0, blocked: 0 });
  assert.deepEqual(plan.summary.items, { create: 163, "source-update": 0, "no-op": 0, blocked: 0 });
  const items = plan.units.flatMap((unit) => unit.items);
  assert.equal(items.filter((item) => item.proposedRow.SortOrder !== null).length, 161);
  assert.equal(items.filter((item) => item.proposedRow.SortOrder === null).length, 2);
  for (const item of items.filter((entry) => entry.proposedRow.SortOrder === null)) {
    assert.match(item.proposedRow.PlacementRule, /^Use anytime/);
  }
  assert.equal(plan.writesPerformed, 0);
  assert.equal(JSON.stringify({ artifact, destination }), before, "classifier must not mutate either input");
});

test("create rows retain null values beside explicit evidence statuses without inventing defaults", () => {
  const plan = buildAmplifyM8ImportPlan(buildArtifact(), fixture("amplify-m8-empty-destination.json"));
  const u1First = findItem(plan, "AMP-M8-U1-I01");
  assert.equal(u1First.proposedRow.Type, null);
  assert.deepEqual(u1First.evidenceFields.type, { value: null, status: "confirmed_absent" });
  const u6Practice = findItem(plan, "AMP-M8-U6-I12");
  assert.equal(u6Practice.proposedRow.LessonTitle, null);
  assert.equal(u6Practice.proposedRow.Description, null);
  assert.equal(u6Practice.proposedRow.IsOptional, null);
  assert.equal(u6Practice.evidenceFields.isOptional.status, "not_found_in_reviewable_source");
});

test("representative fixture proves no-op, narrow source updates, teacher-field preservation, tri-state optionality, and flexible matching", () => {
  const plan = buildAmplifyM8ImportPlan(buildArtifact(), fixture("amplify-m8-representative-destination.json"));
  assert.deepEqual(plan.summary.units, { create: 6, "source-update": 1, "no-op": 1, blocked: 0 });
  assert.deepEqual(plan.summary.items, { create: 155, "source-update": 2, "no-op": 6, blocked: 0 });
  assert.equal(findItem(plan, "AMP-M8-U1-I01").classification, "no-op");
  const titleUpdate = findItem(plan, "AMP-M8-U1-I02");
  assert.equal(titleUpdate.classification, "source-update");
  assert.deepEqual(titleUpdate.proposedUpdate, { LessonTitle: "8.1 Pre-Unit Check" });
  assert.deepEqual(titleUpdate.preservedTeacherFields, ["PlannedDays", "TeacherNotes", "PrimaryLink"]);
  const trueOptional = findItem(plan, "AMP-M8-U1-I03");
  assert.deepEqual(trueOptional.proposedUpdate, { IsOptional: true });
  assert.equal(findItem(plan, "AMP-M8-U1-I12").classification, "no-op", "null optionality must not compare as false");
  assert.equal(findItem(plan, "AMP-M8-U6-I12").classification, "no-op", "unresolved fields must not erase destination content");
  assert.equal(findItem(plan, "AMP-M8-U5-F1").classification, "no-op");
  assert.equal(findItem(plan, "AMP-M8-U6-F1").classification, "no-op");
  assert.equal(plan.writesPerformed, 0);
});

test("legacy M8 rows are counted as protected and never matched by title, order, or natural key", () => {
  const destination = fixture("amplify-m8-representative-destination.json");
  const plan = buildAmplifyM8ImportPlan(buildArtifact(), destination);
  assert.deepEqual(plan.protectedLegacy, { units: 1, items: 1, total: 2 });
  assert.equal(plan.units.some((unit) => unit.unitId === "M8-U1"), false);
  assert.equal(plan.units.flatMap((unit) => unit.items).some((item) => item.itemId === "M8-U1-L1"), false);
  assert.equal(plan.blockers.some((reason) => reason.includes("M8-U1")), false);
});

test("duplicate IDs and incompatible exact-ID collisions are blocked with a reason for every blocked classification", () => {
  const artifact = buildArtifact();
  const firstUnit = artifact.units[0];
  const firstItem = firstUnit.items[0];
  const destination = {
    units: [
      { UnitID: firstUnit.unitId, CourseID: "OTHER" },
      { UnitID: artifact.units[1].unitId, CourseID: "M8" },
      { UnitID: artifact.units[1].unitId, CourseID: "M8" },
    ],
    lessons: [
      { LessonID: firstItem.itemId, UnitID: "M8-U1", CourseID: "M8" },
      { LessonID: artifact.units[0].items[1].itemId, UnitID: firstUnit.unitId, CourseID: "M8" },
      { LessonID: artifact.units[0].items[1].itemId, UnitID: firstUnit.unitId, CourseID: "M8" },
    ],
  };
  const plan = buildAmplifyM8ImportPlan(artifact, destination);
  assert.equal(plan.blocked, true);
  assert.equal(plan.summary.units.blocked, 2);
  assert.equal(plan.summary.items.blocked, 2);
  assert.equal(plan.blockers.length, 4);
  for (const blocked of [...plan.units, ...plan.units.flatMap((unit) => unit.items)].filter((entry) => entry.classification === "blocked")) {
    assert.ok(blocked.reasons.length > 0);
  }
});

test("structural unknowns that would require clearing destination placement are blocked, never normalized", () => {
  const artifact = buildArtifact();
  const fixed = artifact.units[0].items[0];
  const flexible = artifact.units[4].items.find((item) => item.order === null);
  const destination = {
    units: [],
    lessons: [
      { LessonID: fixed.itemId, UnitID: artifact.units[0].unitId, CourseID: "M8", PlacementRule: "invented rule" },
      { LessonID: flexible.itemId, UnitID: artifact.units[4].unitId, CourseID: "M8", SortOrder: 999 },
    ],
  };
  const plan = buildAmplifyM8ImportPlan(artifact, destination);
  assert.equal(findItem(plan, fixed.itemId).classification, "blocked");
  assert.equal(findItem(plan, flexible.itemId).classification, "blocked");
  assert.ok(plan.blockers.every((reason) => reason.includes("destructive clearing")));
});

test("Math 8 preview dispatch reports identity, schema/profile/hash, protected rows, blocked reasons, and zero writes", () => {
  const artifactPath = "data/import-staging/amplify-m8.json";
  const destinationPath = "scripts/import-staging/fixtures/amplify-m8-representative-destination.json";
  const report = runPreview({ artifactPath, destinationPath });
  const summary = buildHumanSummary(report);
  assert.equal(report.plan.writesPerformed, 0);
  assert.match(summary, /Artifact path: data\/import-staging\/amplify-m8\.json/);
  assert.match(summary, /Artifact schema version: 2\.0\.0/);
  assert.match(summary, /Validation profile: amplify-m8/);
  assert.match(summary, /Extraction SHA-256: [a-f0-9]{64}/);
  assert.match(summary, /Null publisher fields \(field:evidence-status=count; never coerced\):/);
  assert.match(summary, /Destination identity: local-fixture:amplify-m8-representative-destination/);
  assert.match(summary, /Protected legacy rows: 2/);
  assert.match(summary, /Writes performed: 0/);
  assert.match(summary, /This preview performed zero writes/);
});
