// Tests for apps-script-planning/LegacyIm1CleanupMigration.js. Every case
// runs against in-memory fakes (fake-spreadsheet.mjs) — none of these touch
// a real spreadsheet, network, or Google API. See that file's own header
// for why "tests pass" is not the same claim as "proven against production."

import test from "node:test";
import assert from "node:assert/strict";
import {
  LEGACY_CLEANUP_CONFIRMATION_PHRASE,
  LEGACY_CLEANUP_EDITOR_PLACEHOLDER_CONFIRMATION,
  legacyCleanupIsAmpId_,
  legacyCleanupAmpUnitNumbers_,
  legacyCleanupClassifyUnits_,
  legacyCleanupPopulatedFields_,
  legacyCleanupFindDependentDailyProgress_,
  legacyCleanupFindDuplicateIds_,
  legacyCleanupBuildPlan_,
  legacyCleanupPlansMatch_,
  legacyCleanupBuildPreviewReport_,
  legacyCleanupValidateConfirmation_,
  legacyCleanupRunEditorWrapper_,
  legacyCleanupVerify_,
  legacyCleanupExecuteLocked_,
} from "../../apps-script-planning/LegacyIm1CleanupMigration.js";
import {
  createFakeSpreadsheetFromRawSheets,
  createFakeSpreadsheetApp,
  createFakeLockService,
} from "./fake-spreadsheet.mjs";

// ---------------------------------------------------------------------------
// Fixture builders
// ---------------------------------------------------------------------------

const UNITS_HEADERS = ["UnitID", "CourseID", "UnitNumber", "UnitTitle", "RequiredDays", "OptionalDays", "SortOrder", "UnitPurpose"];
const LESSONS_HEADERS = [
  "LessonID", "UnitID", "CourseID", "LessonNumber", "LessonTitle", "PlannedDays", "SortOrder",
  "Type", "PlacementRule", "KeyOutcome", "Description", "PrimaryLink", "TeacherNotes", "IsOptional",
];
const DAILY_PROGRESS_HEADERS = ["DailyProgressID", "Date", "CourseSectionID", "CourseID", "UnitID", "LessonID", "DayFraction", "Finished", "Notes"];

function row(headers, obj) {
  return headers.map((h) => (obj[h] === undefined ? "" : obj[h]));
}

