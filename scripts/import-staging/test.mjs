// Lightweight test suite for the Amplify IM1 staged-importer pipeline.
// Uses only Node's built-in test runner and assert module — no new
// dependency, per this sprint's explicit "no large testing framework" rule.
//
// Run with: node --test scripts/import-staging/test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { buildArtifact } from "./generate-artifact.mjs";
import { validateArtifact, KNOWN_TYPES, EXPECTED_UNIT_COUNTS } from "./validate-artifact.mjs";
import { buildImportPlan } from "./build-import-plan.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readFixture(name) {
  return JSON.parse(readFileSync(path.join(__dirname, "fixtures", name), "utf8"));
}

function findUnit(artifact, unitNumber) {
  return artifact.units.find((u) => u.unitNumber === unitNumber);
}

function findItem(unit, itemId) {
  return unit.items.find((i) => i.itemId === itemId);
}

// --- Determinism / idempotency -------------------------------------------

test("generator is deterministic: two builds produce byte-identical JSON", () => {
  const first = JSON.stringify(buildArtifact());
  const second = JSON.stringify(buildArtifact());
  assert.equal(first, second);
});

// --- Real artifact structural sanity --------------------------------------

test("real artifact has all 7 units with expected item counts", () => {
  const artifact = buildArtifact();
  assert.equal(artifact.units.length, 7);
  for (const unit of artifact.units) {
    const expected = EXPECTED_UNIT_COUNTS[unit.unitNumber];
    const fixed = unit.items.filter((i) => i.order !== null).length;
    const flexible = unit.items.filter((i) => i.order === null).length;
    assert.equal(fixed, expected.fixed, `Unit ${unit.unitNumber} fixed count`);
    assert.equal(flexible, expected.flexible, `Unit ${unit.unitNumber} flexible count`);
  }
});

test("real artifact passes validation with zero errors", () => {
  const artifact = buildArtifact();
  const result = validateArtifact(artifact);
  assert.deepEqual(result.errors, []);
  assert.equal(result.valid, true);
});

test("Unit 1 has no Sub-Unit Quiz / Mid-Unit Check item — confirmed absent, not an error", () => {
  const artifact = buildArtifact();
  const unit1 = findUnit(artifact, 1);
  const quizLike = unit1.items.filter((i) => i.type === "Sub-Unit Quiz" || i.type === "Mid-Unit Check");
  assert.equal(quizLike.length, 0);
  const result = validateArtifact(artifact);
  assert.equal(result.valid, true);
});

test("literal Type strings are preserved distinctly across the two vocabularies", () => {
  const artifact = buildArtifact();
  const unit3 = findUnit(artifact, 3);
  const unit6 = findUnit(artifact, 6);
  assert.ok(unit3.items.some((i) => i.type === "Practice"));
  assert.ok(unit6.items.some((i) => i.type === "Practice Day"));
  assert.ok(unit3.items.some((i) => i.type === "Mid-Unit Check"));
  assert.ok(unit6.items.some((i) => i.type === "Sub-Unit Quiz"));
  assert.ok(unit3.items.some((i) => i.type === "Assessment"));
  assert.ok(unit6.items.some((i) => i.type === "Performance Task"));
});

test("both Investigate flexible items have no order and a populated placementRule", () => {
  const artifact = buildArtifact();
  for (const unitNumber of [5, 7]) {
    const unit = findUnit(artifact, unitNumber);
    const investigate = unit.items.find((i) => i.type === "Investigate");
    assert.ok(investigate, `Unit ${unitNumber} should have an Investigate item`);
    assert.equal(investigate.order, null);
    assert.ok(investigate.placementRule && investigate.placementRule.length > 0);
  }
});

test("optional Lesson-type items are preserved (Unit 6 Lesson 13, Unit 7 Lesson 1)", () => {
  const artifact = buildArtifact();
  const unit6Lesson13 = findItem(findUnit(artifact, 6), "AMP-IM1-U6-I16");
  const unit7Lesson1 = findItem(findUnit(artifact, 7), "AMP-IM1-U7-I03");
  assert.equal(unit6Lesson13.type, "Lesson");
  assert.equal(unit6Lesson13.isOptional, true);
  assert.equal(unit7Lesson1.type, "Lesson");
  assert.equal(unit7Lesson1.isOptional, true);
});

