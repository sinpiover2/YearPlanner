// Guarded, narrowly-scoped schema migration: adds the Type and
// PlacementRule columns to the production Lessons sheet, required before
// AmplifyIm1Importer.js's schema validation can ever pass for Lessons (see
// docs/Development/AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md's Sprint 4/5
// sections — Type/PlacementRule confirmed absent from production by a
// read-only audit).
//
// SAFETY STATUS AS OF THIS SPRINT: structurally complete and locally
// simulated only. executeLessonsTypePlacementRuleMigration() has NEVER been
// run against the real production spreadsheet — every test in
// scripts/import-staging/lessons-schema-migration.test.mjs exercises this
// file's logic against in-memory fakes only. Do not treat "the code exists"
// as "the code has been proven safe against real Sheets."
//
// Deliberately a separate file from AmplifyIm1Importer.js and Code.js — a
// schema migration and a curriculum-row importer are different kinds of
// operation with different blast radii, and this file must remain
// independently reviewable and removable without touching either of those.
// It never adds, edits, or reads a curriculum row, and never touches the
// Units sheet at all.
//
// Precedent this file follows: apps-script-roster-admin/
// ProductionDataCleanup.js (preview/execute split, LockService guard,
// backup-before-write, planning-pass + revalidation-pass-under-lock,
// structured report, exact-string confirmation) and
// apps-script-planning/AmplifyIm1Importer.js (same guarded-write-sequence
// shape, applied here to a schema change instead of a data import).
//
// Hard dependency: SHEET_ID (Code.js, same Apps Script project, shared
// global namespace).
//
// Every function below prefixed `lessonsMigration` to avoid colliding with
// the global namespace shared by every file in this Apps Script project.
//
// ============================================================================
// SECTION 1 — Pure logic (no SpreadsheetApp/LockService/Utilities calls).
// Exercised directly from Node via the module.exports guard at the bottom of
// this file — see scripts/import-staging/lessons-schema-migration.test.mjs.
// ============================================================================

// Audited production Lessons header order, confirmed by the Sprint 5
// read-only production audit (55 data rows at the time of that audit — see
// the implementation spec). This migration refuses unless the live sheet's
// headers match this exact array, in this exact order — no partial or
// fuzzy match.
const LESSONS_MIGRATION_ORIGINAL_HEADERS = [
  "LessonID",
  "UnitID",
  "CourseID",
  "LessonNumber",
  "LessonTitle",
  "PlannedDays",
  "SortOrder",
  "KeyOutcome",
  "Description",
  "PrimaryLink",
  "TeacherNotes",
  "IsOptional",
];

// New columns this migration adds, in the order they are inserted.
const LESSONS_MIGRATION_NEW_HEADERS = ["Type", "PlacementRule"];

// Inserted immediately after this header — placing the new sequencing/type
// fields with the other structural fields (LessonNumber, PlannedDays,
// SortOrder) rather than the content fields that follow (KeyOutcome,
// Description, ...). See LESSONS_SCHEMA_MIGRATION_README.md for the full
// consumer-safety review that confirmed this insertion point is safe: every
// Apps Script reader/writer resolves columns via headers.indexOf(...) at
// call time, never a fixed numeric position, and the frontend only ever
// consumes the JSON objects getSheetData() already produces by header name.
const LESSONS_MIGRATION_INSERT_AFTER_HEADER = "SortOrder";

// The exact, approved header order once this migration has run.
const LESSONS_MIGRATION_APPROVED_FINAL_HEADERS = [
  "LessonID",
  "UnitID",
  "CourseID",
  "LessonNumber",
  "LessonTitle",
  "PlannedDays",
  "SortOrder",
  "Type",
  "PlacementRule",
  "KeyOutcome",
  "Description",
  "PrimaryLink",
  "TeacherNotes",
  "IsOptional",
];

// Exact `===` match only. No trim, no case-folding, no boolean/truthy
// acceptance. Immutable by design (not derived from a row count, which can
// legitimately change before this migration is ever authorized to run) —
// see this sprint's documentation for why the row-count-suffixed form
// suggested first was rejected in favor of this one.
const LESSONS_MIGRATION_CONFIRMATION_PHRASE = "MIGRATE_LESSONS_SCHEMA_ADD_TYPE_AND_PLACEMENTRULE_V1";

