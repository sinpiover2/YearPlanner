// Guarded migration that archives the legacy (pre-Amplify) Integrated Math 1
// units by marking them IsArchived: true, rather than deleting or migrating
// their data (see docs/Development/AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md,
// Sprint 6.3/6.4/6.5 — the legacy IM1 curriculum is a separate historical
// curriculum, not an obsolete copy of the imported Amplify curriculum, so it
// is archived in place, never deleted, never merged into the imported rows).
//
// SAFETY STATUS AS OF THIS SPRINT: structurally complete and locally
// simulated only. executeUnitsArchiveMigration() has NEVER been run against
// the real production spreadsheet — every test in
// scripts/import-staging/units-archive-migration.test.mjs exercises this
// file's logic against in-memory fakes only.
//
// Precedent this file follows: apps-script-planning/LessonsSchemaMigration.js
// (schema-column-add guarded sequence, four-state schema classification,
// exact-array header equality, snapshot-based post-write verification) and
// apps-script-roster-admin/ProductionDataCleanup.js (an explicit, named
// target-ID list rather than a derived/heuristic selection — deliberately
// chosen after the Sprint 6.3/6.4 investigation found that a derived "same
// UnitNumber" rule was unsound for several of these units; the exact 9
// target UnitIDs below are a reviewed, explicit decision, not a re-derived
// heuristic).
//
// Field naming — `IsArchived`, not `Active` (Sprint 6.5 correction). The
// first implementation of this migration reused Sections' `Active` field
// name and polarity. On review, that was the wrong call: `Active` on
// Sections represents operational availability (does this section meet
// this year), a genuinely different domain concept from Units' curriculum
// lifecycle (is this unit historical/superseded, independent of whether the
// course itself is active). Reusing a field name is only correct when the
// domain meaning is actually the same — see docs/WORKFLOW/LESSONS_LEARNED.md,
// Sprint 6.5, for the corrected version of that lesson. `Sections.Active`
// and its reader (`isSectionActive` in frontend/src/App.jsx) are completely
// untouched by this file. `IsArchived` has the opposite polarity from
// `Active`: blank/missing/false means NOT archived (visible); an explicit
// truthy value means archived (hidden by default). This migration also
// treats a pre-existing `Active` column on Units — which the never-executed
// first design could in principle have left behind — as a distinct,
// explicitly-flagged `unexpected` schema state, never silently reinterpreted
// as `IsArchived`.
//
// Hard dependency: SHEET_ID (Code.js, same Apps Script project, shared
// global namespace).
//
// Every function below prefixed `unitsArchive` to avoid colliding with the
// global namespace shared by every file in this Apps Script project.
//
// ============================================================================
// SECTION 1 — Pure logic (no SpreadsheetApp/LockService/Utilities calls).
// Exercised directly from Node via the module.exports guard at the bottom of
// this file — see scripts/import-staging/units-archive-migration.test.mjs.
// ============================================================================

// Explicit, reviewed list — not derived from CourseID/UnitNumber/ID-prefix
// pattern matching. The Sprint 6.3/6.4 investigation found that "same
// UnitNumber" is an unsound rule for at least 4 of these units (title and
// lesson content prove IM1-U3/U5/U6/U7 do not correspond to AMP-IM1-U3/U5/
// U6/U7 at the same number), so this migration never re-derives its own
// scope — it archives exactly these 9 IDs and nothing else, matching the
// explicit, human-reviewed decision this sprint's task specifies.
const UNITS_ARCHIVE_TARGET_UNIT_IDS = [
  "IM1-U0", "IM1-U1", "IM1-U2", "IM1-U3", "IM1-U4", "IM1-U5", "IM1-U6", "IM1-U7", "IM1-U8",
];

// Audited production Units header order (confirmed live: 8 columns,
// neither `Active` nor `IsArchived` present, since the prior design was
// never executed against production). This migration refuses unless the
// live sheet's headers match this exact array, in this exact order, before
// it has ever run — mirrors LESSONS_MIGRATION_ORIGINAL_HEADERS's
// exact-array-equality discipline in LessonsSchemaMigration.js.
const UNITS_ARCHIVE_ORIGINAL_HEADERS = [
  "UnitID", "CourseID", "UnitNumber", "UnitTitle", "RequiredDays", "OptionalDays", "SortOrder", "UnitPurpose",
];

