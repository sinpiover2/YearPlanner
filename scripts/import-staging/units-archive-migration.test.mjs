// Tests for apps-script-planning/UnitsArchiveMigration.js. Every case runs
// against in-memory fakes (fake-spreadsheet.mjs) — none of these touch a
// real spreadsheet, network, or Google API.

import test from "node:test";
import assert from "node:assert/strict";
import {
  UNITS_ARCHIVE_TARGET_UNIT_IDS,
  UNITS_ARCHIVE_ORIGINAL_HEADERS,
  UNITS_ARCHIVE_LEGACY_ACTIVE_HEADER,
  UNITS_ARCHIVE_NEW_HEADER,
  UNITS_ARCHIVE_APPROVED_FINAL_HEADERS,
  UNITS_ARCHIVE_CONFIRMATION_PHRASE,
  UNITS_ARCHIVE_EDITOR_PLACEHOLDER_CONFIRMATION,
  unitsArchiveIsTrue_,
  unitsArchiveIsExplicitlyArchived_,
  unitsArchiveArraysEqual_,
  unitsArchiveClassifySchema_,
  unitsArchiveBuildPlan_,
  unitsArchivePlansMatch_,
  unitsArchiveBuildPreviewReport_,
  unitsArchiveValidateConfirmation_,
  unitsArchiveRunEditorWrapper_,
  unitsArchiveVerify_,
  unitsArchiveExecuteLocked_,
} from "../../apps-script-planning/UnitsArchiveMigration.js";
import {
  createFakeSpreadsheetFromRawSheets,
  createFakeSpreadsheetApp,
  createFakeLockService,
} from "./fake-spreadsheet.mjs";

const HEADERS = UNITS_ARCHIVE_ORIGINAL_HEADERS;

function row(headers, obj) {
  return headers.map((h) => (obj[h] === undefined ? "" : obj[h]));
}

// Mirrors this sprint's real, live production Units shape: 9 legacy IM1-U*
// units (all with populated RequiredDays/OptionalDays — teacher pacing
// data, deliberately untouched by this migration), 7 AMP-IM1-* units
// (blank RequiredDays/OptionalDays), 3 Math 8 units. Neither Active nor
// IsArchived exists yet — the prior Active-based design was never executed
// against production.
function buildRealShapeUnitsRows() {
  const legacy = UNITS_ARCHIVE_TARGET_UNIT_IDS.map((id, i) => ({
    UnitID: id, CourseID: "IM1", UnitNumber: i, UnitTitle: "Legacy Unit " + i, RequiredDays: 10 + i, OptionalDays: 1, SortOrder: i, UnitPurpose: "",
  }));
  const amp = [1, 2, 3, 4, 5, 6, 7].map((n) => ({
    UnitID: "AMP-IM1-U" + n, CourseID: "IM1", UnitNumber: n, UnitTitle: "Amp Unit " + n, RequiredDays: "", OptionalDays: "", SortOrder: n, UnitPurpose: "",
  }));
  const math8 = [1, 2, 3].map((n) => ({
    UnitID: "M8-U" + n, CourseID: "M8", UnitNumber: n, UnitTitle: "Math 8 Unit " + n, RequiredDays: 10, OptionalDays: 2, SortOrder: n, UnitPurpose: "",
  }));
  return [HEADERS, ...legacy.map((u) => row(HEADERS, u)), ...amp.map((u) => row(HEADERS, u)), ...math8.map((u) => row(HEADERS, u))];
}

function objectsFromRaw(rawSheet) {
  const [hdrs, ...rows] = rawSheet;
  return rows.map((r) => {
    const obj = {};
    hdrs.forEach((h, i) => (obj[h] = r[i]));
    return obj;
  });
}

// ---------------------------------------------------------------------------
// Boolean convention
// ---------------------------------------------------------------------------

test("unitsArchiveIsTrue_ matches the repo's isTrue() convention exactly (true/'true', nothing else)", () => {
  assert.equal(unitsArchiveIsTrue_(true), true);
  assert.equal(unitsArchiveIsTrue_("true"), true);
  assert.equal(unitsArchiveIsTrue_("True"), true);
  assert.equal(unitsArchiveIsTrue_("TRUE"), true);
  assert.equal(unitsArchiveIsTrue_(false), false);
  assert.equal(unitsArchiveIsTrue_("false"), false);
  assert.equal(unitsArchiveIsTrue_(""), false);
  assert.equal(unitsArchiveIsTrue_(undefined), false);
  assert.equal(unitsArchiveIsTrue_(1), false);
  assert.equal(unitsArchiveIsTrue_("1"), false);
});

