import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import vm from "node:vm";
import {
  LEGACY_M8_ARCHIVE_TARGET_UNIT_IDS, LEGACY_M8_ARCHIVE_CONFIRMATION_PHRASE,
  legacyM8ArchiveBuildPlan_, legacyM8ArchivePreview_, legacyM8ArchiveBuildLivePreview_, legacyM8ArchiveVerifyRaw_, legacyM8ArchiveExecuteLocked_, legacyM8ArchiveCloneMatrix_,
  previewLegacyM8ArchiveMigration, executeLegacyM8ArchiveMigration,
  executeLegacyM8ArchiveMigrationFromEditor, verifyLegacyM8ArchiveMigration,
} from "../../apps-script-planning/LegacyM8ArchiveMigration.js";
import { createFakeSpreadsheetFromRawSheets, createFakeSpreadsheetApp, createFakeLockService } from "./fake-spreadsheet.mjs";

const UNIT_HEADERS = ["UnitID", "CourseID", "UnitNumber", "UnitTitle", "RequiredDays", "OptionalDays", "SortOrder", "UnitPurpose", "IsArchived"];
const LESSON_HEADERS = ["LessonID", "CourseID", "UnitID", "LessonTitle", "Type", "SortOrder", "PlannedDays", "TeacherNotes", "PrimaryLink", "KeyOutcome"];
const row = (headers, object) => headers.map((header) => object[header] ?? "");

function fixture({ archived = false } = {}) {
  const units = LEGACY_M8_ARCHIVE_TARGET_UNIT_IDS.map((id, index) => ({ UnitID: id, CourseID: "M8", UnitNumber: index, UnitTitle: "Legacy " + index, RequiredDays: index + 10, OptionalDays: 1, SortOrder: index, UnitPurpose: "purpose " + index, IsArchived: archived ? true : "" }));
  units.push({ UnitID: "AMP-M8-U1", CourseID: "M8", UnitNumber: 1, UnitTitle: "Amplify", IsArchived: "" });
  units.push({ UnitID: "IM1-U1", CourseID: "IM1", UnitNumber: 1, UnitTitle: "IM1", IsArchived: "" });
  const lessons = Array.from({ length: 50 }, (_, index) => ({ LessonID: "LEGACY-M8-L" + String(index + 1).padStart(2, "0"), CourseID: "M8", UnitID: LEGACY_M8_ARCHIVE_TARGET_UNIT_IDS[index % 9], LessonTitle: "Lesson " + index, Type: "Lesson", SortOrder: index, PlannedDays: index % 3, TeacherNotes: "note " + index, PrimaryLink: "https://example.invalid/" + index, KeyOutcome: "outcome " + index }));
  lessons.push({ LessonID: "AMP-M8-I01", CourseID: "M8", UnitID: "AMP-M8-U1", LessonTitle: "Amplify lesson", TeacherNotes: "preserve" });
  lessons.push({ LessonID: "IM1-L1", CourseID: "IM1", UnitID: "IM1-U1", LessonTitle: "IM1 lesson" });
  return { units, lessons, unitsHeaders: UNIT_HEADERS };
}

function raw(data) { return { Units: [UNIT_HEADERS, ...data.units.map((x) => row(UNIT_HEADERS, x))], Lessons: [LESSON_HEADERS, ...data.lessons.map((x) => row(LESSON_HEADERS, x))] }; }
function cloneCell(value) { return value instanceof Date ? new Date(value.getTime()) : value; }
function cloneMatrix(matrix) { return matrix.map((values) => values.map(cloneCell)); }
function verificationFixture() {
  const sheets = raw(fixture());
  const before = { unitsRaw: cloneMatrix(sheets.Units), lessonsRaw: cloneMatrix(sheets.Lessons) };
  const after = { unitsRaw: cloneMatrix(sheets.Units), lessonsRaw: cloneMatrix(sheets.Lessons) };
  const archivedIndex = UNIT_HEADERS.indexOf("IsArchived");
  after.unitsRaw.slice(1).forEach((values) => { if (LEGACY_M8_ARCHIVE_TARGET_UNIT_IDS.includes(values[0])) values[archivedIndex] = true; });
  return { before, after };
}
function assertRawVerificationFails(mutator) {
  const state = verificationFixture();
  mutator(state.before, state.after);
  assert.equal(legacyM8ArchiveVerifyRaw_(state.before, state.after).valid, false);
}
function deps(data, options = {}) {
  const spreadsheet = createFakeSpreadsheetFromRawSheets(raw(data));
  const spreadsheetApp = createFakeSpreadsheetApp(spreadsheet);
  let backupCalls = 0;
  const originalCopy = spreadsheet.copy.bind(spreadsheet);
  spreadsheet.copy = (name) => { backupCalls += 1; return originalCopy(name); };
  return { spreadsheet, spreadsheetApp, lockService: createFakeLockService({ acquireSucceeds: options.lockSucceeds !== false }), sheetId: spreadsheet.id, formatTimestamp: () => "2026-08-05 000000", backupCalls: () => backupCalls };
}