// The never-shipped prior design's column name — recognized here only so
// its presence can be explicitly flagged as unexpected, never silently
// treated as equivalent to IsArchived (see this file's header comment).
const UNITS_ARCHIVE_LEGACY_ACTIVE_HEADER = "Active";

// New column, appended at the end — the smallest-diff position against the
// existing 8-column shape. Never inserted mid-row: every existing Apps
// Script reader/writer of Units resolves columns by headers.indexOf(...),
// never a fixed position, so an appended column is exactly as safe as an
// inserted one here.
const UNITS_ARCHIVE_NEW_HEADER = "IsArchived";
const UNITS_ARCHIVE_APPROVED_FINAL_HEADERS = UNITS_ARCHIVE_ORIGINAL_HEADERS.concat([UNITS_ARCHIVE_NEW_HEADER]);

// Static, not derived — this migration's scope is a fixed, explicit ID
// list, not a versioned data artifact (mirrors
// LEGACY_CLEANUP_CONFIRMATION_PHRASE's same reasoning in
// LegacyIm1CleanupMigration.js). Unchanged across the Active -> IsArchived
// field-naming correction: the confirmation phrase identifies the
// operation ("archive these 9 legacy IM1 units"), not the column name used
// to implement it, and this migration was never executed under the prior
// name, so there is no stale-phrase risk to guard against by versioning it.
const UNITS_ARCHIVE_CONFIRMATION_PHRASE = "ARCHIVE-LEGACY-IM1-UNITS-CONFIRMED-V1";
const UNITS_ARCHIVE_EDITOR_PLACEHOLDER_CONFIRMATION = "REPLACE_WITH_EXACT_AUTHORIZATION_PHRASE_BEFORE_RUNNING";

function unitsArchiveIsBlank_(value) {
  return value === null || value === undefined || value === "";
}

// The repository's single boolean-truthiness convention (matches
// frontend/src/utils/plannerUtils.js's isTrue() exactly — value === true,
// or the string "true" case-insensitively) reimplemented here because Apps
// Script code cannot import frontend modules. Deliberately not extended to
// recognize "1"/1 as truthy: nothing in this codebase's boolean fields
// (IsOptional, Active, and now IsArchived) is ever written as "1", and
// introducing a second, broader parser here — inconsistent with isTrue()'s
// narrower one — would itself become the "second conflicting boolean
// parser" this sprint's task explicitly warned against.
function unitsArchiveIsTrue_(value) {
  return value === true || String(value).trim().toLowerCase() === "true";
}

// True only when IsArchived is an explicit truthy value — never for
// blank/missing/false, which all mean "not archived, visible by default."
// Used only to detect whether a row is ALREADY archived; the frontend's
// isUnitArchived() makes the equivalent default-visibility decision.
function unitsArchiveIsExplicitlyArchived_(isArchivedValue) {
  return unitsArchiveIsTrue_(isArchivedValue);
}

function unitsArchiveArraysEqual_(a, b) {
  return a.length === b.length && a.every(function (value, index) {
    return value === b[index];
  });
}