// Mirrors this sprint's real, live-read production shape exactly: 9 legacy
// IM1 units (U0 orientation + U1-U8), 7 AMP-IM1-* units (UnitNumber 1-7),
// legacy IM1-U1 carrying two real teacher-authored lessons, legacy IM1-U0
// carrying three orientation lessons, and 4 real DailyProgress rows logged
// against IM1-U1/IM1-U1-L1/L2.
function buildRealShapeSheets() {
  const units = [
    { UnitID: "IM1-U0", CourseID: "IM1", UnitNumber: 0, UnitTitle: "Class Orientation", RequiredDays: 5, OptionalDays: 0, SortOrder: 0, UnitPurpose: "Students learn about how the class works." },
    { UnitID: "IM1-U1", CourseID: "IM1", UnitNumber: 1, UnitTitle: "Patterns and Sequences", RequiredDays: 9, OptionalDays: 1, SortOrder: 1, UnitPurpose: "" },
    { UnitID: "IM1-U2", CourseID: "IM1", UnitNumber: 2, UnitTitle: "Linear Equations and Inequalities", RequiredDays: 18, OptionalDays: 3, SortOrder: 2, UnitPurpose: "" },
    { UnitID: "IM1-U8", CourseID: "IM1", UnitNumber: 8, UnitTitle: "Quadratic Equations", RequiredDays: 21, OptionalDays: 3, SortOrder: 8, UnitPurpose: "" },
    { UnitID: "AMP-IM1-U1", CourseID: "IM1", UnitNumber: 1, UnitTitle: "Patterns and Sequences", RequiredDays: "", OptionalDays: "", SortOrder: 1, UnitPurpose: "" },
    { UnitID: "AMP-IM1-U2", CourseID: "IM1", UnitNumber: 2, UnitTitle: "Linear Equations and Inequalities", RequiredDays: "", OptionalDays: "", SortOrder: 2, UnitPurpose: "" },
    { UnitID: "M8-U1", CourseID: "M8", UnitNumber: 1, UnitTitle: "Rigid Transformations & Congruence", RequiredDays: 10, OptionalDays: 2, SortOrder: 1, UnitPurpose: "" },
  ];

  const lessons = [
    { LessonID: "IM1-U1-L1", UnitID: "IM1-U1", CourseID: "IM1", LessonNumber: 1, LessonTitle: "Patterns and Sequences Lesson 1", PlannedDays: 1, SortOrder: 1, Type: "", PlacementRule: "", KeyOutcome: "Students describe patterns recursively and explicitly.", Description: "Students look for structure in patterns.", PrimaryLink: "", TeacherNotes: "", IsOptional: "" },
    { LessonID: "IM1-U1-L2", UnitID: "IM1-U1", CourseID: "IM1", LessonNumber: 2, LessonTitle: "Patterns and Sequences Lesson 2", PlannedDays: 1, SortOrder: 2, Type: "", PlacementRule: "", KeyOutcome: "Students connect sequence patterns to representations.", Description: "Students represent growing patterns.", PrimaryLink: "", TeacherNotes: "", IsOptional: "" },
    { LessonID: "IM1-U0-L1", UnitID: "IM1-U0", CourseID: "IM1", LessonNumber: 1, LessonTitle: "Orientation 1", PlannedDays: 0.5, SortOrder: 1, Type: "", PlacementRule: "", KeyOutcome: "", Description: "", PrimaryLink: "", TeacherNotes: "", IsOptional: "" },
    { LessonID: "AMP-IM1-U1-I01", UnitID: "AMP-IM1-U1", CourseID: "IM1", LessonNumber: "", LessonTitle: "Meet & Greet", PlannedDays: "", SortOrder: 1, Type: "Meet & Greet", PlacementRule: "", KeyOutcome: "", Description: "This is intended to help you get to know your students.", PrimaryLink: "", TeacherNotes: "", IsOptional: true },
    { LessonID: "M8-U1-L1", UnitID: "M8-U1", CourseID: "M8", LessonNumber: 1, LessonTitle: "Reflections", PlannedDays: 1, SortOrder: 1, Type: "", PlacementRule: "", KeyOutcome: "Students reflect shapes.", Description: "", PrimaryLink: "", TeacherNotes: "", IsOptional: "" },
  ];

  const dailyProgress = [
    { DailyProgressID: "TEST-IM1P5-001", Date: "2026-09-01T07:00:00.000Z", CourseSectionID: "IM1-P5", CourseID: "IM1", UnitID: "IM1-U1", LessonID: "IM1-U1-L1", DayFraction: 5, Finished: true, Notes: "Test: significant buffer use" },
    { DailyProgressID: "TEST-IM1P5-002", Date: "2026-09-02T07:00:00.000Z", CourseSectionID: "IM1-P5", CourseID: "IM1", UnitID: "IM1-U1", LessonID: "IM1-U1-L2", DayFraction: 5, Finished: true, Notes: "Test: significant buffer use" },
    { DailyProgressID: "TEST-M8P2-001", Date: "2026-09-01T07:00:00.000Z", CourseSectionID: "M8-P2", CourseID: "M8", UnitID: "M8-U1", LessonID: "M8-U1-L1", DayFraction: 1, Finished: true, Notes: "Test: on track" },
  ];

  return {
    Units: [UNITS_HEADERS, ...units.map((u) => row(UNITS_HEADERS, u))],
    Lessons: [LESSONS_HEADERS, ...lessons.map((l) => row(LESSONS_HEADERS, l))],
    DailyProgress: [DAILY_PROGRESS_HEADERS, ...dailyProgress.map((d) => row(DAILY_PROGRESS_HEADERS, d))],
  };
}