test("exact nine-unit and 50-linked-lesson plan is safe and reports required preview fields", () => {
  const plan = legacyM8ArchiveBuildPlan_(fixture());
  assert.equal(plan.safeToExecute, true); assert.equal(plan.targetCount, 9); assert.equal(plan.linkedLessonCount, 50);
  assert.deepEqual(plan.targetIds, LEGACY_M8_ARCHIVE_TARGET_UNIT_IDS); assert.deepEqual(plan.missingTargetIds, []);
  assert.deepEqual(plan.identityMismatches, []); assert.ok(Array.isArray(plan.nonTargetConflicts));
});

test("preview is pure and performs zero writes", () => {
  const data = fixture(); const before = JSON.stringify(data);
  const report = legacyM8ArchivePreview_(data, new Date("2026-08-05T00:00:00Z"));
  assert.equal(report.writesOccurred, false); assert.equal(JSON.stringify(data), before); assert.equal(report.targets.length, 9);
});

function livePreview(data = fixture(), rawOverrides = {}) {
  const sheets = { ...raw(data), ...rawOverrides };
  Object.keys(sheets).forEach((name) => { if (sheets[name] === undefined) delete sheets[name]; });
  const spreadsheet = createFakeSpreadsheetFromRawSheets(sheets);
  spreadsheet.getName = () => "Year Planner Database";
  const openedIds = [];
  const sheetReads = [];
  const originalGetSheet = spreadsheet.getSheetByName.bind(spreadsheet);
  spreadsheet.getSheetByName = (name) => { sheetReads.push(name); return originalGetSheet(name); };
  for (const method of ["copy", "insertSheet", "deleteSheet", "moveActiveSheet", "toast"]) {
    spreadsheet[method] = () => { throw new Error(`write-capable method invoked: ${method}`); };
  }
  const logs = [];
  const report = legacyM8ArchiveBuildLivePreview_({
    sheetId: "configured-sheet-id",
    spreadsheetApp: { openById(id) { openedIds.push(id); return spreadsheet; }, flush() { throw new Error("flush invoked"); } },
    logger: { log(value) { logs.push(value); } },
    lockService: { getScriptLock() { throw new Error("lock invoked"); } },
    createBackup() { throw new Error("backup invoked"); },
  }, new Date("2026-08-05T12:34:56.000Z"));
  return { report, openedIds, sheetReads, logs, spreadsheet };
}

test("live preview adapter opens only configured ID, reads only Units and Lessons, logs evidence, and cannot write", () => {
  const result = livePreview();
  assert.deepEqual(result.openedIds, ["configured-sheet-id"]);
  assert.deepEqual(result.sheetReads, ["Units", "Lessons"]);
  assert.equal(result.report.mode, "preview");
  assert.equal(result.report.timestamp, "2026-08-05T12:34:56.000Z");
  assert.equal(result.report.spreadsheetIdentity.configuredSheetId, "configured-sheet-id");
  assert.equal(result.report.spreadsheetIdentity.spreadsheetName, "Year Planner Database");
  assert.deepEqual(result.report.targetUnitIds, LEGACY_M8_ARCHIVE_TARGET_UNIT_IDS);
  assert.equal(result.report.targetUnits.length, 9);
  assert.equal(result.report.currentIsArchivedStates.length, 9);
  assert.equal(result.report.targetCount, 9);
  assert.equal(result.report.linkedLegacyLessonCount, 50);
  assert.deepEqual(result.report.missingOrDuplicateIds, { missingTargetUnitIds: [], duplicateUnitIds: [], duplicateLessonIds: [] });
  assert.deepEqual(result.report.courseOwnershipMismatches, []);
  assert.equal(result.report.lessonOwnershipCountProblems.countMatches, true);
  assert.deepEqual(result.report.nonTargetArchiveConflicts, []);
  assert.deepEqual(result.report.blockerReasons, []);
  assert.equal(result.report.safeToExecute, true);
  assert.equal(result.report.alreadyComplete, false);
  assert.equal(result.report.confirmationRequired, LEGACY_M8_ARCHIVE_CONFIRMATION_PHRASE);
  assert.equal(result.report.writesOccurred, false);
  assert.match(result.report.note, /zero writes/);
  assert.equal(result.logs.length, 1);
  assert.deepEqual(JSON.parse(result.logs[0]), result.report);
});