test("unit day-budget statuses match the extraction's own wording per unit", () => {
  const artifact = buildArtifact();
  assert.equal(findUnit(artifact, 3).requiredDays.status, "value_provided");
  assert.equal(findUnit(artifact, 3).requiredDays.value, 17);
  assert.equal(findUnit(artifact, 3).optionalDays.value, 3);
  assert.equal(findUnit(artifact, 4).requiredDays.status, "not_provided");
  for (const unitNumber of [1, 2, 5, 6, 7]) {
    assert.equal(findUnit(artifact, unitNumber).requiredDays.status, "not_yet_verified");
  }
});

// --- Validator edge cases (synthetic artifacts) ---------------------------

function minimalValidArtifact() {
  return {
    schemaVersion: "1.0.0",
    course: { courseId: "IM1" },
    units: [
      {
        unitId: "TEST-U1",
        unitNumber: 99,
        title: "Test Unit",
        requiredDays: { status: "not_yet_verified", value: null },
        optionalDays: { status: "not_yet_verified", value: null },
        items: [
          {
            itemId: "TEST-U1-I01",
            order: 1,
            placementRule: null,
            type: "Lesson",
            title: "A Lesson",
            subtitle: null,
            isOptional: false,
            summary: "Summary.",
          },
        ],
      },
    ],
  };
}

test("unknown future Type produces a warning, not an error", () => {
  const artifact = minimalValidArtifact();
  artifact.units[0].items[0].type = "Some New Publisher Type";
  const result = validateArtifact(artifact);
  assert.equal(result.valid, true);
  assert.ok(result.warnings.some((w) => w.includes("Some New Publisher Type")));
  assert.ok(!KNOWN_TYPES.has("Some New Publisher Type"));
});

test("an item with both order and placementRule is a validation error", () => {
  const artifact = minimalValidArtifact();
  artifact.units[0].items[0].placementRule = "anytime after Lesson 1";
  const result = validateArtifact(artifact);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("both an order and a placementRule")));
});

test("an item with neither order nor placementRule is a validation error", () => {
  const artifact = minimalValidArtifact();
  artifact.units[0].items[0].order = null;
  const result = validateArtifact(artifact);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("neither an order nor a placementRule")));
});

test("duplicate itemId within an artifact is a hard validation error", () => {
  const artifact = minimalValidArtifact();
  artifact.units[0].items.push({ ...artifact.units[0].items[0] });
  const result = validateArtifact(artifact);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Duplicate itemId")));
});

test("duplicate order values within a unit is a validation error", () => {
  const artifact = minimalValidArtifact();
  artifact.units[0].items.push({
    itemId: "TEST-U1-I02",
    order: 1,
    placementRule: null,
    type: "Lesson",
    title: "Another Lesson",
    subtitle: null,
    isOptional: false,
    summary: "Summary.",
  });
  const result = validateArtifact(artifact);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("duplicate order value")));
});

test("requiredDays with status value_provided but no numeric value is a validation error", () => {
  const artifact = minimalValidArtifact();
  artifact.units[0].requiredDays = { status: "value_provided", value: null };
  const result = validateArtifact(artifact);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("value_provided")));
});

// --- Import plan classification matrix ------------------------------------

test("plan: item absent from destination classifies as create", () => {
  const artifact = buildArtifact();
  const empty = readFixture("empty-destination.json");
  const plan = buildImportPlan(artifact, empty);
  assert.equal(plan.blocked, false);
  const unit1 = plan.units.find((u) => u.unitId === "AMP-IM1-U1");
  assert.equal(unit1.classification, "create");
  assert.ok(unit1.items.every((i) => i.classification === "create"));
});