// A fully-resolved scenario: legacy IM1-U2 has no populated teacher fields
// (RequiredDays/OptionalDays already migrated/cleared), its one lesson has
// no populated teacher fields either, and no DailyProgress row references
// it — this is the shape a real cleanup candidate must have before this
// tool's own guard will ever classify it "delete". IM1-U0/IM1-U8 (no AMP
// replacement) and M8 rows are included to prove they're left alone even in
// an otherwise-clean run.
function buildCleanShapeSheets() {
  const units = [
    { UnitID: "IM1-U0", CourseID: "IM1", UnitNumber: 0, UnitTitle: "Class Orientation", RequiredDays: 5, OptionalDays: 0, SortOrder: 0, UnitPurpose: "" },
    { UnitID: "IM1-U2", CourseID: "IM1", UnitNumber: 2, UnitTitle: "Linear Equations and Inequalities", RequiredDays: "", OptionalDays: "", SortOrder: 2, UnitPurpose: "" },
    { UnitID: "IM1-U8", CourseID: "IM1", UnitNumber: 8, UnitTitle: "Quadratic Equations", RequiredDays: 21, OptionalDays: 3, SortOrder: 8, UnitPurpose: "" },
    { UnitID: "AMP-IM1-U2", CourseID: "IM1", UnitNumber: 2, UnitTitle: "Linear Equations and Inequalities", RequiredDays: "", OptionalDays: "", SortOrder: 2, UnitPurpose: "" },
    { UnitID: "M8-U1", CourseID: "M8", UnitNumber: 1, UnitTitle: "Rigid Transformations & Congruence", RequiredDays: 10, OptionalDays: 2, SortOrder: 1, UnitPurpose: "" },
  ];
  const lessons = [
    { LessonID: "IM1-U2-L1", UnitID: "IM1-U2", CourseID: "IM1", LessonNumber: 1, LessonTitle: "Old Lesson", PlannedDays: "", SortOrder: 1, Type: "", PlacementRule: "", KeyOutcome: "", Description: "", PrimaryLink: "", TeacherNotes: "", IsOptional: "" },
    { LessonID: "IM1-U0-L1", UnitID: "IM1-U0", CourseID: "IM1", LessonNumber: 1, LessonTitle: "Orientation 1", PlannedDays: 0.5, SortOrder: 1, Type: "", PlacementRule: "", KeyOutcome: "", Description: "", PrimaryLink: "", TeacherNotes: "", IsOptional: "" },
    { LessonID: "AMP-IM1-U2-I01", UnitID: "AMP-IM1-U2", CourseID: "IM1", LessonNumber: "", LessonTitle: "Homecoming", PlannedDays: "", SortOrder: 1, Type: "Explore", PlacementRule: "", KeyOutcome: "", Description: "Planning for Homecoming.", PrimaryLink: "", TeacherNotes: "", IsOptional: true },
    { LessonID: "M8-U1-L1", UnitID: "M8-U1", CourseID: "M8", LessonNumber: 1, LessonTitle: "Reflections", PlannedDays: 1, SortOrder: 1, Type: "", PlacementRule: "", KeyOutcome: "Students reflect shapes.", Description: "", PrimaryLink: "", TeacherNotes: "", IsOptional: "" },
  ];
  const dailyProgress = [
    { DailyProgressID: "TEST-M8P2-001", Date: "2026-09-01T07:00:00.000Z", CourseSectionID: "M8-P2", CourseID: "M8", UnitID: "M8-U1", LessonID: "M8-U1-L1", DayFraction: 1, Finished: true, Notes: "Test: on track" },
  ];
  return {
    Units: [UNITS_HEADERS, ...units.map((u) => row(UNITS_HEADERS, u))],
    Lessons: [LESSONS_HEADERS, ...lessons.map((l) => row(LESSONS_HEADERS, l))],
    DailyProgress: [DAILY_PROGRESS_HEADERS, ...dailyProgress.map((d) => row(DAILY_PROGRESS_HEADERS, d))],
  };
}

function objectsFromRawSheet(rawSheet) {
  const [headers, ...rows] = rawSheet;
  return rows.map((r) => {
    const obj = {};
    headers.forEach((h, i) => (obj[h] = r[i]));
    return obj;
  });
}

function planFromRawSheets(sheets) {
  return legacyCleanupBuildPlan_({
    units: objectsFromRawSheet(sheets.Units),
    lessons: objectsFromRawSheet(sheets.Lessons),
    dailyProgress: objectsFromRawSheet(sheets.DailyProgress),
  });
}

// ---------------------------------------------------------------------------
// Pure logic
// ---------------------------------------------------------------------------

test("legacyCleanupIsAmpId_ matches only the AMP-IM1- prefix", () => {
  assert.equal(legacyCleanupIsAmpId_("AMP-IM1-U1"), true);
  assert.equal(legacyCleanupIsAmpId_("IM1-U1"), false);
  assert.equal(legacyCleanupIsAmpId_(""), false);
  assert.equal(legacyCleanupIsAmpId_(undefined), false);
});