test("live preview adapter fails closed for missing sheets and schema problems", () => {
  const missing = livePreview(fixture(), { Lessons: undefined }).report;
  assert.equal(missing.sheetsPresent.Lessons, false);
  assert.equal(missing.schemaValidation.valid, false);
  assert.equal(missing.safeToExecute, false);
  assert.ok(missing.blockerReasons.some((reason) => /Lessons sheet is missing/.test(reason)));

  const data = fixture();
  const unitsWithoutTitle = raw(data).Units.map((values) => values.filter((_value, index) => index !== UNIT_HEADERS.indexOf("UnitTitle")));
  const schema = livePreview(data, { Units: unitsWithoutTitle }).report;
  assert.equal(schema.schemaValidation.sheets.Units.valid, false);
  assert.deepEqual(schema.schemaValidation.sheets.Units.missingHeaders, ["UnitTitle"]);
  assert.equal(schema.safeToExecute, false);
});

test("live preview adapter reports and blocks target and lesson-count or ownership problems", () => {
  const targetMismatch = fixture();
  targetMismatch.units[0].CourseID = "IM1";
  const targetReport = livePreview(targetMismatch).report;
  assert.equal(targetReport.safeToExecute, false);
  assert.equal(targetReport.courseOwnershipMismatches[0].UnitID, "M8-U0");

  const lessonProblems = fixture();
  lessonProblems.lessons.splice(1, 1);
  lessonProblems.lessons[0].CourseID = "IM1";
  const lessonReport = livePreview(lessonProblems).report;
  assert.equal(lessonReport.safeToExecute, false);
  assert.equal(lessonReport.lessonOwnershipCountProblems.countMatches, false);
  assert.equal(lessonReport.lessonOwnershipCountProblems.ownershipMismatches.length, 1);
});

test("missing and duplicate target IDs block", () => {
  const missing = fixture(); missing.units = missing.units.filter((u) => u.UnitID !== "M8-U8");
  assert.equal(legacyM8ArchiveBuildPlan_(missing).safeToExecute, false);
  const duplicate = fixture(); duplicate.units.push({ ...duplicate.units[0] });
  assert.deepEqual(legacyM8ArchiveBuildPlan_(duplicate).duplicateUnitIds, ["M8-U0"]);
});

test("wrong target CourseID blocks", () => { const data = fixture(); data.units[2].CourseID = "IM1"; assert.equal(legacyM8ArchiveBuildPlan_(data).safeToExecute, false); });

test("missing, extra, duplicate, and cross-owned linked lessons each block", () => {
  const missing = fixture(); missing.lessons.splice(0, 1); assert.equal(legacyM8ArchiveBuildPlan_(missing).safeToExecute, false);
  const extra = fixture(); extra.lessons.push({ ...extra.lessons[0], LessonID: "EXTRA" }); assert.equal(legacyM8ArchiveBuildPlan_(extra).safeToExecute, false);
  const duplicate = fixture(); duplicate.lessons.push({ ...duplicate.lessons[0] }); assert.ok(legacyM8ArchiveBuildPlan_(duplicate).duplicateLessonIds.length);
  const cross = fixture(); cross.lessons[0].CourseID = "IM1"; assert.ok(legacyM8ArchiveBuildPlan_(cross).unexpectedLessonOwnership.length);
});

test("non-target and AMP-M8 rows never become targets", () => { const plan = legacyM8ArchiveBuildPlan_(fixture()); assert.equal(plan.targets.some((u) => u.UnitID.startsWith("AMP-M8-") || u.CourseID === "IM1"), false); });

test("confirmation and lock failures are zero-write", () => {
  let d = deps(fixture()); let report = legacyM8ArchiveExecuteLocked_("wrong", d); assert.equal(report.errorStage, "confirmation"); assert.equal(report.writesOccurred, false);
  d = deps(fixture(), { lockSucceeds: false }); report = legacyM8ArchiveExecuteLocked_(LEGACY_M8_ARCHIVE_CONFIRMATION_PHRASE, d); assert.equal(report.errorStage, "lock"); assert.equal(report.writesOccurred, false);
});