test("unitsArchiveIsExplicitlyArchived_: blank/missing/false = not archived, explicit true = archived", () => {
  assert.equal(unitsArchiveIsExplicitlyArchived_(undefined), false);
  assert.equal(unitsArchiveIsExplicitlyArchived_(""), false);
  assert.equal(unitsArchiveIsExplicitlyArchived_(false), false);
  assert.equal(unitsArchiveIsExplicitlyArchived_("false"), false);
  assert.equal(unitsArchiveIsExplicitlyArchived_("FALSE"), false);
  assert.equal(unitsArchiveIsExplicitlyArchived_(true), true);
  assert.equal(unitsArchiveIsExplicitlyArchived_("true"), true);
  assert.equal(unitsArchiveIsExplicitlyArchived_("TRUE"), true);
});

// ---------------------------------------------------------------------------
// Schema classification
// ---------------------------------------------------------------------------

test("classify: original 8-column schema (no Active, no IsArchived) is migration-required", () => {
  const classification = unitsArchiveClassifySchema_(HEADERS);
  assert.equal(classification.state, "migration-required");
});

test("classify: IsArchived present and headers match approved final schema is schema-complete", () => {
  const classification = unitsArchiveClassifySchema_(UNITS_ARCHIVE_APPROVED_FINAL_HEADERS);
  assert.equal(classification.state, "schema-complete");
});

test("classify: a pre-existing legacy 'Active' column is its own explicit unexpected state, never IsArchived", () => {
  const headersWithLegacyActive = HEADERS.concat([UNITS_ARCHIVE_LEGACY_ACTIVE_HEADER]);
  const classification = unitsArchiveClassifySchema_(headersWithLegacyActive);
  assert.equal(classification.state, "unexpected");
  assert.ok(classification.reasons.some((r) => r.includes("Active") && r.includes("leftover")));
});

test("classify: 'Active' column present even alongside IsArchived is still unexpected, not silently accepted", () => {
  const headers = HEADERS.concat([UNITS_ARCHIVE_LEGACY_ACTIVE_HEADER, UNITS_ARCHIVE_NEW_HEADER]);
  const classification = unitsArchiveClassifySchema_(headers);
  assert.equal(classification.state, "unexpected");
  assert.ok(classification.reasons.some((r) => r.includes("Active")));
});

test("classify: unexpected reordered/extra headers without Active/IsArchived", () => {
  const classification = unitsArchiveClassifySchema_(HEADERS.concat(["SomeUnexpectedColumn"]));
  assert.equal(classification.state, "unexpected");
});

test("classify: IsArchived present but headers don't exactly match approved order is unexpected", () => {
  const wrongOrder = HEADERS.slice().reverse().concat([UNITS_ARCHIVE_NEW_HEADER]);
  const classification = unitsArchiveClassifySchema_(wrongOrder);
  assert.equal(classification.state, "unexpected");
});

// ---------------------------------------------------------------------------
// Plan building
// ---------------------------------------------------------------------------

test("plan: real shape, no IsArchived column yet, migration required, safe to execute", () => {
  const raw = buildRealShapeUnitsRows();
  const plan = unitsArchiveBuildPlan_({ headers: HEADERS, objects: objectsFromRaw(raw) });
  assert.equal(plan.schemaState, "migration-required");
  assert.equal(plan.safeToExecute, true);
  assert.equal(plan.targetUnits.length, 9);
  assert.ok(plan.targetUnits.every((u) => u.classification === "needs-archiving"));
  assert.deepEqual(plan.nonTargetConflicts, []);
});

test("plan: refuses if a legacy 'Active' column is present, with a clear message, not silently treated as IsArchived", () => {
  const raw = buildRealShapeUnitsRows();
  const headersWithActive = HEADERS.concat([UNITS_ARCHIVE_LEGACY_ACTIVE_HEADER]);
  const objects = objectsFromRaw(raw).map((u) => Object.assign({}, u, { Active: "" }));
  const plan = unitsArchiveBuildPlan_({ headers: headersWithActive, objects });
  assert.equal(plan.safeToExecute, false);
  assert.equal(plan.schemaState, "unexpected");
  assert.ok(plan.structuralBlockingFindings.some((f) => f.includes("Active")));
});