test("legacyCleanupClassifyUnits_ separates superseded from no-replacement units", () => {
  const units = objectsFromRawSheet(buildRealShapeSheets().Units);
  const classified = legacyCleanupClassifyUnits_(units);

  assert.deepEqual(classified.superseded.map((u) => u.UnitID).sort(), ["IM1-U1", "IM1-U2"]);
  assert.deepEqual(classified.noReplacement.map((u) => u.UnitID).sort(), ["IM1-U0", "IM1-U8"]);
});

test("legacyCleanupPopulatedFields_ reports only populated fields", () => {
  const populated = legacyCleanupPopulatedFields_({ RequiredDays: 9, OptionalDays: "" }, ["RequiredDays", "OptionalDays"]);
  assert.deepEqual(populated, [{ field: "RequiredDays", value: 9 }]);
});

test("legacyCleanupFindDependentDailyProgress_ matches by UnitID or LessonID", () => {
  const dailyProgress = objectsFromRawSheet(buildRealShapeSheets().DailyProgress);
  const deps = legacyCleanupFindDependentDailyProgress_(dailyProgress, ["IM1-U1"], ["IM1-U1-L1", "IM1-U1-L2"]);
  assert.equal(deps.length, 2);
});

test("legacyCleanupFindDuplicateIds_ finds duplicates only", () => {
  assert.deepEqual(legacyCleanupFindDuplicateIds_([{ UnitID: "A" }, { UnitID: "A" }, { UnitID: "B" }], "UnitID"), ["A"]);
});

// ---------------------------------------------------------------------------
// Plan building against the real production shape (regression proof: the
// real risk this sprint found must always be detected)
// ---------------------------------------------------------------------------

test("real production shape: IM1-U0 and IM1-U8 are out-of-scope, never candidates", () => {
  const plan = planFromRawSheets(buildRealShapeSheets());
  const candidateIds = plan.candidateUnits.map((u) => u.UnitID);
  assert.equal(candidateIds.includes("IM1-U0"), false);
  assert.equal(candidateIds.includes("IM1-U8"), false);
  assert.deepEqual(plan.noReplacementUnits.map((u) => u.UnitID).sort(), ["IM1-U0", "IM1-U8"]);
});

test("real production shape: IM1-U1 and IM1-U2 are blocked by populated teacher fields", () => {
  const plan = planFromRawSheets(buildRealShapeSheets());
  const u1 = plan.candidateUnits.find((u) => u.UnitID === "IM1-U1");
  const u2 = plan.candidateUnits.find((u) => u.UnitID === "IM1-U2");
  assert.equal(u1.classification, "blocked");
  assert.ok(u1.reasons.includes("preserve-teacher-fields"));
  assert.equal(u2.classification, "blocked");
  assert.ok(u2.reasons.includes("preserve-teacher-fields"));
});

test("real production shape: IM1-U1-L1/L2 are blocked by populated KeyOutcome/PlannedDays and dependent DailyProgress", () => {
  const plan = planFromRawSheets(buildRealShapeSheets());
  const l1 = plan.candidateLessons.find((l) => l.LessonID === "IM1-U1-L1");
  assert.equal(l1.classification, "blocked");
  assert.ok(l1.reasons.includes("preserve-teacher-fields"));
  assert.ok(l1.reasons.includes("dependent-records-exist"));
});

test("real production shape: safeToExecute is false", () => {
  const plan = planFromRawSheets(buildRealShapeSheets());
  assert.equal(plan.safeToExecute, false);
});

test("real production shape: Math 8 and AMP-IM1 rows are never candidates", () => {
  const plan = planFromRawSheets(buildRealShapeSheets());
  const allCandidateUnitIds = plan.candidateUnits.map((u) => u.UnitID);
  const allCandidateLessonIds = plan.candidateLessons.map((l) => l.LessonID);
  assert.equal(allCandidateUnitIds.some((id) => id.startsWith("M8-") || id.startsWith("AMP-IM1-")), false);
  assert.equal(allCandidateLessonIds.some((id) => id.startsWith("M8-") || id.startsWith("AMP-IM1-")), false);
});

test("preview report shape matches spec: found/dependent/deleted/preserved/safety/safeToExecute", () => {
  const plan = planFromRawSheets(buildRealShapeSheets());
  const report = legacyCleanupBuildPreviewReport_(plan, new Date("2026-07-30T00:00:00Z"));
  assert.ok(Array.isArray(report.legacyUnitsFound));
  assert.ok(Array.isArray(report.legacyLessonsFound));
  assert.ok(Array.isArray(report.dependentRecordsFoundByTable.DailyProgress));
  assert.ok(Array.isArray(report.recordsThatWouldBeDeleted.units));
  assert.ok(report.recordsPreserved);
  assert.ok(report.safetyValidation);
  assert.equal(report.safeToExecute, false);
  assert.equal(report.writesOccurred, false);
});

