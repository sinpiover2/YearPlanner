import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { buildArtifact } from "./generate-amplify-m8-artifact.mjs";
import { buildAmplifyM8ImportPlan } from "./build-amplify-m8-import-plan.mjs";
import { createFakeSpreadsheetFromFixture, createFakeSpreadsheetFromRawSheets, createFakeSpreadsheetApp, createFakeLockService } from "./fake-spreadsheet.mjs";

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const importer = require(path.join(HERE, "../../apps-script-planning/AmplifyM8Importer.js"));
const data = require(path.join(HERE, "../../apps-script-planning/AmplifyM8ImportData.js"));
const sha256 = (text) => createHash("sha256").update(text).digest("hex");
const UNIT_HEADERS = importer.AMPLIFY_M8_REQUIRED_UNIT_HEADERS;
const LESSON_HEADERS = importer.AMPLIFY_M8_REQUIRED_LESSON_HEADERS;
const COURSE_HEADERS = importer.AMPLIFY_M8_REQUIRED_COURSE_HEADERS;

function metadata(payload, overrides = {}) {
  const bytes = JSON.stringify(payload, null, 2) + "\n";
  const items = payload.units.flatMap((unit) => unit.items);
  const hash = sha256(bytes);
  return { schemaVersion: "2.0.0", profile: "amplify-m8", artifactSha256: hash,
    unitCount: payload.units.length, itemCount: items.length,
    fixedItemCount: items.filter((item) => item.order !== null).length,
    flexibleItemCount: items.filter((item) => item.order === null).length,
    confirmationPhrase: `IMPORT_AMPLIFY_M8_${hash.slice(0, 12)}_${payload.units.length}_${items.length}`, ...overrides };
}

function payload() {
  const field = (value, status = value === null ? "confirmed_absent" : "value_provided") => ({ value, status });
  const item = (itemId, order, placementRule, values) => ({ itemId, order, placementRule,
    type: values.type, typeStatus: field(values.type).status,
    title: values.title, titleStatus: field(values.title).status,
    subtitle: null, subtitleStatus: "confirmed_absent",
    summary: values.summary, summaryStatus: field(values.summary).status,
    isOptional: values.isOptional, isOptionalStatus: field(values.isOptional).status,
    provenance: { evidence: "fixture", optionalityEvidence: "fixture", placementEvidence: "fixture" } });
  return { schemaVersion: "2.0.0", course: { courseId: "M8" }, units: [{ unitId: "AMP-M8-U1", unitNumber: 1,
    title: "Test Unit", purpose: "Purpose", requiredDays: field(null), optionalDays: field(null), items: [
      item("AMP-M8-U1-I01", 1, null, { type: null, title: "Known", summary: null, isOptional: null }),
      item("AMP-M8-U1-F1", null, "Use anytime after Lesson 1.", { type: "Investigate", title: "Flex", summary: "Summary", isOptional: true }),
    ] }] };
}

function spreadsheet(destination = { units: [], lessons: [] }) {
  return createFakeSpreadsheetFromFixture(destination, { units: UNIT_HEADERS, lessons: LESSON_HEADERS });
}
function previewSpreadsheet({ courses = [{ CourseID: "M8" }], units = [], lessons = [],
  courseHeaders = COURSE_HEADERS, unitHeaders = UNIT_HEADERS, lessonHeaders = LESSON_HEADERS, omit = [] } = {}) {
  const rows = {};
  const values = (headers, objects) => [headers, ...objects.map((object) => headers.map((header) => object[header] ?? ""))];
  if (!omit.includes("Courses")) rows.Courses = values(courseHeaders, courses);
  if (!omit.includes("Units")) rows.Units = values(unitHeaders, units);
  if (!omit.includes("Lessons")) rows.Lessons = values(lessonHeaders, lessons);
  return createFakeSpreadsheetFromRawSheets(rows);
}
function previewDeps(overrides = {}) {
  const p = overrides.payload || payload();
  return { spreadsheetApp: createFakeSpreadsheetApp(overrides.spreadsheet || previewSpreadsheet()), sheetId: "local-preview",
    computeSha256Hex: sha256, payload: p, metadata: overrides.metadata || metadata(p), ...overrides };
}
function deps(overrides = {}) {
  const p = overrides.payload || payload();
  return { spreadsheetApp: createFakeSpreadsheetApp(overrides.spreadsheet || spreadsheet()), lockService: createFakeLockService(),
    sheetId: "local-only", computeSha256Hex: sha256, payload: p, metadata: overrides.metadata || metadata(p),
    courses: [{ CourseID: "M8" }], formatTimestamp: () => "2026-08-02 000000", ...overrides };
}