// The single source of truth for what state the live Units schema is in —
// four states, mirroring lessonsMigrationClassifySchema_'s discipline in
// LessonsSchemaMigration.js. A pre-existing `Active` column (the never-
// shipped prior design) is its own explicit, clearly-messaged `unexpected`
// state — never silently folded into `migration-required` or treated as
// if it were `IsArchived`.
function unitsArchiveClassifySchema_(headers) {
  const hasLegacyActiveColumn = headers.indexOf(UNITS_ARCHIVE_LEGACY_ACTIVE_HEADER) !== -1;

  if (hasLegacyActiveColumn) {
    return {
      state: "unexpected",
      reasons: [
        "Units has an 'Active' column — leftover from this migration's earlier, never-executed design, which " +
          "used Active instead of IsArchived. This must not be silently reinterpreted as archival state; resolve " +
          "manually (confirm what created it and either remove it or reconcile it) before this migration can run. " +
          "Current headers: " + JSON.stringify(headers),
      ],
    };
  }

  const hasIsArchivedColumn = headers.indexOf(UNITS_ARCHIVE_NEW_HEADER) !== -1;

  if (!hasIsArchivedColumn) {
    if (unitsArchiveArraysEqual_(headers, UNITS_ARCHIVE_ORIGINAL_HEADERS)) {
      return { state: "migration-required", reasons: [] };
    }
    return {
      state: "unexpected",
      reasons: [
        "Neither Active nor IsArchived exists, but the current headers do not exactly match the audited " +
          "original schema. Current: " + JSON.stringify(headers) +
          " Expected original: " + JSON.stringify(UNITS_ARCHIVE_ORIGINAL_HEADERS),
      ],
    };
  }

  if (unitsArchiveArraysEqual_(headers, UNITS_ARCHIVE_APPROVED_FINAL_HEADERS)) {
    return { state: "schema-complete", reasons: [] };
  }
  return {
    state: "unexpected",
    reasons: [
      "IsArchived exists, but the full header array does not exactly match the approved final schema " +
        "(unexpected position, a missing original header, or an unknown extra column). Current: " +
        JSON.stringify(headers) + " Approved: " + JSON.stringify(UNITS_ARCHIVE_APPROVED_FINAL_HEADERS),
    ],
  };
}

// The single source of truth for what this migration is in a position to
// do, given live (or fixture) Units header/row data. Used identically by
// preview, execution's planning pass, and execution's revalidation pass.
//
// unitsData = { headers: [...], objects: [...rowObjects] }
function unitsArchiveBuildPlan_(unitsData) {
  const headers = unitsData.headers || [];
  const units = unitsData.objects || [];

  const classification = unitsArchiveClassifySchema_(headers);

  if (classification.state === "unexpected") {
    return {
      safeToExecute: false,
      schemaState: classification.state,
      structuralBlockingFindings: classification.reasons,
      targetUnits: [],
      nonTargetConflicts: [],
      alreadyComplete: false,
    };
  }

  const hasIsArchivedColumn = classification.state === "schema-complete";

  const foundIds = new Set(
    units.map(function (u) {
      return u.UnitID;
    }),
  );
  const missingTargetIds = UNITS_ARCHIVE_TARGET_UNIT_IDS.filter(function (id) {
    return !foundIds.has(id);
  });

  if (missingTargetIds.length > 0) {
    return {
      safeToExecute: false,
      schemaState: classification.state,
      structuralBlockingFindings: [
        "Target UnitID(s) not found in production: " + missingTargetIds.join(", ") + ".",
      ],
      targetUnits: [],
      nonTargetConflicts: [],
      alreadyComplete: false,
    };
  }

  const targetIdSet = new Set(UNITS_ARCHIVE_TARGET_UNIT_IDS);
  const targetUnits = UNITS_ARCHIVE_TARGET_UNIT_IDS.map(function (id) {
    const unit = units.find(function (u) {
      return u.UnitID === id;
    });
    const alreadyArchived = hasIsArchivedColumn && unitsArchiveIsExplicitlyArchived_(unit.IsArchived);
    return {
      UnitID: unit.UnitID,
      CourseID: unit.CourseID,
      UnitTitle: unit.UnitTitle,
      currentIsArchived: hasIsArchivedColumn ? unit.IsArchived : undefined,
      classification: alreadyArchived ? "already-archived" : "needs-archiving",
    };
  });

  // Never touched, but verified clean: no non-target row (any AMP-IM1-* IM1
  // unit, or any Math 8 unit) should already carry an explicit
  // IsArchived:true — if one does, that's a surprising, unexplained state
  // this migration did not cause and should not silently coexist with;
  // it's reported, not auto-corrected, and it does not block archiving the
  // 9 named targets (which remain independent of this anomaly).
  const nonTargetConflicts = hasIsArchivedColumn
    ? units
        .filter(function (u) {
          return !targetIdSet.has(u.UnitID) && unitsArchiveIsExplicitlyArchived_(u.IsArchived);
        })
        .map(function (u) {
          return u.UnitID;
        })
    : [];

  const needsArchivingCount = targetUnits.filter(function (u) {
    return u.classification === "needs-archiving";
  }).length;

  const alreadyComplete = hasIsArchivedColumn && needsArchivingCount === 0;

  return {
    safeToExecute: !alreadyComplete && needsArchivingCount > 0,
    schemaState: classification.state,
    structuralBlockingFindings: [],
    targetUnits: targetUnits,
    nonTargetConflicts: nonTargetConflicts,
    alreadyComplete: alreadyComplete,
  };
}

