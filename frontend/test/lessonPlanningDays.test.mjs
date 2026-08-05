import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

import {
  PLANNED_DAYS_VALIDATION_MESSAGE,
  parsePlannedDays,
  serializePlannedDays,
} from "../src/utils/plannerUtils.js";

test("existing lesson PlannedDays preserves blank and valid half-days", () => {
  for (const value of [undefined, null, "", "   "]) {
    assert.deepEqual(serializePlannedDays(value), { ok: true, value: "" });
  }

  for (const [value, expected] of [[0.5, 0.5], ["1", 1], [" 2.5 ", 2.5]]) {
    assert.deepEqual(serializePlannedDays(value), { ok: true, value: expected });
  }
});

test("zero, negative, nonnumeric, nonfinite, and unsupported PlannedDays fail", () => {
  for (const value of [0, "0", -0.5, 0.75, "bad", NaN, Infinity, -Infinity, true, false, [], {}, 1n]) {
    assert.deepEqual(serializePlannedDays(value), {
      ok: false,
      error: PLANNED_DAYS_VALIDATION_MESSAGE,
    });
  }
});

test("a new lesson default is valid only when explicitly retained and submitted", () => {
  assert.deepEqual(serializePlannedDays(1), { ok: true, value: 1 });
  assert.deepEqual(serializePlannedDays(""), { ok: true, value: "" });
  assert.equal(parsePlannedDays(0).state, "invalid");
});

async function loadPlanningServer() {
  const source = await readFile(new URL("../../apps-script-planning/Code.js", import.meta.url), "utf8");
  const writes = [];
  const rows = [["LessonID", "CourseID", "UnitID", "LessonNumber", "SortOrder", "LessonTitle", "PlannedDays", "KeyOutcome", "PrimaryLink", "TeacherNotes"]];
  const sheet = {
    getDataRange: () => ({ getValues: () => rows.map((row) => [...row]) }),
    appendRow: (row) => writes.push({ type: "append", row }),
    getRange: (row, column) => ({ setValue: (value) => writes.push({ type: "set", row, column, value }) }),
  };
  const context = {
    SpreadsheetApp: { openById: () => ({ getSheetByName: () => sheet }) },
    ContentService: {
      MimeType: { JSON: "JSON" },
      createTextOutput: (text) => ({ text, setMimeType() { return this; } }),
    },
    console,
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  return { context, writes, rows };
}

test("Apps Script parser matches frontend PlannedDays policy", async () => {
  const { context } = await loadPlanningServer();
  const values = [undefined, null, "", " ", 0.5, "1", 2.5, 0, -1, 0.75, "bad", NaN, Infinity, true, [], {}];

  for (const value of values) {
    const frontend = serializePlannedDays(value);
    const server = context.parsePlannedDaysForWrite_(value);
    assert.equal(server.ok, frontend.ok, `parity for ${String(value)}`);
    if (frontend.ok) assert.equal(server.value, frontend.value);
  }
});

test("Apps Script rejects invalid add/update before opening or writing a sheet", async () => {
  const { context, writes } = await loadPlanningServer();
  let openCount = 0;
  context.SpreadsheetApp.openById = () => {
    openCount += 1;
    throw new Error("must not open");
  };

  for (const action of ["addLesson", "updateLesson"]) {
    const result = context[action]({ plannedDays: 0 });
    assert.match(JSON.parse(result.text).error, /positive number.*0\.5-day/);
  }
  assert.equal(openCount, 0);
  assert.deepEqual(writes, []);
});

test("Apps Script preserves blank on add and title-only existing lesson update", async () => {
  const { context, writes, rows } = await loadPlanningServer();
  const added = context.addLesson({
    courseId: "M8", unitId: "U1", lessonTitle: "New", plannedDays: "", keyOutcome: "Goal", primaryLink: "",
  });
  assert.equal(JSON.parse(added.text).lesson.PlannedDays, "");
  assert.equal(writes[0].row[6], "");

  rows.push(["L1", "M8", "U1", 1, 1, "Old", "", "Goal", "link", "notes"]);
  context.updateLesson({
    lessonId: "L1", lessonTitle: "Renamed", plannedDays: "", keyOutcome: "Goal", primaryLink: "link", teacherNotes: "notes",
  });
  const plannedDaysWrite = writes.find((write) => write.type === "set" && write.column === 7);
  assert.equal(plannedDaysWrite.value, "");
});