test("generated payload preserves schema/profile/hash/counts and exact confirmation phrase", () => {
  const result = importer.amplifyM8ValidatePayloadIntegrity_(data.AMPLIFY_M8_IMPORT_PAYLOAD, data.AMPLIFY_M8_IMPORT_METADATA, sha256);
  assert.deepEqual(result, { valid: true, errors: [] });
  assert.deepEqual([data.AMPLIFY_M8_IMPORT_METADATA.unitCount, data.AMPLIFY_M8_IMPORT_METADATA.itemCount,
    data.AMPLIFY_M8_IMPORT_METADATA.fixedItemCount, data.AMPLIFY_M8_IMPORT_METADATA.flexibleItemCount], [8, 163, 161, 2]);
  assert.match(data.AMPLIFY_M8_IMPORT_METADATA.confirmationPhrase, /^IMPORT_AMPLIFY_M8_[a-f0-9]{12}_8_163$/);
});

test("Apps Script classifier matches schema-2 Node classifications and write proposals", () => {
  const artifact = buildArtifact();
  for (const destination of [{ units: [], lessons: [] }, { units: [], lessons: [{ LessonID: "AMP-M8-U1-I01", UnitID: "AMP-M8-U1", CourseID: "M8", LessonTitle: "stale", TeacherNotes: "owned" }] }]) {
    const actual = importer.amplifyM8BuildImportPlan_(artifact, destination);
    const expected = buildAmplifyM8ImportPlan(artifact, destination);
    assert.deepEqual(actual.summary, expected.summary);
    assert.equal(actual.blocked, expected.blocked);
    assert.deepEqual(actual.units.map((unit) => [unit.unitId, unit.classification, unit.items.map((item) => [item.itemId, item.classification])]),
      expected.units.map((unit) => [unit.unitId, unit.classification, unit.items.map((item) => [item.itemId, item.classification])]));
  }
});

test("null/unresolved updates are omitted and never clear destination values", () => {
  const p = payload();
  const row = { LessonID: "AMP-M8-U1-I01", UnitID: "AMP-M8-U1", CourseID: "M8", LessonTitle: "Known", Type: "Teacher value", SortOrder: 1,
    PlacementRule: "", IsOptional: false, Description: "Keep me" };
  const plan = importer.amplifyM8BuildImportPlan_(p, { units: [], lessons: [row] });
  const item = plan.units[0].items[0];
  assert.equal(item.classification, "no-op");
});

test("publisher difference on any teacher-owned row is blocked", () => {
  const p = payload();
  const row = { LessonID: "AMP-M8-U1-I01", UnitID: "AMP-M8-U1", CourseID: "M8", LessonTitle: "stale", SortOrder: 1, PlannedDays: 2 };
  const item = importer.amplifyM8BuildImportPlan_(p, { units: [], lessons: [row] }).units[0].items[0];
  assert.equal(item.classification, "blocked");
  assert.deepEqual(item.populatedTeacherFields, ["PlannedDays"]);
});

test("exact IDs only; simulated execution leaves internal legacy M8 rows byte-for-byte untouched", () => {
  const p = payload();
  const destination = { units: [{ UnitID: "M8-U1", CourseID: "M8", UnitTitle: "Legacy" }], lessons: [{ LessonID: "M8-U1-L1", UnitID: "M8-U1", CourseID: "M8" }] };
  const s = spreadsheet(destination);
  const legacyRows = () => ({
    units: s.getSheetByName("Units").values.filter((row) => /^M8-U/.test(String(row[UNIT_HEADERS.indexOf("UnitID")]))),
    lessons: s.getSheetByName("Lessons").values.filter((row) => /^M8-U/.test(String(row[LESSON_HEADERS.indexOf("LessonID")]))),
  });
  const beforeBytes = JSON.stringify(legacyRows());
  const d = deps({ spreadsheet: s, payload: p });
  const report = importer.amplifyM8ExecuteLocked_(d.metadata.confirmationPhrase, d);
  assert.equal(report.success, true, report.errorMessage);
  assert.equal(JSON.stringify(legacyRows()), beforeBytes);
});