// True only when two plans built from unitsArchiveBuildPlan_ select the
// exact same rows for archiving. Used to confirm nothing changed between
// the planning pass and the moment execution is about to mutate data.
function unitsArchivePlansMatch_(planA, planB) {
  if (planA.schemaState !== planB.schemaState) return false;
  if (planA.safeToExecute !== planB.safeToExecute) return false;
  if (!planA.safeToExecute) return planA.alreadyComplete === planB.alreadyComplete;

  const idSet = function (plan) {
    return new Set(
      plan.targetUnits
        .filter(function (u) {
          return u.classification === "needs-archiving";
        })
        .map(function (u) {
          return u.UnitID;
        }),
    );
  };
  const a = idSet(planA);
  const b = idSet(planB);
  if (a.size !== b.size) return false;
  for (const value of a) {
    if (!b.has(value)) return false;
  }
  return true;
}

function unitsArchiveBuildPreviewReport_(plan, startedAt) {
  return {
    mode: "preview",
    timestamp: startedAt.toISOString(),
    writesOccurred: false,
    note: "This preview performed zero writes.",
    schemaState: plan.schemaState,
    structuralBlockingFindings: plan.structuralBlockingFindings,
    targetUnits: plan.targetUnits,
    unitsToArchive: plan.targetUnits
      .filter(function (u) {
        return u.classification === "needs-archiving";
      })
      .map(function (u) {
        return u.UnitID;
      }),
    alreadyArchived: plan.targetUnits
      .filter(function (u) {
        return u.classification === "already-archived";
      })
      .map(function (u) {
        return u.UnitID;
      }),
    nonTargetConflicts: plan.nonTargetConflicts,
    alreadyComplete: plan.alreadyComplete,
    confirmationRequired: UNITS_ARCHIVE_CONFIRMATION_PHRASE,
    safeToExecute: plan.safeToExecute,
  };
}

function unitsArchiveValidateConfirmation_(provided) {
  return typeof provided === "string" && provided === UNITS_ARCHIVE_CONFIRMATION_PHRASE;
}

// Pure adapter behind the editor wrapper — see the identical pattern and
// rationale in AmplifyIm1Importer.js / LessonsSchemaMigration.js /
// LegacyIm1CleanupMigration.js.
function unitsArchiveRunEditorWrapper_(confirmation, deps) {
  const report = deps.executeMigration(confirmation);
  deps.log(JSON.stringify(report, null, 2));
  return report;
}