function lessonsMigrationIsBlank_(value) {
  return value === null || value === undefined || value === "";
}

// Excludes the blank string itself — a blank header is reported separately
// by lessonsMigrationFindBlankHeaders_ so the two defects are never
// conflated into one ambiguous finding.
function lessonsMigrationFindDuplicateHeaders_(headers) {
  const counts = {};
  headers.forEach(function (header) {
    if (header === "") return;
    counts[header] = (counts[header] || 0) + 1;
  });
  return Object.keys(counts).filter(function (header) {
    return counts[header] > 1;
  });
}

// Returns 0-indexed positions within the headers array (as read, i.e.
// bounded by the sheet's current last column — so this only ever reports
// blanks inside the active header row, never phantom trailing columns).
function lessonsMigrationFindBlankHeaders_(headers) {
  const indices = [];
  headers.forEach(function (header, index) {
    if (String(header).trim() === "") indices.push(index);
  });
  return indices;
}

function lessonsMigrationArraysEqual_(a, b) {
  return a.length === b.length && a.every(function (value, index) {
    return value === b[index];
  });
}

// The single source of truth for what state the live Lessons schema is in.
// Every branch below maps directly onto this sprint's required schema-state
// classifications (see the implementation spec's Sprint 6.2A section):
// migration-required, already-complete, partially-complete, unexpected.
// Deliberately conservative: any ambiguity (duplicate/blank header, unknown
// interleaved column, wrong order) falls to "unexpected" and refuses, rather
// than guessing.
function lessonsMigrationClassifySchema_(headers) {
  const duplicateHeaders = lessonsMigrationFindDuplicateHeaders_(headers);
  const blankHeaderPositions = lessonsMigrationFindBlankHeaders_(headers).map(function (index) {
    return index + 1;
  });

  if (duplicateHeaders.length > 0 || blankHeaderPositions.length > 0) {
    const reasons = [];
    if (duplicateHeaders.length > 0) {
      reasons.push("Duplicate header(s): " + duplicateHeaders.join(", ") + ".");
    }
    if (blankHeaderPositions.length > 0) {
      reasons.push("Blank header(s) at column position(s): " + blankHeaderPositions.join(", ") + ".");
    }
    return { state: "unexpected", reasons: reasons };
  }

  const hasType = headers.indexOf("Type") !== -1;
  const hasPlacementRule = headers.indexOf("PlacementRule") !== -1;

  if (hasType !== hasPlacementRule) {
    return {
      state: "partially-complete",
      reasons: [
        "Only " + (hasType ? "Type" : "PlacementRule") + " is present. Refusing rather than guessing how a " +
          "partial migration occurred or silently adding only the missing column — this must be resolved manually.",
      ],
    };
  }

  if (hasType && hasPlacementRule) {
    if (lessonsMigrationArraysEqual_(headers, LESSONS_MIGRATION_APPROVED_FINAL_HEADERS)) {
      return { state: "already-complete", reasons: [] };
    }
    return {
      state: "unexpected",
      reasons: [
        "Type and PlacementRule both exist, but the full header array does not exactly match the approved " +
          "final schema (unexpected position, a missing original header, or an unknown extra column).",
        "Current: " + JSON.stringify(headers),
        "Approved: " + JSON.stringify(LESSONS_MIGRATION_APPROVED_FINAL_HEADERS),
      ],
    };
  }

  if (lessonsMigrationArraysEqual_(headers, LESSONS_MIGRATION_ORIGINAL_HEADERS)) {
    return { state: "migration-required", reasons: [] };
  }

  return {
    state: "unexpected",
    reasons: [
      "Neither Type nor PlacementRule exists, but the current headers do not exactly match the audited " +
        "original schema (a missing/extra/reordered header).",
      "Current: " + JSON.stringify(headers),
      "Expected original: " + JSON.stringify(LESSONS_MIGRATION_ORIGINAL_HEADERS),
    ],
  };
}

// Snapshots only the 12 original fields, looked up by header name (never by
// position) — used to prove, row for row, that nothing under an original
// header changed value or row alignment across the migration. Intentionally
// excludes Type/PlacementRule (didn't exist "before"; checked separately by
// lessonsMigrationCheckNewColumnsBlank_).
function lessonsMigrationSnapshotRows_(headers, rawRows) {
  return rawRows.map(function (row) {
    const snapshot = {};
    LESSONS_MIGRATION_ORIGINAL_HEADERS.forEach(function (header) {
      const index = headers.indexOf(header);
      snapshot[header] = index === -1 ? undefined : row[index];
    });
    return snapshot;
  });
}