// ---------------------------------------------------------------------------
// Plan building against a fully-resolved (clean) shape
// ---------------------------------------------------------------------------

test("clean shape: IM1-U2/IM1-U2-L1 classify delete; IM1-U0/IM1-U8 still out of scope", () => {
  const plan = planFromRawSheets(buildCleanShapeSheets());
  assert.equal(plan.safeToExecute, true);
  const u2 = plan.candidateUnits.find((u) => u.UnitID === "IM1-U2");
  assert.equal(u2.classification, "delete");
  const l1 = plan.candidateLessons.find((l) => l.LessonID === "IM1-U2-L1");
  assert.equal(l1.classification, "delete");
  assert.deepEqual(plan.noReplacementUnits.map((u) => u.UnitID).sort(), ["IM1-U0", "IM1-U8"]);
});

test("legacyCleanupPlansMatch_ detects identical vs. changed plans", () => {
  const sheets = buildCleanShapeSheets();
  const planA = planFromRawSheets(sheets);
  const planB = planFromRawSheets(sheets);
  assert.equal(legacyCleanupPlansMatch_(planA, planB), true);

  const mutatedUnits = objectsFromRawSheet(sheets.Units).map((u) =>
    u.UnitID === "IM1-U2" ? { ...u, RequiredDays: 5 } : u,
  );
  const planC = legacyCleanupBuildPlan_({
    units: mutatedUnits,
    lessons: objectsFromRawSheet(sheets.Lessons),
    dailyProgress: objectsFromRawSheet(sheets.DailyProgress),
  });
  assert.equal(legacyCleanupPlansMatch_(planA, planC), false);
});

// ---------------------------------------------------------------------------
// Confirmation
// ---------------------------------------------------------------------------

test("confirmation: exact match only", () => {
  assert.equal(legacyCleanupValidateConfirmation_(LEGACY_CLEANUP_CONFIRMATION_PHRASE), true);
  assert.equal(legacyCleanupValidateConfirmation_(LEGACY_CLEANUP_CONFIRMATION_PHRASE + " "), false);
  assert.equal(legacyCleanupValidateConfirmation_(LEGACY_CLEANUP_CONFIRMATION_PHRASE.toLowerCase()), false);
  assert.equal(legacyCleanupValidateConfirmation_(true), false);
  assert.equal(legacyCleanupValidateConfirmation_(undefined), false);
});

test("editor placeholder never matches the real confirmation phrase", () => {
  assert.notEqual(LEGACY_CLEANUP_EDITOR_PLACEHOLDER_CONFIRMATION, LEGACY_CLEANUP_CONFIRMATION_PHRASE);
});

test("editor wrapper logs and returns the executor's report unchanged, no logic of its own", () => {
  const logged = [];
  const fakeReport = { mode: "execute", writesOccurred: true };
  const result = legacyCleanupRunEditorWrapper_("whatever", {
    executeCleanup: (confirmation) => {
      assert.equal(confirmation, "whatever");
      return fakeReport;
    },
    log: (msg) => logged.push(msg),
  });
  assert.equal(result, fakeReport);
  assert.equal(logged.length, 1);
});

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

test("legacyCleanupVerify_ passes on a fully cleaned-up state", () => {
  const afterData = {
    units: [
      { UnitID: "IM1-U0", CourseID: "IM1" },
      { UnitID: "IM1-U8", CourseID: "IM1" },
      { UnitID: "AMP-IM1-U2", CourseID: "IM1" },
      { UnitID: "M8-U1", CourseID: "M8" },
    ],
    lessons: [
      { LessonID: "AMP-IM1-U2-I01", UnitID: "AMP-IM1-U2", CourseID: "IM1" },
      { LessonID: "M8-U1-L1", UnitID: "M8-U1", CourseID: "M8" },
    ],
    dailyProgress: [{ DailyProgressID: "d1", CourseID: "M8", UnitID: "M8-U1" }],
  };
  const expected = { supersededUnitIds: ["IM1-U2"], supersededLessonIds: ["IM1-U2-L1"], math8UnitCount: 1, math8LessonCount: 1 };
  const verification = legacyCleanupVerify_(afterData, expected);
  assert.equal(verification.valid, true);
  assert.equal(verification.counts.ampIm1UnitCount, 1);
});