// Post-execution verification, given a before-state snapshot (every unit's
// full row, by header name, captured immediately before mutation) and the
// current (after) data. Pure function so it is exercised identically by the
// execute path's own post-write step and by the standalone
// verifyUnitsArchiveMigration().
function unitsArchiveVerify_(beforeSnapshot, afterData) {
  const errors = [];
  const headers = afterData.headers || [];
  const units = afterData.objects || [];

  if (!unitsArchiveArraysEqual_(headers, UNITS_ARCHIVE_APPROVED_FINAL_HEADERS)) {
    errors.push("Final headers do not exactly match the approved schema. Current: " + JSON.stringify(headers));
  }

  const byId = {};
  units.forEach(function (u) {
    byId[u.UnitID] = u;
  });

  UNITS_ARCHIVE_TARGET_UNIT_IDS.forEach(function (id) {
    const unit = byId[id];
    if (!unit) {
      errors.push("Target unit " + id + " is missing after migration (must never be deleted).");
      return;
    }
    if (!unitsArchiveIsExplicitlyArchived_(unit.IsArchived)) {
      errors.push("Target unit " + id + " does not have IsArchived set to an explicit true value; found: " + JSON.stringify(unit.IsArchived) + ".");
    }
  });

  beforeSnapshot.forEach(function (beforeUnit) {
    if (UNITS_ARCHIVE_TARGET_UNIT_IDS.indexOf(beforeUnit.UnitID) !== -1) return;
    const afterUnit = byId[beforeUnit.UnitID];
    if (!afterUnit) {
      errors.push("Non-target unit " + beforeUnit.UnitID + " is missing after migration (must never be deleted).");
      return;
    }
    UNITS_ARCHIVE_ORIGINAL_HEADERS.forEach(function (field) {
      if (afterUnit[field] !== beforeUnit[field]) {
        errors.push(
          "Non-target unit " + beforeUnit.UnitID + "'s field '" + field + "' changed: " +
            JSON.stringify(beforeUnit[field]) + " -> " + JSON.stringify(afterUnit[field]) + ".",
        );
      }
    });
    if (unitsArchiveIsExplicitlyArchived_(afterUnit.IsArchived)) {
      errors.push("Non-target unit " + beforeUnit.UnitID + " was unexpectedly archived (IsArchived is explicitly true).");
    }
  });

  const rowCountUnchanged = units.length === beforeSnapshot.length;
  if (!rowCountUnchanged) {
    errors.push("Row count changed: expected " + beforeSnapshot.length + ", found " + units.length + ".");
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    rowCount: units.length,
    archivedCount: UNITS_ARCHIVE_TARGET_UNIT_IDS.filter(function (id) {
      return byId[id] && unitsArchiveIsExplicitlyArchived_(byId[id].IsArchived);
    }).length,
  };
}

// ============================================================================
// SECTION 2 — Apps Script I/O boundary. Everything below touches
// SpreadsheetApp/LockService/Utilities (or accepts injected stand-ins for
// them) and is therefore exercised under Node only through the fakes in
// scripts/import-staging/fake-spreadsheet.mjs.
// ============================================================================

function unitsArchiveReadUnitsSheet_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName("Units");
  if (!sheet) return { present: false };

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow === 0 || lastColumn === 0) {
    return { present: true, headers: [], rawRows: [], objects: [], rowCount: 0 };
  }

  const values = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
  const headers = values[0].map(function (h) {
    return String(h);
  });
  const rawRows = values.slice(1);
  const objects = rawRows.map(function (row) {
    const obj = {};
    headers.forEach(function (header, index) {
      obj[header] = row[index];
    });
    return obj;
  });

  return { present: true, headers: headers, rawRows: rawRows, objects: objects, rowCount: objects.length };
}

function unitsArchiveBuildLivePlan_(spreadsheet) {
  const sheetInfo = unitsArchiveReadUnitsSheet_(spreadsheet);
  if (!sheetInfo.present) {
    return {
      safeToExecute: false,
      schemaState: "unexpected",
      structuralBlockingFindings: ["Units sheet not found."],
      targetUnits: [],
      nonTargetConflicts: [],
      alreadyComplete: false,
    };
  }
  return unitsArchiveBuildPlan_({ headers: sheetInfo.headers, objects: sheetInfo.objects });
}

function unitsArchiveCreateBackup_(spreadsheet, formatTimestamp) {
  const timestamp = formatTimestamp();
  const backupName = "Year Planner Database — pre-units-archive-migration " + timestamp;
  const backupSpreadsheet = spreadsheet.copy(backupName);

  if (!backupSpreadsheet || !backupSpreadsheet.getId()) {
    throw new Error("Spreadsheet.copy() did not return a usable backup spreadsheet.");
  }

  return { id: backupSpreadsheet.getId(), url: backupSpreadsheet.getUrl(), name: backupName };
}