function lessonsMigrationSnapshotsEqual_(beforeRows, afterRows) {
  return JSON.stringify(beforeRows) === JSON.stringify(afterRows);
}

function lessonsMigrationCheckNewColumnsBlank_(headers, rawRows) {
  const typeIndex = headers.indexOf("Type");
  const placementRuleIndex = headers.indexOf("PlacementRule");
  let typeBlank = true;
  let placementRuleBlank = true;
  const nonBlankTypeRows = [];
  const nonBlankPlacementRuleRows = [];

  rawRows.forEach(function (row, index) {
    const rowNumber = index + 2; // header is row 1
    if (typeIndex !== -1 && !lessonsMigrationIsBlank_(row[typeIndex])) {
      typeBlank = false;
      nonBlankTypeRows.push(rowNumber);
    }
    if (placementRuleIndex !== -1 && !lessonsMigrationIsBlank_(row[placementRuleIndex])) {
      placementRuleBlank = false;
      nonBlankPlacementRuleRows.push(rowNumber);
    }
  });

  return {
    typeBlank: typeBlank,
    placementRuleBlank: placementRuleBlank,
    nonBlankTypeRows: nonBlankTypeRows,
    nonBlankPlacementRuleRows: nonBlankPlacementRuleRows,
  };
}

// Exact match only — mirrors amplifyIm1ValidateConfirmation_'s contract
// exactly (no trim, no case-folding, no boolean/truthy acceptance).
function lessonsMigrationValidateConfirmation_(provided) {
  return typeof provided === "string" && provided === LESSONS_MIGRATION_CONFIRMATION_PHRASE;
}

// Compares a pre-migration snapshot (taken during the planning pass) against
// the post-write state, and is the only thing that can make an otherwise
// "successful" write report itself unsuccessful. Deliberately does not log
// PrimaryLink/TeacherNotes/Description content anywhere in its output —
// only counts, booleans, and row numbers.
function lessonsMigrationVerifyMigration_(beforeSnapshot, afterInfo) {
  const errors = [];
  const classification = lessonsMigrationClassifySchema_(afterInfo.headers);

  if (classification.state !== "already-complete") {
    errors.push("Final headers do not exactly match the approved schema: " + classification.reasons.join(" "));
  }

  const columnCountIncreasedByTwo = afterInfo.columnCount === beforeSnapshot.columnCount + 2;
  if (!columnCountIncreasedByTwo) {
    errors.push(
      "Column count changed from " + beforeSnapshot.columnCount + " to " + afterInfo.columnCount +
        "; expected an increase of exactly 2.",
    );
  }

  const rowCountUnchanged = afterInfo.rowCount === beforeSnapshot.rowCount;
  if (!rowCountUnchanged) {
    errors.push("Row count changed from " + beforeSnapshot.rowCount + " to " + afterInfo.rowCount + "; expected unchanged.");
  }

  const afterSnapshotRows = lessonsMigrationSnapshotRows_(afterInfo.headers, afterInfo.rawRows);
  const originalFieldValuesPreserved = lessonsMigrationSnapshotsEqual_(beforeSnapshot.rows, afterSnapshotRows);
  if (!originalFieldValuesPreserved) {
    errors.push("Original field values under the 12 original headers do not match their pre-migration values row-for-row.");
  }

  const blankCheck = lessonsMigrationCheckNewColumnsBlank_(afterInfo.headers, afterInfo.rawRows);
  if (!blankCheck.typeBlank) {
    errors.push("New Type column is not blank on row(s): " + blankCheck.nonBlankTypeRows.join(", ") + ".");
  }
  if (!blankCheck.placementRuleBlank) {
    errors.push("New PlacementRule column is not blank on row(s): " + blankCheck.nonBlankPlacementRuleRows.join(", ") + ".");
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    rowCountUnchanged: rowCountUnchanged,
    columnCountIncreasedByTwo: columnCountIncreasedByTwo,
    finalHeadersApproved: classification.state === "already-complete",
    newColumnsBlank: blankCheck.typeBlank && blankCheck.placementRuleBlank,
    originalFieldValuesPreserved: originalFieldValuesPreserved,
  };
}