test("legacyCleanupVerify_ fails if a superseded legacy unit still exists", () => {
  const afterData = {
    units: [{ UnitID: "IM1-U2", CourseID: "IM1" }, { UnitID: "AMP-IM1-U2", CourseID: "IM1" }],
    lessons: [],
    dailyProgress: [],
  };
  const verification = legacyCleanupVerify_(afterData, { supersededUnitIds: ["IM1-U2"], supersededLessonIds: [] });
  assert.equal(verification.valid, false);
  assert.ok(verification.errors.some((e) => e.includes("IM1-U2")));
});

test("legacyCleanupVerify_ fails on orphaned DailyProgress referencing a deleted UnitID", () => {
  const afterData = {
    units: [{ UnitID: "AMP-IM1-U2", CourseID: "IM1" }],
    lessons: [],
    dailyProgress: [{ DailyProgressID: "orphan-1", CourseID: "IM1", UnitID: "IM1-U2" }],
  };
  const verification = legacyCleanupVerify_(afterData, { supersededUnitIds: [], supersededLessonIds: [] });
  assert.equal(verification.valid, false);
  assert.ok(verification.errors.some((e) => e.includes("orphan-1")));
});

test("legacyCleanupVerify_ fails if AMP-IM1 lesson count changed from the expected count", () => {
  const afterData = {
    units: [],
    lessons: new Array(163).fill(0).map((_, i) => ({ LessonID: "AMP-IM1-U1-I" + i, UnitID: "AMP-IM1-U1", CourseID: "IM1" })),
    dailyProgress: [],
  };
  const verification = legacyCleanupVerify_(afterData, {
    supersededUnitIds: [],
    supersededLessonIds: [],
    expectedAmpLessonCount: 164,
  });
  assert.equal(verification.valid, false);
  assert.ok(verification.errors.some((e) => e.includes("164")));
});

test("legacyCleanupVerify_ skips the AMP unit/lesson count check entirely when not supplied", () => {
  const afterData = {
    units: [{ UnitID: "AMP-IM1-U1", CourseID: "IM1" }],
    lessons: [{ LessonID: "AMP-IM1-U1-I01", UnitID: "AMP-IM1-U1", CourseID: "IM1" }],
    dailyProgress: [],
  };
  const verification = legacyCleanupVerify_(afterData, { supersededUnitIds: [], supersededLessonIds: [] });
  assert.equal(verification.valid, true);
});

// ---------------------------------------------------------------------------
// Full guarded execute sequence, against fakes only
// ---------------------------------------------------------------------------

function depsFor(sheets, { lockSucceeds = true } = {}) {
  const spreadsheet = createFakeSpreadsheetFromRawSheets(sheets);
  return {
    spreadsheetApp: createFakeSpreadsheetApp(spreadsheet),
    lockService: createFakeLockService({ acquireSucceeds: lockSucceeds }),
    sheetId: spreadsheet.id,
    formatTimestamp: () => "2026-07-30 000000",
    spreadsheet,
  };
}

test("execute: wrong confirmation refuses, touches nothing", () => {
  const deps = depsFor(buildCleanShapeSheets());
  const report = legacyCleanupExecuteLocked_("nope", deps);
  assert.equal(report.errorStage, "confirmation");
  assert.equal(report.writesOccurred, false);
});

test("execute: blocked plan (real production shape) refuses at the planning stage", () => {
  const deps = depsFor(buildRealShapeSheets());
  const report = legacyCleanupExecuteLocked_(LEGACY_CLEANUP_CONFIRMATION_PHRASE, deps);
  assert.equal(report.errorStage, "planning");
  assert.equal(report.writesOccurred, false);
  assert.equal(report.backup, null);
});

test("execute: lock-acquisition failure refuses, touches nothing", () => {
  const deps = depsFor(buildCleanShapeSheets(), { lockSucceeds: false });
  const report = legacyCleanupExecuteLocked_(LEGACY_CLEANUP_CONFIRMATION_PHRASE, deps);
  assert.equal(report.errorStage, "lock");
  assert.equal(report.writesOccurred, false);
});