test("backup failure blocks before mutation", () => { const d = deps(fixture()); d.spreadsheet.copy = () => { throw new Error("backup failed"); }; const report = legacyM8ArchiveExecuteLocked_(LEGACY_M8_ARCHIVE_CONFIRMATION_PHRASE, d); assert.equal(report.errorStage, "backup"); assert.equal(report.writesOccurred, false); });

test("revalidation drift blocks after backup and before mutation", () => {
  const d = deps(fixture()); const original = d.spreadsheet.getSheetByName.bind(d.spreadsheet); let reads = 0;
  d.spreadsheet.getSheetByName = (name) => { if (name === "Units" && ++reads === 2) { const clone = original(name).clone(); clone.values[1][3] = "drift"; return clone; } return original(name); };
  const report = legacyM8ArchiveExecuteLocked_(LEGACY_M8_ARCHIVE_CONFIRMATION_PHRASE, d); assert.equal(report.errorStage, "revalidation"); assert.equal(report.writesOccurred, false); assert.ok(report.backup);
});

test("successful execution writes only nine IsArchived cells and preserves every other byte", () => {
  const data = fixture(); const d = deps(data); const unitsBefore = JSON.stringify(d.spreadsheet.getSheetByName("Units").values); const lessonsBefore = JSON.stringify(d.spreadsheet.getSheetByName("Lessons").values);
  const report = legacyM8ArchiveExecuteLocked_(LEGACY_M8_ARCHIVE_CONFIRMATION_PHRASE, d);
  assert.equal(report.success, true); assert.equal(report.cellsWritten, 9); assert.equal(report.verification.valid, true); assert.equal(d.backupCalls(), 1);
  assert.equal(JSON.stringify(d.spreadsheet.getSheetByName("Lessons").values), lessonsBefore);
  const before = JSON.parse(unitsBefore), after = d.spreadsheet.getSheetByName("Units").values, archiveIndex = UNIT_HEADERS.indexOf("IsArchived");
  after.forEach((r, i) => r.forEach((value, j) => { if (i && LEGACY_M8_ARCHIVE_TARGET_UNIT_IDS.includes(r[0]) && j === archiveIndex) assert.equal(value, true); else assert.deepEqual(value, before[i][j]); }));
});

test("already archived state and second execution are zero-write zero-backup no-ops", () => {
  let d = deps(fixture({ archived: true })); let report = legacyM8ArchiveExecuteLocked_(LEGACY_M8_ARCHIVE_CONFIRMATION_PHRASE, d); assert.equal(report.success, true); assert.equal(report.writesOccurred, false); assert.equal(d.backupCalls(), 0);
  d = deps(fixture()); assert.equal(legacyM8ArchiveExecuteLocked_(LEGACY_M8_ARCHIVE_CONFIRMATION_PHRASE, d).success, true); report = legacyM8ArchiveExecuteLocked_(LEGACY_M8_ARCHIVE_CONFIRMATION_PHRASE, d); assert.equal(report.success, true); assert.equal(report.writesOccurred, false); assert.equal(d.backupCalls(), 1);
});

test("mid-write failure reports backup and manual recovery guidance", () => {
  const d = deps(fixture()); const sheet = d.spreadsheet.getSheetByName("Units"); const original = sheet.getRange.bind(sheet); let writes = 0;
  sheet.getRange = (...args) => { const range = original(...args); const set = range.setValue.bind(range); range.setValue = (value) => { writes += 1; if (writes === 4) throw new Error("simulated mid-write failure"); return set(value); }; return range; };
  const report = legacyM8ArchiveExecuteLocked_(LEGACY_M8_ARCHIVE_CONFIRMATION_PHRASE, d); assert.equal(report.errorStage, "mutation"); assert.equal(report.writesOccurred, true); assert.ok(report.backup.id); assert.match(report.manualRecoveryGuidance, /Restore/);
});

test("post-write verification failure is explicit with recovery guidance", () => {
  const d = deps(fixture()); d.spreadsheetApp.flush = () => { d.spreadsheet.getSheetByName("Lessons").values[1][3] = "tampered"; };
  const report = legacyM8ArchiveExecuteLocked_(LEGACY_M8_ARCHIVE_CONFIRMATION_PHRASE, d); assert.equal(report.errorStage, "post-write-verification"); assert.equal(report.success, false); assert.match(report.manualRecoveryGuidance, /backup/);
});