// ============================================================================
// SECTION 2 — Apps Script I/O boundary. Everything below touches
// SpreadsheetApp/LockService/Utilities (or accepts injected stand-ins for
// them) and is therefore exercised under Node only through the fakes in
// scripts/import-staging/fake-spreadsheet.mjs, exactly like
// AmplifyIm1Importer.js's own Section 2.
// ============================================================================

// Mirrors amplifyIm1ReadSheet_/auditReadSheet_'s shape, narrowed to what
// this migration actually needs (no `objects` — a schema migration reasons
// about headers and raw rows, never field-keyed records).
function lessonsMigrationReadLessonsSheet_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName("Lessons");
  if (!sheet) return { present: false };

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow === 0 || lastColumn === 0) {
    return { present: true, headers: [], rawRows: [], rowCount: 0, columnCount: 0 };
  }

  const values = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
  const headers = values[0].map(function (header) {
    return String(header);
  });
  const rawRows = values.slice(1);

  return { present: true, headers: headers, rawRows: rawRows, rowCount: rawRows.length, columnCount: lastColumn };
}

// Mirrors amplifyIm1CreateBackup_/cleanupCreateBackup_ exactly:
// Spreadsheet.copy(name) — a complete, independent copy as a new Drive
// file, never a mutation of the original. sourceSpreadsheetId is recorded
// directly on the returned backup object (not just alongside it in the
// outer report) so source and backup identities cannot be confused even if
// report.backup is copied out of its surrounding context.
function lessonsMigrationCreateBackup_(spreadsheet, confirmation, snapshot, sourceSpreadsheetId, formatTimestamp) {
  const timestamp = formatTimestamp();
  const backupName = "Year Planner Database — pre-lessons-type-placementrule-migration " + timestamp;
  const backupSpreadsheet = spreadsheet.copy(backupName);

  if (!backupSpreadsheet || !backupSpreadsheet.getId()) {
    throw new Error("Spreadsheet.copy() did not return a usable backup spreadsheet.");
  }

  return {
    id: backupSpreadsheet.getId(),
    url: backupSpreadsheet.getUrl(),
    name: backupName,
    sourceSpreadsheetId: sourceSpreadsheetId,
    confirmation: confirmation,
    originalLessonsRowCount: snapshot.rowCount,
    originalLessonsColumnCount: snapshot.columnCount,
    originalLessonsHeaders: snapshot.headers,
  };
}

// One insertion operation followed by one header write, per this sprint's
// explicit preference — never a full-sheet rewrite. insertColumnsAfter
// shifts every existing cell (data, formatting, notes, validation) right of
// the insertion point atomically via the Sheets API itself; this code never
// re-derives or rewrites any existing cell.
function lessonsMigrationInsertHeaderColumns_(sheet, afterPosition, newHeaderNames) {
  sheet.insertColumnsAfter(afterPosition, newHeaderNames.length);
  sheet.getRange(1, afterPosition + 1, 1, newHeaderNames.length).setValues([newHeaderNames]);
}

function lessonsMigrationBuildPreviewReport_(deps, startedAt) {
  const spreadsheet = deps.spreadsheetApp.openById(deps.sheetId);
  const sheetInfo = lessonsMigrationReadLessonsSheet_(spreadsheet);

  const base = {
    mode: "preview",
    timestamp: startedAt.toISOString(),
    spreadsheetId: deps.sheetId,
    confirmationRequired: LESSONS_MIGRATION_CONFIRMATION_PHRASE,
    writesOccurred: false,
    note: "This preview performed zero writes. No column was inserted, no cell was edited, no backup was created, no lock was held.",
  };

  if (!sheetInfo.present) {
    return Object.assign({}, base, {
      sheetPresent: false,
      classification: { state: "unexpected", reasons: ["Lessons sheet not found."] },
    });
  }

  const classification = lessonsMigrationClassifySchema_(sheetInfo.headers);
  const sortOrderIndex = sheetInfo.headers.indexOf(LESSONS_MIGRATION_INSERT_AFTER_HEADER);
  const insertAfterPosition = sortOrderIndex === -1 ? null : sortOrderIndex + 1;

  return Object.assign({}, base, {
    sheetPresent: true,
    headers: sheetInfo.headers,
    duplicateHeaders: lessonsMigrationFindDuplicateHeaders_(sheetInfo.headers),
    blankHeaderPositions: lessonsMigrationFindBlankHeaders_(sheetInfo.headers).map(function (index) {
      return index + 1;
    }),
    rowCount: sheetInfo.rowCount,
    columnCount: sheetInfo.columnCount,
    hasType: sheetInfo.headers.indexOf("Type") !== -1,
    hasPlacementRule: sheetInfo.headers.indexOf("PlacementRule") !== -1,
    proposedInsertion: {
      afterHeader: LESSONS_MIGRATION_INSERT_AFTER_HEADER,
      afterPosition: insertAfterPosition,
      newHeaders: LESSONS_MIGRATION_NEW_HEADERS,
      newHeaderPositions: insertAfterPosition === null ? null : [insertAfterPosition + 1, insertAfterPosition + 2],
    },
    approvedFinalHeaders: LESSONS_MIGRATION_APPROVED_FINAL_HEADERS,
    classification: classification,
  });
}