test("plan: exact-match destination row classifies as no-op", () => {
  const artifact = buildArtifact();
  const destination = readFixture("representative-destination.json");
  const plan = buildImportPlan(artifact, destination);
  const unit1 = plan.units.find((u) => u.unitId === "AMP-IM1-U1");
  // AMP-IM1-U1's UnitTitle and UnitNumber both match the artifact exactly —
  // the unit itself must be a no-op, not just its items (Sprint 6.1).
  assert.equal(unit1.classification, "no-op");
  const meetGreet = unit1.items.find((i) => i.itemId === "AMP-IM1-U1-I01");
  assert.equal(meetGreet.classification, "no-op");
});

test("plan: title mismatch with no teacher fields classifies as source-update with a warning reason", () => {
  const artifact = buildArtifact();
  const destination = readFixture("representative-destination.json");
  const plan = buildImportPlan(artifact, destination);
  const unit1 = plan.units.find((u) => u.unitId === "AMP-IM1-U1");
  const preUnitCheck = unit1.items.find((i) => i.itemId === "AMP-IM1-U1-I02");
  assert.equal(preUnitCheck.classification, "source-update");
  assert.ok(preUnitCheck.reasons.includes("title-mismatch-warning"));
});

test("plan: populated teacher-owned fields block an update, even with publisher-field diffs", () => {
  const artifact = buildArtifact();
  const destination = readFixture("representative-destination.json");
  const plan = buildImportPlan(artifact, destination);
  const unit1 = plan.units.find((u) => u.unitId === "AMP-IM1-U1");
  const visualPatterns = unit1.items.find((i) => i.itemId === "AMP-IM1-U1-I04");
  assert.equal(visualPatterns.classification, "blocked");
  assert.ok(visualPatterns.reasons.includes("preserve-teacher-fields"));
  assert.ok(visualPatterns.populatedTeacherFields.includes("PlannedDays"));
  assert.ok(visualPatterns.populatedTeacherFields.includes("TeacherNotes"));
  assert.ok(visualPatterns.populatedTeacherFields.includes("PrimaryLink"));
});

test("plan: duplicate destination LessonID is a hard fail", () => {
  const artifact = buildArtifact();
  const destination = readFixture("representative-destination.json");
  const plan = buildImportPlan(artifact, destination);
  assert.equal(plan.blocked, true);
  assert.ok(plan.blockers.some((b) => b.includes("Duplicate destination LessonID")));
  const unit1 = plan.units.find((u) => u.unitId === "AMP-IM1-U1");
  const dup = unit1.items.find((i) => i.itemId === "AMP-IM1-U1-I03");
  assert.equal(dup.classification, "blocked");
  assert.ok(dup.reasons.includes("duplicate-destination-id"));
});

test("plan: cross-course ID collision is a hard fail, at both unit and item level", () => {
  const artifact = buildArtifact();
  const destination = readFixture("representative-destination.json");
  const plan = buildImportPlan(artifact, destination);
  assert.ok(plan.blockers.some((b) => b.includes('UnitID "AMP-IM1-U2"')));
  assert.ok(plan.blockers.some((b) => b.includes('LessonID "AMP-IM1-U1-I05"')));
  const unit2 = plan.units.find((u) => u.unitId === "AMP-IM1-U2");
  assert.equal(unit2.classification, "blocked");
  const unit1 = plan.units.find((u) => u.unitId === "AMP-IM1-U1");
  const seqCarnival = unit1.items.find((i) => i.itemId === "AMP-IM1-U1-I05");
  assert.equal(seqCarnival.classification, "blocked");
  assert.ok(seqCarnival.reasons.includes("cross-course-id-collision"));
});

test("plan: unit-level title mismatch classifies as source-update and never proposes touching day budgets", () => {
  const artifact = buildArtifact();
  const destination = readFixture("representative-destination.json");
  const plan = buildImportPlan(artifact, destination);
  const unit3 = plan.units.find((u) => u.unitId === "AMP-IM1-U3");
  assert.equal(unit3.classification, "source-update");
  assert.ok(unit3.reasons.includes("title-mismatch-warning"));
  // AMP-IM1-U3's UnitNumber matches the artifact — only UnitTitle differs.
  assert.deepEqual(
    unit3.publisherFieldDiffs.map((d) => d.field),
    ["UnitTitle"],
  );
  assert.ok(!unit3.publisherFieldDiffs.some((d) => d.field === "RequiredDays" || d.field === "OptionalDays"));
});