test("raw verification rejects swapped target Unit rows", () => assertRawVerificationFails((_before, after) => {
  [after.unitsRaw[1], after.unitsRaw[2]] = [after.unitsRaw[2], after.unitsRaw[1]];
}));

test("raw verification rejects swapped target and non-target Unit rows", () => assertRawVerificationFails((_before, after) => {
  [after.unitsRaw[1], after.unitsRaw[10]] = [after.unitsRaw[10], after.unitsRaw[1]];
}));

test("raw verification rejects Units header reordering", () => assertRawVerificationFails((_before, after) => {
  [after.unitsRaw[0][2], after.unitsRaw[0][3]] = [after.unitsRaw[0][3], after.unitsRaw[0][2]];
}));

test("raw verification rejects added, removed, and duplicate Units headers", () => {
  assertRawVerificationFails((_before, after) => after.unitsRaw.forEach((values, index) => values.push(index ? "added" : "AddedField")));
  assertRawVerificationFails((_before, after) => after.unitsRaw.forEach((values) => values.splice(3, 1)));
  assertRawVerificationFails((_before, after) => after.unitsRaw.forEach((values, index) => values.push(index ? "" : "UnitTitle")));
});

test("planning rejects duplicate Units and Lessons headers", () => {
  const data = fixture();
  data.unitsHeaders = UNIT_HEADERS.concat("UnitTitle");
  data.lessonsHeaders = LESSON_HEADERS.concat("LessonID");
  const plan = legacyM8ArchiveBuildPlan_(data);
  assert.deepEqual(plan.duplicateUnitsHeaders, ["UnitTitle"]);
  assert.deepEqual(plan.duplicateLessonsHeaders, ["LessonID"]);
  assert.equal(plan.safeToExecute, false);
});

test("raw verification rejects an added target field/column", () => assertRawVerificationFails((_before, after) => {
  after.unitsRaw[0].push("Extra"); after.unitsRaw[1].push("target value");
}));

test("raw verification rejects changed target and non-target cells", () => {
  assertRawVerificationFails((_before, after) => { after.unitsRaw[1][3] = "changed target title"; });
  assertRawVerificationFails((_before, after) => { after.unitsRaw[10][3] = "changed AMP title"; });
});

test("raw verification rejects Lessons header reordering", () => assertRawVerificationFails((_before, after) => {
  [after.lessonsRaw[0][2], after.lessonsRaw[0][3]] = [after.lessonsRaw[0][3], after.lessonsRaw[0][2]];
}));

test("raw verification rejects added, removed, and duplicate Lessons headers", () => {
  assertRawVerificationFails((_before, after) => after.lessonsRaw.forEach((values, index) => values.push(index ? "added" : "AddedField")));
  assertRawVerificationFails((_before, after) => after.lessonsRaw.forEach((values) => values.splice(3, 1)));
  assertRawVerificationFails((_before, after) => after.lessonsRaw.forEach((values, index) => values.push(index ? "" : "LessonTitle")));
});

test("raw verification rejects lesson row reordering and added or removed lesson rows", () => {
  assertRawVerificationFails((_before, after) => { [after.lessonsRaw[1], after.lessonsRaw[2]] = [after.lessonsRaw[2], after.lessonsRaw[1]]; });
  assertRawVerificationFails((_before, after) => { after.lessonsRaw.push(after.lessonsRaw[1].slice()); });
  assertRawVerificationFails((_before, after) => { after.lessonsRaw.pop(); });
});

test("raw verification rejects changed lesson values and superficially similar cell types", () => {
  assertRawVerificationFails((_before, after) => { after.lessonsRaw[1][3] = "changed lesson"; });
  assertRawVerificationFails((before, after) => { before.lessonsRaw[1][5] = 1; after.lessonsRaw[1][5] = "1"; });
  assertRawVerificationFails((before, after) => { before.unitsRaw[10][8] = false; after.unitsRaw[10][8] = "false"; });
});