function previewLessonsTypePlacementRuleMigration() {
  const startedAt = new Date();
  const report = lessonsMigrationBuildPreviewReport_(
    { spreadsheetApp: SpreadsheetApp, sheetId: SHEET_ID },
    startedAt,
  );
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

// Guarded sequence (mirrors executeProductionDataCleanupV1Locked_ /
// amplifyIm1ExecuteLocked_'s ordering exactly, adapted for a schema change
// instead of a row-level diff):
//  1. validate confirmation
//  2. acquire lock
//  3. planning pass: reread and classify current schema under lock (never
//     trusts a prior preview) — already-complete short-circuits here as a
//     successful no-op; anything other than migration-required refuses
//  4. create backup (metadata from the planning-pass read)
//  5. revalidation pass: reread and re-classify immediately before mutating;
//     abort if anything changed since the planning pass
//  6. snapshot pre-migration state — from the revalidation-pass read, the
//     freshest available immediately before mutating (narrows the window
//     for a false-positive verification failure from a concurrent,
//     unlocked classroom write; see the inline comment at that step)
//  7. insert the two columns, write their header cells
//  8. post-write verification against the pre-migration snapshot
//  9. return a structured report
// 10. release the lock in `finally`
function lessonsMigrationExecuteLocked_(confirmation, deps) {
  const startedAt = new Date();
  const report = {
    mode: "execute",
    timestamp: startedAt.toISOString(),
    spreadsheetId: deps.sheetId,
    confirmationAccepted: false,
    lockAcquired: false,
    classification: null,
    alreadyComplete: false,
    backup: null,
    columnsInserted: false,
    writeDetails: null,
    verification: null,
    writesOccurred: false,
    errorStage: null,
    errorMessage: null,
  };

  if (!lessonsMigrationValidateConfirmation_(confirmation)) {
    report.errorStage = "confirmation";
    report.errorMessage = "Confirmation did not match exactly. No data was read or touched.";
    return report;
  }
  report.confirmationAccepted = true;

  const lock = deps.lockService.getScriptLock();
  let lockAcquired = false;
  try {
    lockAcquired = lock.tryLock(30000);
  } catch (error) {
    lockAcquired = false;
  }
  if (!lockAcquired) {
    report.errorStage = "lock";
    report.errorMessage = "Could not acquire the script lock within 30 seconds. No data was touched.";
    return report;
  }
  report.lockAcquired = true;

  try {
    const spreadsheet = deps.spreadsheetApp.openById(deps.sheetId);

    // 3. planning pass
    const planningInfo = lessonsMigrationReadLessonsSheet_(spreadsheet);
    if (!planningInfo.present) {
      report.errorStage = "schema";
      report.errorMessage = "Lessons sheet not found. No data was touched.";
      return report;
    }

    const planningClassification = lessonsMigrationClassifySchema_(planningInfo.headers);
    report.classification = planningClassification;

    if (planningClassification.state === "already-complete") {
      // Successful no-op, per this sprint's explicit idempotence
      // requirement — not an error, and never touches the sheet or creates
      // a second backup.
      report.alreadyComplete = true;
      return report;
    }

    if (planningClassification.state !== "migration-required") {
      report.errorStage = "schema";
      report.errorMessage =
        "Lessons schema is not in the expected pre-migration state (" + planningClassification.state +
          "). No data was touched.";
      return report;
    }

    // 4. backup — before any mutation. Metadata reflects the planning-pass
    // read, which is what's known/committed-to at backup-creation time.
    let backup;
    try {
      backup = lessonsMigrationCreateBackup_(spreadsheet, confirmation, planningInfo, deps.sheetId, deps.formatTimestamp);
    } catch (error) {
      report.errorStage = "backup";
      report.errorMessage = "Backup creation failed: " + error.message + ". No Lessons data was touched.";
      return report;
    }
    report.backup = backup;

    // 5. revalidation pass — immediately before mutating.
    const revalInfo = lessonsMigrationReadLessonsSheet_(spreadsheet);
    const revalClassification = lessonsMigrationClassifySchema_(revalInfo.headers);
    const stateChanged =
      revalClassification.state !== "migration-required" ||
      !lessonsMigrationArraysEqual_(revalInfo.headers, planningInfo.headers) ||
      revalInfo.rowCount !== planningInfo.rowCount;

    if (stateChanged) {
      report.errorStage = "revalidation";
      report.errorMessage =
        "Lessons schema or row count changed between planning and mutation. Aborted before inserting anything.";
      return report;
    }

    // 6. snapshot — built from the revalidation-pass read, not the planning
    // pass. Code.js's addLesson/updateLesson/deleteLesson/reorderLessons
    // acquire no lock at all (see this file's header comment on locking
    // scope), so a concurrent, legitimate classroom write is possible in
    // principle during this execution. Taking the verification baseline
    // from the freshest read available — immediately before the mutating
    // call — keeps that window as narrow as achievable without changing
    // Code.js's own write paths, which is out of this file's scope.
    const beforeSnapshot = {
      headers: revalInfo.headers,
      rowCount: revalInfo.rowCount,
      columnCount: revalInfo.columnCount,
      rows: lessonsMigrationSnapshotRows_(revalInfo.headers, revalInfo.rawRows),
    };

    // 7. insert + write headers
    const sheet = spreadsheet.getSheetByName("Lessons");
    const afterPosition = revalInfo.headers.indexOf(LESSONS_MIGRATION_INSERT_AFTER_HEADER) + 1;
    lessonsMigrationInsertHeaderColumns_(sheet, afterPosition, LESSONS_MIGRATION_NEW_HEADERS);
    // Mutation flags are set the instant the actual mutating call returns —
    // deliberately BEFORE flush(). flush() can itself throw (quota, a
    // transient API error) without undoing anything it flushes; if flags
    // were set after it, a flush failure would falsely report
    // writesOccurred: false for a mutation that had already fully
    // succeeded. Never report "no writes happened" after a call that may
    // already have mutated the sheet.
    report.columnsInserted = true;
    report.writeDetails = {
      insertedAfterHeader: LESSONS_MIGRATION_INSERT_AFTER_HEADER,
      insertedAfterPosition: afterPosition,
      insertedHeaders: LESSONS_MIGRATION_NEW_HEADERS,
      insertedAtColumns: [afterPosition + 1, afterPosition + 2],
    };
    report.writesOccurred = true;

    if (typeof deps.spreadsheetApp.flush === "function") {
      deps.spreadsheetApp.flush();
    }

    // 8. post-write verification
    const afterInfo = lessonsMigrationReadLessonsSheet_(spreadsheet);
    const verification = lessonsMigrationVerifyMigration_(beforeSnapshot, afterInfo);
    report.verification = verification;

    if (!verification.valid) {
      report.errorStage = "post-write-verification";
      report.errorMessage =
        "Columns were inserted but post-write verification found mismatches. Manual recovery may be required " +
          "from the backup created this run. No automatic rollback was performed.";
      return report;
    }

    return report;
  } catch (error) {
    report.errorStage = report.errorStage || "exception";
    report.errorMessage = report.backup
      ? error.message +
          " The mutation may have partially applied and was not confirmed complete. Manual recovery may be " +
          "required from the backup created this run (see report.backup). No automatic rollback was performed."
      : error.message;
    return report;
  } finally {
    if (lockAcquired) {
      // Never let a release failure override or swallow the report already
      // computed above — it may carry critical recovery information (a
      // backup ID) that must reach the operator. The script lock expires on
      // its own once this execution ends regardless, so a failed explicit
      // release here is not itself a safety problem.
      try {
        lock.releaseLock();
      } catch (releaseError) {
        // Intentionally swallowed — see comment above.
      }
    }
  }
}

// The one real public execute entry point. No default parameter — an
// accidental zero-argument call (e.g. an Apps Script editor "Run" click)
// passes `confirmation` as `undefined`, which can never satisfy
// lessonsMigrationValidateConfirmation_'s exact-string-match requirement.
function executeLessonsTypePlacementRuleMigration(confirmation) {
  return lessonsMigrationExecuteLocked_(confirmation, {
    spreadsheetApp: SpreadsheetApp,
    lockService: LockService,
    sheetId: SHEET_ID,
    formatTimestamp: function () {
      return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HHmmss");
    },
  });
}

// Read-only, standalone. Has no memory of what a specific execute run
// touched (mirrors verifyAmplifyIm1Import()'s same honest limitation) — it
// evaluates the current schema shape fresh every time it's called. It can
// confirm the schema is the approved final shape and that the new columns
// are currently blank; it cannot prove "nothing else changed since before
// the migration" without a stored snapshot, which only the execute path's
// own post-write verification has access to.
function lessonsMigrationBuildStandaloneVerifyReport_(deps, startedAt) {
  const spreadsheet = deps.spreadsheetApp.openById(deps.sheetId);
  const info = lessonsMigrationReadLessonsSheet_(spreadsheet);

  if (!info.present) {
    return {
      mode: "verify",
      timestamp: startedAt.toISOString(),
      spreadsheetId: deps.sheetId,
      valid: false,
      errors: ["Lessons sheet not found."],
    };
  }

  const classification = lessonsMigrationClassifySchema_(info.headers);
  const blankCheck = lessonsMigrationCheckNewColumnsBlank_(info.headers, info.rawRows);
  const errors = [];

  if (classification.state !== "already-complete") {
    errors.push("Current schema is not the approved final schema: " + classification.reasons.join(" "));
  } else {
    if (!blankCheck.typeBlank) {
      errors.push(
        "Type column has non-blank value(s) on row(s): " + blankCheck.nonBlankTypeRows.join(", ") +
          ". (Expected before any curriculum import has run.)",
      );
    }
    if (!blankCheck.placementRuleBlank) {
      errors.push(
        "PlacementRule column has non-blank value(s) on row(s): " + blankCheck.nonBlankPlacementRuleRows.join(", ") +
          ". (Expected before any curriculum import has run.)",
      );
    }
  }

  return {
    mode: "verify",
    timestamp: startedAt.toISOString(),
    spreadsheetId: deps.sheetId,
    headers: info.headers,
    rowCount: info.rowCount,
    classification: classification,
    newColumnsBlank: { type: blankCheck.typeBlank, placementRule: blankCheck.placementRuleBlank },
    valid: errors.length === 0,
    errors: errors,
  };
}

function verifyLessonsTypePlacementRuleMigration() {
  const startedAt = new Date();
  const report = lessonsMigrationBuildStandaloneVerifyReport_(
    { spreadsheetApp: SpreadsheetApp, sheetId: SHEET_ID },
    startedAt,
  );
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

// ============================================================================
// Node test access. `module` does not exist in the Apps Script runtime, so
// this block never executes there.
// ============================================================================
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    LESSONS_MIGRATION_ORIGINAL_HEADERS,
    LESSONS_MIGRATION_NEW_HEADERS,
    LESSONS_MIGRATION_INSERT_AFTER_HEADER,
    LESSONS_MIGRATION_APPROVED_FINAL_HEADERS,
    LESSONS_MIGRATION_CONFIRMATION_PHRASE,
    lessonsMigrationFindDuplicateHeaders_,
    lessonsMigrationFindBlankHeaders_,
    lessonsMigrationArraysEqual_,
    lessonsMigrationClassifySchema_,
    lessonsMigrationSnapshotRows_,
    lessonsMigrationSnapshotsEqual_,
    lessonsMigrationCheckNewColumnsBlank_,
    lessonsMigrationValidateConfirmation_,
    lessonsMigrationVerifyMigration_,
    lessonsMigrationReadLessonsSheet_,
    lessonsMigrationCreateBackup_,
    lessonsMigrationInsertHeaderColumns_,
    lessonsMigrationBuildPreviewReport_,
    lessonsMigrationExecuteLocked_,
    lessonsMigrationBuildStandaloneVerifyReport_,
  };
}