function previewUnitsArchiveMigration() {
  const startedAt = new Date();
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const plan = unitsArchiveBuildLivePlan_(spreadsheet);
  const report = unitsArchiveBuildPreviewReport_(plan, startedAt);
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

// Guarded sequence (mirrors executeProductionDataCleanupV1Locked_'s /
// amplifyIm1ExecuteLocked_'s / lessonsMigrationExecuteLocked_'s ordering):
// (1) validate confirmation, (2) acquire lock, (3) planning pass — reread
// and build the plan fresh under lock; alreadyComplete short-circuits as a
// successful no-op (no backup, no writes); refuse if not safeToExecute
// otherwise (including the dedicated "unexpected legacy Active column"
// schema state, which never falls through to a write), (4) create backup,
// (5) revalidation pass — reread and rebuild immediately before mutating;
// abort if the plan changed, (6) snapshot every row (by header name) from
// the revalidation-pass read, (7) add the IsArchived column if missing,
// write `true` only into the rows still needing it, (8) reread and
// post-write verify against the pre-migration snapshot, (9) return a
// structured report, (10) release the lock in `finally`.
function unitsArchiveExecuteLocked_(confirmation, deps) {
  const startedAt = new Date();
  const report = {
    mode: "execute",
    timestamp: startedAt.toISOString(),
    confirmationAccepted: false,
    lockAcquired: false,
    plan: null,
    alreadyComplete: false,
    backup: null,
    columnAdded: false,
    unitsArchived: 0,
    verification: null,
    writesOccurred: false,
    errorStage: null,
    errorMessage: null,
  };

  if (!unitsArchiveValidateConfirmation_(confirmation)) {
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

    const planningPass = unitsArchiveBuildLivePlan_(spreadsheet);
    report.plan = planningPass;

    if (planningPass.alreadyComplete) {
      report.alreadyComplete = true;
      return report;
    }

    if (!planningPass.safeToExecute) {
      report.errorStage = "planning";
      report.errorMessage = "Archive plan is not safe to execute (blocking findings present); no data was touched.";
      return report;
    }

    let backup;
    try {
      backup = unitsArchiveCreateBackup_(spreadsheet, deps.formatTimestamp);
    } catch (error) {
      report.errorStage = "backup";
      report.errorMessage = "Backup creation failed: " + error.message + ". No data was touched.";
      return report;
    }
    report.backup = backup;

    const revalidationPass = unitsArchiveBuildLivePlan_(spreadsheet);
    if (!unitsArchivePlansMatch_(planningPass, revalidationPass)) {
      report.errorStage = "revalidation";
      report.errorMessage = "Units data changed between planning and mutation; aborted before writing anything.";
      return report;
    }

    const sheet = spreadsheet.getSheetByName("Units");
    const sheetInfo = unitsArchiveReadUnitsSheet_(spreadsheet);
    const beforeSnapshot = sheetInfo.objects.map(function (u) {
      return Object.assign({}, u);
    });

    let headers = sheetInfo.headers.slice();
    let isArchivedIndex = headers.indexOf(UNITS_ARCHIVE_NEW_HEADER);
    if (isArchivedIndex === -1) {
      const lastColumn = headers.length;
      sheet.getRange(1, lastColumn + 1, 1, 1).setValues([[UNITS_ARCHIVE_NEW_HEADER]]);
      headers = headers.concat([UNITS_ARCHIVE_NEW_HEADER]);
      isArchivedIndex = headers.length - 1;
      report.columnAdded = true;
    }

    const unitIdIndex = headers.indexOf("UnitID");
    const targetIdsNeedingArchive = new Set(
      revalidationPass.targetUnits
        .filter(function (u) {
          return u.classification === "needs-archiving";
        })
        .map(function (u) {
          return u.UnitID;
        }),
    );

    let archivedCount = 0;
    sheetInfo.rawRows.forEach(function (row, index) {
      if (targetIdsNeedingArchive.has(row[unitIdIndex])) {
        sheet.getRange(index + 2, isArchivedIndex + 1).setValue(true);
        archivedCount += 1;
      }
    });
    report.unitsArchived = archivedCount;
    report.writesOccurred = true;

    if (typeof deps.spreadsheetApp.flush === "function") {
      deps.spreadsheetApp.flush();
    }

    const afterInfo = unitsArchiveReadUnitsSheet_(spreadsheet);
    const verification = unitsArchiveVerify_(beforeSnapshot, { headers: afterInfo.headers, objects: afterInfo.objects });
    report.verification = verification;

    if (!verification.valid) {
      report.errorStage = "post-write-verification";
      report.errorMessage =
        "Rows were written but post-write verification found mismatches. Manual recovery may be required " +
          "from the backup created this run. No automatic rollback was performed.";
      return report;
    }

    return report;
  } catch (error) {
    report.errorStage = report.errorStage || "exception";
    report.errorMessage = report.backup
      ? error.message +
          " The write may have partially applied and was not confirmed complete. Manual recovery may be " +
          "required from the backup created this run (see report.backup). No automatic rollback was performed."
      : error.message;
    return report;
  } finally {
    if (lockAcquired) {
      try {
        lock.releaseLock();
      } catch (releaseError) {
        // Intentionally swallowed — never let a release failure override or
        // swallow the already-computed report, which may carry a backup ID.
      }
    }
  }
}

function executeUnitsArchiveMigration(confirmation) {
  return unitsArchiveExecuteLocked_(confirmation, {
    spreadsheetApp: SpreadsheetApp,
    lockService: LockService,
    sheetId: SHEET_ID,
    formatTimestamp: function () {
      return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HHmmss");
    },
  });
}

// Disarmed by construction — see AMPLIFY_IM1_IMPORTER_README.md and the
// identical wrapper pattern in LessonsSchemaMigration.js /
// LegacyIm1CleanupMigration.js for the full edit-then-run production
// authorization ceremony this exists to support.
function executeUnitsArchiveMigrationFromEditor() {
  // Change ONLY the line below, and only when ready to run the real
  // migration against the LIVE production spreadsheet, after
  // previewUnitsArchiveMigration() has been reviewed and shows
  // safeToExecute: true.
  const CONFIRMATION = UNITS_ARCHIVE_EDITOR_PLACEHOLDER_CONFIRMATION;

  return unitsArchiveRunEditorWrapper_(CONFIRMATION, {
    executeMigration: executeUnitsArchiveMigration,
    log: console.log,
  });
}

// Read-only, standalone. Has no memory of what a specific execute run
// touched — evaluates current state fresh every time (mirrors the same
// honest limitation in verifyAmplifyIm1Import() /
// verifyLessonsTypePlacementRuleMigration() / verifyLegacyIm1CleanupMigration()).
function verifyUnitsArchiveMigration() {
  const startedAt = new Date();
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const sheetInfo = unitsArchiveReadUnitsSheet_(spreadsheet);

  if (!sheetInfo.present) {
    const report = { mode: "verify", timestamp: startedAt.toISOString(), valid: false, errors: ["Units sheet not found."] };
    Logger.log(JSON.stringify(report, null, 2));
    return report;
  }

  // No stored "before" snapshot exists for a standalone verify call — every
  // unit is its own baseline (i.e., "did the migration's invariants hold"),
  // so non-target-unit field drift since some unrelated edit cannot be
  // detected here; only the execute path's own post-write verification (with
  // a real snapshot) can detect that. This call proves the CURRENT state is
  // consistent with a successfully-applied migration.
  const verification = unitsArchiveVerify_(sheetInfo.objects, { headers: sheetInfo.headers, objects: sheetInfo.objects });

  const report = {
    mode: "verify",
    timestamp: startedAt.toISOString(),
    headers: sheetInfo.headers,
    rowCount: sheetInfo.rowCount,
    verification: verification,
  };
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

// ============================================================================
// Node test access. `module` does not exist in the Apps Script runtime, so
// this block never executes there.
// ============================================================================
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    UNITS_ARCHIVE_TARGET_UNIT_IDS,
    UNITS_ARCHIVE_ORIGINAL_HEADERS,
    UNITS_ARCHIVE_LEGACY_ACTIVE_HEADER,
    UNITS_ARCHIVE_NEW_HEADER,
    UNITS_ARCHIVE_APPROVED_FINAL_HEADERS,
    UNITS_ARCHIVE_CONFIRMATION_PHRASE,
    UNITS_ARCHIVE_EDITOR_PLACEHOLDER_CONFIRMATION,
    unitsArchiveIsBlank_,
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
    unitsArchiveReadUnitsSheet_,
    unitsArchiveBuildLivePlan_,
    unitsArchiveCreateBackup_,
    unitsArchiveExecuteLocked_,
  };
}