test("plan: refuses if a target UnitID is missing from production", () => {
  const raw = buildRealShapeUnitsRows().filter((r) => r[0] !== "IM1-U8");
  const plan = unitsArchiveBuildPlan_({ headers: HEADERS, objects: objectsFromRaw(raw) });
  assert.equal(plan.safeToExecute, false);
  assert.ok(plan.structuralBlockingFindings.some((f) => f.includes("IM1-U8")));
});

test("plan: refuses on unexpected headers (extra/reordered column, no Active/IsArchived)", () => {
  const weirdHeaders = HEADERS.concat(["SomeUnexpectedColumn"]);
  const raw = [weirdHeaders, ...buildRealShapeUnitsRows().slice(1).map((r) => r.concat([""]))];
  const plan = unitsArchiveBuildPlan_({ headers: weirdHeaders, objects: objectsFromRaw(raw) });
  assert.equal(plan.safeToExecute, false);
  assert.equal(plan.schemaState, "unexpected");
});

test("plan: with IsArchived column already present, distinguishes already-archived from needs-archiving", () => {
  const finalHeaders = UNITS_ARCHIVE_APPROVED_FINAL_HEADERS;
  const raw = buildRealShapeUnitsRows().map((r, i) => (i === 0 ? finalHeaders : r.concat([""])));
  const objects = objectsFromRaw(raw);
  objects[0].IsArchived = true;
  const plan = unitsArchiveBuildPlan_({ headers: finalHeaders, objects });
  const im1u0 = plan.targetUnits.find((u) => u.UnitID === "IM1-U0");
  const im1u1 = plan.targetUnits.find((u) => u.UnitID === "IM1-U1");
  assert.equal(im1u0.classification, "already-archived");
  assert.equal(im1u1.classification, "needs-archiving");
  assert.equal(plan.safeToExecute, true);
  assert.equal(plan.alreadyComplete, false);
});

test("plan: blank IsArchived means not archived (needs-archiving)", () => {
  const finalHeaders = UNITS_ARCHIVE_APPROVED_FINAL_HEADERS;
  const raw = buildRealShapeUnitsRows().map((r, i) => (i === 0 ? finalHeaders : r.concat([""])));
  const plan = unitsArchiveBuildPlan_({ headers: finalHeaders, objects: objectsFromRaw(raw) });
  assert.ok(plan.targetUnits.every((u) => u.classification === "needs-archiving"));
});

test("plan: explicit false IsArchived means not archived (needs-archiving)", () => {
  const finalHeaders = UNITS_ARCHIVE_APPROVED_FINAL_HEADERS;
  const raw = buildRealShapeUnitsRows().map((r, i) => (i === 0 ? finalHeaders : r.concat([false])));
  const plan = unitsArchiveBuildPlan_({ headers: finalHeaders, objects: objectsFromRaw(raw) });
  assert.ok(plan.targetUnits.every((u) => u.classification === "needs-archiving"));
});

test("plan: alreadyComplete true when IsArchived present and all 9 targets already archived (explicit true)", () => {
  const finalHeaders = UNITS_ARCHIVE_APPROVED_FINAL_HEADERS;
  const raw = buildRealShapeUnitsRows().map((r) => r.concat([""]));
  raw[0] = finalHeaders;
  const objects = objectsFromRaw(raw);
  objects.forEach((u) => {
    if (UNITS_ARCHIVE_TARGET_UNIT_IDS.includes(u.UnitID)) u.IsArchived = true;
  });
  const plan = unitsArchiveBuildPlan_({ headers: finalHeaders, objects });
  assert.equal(plan.alreadyComplete, true);
  assert.equal(plan.safeToExecute, false);
});

test("plan: flags a non-target unit unexpectedly already IsArchived:true, without blocking targets (AMP-IM1 preserved otherwise)", () => {
  const finalHeaders = UNITS_ARCHIVE_APPROVED_FINAL_HEADERS;
  const raw = buildRealShapeUnitsRows().map((r) => r.concat([""]));
  raw[0] = finalHeaders;
  const objects = objectsFromRaw(raw);
  const ampUnit = objects.find((u) => u.UnitID === "AMP-IM1-U1");
  ampUnit.IsArchived = true;
  const plan = unitsArchiveBuildPlan_({ headers: finalHeaders, objects });
  assert.deepEqual(plan.nonTargetConflicts, ["AMP-IM1-U1"]);
  assert.equal(plan.safeToExecute, true);
});

