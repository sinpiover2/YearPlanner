import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

import {
  OPTIONAL_DAYS_VALIDATION_MESSAGE,
  PLANNED_DAYS_VALIDATION_MESSAGE,
  REQUIRED_DAYS_VALIDATION_MESSAGE,
  parsePlannedDays,
  serializeOptionalDays,
  serializePlannedDays,
  serializeRequiredDays,
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

test("Unit day serializers preserve blanks and enforce required/optional policies", () => {
  for (const value of [undefined, null, "", "   "]) {
    assert.deepEqual(serializeRequiredDays(value), { ok: true, value: "" });
    assert.deepEqual(serializeOptionalDays(value), { ok: true, value: "" });
  }

  assert.deepEqual(serializeRequiredDays("12.5"), { ok: true, value: 12.5 });
  assert.deepEqual(serializeOptionalDays(0), { ok: true, value: 0 });
  assert.deepEqual(serializeRequiredDays(0), {
    ok: false,
    error: REQUIRED_DAYS_VALIDATION_MESSAGE,
  });
  assert.deepEqual(serializeOptionalDays(-1), {
    ok: false,
    error: OPTIONAL_DAYS_VALIDATION_MESSAGE,
  });
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

async function loadUnitPlanningServer(
  unitRows,
  { expectedToken = "test-token", failWrite = false } = {},
) {
  const source = await readFile(new URL("../../apps-script-planning/Code.js", import.meta.url), "utf8");
  const writes = [];
  let openCount = 0;
  const sheet = {
    getDataRange: () => ({ getValues: () => unitRows.map((row) => [...row]) }),
    getRange: (row, column, rowCount, columnCount) => ({
      setValues: (values) => {
        if (failWrite) throw new Error("simulated batch write failure");
        writes.push({ row, column, rowCount, columnCount, values });
      },
    }),
  };
  const context = {
    SpreadsheetApp: {
      openById: () => {
        openCount += 1;
        return { getSheetByName: (name) => (name === "Units" ? sheet : null) };
      },
    },
    PropertiesService: {
      getScriptProperties: () => ({ getProperty: () => expectedToken }),
    },
    ContentService: {
      MimeType: { JSON: "JSON" },
      createTextOutput: (text) => ({ text, setMimeType() { return this; } }),
    },
    console,
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  return { context, writes, getOpenCount: () => openCount };
}

test("Apps Script Unit planning update is authenticated, narrow, and course-scoped", async () => {
  const rows = [
    ["UnitID", "CourseID", "UnitTitle", "RequiredDays", "OptionalDays"],
    ["AMP-M8-U1", "M8", "Rigid Transformations", "", ""],
    ["AMP-M8-U1", "OTHER", "Do not touch", 99, 99],
  ];
  const { context, writes } = await loadUnitPlanningServer(rows);
  const response = context.doPost({
    postData: {
      contents: JSON.stringify({
        action: "updateUnitPlanning",
        token: "test-token",
        unitId: "AMP-M8-U1",
        courseId: "M8",
        requiredDays: 16,
        optionalDays: 1,
      }),
    },
  });

  assert.equal(JSON.parse(response.text).ok, true);
  assert.equal(
    JSON.stringify(writes),
    JSON.stringify([{
      row: 2,
      column: 4,
      rowCount: 1,
      columnCount: 2,
      values: [[16, 1]],
    }]),
  );
});

test("Apps Script Unit planning validation fails before spreadsheet access", async () => {
  const rows = [["UnitID", "CourseID", "RequiredDays", "OptionalDays"]];
  const { context, writes, getOpenCount } = await loadUnitPlanningServer(rows);

  for (const payload of [
    { requiredDays: 0, optionalDays: 0 },
    { requiredDays: 1, optionalDays: -1 },
  ]) {
    const response = context.updateUnitPlanning({
      unitId: "AMP-M8-U1",
      courseId: "M8",
      ...payload,
    });
    assert.equal(JSON.parse(response.text).ok, false);
  }

  assert.equal(getOpenCount(), 0);
  assert.deepEqual(writes, []);
});

test("Apps Script Unit planning blocks incompatible schema and ambiguous identity", async () => {
  for (const rows of [
    [["UnitID", "CourseID", "RequiredDays"]],
    [["UnitID", "CourseID", "RequiredDays", "RequiredDays", "OptionalDays"]],
    [
      ["UnitID", "CourseID", "RequiredDays", "OptionalDays"],
      ["AMP-M8-U1", "M8", "", ""],
      ["AMP-M8-U1", "M8", "", ""],
    ],
  ]) {
    const { context, writes } = await loadUnitPlanningServer(rows);
    const response = context.updateUnitPlanning({
      unitId: "AMP-M8-U1",
      courseId: "M8",
      requiredDays: 16,
      optionalDays: 0,
    });
    assert.equal(JSON.parse(response.text).ok, false);
    assert.deepEqual(writes, []);
  }
});

test("Apps Script rejects missing, incorrect, and unconfigured Unit-write tokens", async () => {
  const rows = [
    ["UnitID", "CourseID", "RequiredDays", "OptionalDays"],
    ["U1", "M8", "", ""],
  ];

  for (const { expectedToken, suppliedToken } of [
    { expectedToken: "test-token", suppliedToken: undefined },
    { expectedToken: "test-token", suppliedToken: "wrong" },
    { expectedToken: null, suppliedToken: "test-token" },
  ]) {
    const { context, writes, getOpenCount } = await loadUnitPlanningServer(
      rows,
      { expectedToken },
    );
    const response = context.doPost({
      postData: {
        contents: JSON.stringify({
          action: "updateUnitPlanning",
          token: suppliedToken,
          unitId: "U1",
          courseId: "M8",
          requiredDays: 12,
          optionalDays: 0,
        }),
      },
    });

    assert.deepEqual(JSON.parse(response.text), {
      ok: false,
      error: "Unauthorized",
    });
    assert.equal(getOpenCount(), 0);
    assert.deepEqual(writes, []);
  }
});

test("Apps Script batch-write failure cannot partially save Unit totals", async () => {
  const rows = [
    ["UnitID", "CourseID", "RequiredDays", "OptionalDays"],
    ["U1", "M8", "", ""],
  ];
  const { context, writes } = await loadUnitPlanningServer(rows, {
    failWrite: true,
  });

  assert.throws(
    () => context.updateUnitPlanning({
      unitId: "U1",
      courseId: "M8",
      requiredDays: 12,
      optionalDays: 0,
    }),
    /simulated batch write failure/,
  );
  assert.deepEqual(writes, []);
});
