import assert from "node:assert/strict";
import test from "node:test";
import { buildPacing } from "./generate-m8-required-pacing.mjs";

const result = buildPacing();

test("schedules every required imported item once per active Math 8 section", () => {
  assert.equal(result.requiredItems.length, 139);
  assert.equal(result.assignments.length, 417);
  for (const sectionId of ["M8-P1", "M8-P2", "M8-P3"]) {
    const rows = result.assignments.filter((row) => row.SectionID === sectionId);
    assert.equal(rows.length, 139);
    assert.equal(new Set(rows.map((row) => row.LessonID)).size, 139);
    assert.ok(rows.every((row) => row.PlannedDays === "1"));
  }
});

test("respects the odd/even bell pattern and actual instructional calendar", () => {
  for (const row of result.assignments) {
    const weekday = new Date(`${row.Date}T12:00:00Z`).getUTCDay();
    assert.ok([1, 2, 3, 4, 5].includes(weekday));
    if (row.BlockGroup === "Odd") assert.notEqual(weekday, 2);
    if (row.BlockGroup === "Even") assert.notEqual(weekday, 1);
  }
});

test("leaves optional items and extra assessment days explicitly unscheduled", () => {
  assert.equal(result.optionalItems.length, 24);
  assert.equal(result.unscheduled.filter((row) => row.Category === "Optional imported item").length, 24);
  assert.equal(result.unscheduled.filter((row) => row.Category === "Additional assessment day").length, 8);
});

test("preserves the available section buffers", () => {
  assert.equal(result.buffers.filter((row) => row.SectionID === "M8-P1").length, 3);
  assert.equal(result.buffers.filter((row) => row.SectionID === "M8-P2").length, 9);
  assert.equal(result.buffers.filter((row) => row.SectionID === "M8-P3").length, 3);
  assert.equal(result.boundaries.length, 24);
  assert.ok(result.boundaries.every((row) => /^[1-8]$/.test(row.UnitNumber)));
});

test("uses the reviewed production title for Unit 6 Practice Day 1", () => {
  const rows = result.assignments.filter((row) => row.LessonID === "AMP-M8-U6-I12");
  assert.equal(rows.length, 3);
  assert.ok(rows.every((row) => row.LessonTitle === "8.6 Practice Day 1"));
});

test("builds a minimal, unique SectionPacing import preview", () => {
  assert.equal(result.sectionPacingRows.length, 417);
  assert.equal(new Set(result.sectionPacingRows.map((row) => row.PacingID)).size, 417);
  assert.deepEqual(Object.keys(result.sectionPacingRows[0]), [
    "PacingID", "SectionID", "PlannedDate", "Sequence", "LessonID", "Locked", "Notes",
  ]);
  assert.ok(result.sectionPacingRows.every((row) => row.PacingID === `${row.SectionID}|${row.PlannedDate}|${row.Sequence}`));
  assert.ok(result.sectionPacingRows.every((row) => row.Sequence === "1" && row.Locked === "FALSE" && row.Notes === ""));
});

test("SectionPacing preview leaves buffers and optional or added assessment days unassigned", () => {
  const scheduledIds = new Set(result.sectionPacingRows.map((row) => row.LessonID));
  assert.ok(result.optionalItems.every((item) => !scheduledIds.has(item.LessonID)));
  assert.equal(result.sectionPacingRows.some((row) => row.LessonID === ""), false);
});