test("execute: backup failure refuses before any deletion", () => {
  const deps = depsFor(buildCleanShapeSheets());
  deps.spreadsheet.copy = () => {
    throw new Error("simulated Drive failure");
  };
  const report = legacyCleanupExecuteLocked_(LEGACY_CLEANUP_CONFIRMATION_PHRASE, deps);
  assert.equal(report.errorStage, "backup");
  assert.equal(report.writesOccurred, false);
});

test("execute: clean shape succeeds — deletes exactly IM1-U2/IM1-U2-L1, leaves everything else, verifies, creates one backup", () => {
  const deps = depsFor(buildCleanShapeSheets());
  const report = legacyCleanupExecuteLocked_(LEGACY_CLEANUP_CONFIRMATION_PHRASE, deps);

  assert.equal(report.errorStage, null, report.errorMessage);
  assert.equal(report.writesOccurred, true);
  assert.equal(report.unitsRemoved, 1);
  assert.equal(report.lessonsRemoved, 1);
  assert.ok(report.backup && report.backup.id);
  assert.equal(report.verification.valid, true, JSON.stringify(report.verification.errors));

  const unitsSheet = deps.spreadsheet.getSheetByName("Units");
  const unitIds = unitsSheet.values.slice(1).map((r) => r[0]);
  assert.equal(unitIds.includes("IM1-U2"), false);
  assert.equal(unitIds.includes("IM1-U0"), true, "IM1-U0 (no AMP replacement) must survive");
  assert.equal(unitIds.includes("IM1-U8"), true, "IM1-U8 (no AMP replacement) must survive");
  assert.equal(unitIds.includes("AMP-IM1-U2"), true);
  assert.equal(unitIds.includes("M8-U1"), true);

  const lessonsSheet = deps.spreadsheet.getSheetByName("Lessons");
  const lessonIds = lessonsSheet.values.slice(1).map((r) => r[0]);
  assert.equal(lessonIds.includes("IM1-U2-L1"), false);
  assert.equal(lessonIds.includes("IM1-U0-L1"), true);
  assert.equal(lessonIds.includes("M8-U1-L1"), true);
});

test("execute: idempotent — rerunning after a successful cleanup finds nothing left to do (refuses, not a false success)", () => {
  const deps = depsFor(buildCleanShapeSheets());
  const first = legacyCleanupExecuteLocked_(LEGACY_CLEANUP_CONFIRMATION_PHRASE, deps);
  assert.equal(first.errorStage, null);

  const second = legacyCleanupExecuteLocked_(LEGACY_CLEANUP_CONFIRMATION_PHRASE, deps);
  // No candidates remain (IM1-U2 is gone), so the plan has zero delete
  // candidates. hasCandidates is false, so safeToExecute is false —
  // refusing is the correct, honest outcome for "there is nothing left to
  // clean up," not a false success and not a second backup.
  assert.equal(second.errorStage, "planning");
  assert.equal(second.backup, null);
  assert.equal(second.writesOccurred, false);
});

test("execute: revalidation aborts if the plan changes between planning and mutation", () => {
  const deps = depsFor(buildCleanShapeSheets());
  const originalBuildLivePlan = deps.spreadsheet.getSheetByName;
  let callCount = 0;
  const realGetSheetByName = deps.spreadsheet.getSheetByName.bind(deps.spreadsheet);
  deps.spreadsheet.getSheetByName = function (name) {
    if (name === "Units") {
      callCount += 1;
      // Second read (revalidation pass, inside legacyCleanupBuildLivePlan_'s
      // second call) sees an extra populated teacher field, simulating a
      // concurrent classroom edit landing in the window between planning
      // and mutation.
      if (callCount === 2) {
        const sheet = realGetSheetByName(name);
        const clone = sheet.clone();
        const idIndex = clone.values[0].indexOf("UnitID");
        const reqIndex = clone.values[0].indexOf("RequiredDays");
        clone.values.forEach((r) => {
          if (r[idIndex] === "IM1-U2") r[reqIndex] = 3;
        });
        return clone;
      }
    }
    return realGetSheetByName(name);
  };

  const report = legacyCleanupExecuteLocked_(LEGACY_CLEANUP_CONFIRMATION_PHRASE, deps);
  assert.equal(report.errorStage, "revalidation");
  assert.equal(report.writesOccurred, false);
  assert.ok(report.backup, "backup is created before revalidation, so it should still be present");
});