test("plan: unit-level UnitNumber-only mismatch classifies as source-update without a title-mismatch warning (Sprint 6.1)", () => {
  const artifact = buildArtifact();
  const destination = readFixture("representative-destination.json");
  const plan = buildImportPlan(artifact, destination);
  const unit4 = plan.units.find((u) => u.unitId === "AMP-IM1-U4");
  assert.equal(unit4.classification, "source-update");
  assert.ok(!unit4.reasons.includes("title-mismatch-warning"));
  assert.deepEqual(
    unit4.publisherFieldDiffs.map((d) => d.field),
    ["UnitNumber"],
  );
  assert.equal(unit4.publisherFieldDiffs[0].proposed, 4);
});

test("plan: unit-level UnitTitle and UnitNumber both mismatched classifies as source-update with both diffs (Sprint 6.1)", () => {
  const artifact = buildArtifact();
  const destination = readFixture("representative-destination.json");
  const plan = buildImportPlan(artifact, destination);
  const unit5 = plan.units.find((u) => u.unitId === "AMP-IM1-U5");
  assert.equal(unit5.classification, "source-update");
  assert.ok(unit5.reasons.includes("title-mismatch-warning"));
  assert.deepEqual(
    unit5.publisherFieldDiffs.map((d) => d.field).sort(),
    ["UnitNumber", "UnitTitle"],
  );
});

test("plan: an unrelated real IM1-* placeholder unit/lesson is never referenced, and its teacher-owned day budgets and notes are untouched (Sprint 6.1)", () => {
  const artifact = buildArtifact();
  const destination = readFixture("representative-destination.json");
  const plan = buildImportPlan(artifact, destination);
  // Stable, distinct ID namespaces (AMP-IM1-U{n} vs IM1-U{n}) mean the
  // artifact's units can never look up and match this row via
  // destinationUnitsById.get(artifactUnit.unitId) — confirmed here by exact
  // lookup, not substring search (a substring check would be misleading:
  // "AMP-IM1-U1" itself contains "IM1-U1" as a substring).
  assert.equal(
    plan.units.find((u) => u.unitId === "IM1-U1"),
    undefined,
  );
  const allItemIds = plan.units.flatMap((u) => u.items.map((i) => i.itemId));
  assert.ok(!allItemIds.includes("IM1-U1-L1"));
});

test("plan: legacy Math 8 rows are never referenced by the plan at all", () => {
  const artifact = buildArtifact();
  const destination = readFixture("representative-destination.json");
  const plan = buildImportPlan(artifact, destination);
  const serialized = JSON.stringify(plan);
  assert.ok(!serialized.includes("M8-U1"));
  assert.ok(!serialized.includes("Some Math 8 Lesson"));
});

test("plan: a destination row missing the Type field entirely is treated as differing from any literal Type, not a crash", () => {
  const artifact = { ...buildArtifact() };
  const destination = {
    units: [{ UnitID: artifact.units[0].unitId, CourseID: "IM1", UnitNumber: artifact.units[0].unitNumber, UnitTitle: artifact.units[0].title }],
    lessons: [
      {
        LessonID: artifact.units[0].items[0].itemId,
        UnitID: artifact.units[0].unitId,
        CourseID: "IM1",
        LessonTitle: artifact.units[0].items[0].title,
        SortOrder: artifact.units[0].items[0].order,
        Description: artifact.units[0].items[0].summary,
        IsOptional: artifact.units[0].items[0].isOptional,
        // Type intentionally omitted — legacy-shaped row.
      },
    ],
  };
  const plan = buildImportPlan(artifact, destination);
  const unit = plan.units[0];
  const item = unit.items[0];
  assert.equal(item.classification, "source-update");
  assert.ok(item.publisherFieldDiffs.some((d) => d.field === "Type"));
});

test("plan is idempotent: running it twice against the same inputs gives the same result", () => {
  const artifact = buildArtifact();
  const destination = readFixture("representative-destination.json");
  const first = JSON.stringify(buildImportPlan(artifact, destination));
  const second = JSON.stringify(buildImportPlan(artifact, destination));
  assert.equal(first, second);
});