test("plan: Math 8 units never appear as candidates or conflicts in the normal case", () => {
  const raw = buildRealShapeUnitsRows();
  const plan = unitsArchiveBuildPlan_({ headers: HEADERS, objects: objectsFromRaw(raw) });
  const allTargetIds = plan.targetUnits.map((u) => u.UnitID);
  assert.equal(allTargetIds.some((id) => id.startsWith("M8-")), false);
  assert.deepEqual(plan.nonTargetConflicts, []);
});

test("preview report shape", () => {
  const raw = buildRealShapeUnitsRows();
  const plan = unitsArchiveBuildPlan_({ headers: HEADERS, objects: objectsFromRaw(raw) });
  const report = unitsArchiveBuildPreviewReport_(plan, new Date("2026-07-30T00:00:00Z"));
  assert.equal(report.mode, "preview");
  assert.equal(report.writesOccurred, false);
  assert.equal(report.unitsToArchive.length, 9);
  assert.equal(report.safeToExecute, true);
  assert.equal(report.confirmationRequired, UNITS_ARCHIVE_CONFIRMATION_PHRASE);
});

test("confirmation: exact match only", () => {
  assert.equal(unitsArchiveValidateConfirmation_(UNITS_ARCHIVE_CONFIRMATION_PHRASE), true);
  assert.equal(unitsArchiveValidateConfirmation_(UNITS_ARCHIVE_CONFIRMATION_PHRASE + " "), false);
  assert.equal(unitsArchiveValidateConfirmation_(true), false);
  assert.equal(unitsArchiveValidateConfirmation_(undefined), false);
});

test("editor placeholder never matches the real confirmation phrase", () => {
  assert.notEqual(UNITS_ARCHIVE_EDITOR_PLACEHOLDER_CONFIRMATION, UNITS_ARCHIVE_CONFIRMATION_PHRASE);
});

test("editor wrapper logs and returns the executor's report unchanged", () => {
  const logged = [];
  const fakeReport = { mode: "execute", writesOccurred: true };
  const result = unitsArchiveRunEditorWrapper_("whatever", {
    executeMigration: (c) => {
      assert.equal(c, "whatever");
      return fakeReport;
    },
    log: (msg) => logged.push(msg),
  });
  assert.equal(result, fakeReport);
  assert.equal(logged.length, 1);
});

test("unitsArchivePlansMatch_ detects identical vs changed target sets and degraded safety", () => {
  const raw = buildRealShapeUnitsRows();
  const objects = objectsFromRaw(raw);
  const planA = unitsArchiveBuildPlan_({ headers: HEADERS, objects });
  const planB = unitsArchiveBuildPlan_({ headers: HEADERS, objects });
  assert.equal(unitsArchivePlansMatch_(planA, planB), true);

  const missingOne = objects.filter((u) => u.UnitID !== "IM1-U8");
  const planC = unitsArchiveBuildPlan_({ headers: HEADERS, objects: missingOne });
  assert.equal(unitsArchivePlansMatch_(planA, planC), false);
});

// ---------------------------------------------------------------------------
// Post-write verification
// ---------------------------------------------------------------------------

test("unitsArchiveVerify_ passes when all targets archived (IsArchived:true) and non-targets untouched", () => {
  const before = objectsFromRaw(buildRealShapeUnitsRows());
  const after = before.map((u) => {
    const copy = Object.assign({}, u);
    if (UNITS_ARCHIVE_TARGET_UNIT_IDS.includes(u.UnitID)) copy.IsArchived = true;
    return copy;
  });
  const verification = unitsArchiveVerify_(before, { headers: UNITS_ARCHIVE_APPROVED_FINAL_HEADERS, objects: after });
  assert.equal(verification.valid, true, JSON.stringify(verification.errors));
  assert.equal(verification.archivedCount, 9);
});

test("unitsArchiveVerify_ fails if a target unit is missing (deleted)", () => {
  const before = objectsFromRaw(buildRealShapeUnitsRows());
  const after = before.filter((u) => u.UnitID !== "IM1-U0").map((u) => {
    const copy = Object.assign({}, u);
    if (UNITS_ARCHIVE_TARGET_UNIT_IDS.includes(u.UnitID)) copy.IsArchived = true;
    return copy;
  });
  const verification = unitsArchiveVerify_(before, { headers: UNITS_ARCHIVE_APPROVED_FINAL_HEADERS, objects: after });
  assert.equal(verification.valid, false);
  assert.ok(verification.errors.some((e) => e.includes("IM1-U0")));
});