test("duplicate IDs, incompatible collisions, and structural clears block", () => {
  const p = payload();
  const duplicate = { LessonID: "AMP-M8-U1-I01", UnitID: "AMP-M8-U1", CourseID: "M8" };
  assert.equal(importer.amplifyM8BuildImportPlan_(p, { units: [], lessons: [duplicate, duplicate] }).blocked, true);
  assert.equal(importer.amplifyM8BuildImportPlan_(p, { units: [], lessons: [{ ...duplicate, CourseID: "OTHER" }] }).blocked, true);
  assert.equal(importer.amplifyM8BuildImportPlan_(p, { units: [], lessons: [{ ...duplicate, PlacementRule: "would clear" }] }).blocked, true);
});

test("course identity requires exactly one exact M8 CourseID and ignores display wording", () => {
  assert.equal(importer.amplifyM8ValidateCourse_([]).valid, false);
  for (const course of [
    { CourseID: "M8" },
    { CourseID: "M8", CourseName: "Math 8" },
    { CourseID: "M8", CourseName: "Mathematics 8" },
    { CourseID: "M8", CourseName: "" },
    { CourseID: "M8", ShortName: "Eighth Grade" },
  ]) assert.equal(importer.amplifyM8ValidateCourse_([course]).valid, true);
  assert.equal(importer.amplifyM8ValidateCourse_([{ CourseID: "M8" }, { CourseID: "M8" }]).valid, false);
  assert.equal(importer.amplifyM8ValidateCourse_([{ CourseID: "MATH8", CourseName: "Math 8" }]).valid, false);
});

test("read-only preview allows exactly one compatible M8 course and always reports zero writes", () => {
  const report = importer.amplifyM8BuildPreviewReport_(previewDeps(), new Date("2026-08-02T00:00:00.000Z"));
  assert.equal(report.courseValidation.valid, true);
  assert.equal(report.destinationSchema.valid, true);
  assert.ok(report.plan);
  assert.deepEqual(report.plan.summary, { units: { create: 1, "source-update": 0, "no-op": 0, blocked: 0 },
    items: { create: 2, "source-update": 0, "no-op": 0, blocked: 0 } });
  assert.equal(report.writesOccurred, false);
});

test("read-only preview accepts optional CourseName wording and blocks missing, duplicate, or incompatible M8 identity", () => {
  for (const courses of [
    [{ CourseID: "M8", CourseName: "Math 8" }],
    [{ CourseID: "M8", CourseName: "Alternate wording" }],
    [{ CourseID: "M8", CourseName: "" }],
    [{ CourseID: "M8" }],
  ]) {
    const report = importer.amplifyM8BuildPreviewReport_(previewDeps({ spreadsheet: previewSpreadsheet({ courses, courseHeaders: ["CourseID", "CourseName"] }) }), new Date(0));
    assert.equal(report.courseValidation.valid, true);
    assert.ok(report.plan);
    assert.equal(report.writesOccurred, false);
  }
  for (const courses of [[],
    [{ CourseID: "M8" }, { CourseID: "M8" }],
    [{ CourseID: "MATH8", CourseName: "Math 8" }]]) {
    const report = importer.amplifyM8BuildPreviewReport_(previewDeps({ spreadsheet: previewSpreadsheet({ courses }) }), new Date(0));
    assert.equal(report.courseValidation.valid, false);
    assert.equal(report.plan, null);
    assert.equal(report.writesOccurred, false);
  }
});