test("raw verification compares Date cells by exact timestamp and preserves Date type", () => {
  assertRawVerificationFails((before, after) => {
    before.lessonsRaw[1][7] = new Date("2026-08-05T00:00:00.000Z");
    after.lessonsRaw[1][7] = new Date("2026-08-05T00:00:00.001Z");
  });
  assertRawVerificationFails((before, after) => {
    before.lessonsRaw[1][7] = new Date("2026-08-05T00:00:00.000Z");
    after.lessonsRaw[1][7] = "2026-08-05T00:00:00.000Z";
  });
});

test("raw verification rejects sparse cell hole becoming explicit undefined", () => assertRawVerificationFails((before, after) => {
  delete before.lessonsRaw[1][3];
  after.lessonsRaw[1][3] = undefined;
}));

test("raw verification rejects explicit undefined becoming sparse hole", () => assertRawVerificationFails((before, after) => {
  before.lessonsRaw[1][3] = undefined;
  delete after.lessonsRaw[1][3];
}));

test("raw verification rejects missing sparse row becoming explicit empty row", () => assertRawVerificationFails((before, after) => {
  delete before.lessonsRaw[5];
  after.lessonsRaw[5] = [];
}));

test("raw verification rejects explicit empty row becoming missing sparse row", () => assertRawVerificationFails((before, after) => {
  before.lessonsRaw[6] = [];
  delete after.lessonsRaw[6];
}));

test("raw verification accepts equivalent sparse structures", () => {
  const state = verificationFixture();
  delete state.before.lessonsRaw[7];
  delete state.after.lessonsRaw[7];
  state.before.lessonsRaw[8] = [];
  state.after.lessonsRaw[8] = [];
  delete state.before.lessonsRaw[9][2];
  delete state.after.lessonsRaw[9][2];
  state.before.lessonsRaw[10][4] = undefined;
  state.after.lessonsRaw[10][4] = undefined;
  assert.equal(legacyM8ArchiveVerifyRaw_(state.before, state.after).valid, true);
});

test("raw snapshot cloning preserves holes, explicit undefined, and independent Dates", () => {
  const source = [];
  source.length = 4;
  source[0] = [];
  source[1] = [];
  source[1].length = 4;
  source[1][0] = "header";
  source[1][2] = undefined;
  const stamp = new Date("2026-08-05T00:00:00.000Z");
  source[3] = [stamp];

  const clone = legacyM8ArchiveCloneMatrix_(source);
  assert.equal(clone.length, source.length);
  assert.equal(Object.prototype.hasOwnProperty.call(clone, 2), false);
  assert.equal(Object.prototype.hasOwnProperty.call(clone, 1), true);
  assert.equal(Array.isArray(clone[1]), true);
  assert.equal(clone[1].length, 4);
  assert.equal(Object.prototype.hasOwnProperty.call(clone[1], 1), false);
  assert.equal(Object.prototype.hasOwnProperty.call(clone[1], 2), true);
  assert.equal(clone[1][2], undefined);
  assert.equal(clone[3][0] instanceof Date, true);
  assert.equal(clone[3][0].getTime(), stamp.getTime());
  assert.notEqual(clone[3][0], stamp);
});

test("all four live wrappers remain unconditionally DISARMED before Apps Script global access", () => {
  const source = readFileSync(new URL("../../apps-script-planning/LegacyM8ArchiveMigration.js", import.meta.url), "utf8");
  let globalAccesses = 0;
  const context = { module: { exports: {} }, exports: {} };
  for (const name of ["SpreadsheetApp", "LockService", "Logger", "SHEET_ID"]) {
    Object.defineProperty(context, name, { get() { globalAccesses += 1; throw new Error(`unexpected access: ${name}`); } });
  }
  vm.runInNewContext(`${source}\nthis.__liveFunctions = { previewLegacyM8ArchiveMigration, executeLegacyM8ArchiveMigration, executeLegacyM8ArchiveMigrationFromEditor, verifyLegacyM8ArchiveMigration };`, context);
  for (const name of Object.keys(context.__liveFunctions)) assert.throws(() => context.__liveFunctions[name](LEGACY_M8_ARCHIVE_CONFIRMATION_PHRASE), /^Error: DISARMED:/, name);
  assert.equal(globalAccesses, 0);
});

test("existing IM1 archive migration is byte-identical to its pre-Math-8 version", () => {
  const source = readFileSync(new URL("../../apps-script-planning/UnitsArchiveMigration.js", import.meta.url));
  assert.equal(createHash("sha256").update(source).digest("hex"), "9a4eb6c14d1e78a46429a1af52ef099321052c44e0d50b25419ef9dcc842207d");
});