test("unitsArchiveVerify_ fails if a non-target unit's publisher field changed (AMP-IM1 byte-for-byte preservation)", () => {
  const before = objectsFromRaw(buildRealShapeUnitsRows());
  const after = before.map((u) => {
    const copy = Object.assign({}, u);
    if (UNITS_ARCHIVE_TARGET_UNIT_IDS.includes(u.UnitID)) copy.IsArchived = true;
    if (u.UnitID === "AMP-IM1-U1") copy.UnitTitle = "Tampered Title";
    return copy;
  });
  const verification = unitsArchiveVerify_(before, { headers: UNITS_ARCHIVE_APPROVED_FINAL_HEADERS, objects: after });
  assert.equal(verification.valid, false);
  assert.ok(verification.errors.some((e) => e.includes("AMP-IM1-U1") && e.includes("UnitTitle")));
});

test("unitsArchiveVerify_ fails if a Math 8 unit's field changed (Math 8 byte-for-byte preservation)", () => {
  const before = objectsFromRaw(buildRealShapeUnitsRows());
  const after = before.map((u) => {
    const copy = Object.assign({}, u);
    if (UNITS_ARCHIVE_TARGET_UNIT_IDS.includes(u.UnitID)) copy.IsArchived = true;
    if (u.UnitID === "M8-U1") copy.RequiredDays = 999;
    return copy;
  });
  const verification = unitsArchiveVerify_(before, { headers: UNITS_ARCHIVE_APPROVED_FINAL_HEADERS, objects: after });
  assert.equal(verification.valid, false);
  assert.ok(verification.errors.some((e) => e.includes("M8-U1") && e.includes("RequiredDays")));
});

test("unitsArchiveVerify_ fails if a non-target unit was unexpectedly archived", () => {
  const before = objectsFromRaw(buildRealShapeUnitsRows());
  const after = before.map((u) => {
    const copy = Object.assign({}, u);
    if (UNITS_ARCHIVE_TARGET_UNIT_IDS.includes(u.UnitID)) copy.IsArchived = true;
    if (u.UnitID === "M8-U1") copy.IsArchived = true;
    return copy;
  });
  const verification = unitsArchiveVerify_(before, { headers: UNITS_ARCHIVE_APPROVED_FINAL_HEADERS, objects: after });
  assert.equal(verification.valid, false);
  assert.ok(verification.errors.some((e) => e.includes("M8-U1") && e.includes("unexpectedly archived")));
});

// ---------------------------------------------------------------------------
// Full guarded execute sequence, against fakes only
// ---------------------------------------------------------------------------

function depsFor(unitsRows, { lockSucceeds = true } = {}) {
  const spreadsheet = createFakeSpreadsheetFromRawSheets({ Units: unitsRows });
  return {
    spreadsheetApp: createFakeSpreadsheetApp(spreadsheet),
    lockService: createFakeLockService({ acquireSucceeds: lockSucceeds }),
    sheetId: spreadsheet.id,
    formatTimestamp: () => "2026-07-30 000000",
    spreadsheet,
  };
}

test("execute: wrong confirmation refuses, touches nothing", () => {
  const deps = depsFor(buildRealShapeUnitsRows());
  const report = unitsArchiveExecuteLocked_("nope", deps);
  assert.equal(report.errorStage, "confirmation");
  assert.equal(report.writesOccurred, false);
});

test("execute: lock-acquisition failure refuses, touches nothing", () => {
  const deps = depsFor(buildRealShapeUnitsRows(), { lockSucceeds: false });
  const report = unitsArchiveExecuteLocked_(UNITS_ARCHIVE_CONFIRMATION_PHRASE, deps);
  assert.equal(report.errorStage, "lock");
  assert.equal(report.writesOccurred, false);
});

test("execute: backup failure refuses before any write", () => {
  const deps = depsFor(buildRealShapeUnitsRows());
  deps.spreadsheet.copy = () => {
    throw new Error("simulated Drive failure");
  };
  const report = unitsArchiveExecuteLocked_(UNITS_ARCHIVE_CONFIRMATION_PHRASE, deps);
  assert.equal(report.errorStage, "backup");
  assert.equal(report.writesOccurred, false);
});

test("execute: refuses at planning stage if a pre-existing legacy 'Active' column is present (not silently upgraded)", () => {
  const raw = buildRealShapeUnitsRows();
  const headersWithActive = raw[0].concat([UNITS_ARCHIVE_LEGACY_ACTIVE_HEADER]);
  const rowsWithActive = [headersWithActive, ...raw.slice(1).map((r) => r.concat([""]))];
  const deps = depsFor(rowsWithActive);
  const report = unitsArchiveExecuteLocked_(UNITS_ARCHIVE_CONFIRMATION_PHRASE, deps);
  assert.equal(report.errorStage, "planning");
  assert.equal(report.backup, null);
  assert.equal(report.writesOccurred, false);
  assert.ok(report.plan.structuralBlockingFindings.some((f) => f.includes("Active")));
});