test("read-only preview requires all three sheets and required headers before classification", () => {
  for (const name of ["Courses", "Units", "Lessons"]) {
    const report = importer.amplifyM8BuildPreviewReport_(previewDeps({ spreadsheet: previewSpreadsheet({ omit: [name] }) }), new Date(0));
    assert.equal(report.destinationSchema.valid, false);
    assert.equal(report.plan, null);
    assert.match(report.destinationSchema.errors.join(" "), new RegExp(name));
  }
  for (const [kind, headers] of [["courseHeaders", COURSE_HEADERS], ["unitHeaders", UNIT_HEADERS], ["lessonHeaders", LESSON_HEADERS]]) {
    for (const header of headers) {
      const options = { [kind]: headers.filter((value) => value !== header) };
      const report = importer.amplifyM8BuildPreviewReport_(previewDeps({ spreadsheet: previewSpreadsheet(options) }), new Date(0));
      assert.equal(report.destinationSchema.valid, false);
      assert.equal(report.plan, null);
      assert.match(report.destinationSchema.errors.join(" "), new RegExp(header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
  }
  const legacyDisplayHeaderOnly = importer.amplifyM8BuildPreviewReport_(previewDeps({
    spreadsheet: previewSpreadsheet({ courseHeaders: ["Course Name"], courses: [{ "Course Name": "Math 8" }] }),
  }), new Date(0));
  assert.equal(legacyDisplayHeaderOnly.destinationSchema.valid, false);
  assert.deepEqual(legacyDisplayHeaderOnly.destinationSchema.missingCourseHeaders, ["CourseID"]);
  const exactIdOnly = importer.amplifyM8BuildPreviewReport_(previewDeps({
    spreadsheet: previewSpreadsheet({ courseHeaders: ["CourseID"], courses: [{ CourseID: "M8" }] }),
  }), new Date(0));
  assert.equal(exactIdOnly.destinationSchema.valid, true);
  assert.equal(exactIdOnly.courseValidation.valid, true);
});

test("read-only preview reads only approved sheets and fields and cannot mutate fake state", () => {
  const s = previewSpreadsheet();
  for (const name of ["Courses", "Units", "Lessons"]) {
    s.sheetsByName[name].values[0].push("NotApprovedForPreview");
    for (let index = 1; index < s.sheetsByName[name].values.length; index += 1) s.sheetsByName[name].values[index].push("secret");
  }
  s.sheetsByName.Unrelated = s.sheetsByName.Units.clone();
  const before = JSON.stringify(s.sheetsByName);
  const requestedSheets = [];
  const originalGetSheet = s.getSheetByName.bind(s);
  s.getSheetByName = (name) => { requestedSheets.push(name); return originalGetSheet(name); };
  for (const sheet of Object.values(s.sheetsByName)) {
    for (const method of ["appendRow", "deleteRow", "insertColumnsAfter"]) sheet[method] = () => { throw new Error(`write method called: ${method}`); };
    const originalRange = sheet.getRange.bind(sheet);
    const readRanges = [];
    Object.defineProperty(sheet, "readRanges", { value: readRanges, enumerable: false });
    sheet.getRange = (...args) => { readRanges.push(args); const range = originalRange(...args); range.setValue = range.setValues = () => { throw new Error("range write called"); }; return range; };
  }
  s.copy = () => { throw new Error("backup called"); };
  const fixtureBefore = JSON.stringify(payload());
  const d = previewDeps({ spreadsheet: s });
  const report = importer.amplifyM8BuildPreviewReport_(d, new Date(0));
  assert.deepEqual(requestedSheets, ["Courses", "Units", "Lessons"]);
  assert.deepEqual(COURSE_HEADERS, ["CourseID"]);
  assert.deepEqual(report.courseValidation.course, { _rowNumber: 2, CourseID: "M8" });
  for (const name of ["Courses", "Units", "Lessons"]) {
    const sheet = s.sheetsByName[name];
    const forbiddenColumn = sheet.values[0].indexOf("NotApprovedForPreview") + 1;
    assert.equal(sheet.readRanges.some((args) => args[0] > 1 && args[1] === forbiddenColumn), false);
  }
  assert.equal(report.writesOccurred, false);
  assert.equal(JSON.stringify(d.payload), fixtureBefore);
  assert.equal(JSON.stringify(s.sheetsByName), before);
});

test("confirmation, lock, and backup guards fail before writes", () => {
  assert.equal(importer.amplifyM8ExecuteLocked_("wrong", deps()).errorStage, "confirmation");
  const lockFail = deps({ lockService: createFakeLockService({ acquireSucceeds: false }) });
  assert.equal(importer.amplifyM8ExecuteLocked_(lockFail.metadata.confirmationPhrase, lockFail).errorStage, "lock");
  const s = spreadsheet(); s.copy = () => { throw new Error("backup failed"); };
  const backupFail = deps({ spreadsheet: s });
  assert.equal(importer.amplifyM8ExecuteLocked_(backupFail.metadata.confirmationPhrase, backupFail).errorStage, "backup");
});

test("full simulation performs narrow writes, verifies, and is idempotent", () => {
  const s = spreadsheet();
  const d = deps({ spreadsheet: s });
  const first = importer.amplifyM8ExecuteLocked_(d.metadata.confirmationPhrase, d);
  assert.equal(first.errorStage, null, first.errorMessage);
  assert.deepEqual(first.writeCounts, { unitsCreated: 1, unitsUpdated: 0, itemsCreated: 2, itemsUpdated: 0 });
  assert.equal(first.verification.valid, true);
  const second = importer.amplifyM8ExecuteLocked_(d.metadata.confirmationPhrase, d);
  assert.deepEqual(second.writeCounts, { unitsCreated: 0, unitsUpdated: 0, itemsCreated: 0, itemsUpdated: 0 });
});

test("revalidation change is reported before mutation", () => {
  const s = spreadsheet();
  const lessons = s.getSheetByName("Lessons");
  const original = lessons.getRange.bind(lessons); let reads = 0;
  lessons.getRange = function (...args) { const range = original(...args); const get = range.getValues.bind(range); range.getValues = () => {
    const values = get(); reads += 1; if (reads === 2 && values[0] && values[0][0] === "LessonID") return [...values, LESSON_HEADERS.map((h) => h === "LessonID" ? "AMP-M8-U1-I01" : h === "UnitID" ? "AMP-M8-U1" : h === "CourseID" ? "M8" : "")]; return values; }; return range; };
  const d = deps({ spreadsheet: s });
  assert.equal(importer.amplifyM8ExecuteLocked_(d.metadata.confirmationPhrase, d).errorStage, "revalidation");
});

test("an actual second write failure reports partial state without retry, rollback, or second backup", () => {
  const s = spreadsheet();
  let backupCount = 0;
  let writeAttempts = 0;
  const realCopy = s.copy.bind(s);
  s.copy = (...args) => { backupCount += 1; return realCopy(...args); };
  for (const sheetName of ["Units", "Lessons"]) {
    const sheet = s.getSheetByName(sheetName);
    const realGetRange = sheet.getRange.bind(sheet);
    sheet.getRange = function (...args) {
      const range = realGetRange(...args);
      if (args[0] > 1) {
        const realSetValues = range.setValues.bind(range);
        range.setValues = (values) => {
          writeAttempts += 1;
          if (sheetName === "Lessons") throw new Error("Simulated second-write failure");
          return realSetValues(values);
        };
      }
      return range;
    };
  }
  const d = deps({ spreadsheet: s });
  const report = importer.amplifyM8ExecuteLocked_(d.metadata.confirmationPhrase, d);
  const unitValues = s.getSheetByName("Units").values;
  const lessonValues = s.getSheetByName("Lessons").values;

  assert.equal(report.success, false);
  assert.equal(report.errorStage, "exception");
  assert.notEqual(report.errorStage, "schema");
  assert.match(report.errorMessage, /partially applied/);
  assert.match(report.errorMessage, /Manual recovery may be required/);
  assert.match(report.errorMessage, /No automatic rollback was performed/);
  assert.ok(report.backup && report.backup.id);
  assert.equal(backupCount, 1, "the failed execution must create exactly one backup");
  assert.equal(writeAttempts, 2, "one successful write plus one failed write; no retry");
  assert.ok(unitValues.some((row) => row[UNIT_HEADERS.indexOf("UnitID")] === "AMP-M8-U1"), "first write remains applied");
  assert.equal(lessonValues.some((row) => row[LESSON_HEADERS.indexOf("LessonID")] === "AMP-M8-U1-I01"), false, "failed second write remains absent");
  assert.equal(report.writesOccurred, false, "write batch was not confirmed complete");
});

test("all five live-facing functions throw DISARMED before global access or side effects", () => {
  const source = require("node:fs").readFileSync(path.join(HERE, "../../apps-script-planning/AmplifyM8Importer.js"), "utf8");
  let sideEffects = 0;
  const context = { module: { exports: {} }, exports: {} };
  for (const name of ["SpreadsheetApp", "LockService", "Utilities", "Session", "Logger", "SHEET_ID", "AMPLIFY_M8_IMPORT_PAYLOAD", "AMPLIFY_M8_IMPORT_METADATA"]) {
    Object.defineProperty(context, name, { get() { sideEffects += 1; throw new Error(`unexpected access: ${name}`); } });
  }
  vm.runInNewContext(`${source}\nthis.__liveFunctions = { previewAmplifyM8Import, previewAmplifyM8ImportSummary, executeAmplifyM8Import, executeAmplifyM8ImportFromEditor, verifyAmplifyM8Import };`, context);
  for (const name of ["previewAmplifyM8Import", "previewAmplifyM8ImportSummary", "executeAmplifyM8Import", "executeAmplifyM8ImportFromEditor", "verifyAmplifyM8Import"]) {
    assert.throws(() => context.__liveFunctions[name]("anything"), /^Error: DISARMED:/, name);
  }
  assert.equal(sideEffects, 0);
});