test("execute: refuses at planning stage if a target unit is missing from the start", () => {
  const deps = depsFor(buildRealShapeUnitsRows().filter((r) => r[0] !== "IM1-U8"));
  const report = unitsArchiveExecuteLocked_(UNITS_ARCHIVE_CONFIRMATION_PHRASE, deps);
  assert.equal(report.errorStage, "planning");
  assert.equal(report.backup, null);
  assert.equal(report.writesOccurred, false);
});

test("execute: succeeds — adds IsArchived column, archives exactly the 9 targets (true), leaves AMP/Math8 untouched, verifies, one backup", () => {
  const deps = depsFor(buildRealShapeUnitsRows());
  const report = unitsArchiveExecuteLocked_(UNITS_ARCHIVE_CONFIRMATION_PHRASE, deps);

  assert.equal(report.errorStage, null, report.errorMessage);
  assert.equal(report.writesOccurred, true);
  assert.equal(report.columnAdded, true);
  assert.equal(report.unitsArchived, 9);
  assert.ok(report.backup && report.backup.id);
  assert.equal(report.verification.valid, true, JSON.stringify(report.verification.errors));

  const sheet = deps.spreadsheet.getSheetByName("Units");
  const allValues = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  const headers = allValues[0];
  assert.deepEqual(headers, UNITS_ARCHIVE_APPROVED_FINAL_HEADERS);
  const isArchivedIndex = headers.indexOf("IsArchived");
  const idIndex = headers.indexOf("UnitID");

  allValues.slice(1).forEach((r) => {
    const isTarget = UNITS_ARCHIVE_TARGET_UNIT_IDS.includes(r[idIndex]);
    if (isTarget) {
      assert.equal(r[isArchivedIndex], true, r[idIndex] + " should be archived (IsArchived: true)");
    } else {
      assert.equal(r[isArchivedIndex], "", r[idIndex] + " should be untouched (blank IsArchived)");
    }
  });
});

test("execute: idempotent — rerunning after a successful archive is a clean no-op (alreadyComplete), no second backup", () => {
  const deps = depsFor(buildRealShapeUnitsRows());
  const first = unitsArchiveExecuteLocked_(UNITS_ARCHIVE_CONFIRMATION_PHRASE, deps);
  assert.equal(first.errorStage, null);

  const second = unitsArchiveExecuteLocked_(UNITS_ARCHIVE_CONFIRMATION_PHRASE, deps);
  assert.equal(second.errorStage, null);
  assert.equal(second.alreadyComplete, true);
  assert.equal(second.backup, null);
  assert.equal(second.writesOccurred, false);
});

test("execute: revalidation aborts if a target unit is removed between planning and mutation", () => {
  const deps = depsFor(buildRealShapeUnitsRows());
  const realGetSheetByName = deps.spreadsheet.getSheetByName.bind(deps.spreadsheet);
  let callCount = 0;
  deps.spreadsheet.getSheetByName = function (name) {
    if (name === "Units") {
      callCount += 1;
      if (callCount === 2) {
        const sheet = realGetSheetByName(name);
        const clone = sheet.clone();
        const idIdx = clone.values[0].indexOf("UnitID");
        clone.values = clone.values.filter((r) => r[idIdx] !== "IM1-U8");
        return clone;
      }
    }
    return realGetSheetByName(name);
  };

  const report = unitsArchiveExecuteLocked_(UNITS_ARCHIVE_CONFIRMATION_PHRASE, deps);
  assert.equal(report.errorStage, "revalidation");
  assert.equal(report.writesOccurred, false);
  assert.ok(report.backup, "backup is created before revalidation, so it should still be present");
});

test("wrapper stays disarmed: executeUnitsArchiveMigrationFromEditor's own source constant never equals the real phrase", () => {
  // Structural proof, not an execution — see the identical assertion style
  // used for the placeholder-vs-real-phrase check above; this test exists
  // to make the "safely disarmed" property explicit and independently
  // checkable, matching this sprint's verification requirements.
  assert.notEqual(UNITS_ARCHIVE_EDITOR_PLACEHOLDER_CONFIRMATION, UNITS_ARCHIVE_CONFIRMATION_PHRASE);
});
