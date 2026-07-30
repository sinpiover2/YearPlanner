// Guarded cleanup of the legacy (pre-Amplify) Integrated Math 1 curriculum
// rows, now that the Amplify IM1 import has been verified in production
// (see docs/Development/AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md and the
// read-only provenance trace that preceded this file). Once the legacy
// AMP-IM1-*-free `IM1-U*` rows this file targets are confirmed safe to
// remove, the AMP-IM1-* rows become the sole source of truth for IM1.
//
// SAFETY STATUS AS OF THIS SPRINT: structurally complete and locally
// simulated only. executeLegacyIm1CleanupMigration() has NEVER been run
// against the real production spreadsheet — every test in
// scripts/import-staging/legacy-im1-cleanup.test.mjs exercises this file's
// logic against in-memory fakes only. A real, read-only preview WAS run
// against live production data this sprint (via the same anonymous doGet
// endpoint the frontend already calls) — see
// scripts/import-staging/preview-legacy-cleanup-live.mjs and its captured
// output — and it found real, populated teacher-owned data blocking every
// candidate unit, plus two units this file's own scoping rule (below)
// correctly refuses to touch at all. Do not treat "the code exists and its
// tests pass" as "this has been used against the real spreadsheet," and do
// not treat "a preview ran" as "execution was authorized."
//
// Precedent this file follows: apps-script-roster-admin/
// ProductionDataCleanup.js (preview/execute split, LockService guard,
// backup-before-write, planning-pass + revalidation-pass-under-lock,
// bottom-to-top row deletion, blockingFindings pattern, structured report)
// and apps-script-planning/AmplifyIm1Importer.js /
// LessonsSchemaMigration.js (same guarded-write-sequence shape, editor
// wrapper with a disarmed placeholder confirmation, module.exports guard
// for Node testability).
//
// Hard dependency: SHEET_ID (Code.js, same Apps Script project, shared
// global namespace).
//
// Every function below prefixed `legacyCleanup` to avoid colliding with the
// global namespace shared by every file in this Apps Script project.
//
// ============================================================================
// SECTION 1 — Pure logic (no SpreadsheetApp/LockService/Utilities calls).
// Exercised directly from Node via the module.exports guard at the bottom of
// this file — see scripts/import-staging/legacy-im1-cleanup.test.mjs.
// ============================================================================

// A legacy IM1 unit is only ever a cleanup candidate ("superseded") if an
// AMP-IM1-* unit already exists at the SAME CourseID + UnitNumber — never by
// the weaker rule "any IM1 unit whose ID doesn't start with AMP-IM1-". That
// weaker rule would also match IM1-U0 ("Class Orientation", UnitNumber 0)
// and, as of this sprint's real data, IM1-U8 ("Quadratic Equations",
// UnitNumber 8) — neither has an AMP-IM1-* replacement, because the Amplify
// extraction only ever covered 7 units (UnitNumber 1-7; see
// docs/Development/AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md's Sprint 5
// section, and the read-only provenance trace, both of which confirm
// IM1-U0 was never part of the Amplify extraction at all). Deleting either
// would destroy the only source of that unit's content, not deduplicate
// replaced data. This function is the single place that decision is made,
// so no other code path can silently disagree with it.
const LEGACY_CLEANUP_COURSE_ID = "IM1";
const LEGACY_CLEANUP_AMP_PREFIX = "AMP-IM1-";

// Teacher-owned fields (CURRICULUM_INFORMATION_MODEL.md §8/§9): a legacy
// unit/lesson carrying any of these, populated, is never deleted
// automatically — there is currently no destination field on the
// corresponding AMP-IM1-* row for this content (confirmed empty on every
// AMP-IM1-* row by this sprint's live preview), so deleting the legacy row
// would destroy it outright, not migrate it. KeyOutcome is included on the
// Lessons side because the read-only provenance trace established it is
// exclusively teacher-entered (the Units "Learning goals" editor), never
// importer-written.
const LEGACY_CLEANUP_UNIT_TEACHER_FIELDS = ["RequiredDays", "OptionalDays"];
const LEGACY_CLEANUP_LESSON_TEACHER_FIELDS = ["PlannedDays", "TeacherNotes", "PrimaryLink", "KeyOutcome"];

// Static, not derived from a row count or content hash (unlike
// AmplifyIm1Importer.js's artifact-hash-derived phrase) — this cleanup's
// scope is a fixed rule (superseded-by-UnitNumber), not a versioned data
// artifact, so there is nothing for a derived phrase to protect against
// going stale. Exact `===` match only. Mirrors
// ProductionDataCleanup.js's CLEANUP_CONFIRMATION_SENTINEL convention.
const LEGACY_CLEANUP_CONFIRMATION_PHRASE = "DELETE-LEGACY-IM1-CURRICULUM-CONFIRMED-V1";

// Never equal to LEGACY_CLEANUP_CONFIRMATION_PHRASE by construction
// (asserted directly in legacy-im1-cleanup.test.mjs).
const LEGACY_CLEANUP_EDITOR_PLACEHOLDER_CONFIRMATION = "REPLACE_WITH_EXACT_AUTHORIZATION_PHRASE_BEFORE_RUNNING";

function legacyCleanupIsBlank_(value) {
  return value === null || value === undefined || value === "";
}

function legacyCleanupIsAmpId_(id) {
  return typeof id === "string" && id.indexOf(LEGACY_CLEANUP_AMP_PREFIX) === 0;
}

// Returns the set of UnitNumbers for which an AMP-IM1-* unit already exists.
function legacyCleanupAmpUnitNumbers_(units) {
  const numbers = new Set();
  units.forEach(function (unit) {
    if (unit.CourseID === LEGACY_CLEANUP_COURSE_ID && legacyCleanupIsAmpId_(unit.UnitID)) {
      numbers.add(Number(unit.UnitNumber));
    }
  });
  return numbers;
}

// Classifies every non-AMP IM1 unit as either "superseded" (a same-numbered
// AMP-IM1-* unit exists — a cleanup candidate) or "no-replacement" (no
// AMP-IM1-* unit shares its UnitNumber — permanently out of scope for this
// cleanup, regardless of anything else about the row).
function legacyCleanupClassifyUnits_(units) {
  const ampUnitNumbers = legacyCleanupAmpUnitNumbers_(units);
  const superseded = [];
  const noReplacement = [];

  units.forEach(function (unit) {
    if (unit.CourseID !== LEGACY_CLEANUP_COURSE_ID) return;
    if (legacyCleanupIsAmpId_(unit.UnitID)) return;

    if (ampUnitNumbers.has(Number(unit.UnitNumber))) {
      superseded.push(unit);
    } else {
      noReplacement.push(unit);
    }
  });

  return { superseded: superseded, noReplacement: noReplacement };
}

function legacyCleanupPopulatedFields_(row, fields) {
  return fields
    .filter(function (field) {
      return !legacyCleanupIsBlank_(row[field]);
    })
    .map(function (field) {
      return { field: field, value: row[field] };
    });
}

function legacyCleanupFindDependentDailyProgress_(dailyProgress, unitIds, lessonIds) {
  const unitIdSet = new Set(unitIds);
  const lessonIdSet = new Set(lessonIds);
  return dailyProgress.filter(function (row) {
    return unitIdSet.has(row.UnitID) || lessonIdSet.has(row.LessonID);
  });
}

// The single source of truth for what this cleanup would do, given live
// (or fixture) Units/Lessons/DailyProgress data. Used identically by the
// preview, by execution's planning pass, and by execution's revalidation
// pass — never duplicated, so preview and execute can never silently
// disagree about scope.
function legacyCleanupBuildPlan_(data) {
  const units = data.units || [];
  const lessons = data.lessons || [];
  const dailyProgress = data.dailyProgress || [];

  const duplicateUnitIds = legacyCleanupFindDuplicateIds_(units, "UnitID");
  const duplicateLessonIds = legacyCleanupFindDuplicateIds_(lessons, "LessonID");
  const structuralBlockingFindings = [];
  if (duplicateUnitIds.length > 0) {
    structuralBlockingFindings.push("Duplicate UnitID(s) in Units: " + duplicateUnitIds.join(", ") + ".");
  }
  if (duplicateLessonIds.length > 0) {
    structuralBlockingFindings.push("Duplicate LessonID(s) in Lessons: " + duplicateLessonIds.join(", ") + ".");
  }

  const ampUnits = units.filter(function (u) {
    return u.CourseID === LEGACY_CLEANUP_COURSE_ID && legacyCleanupIsAmpId_(u.UnitID);
  });
  const math8Units = units.filter(function (u) {
    return u.CourseID !== LEGACY_CLEANUP_COURSE_ID;
  });
  const math8Lessons = lessons.filter(function (l) {
    return l.CourseID !== LEGACY_CLEANUP_COURSE_ID;
  });

  if (structuralBlockingFindings.length > 0) {
    return {
      safeToExecute: false,
      structuralBlockingFindings: structuralBlockingFindings,
      candidateUnits: [],
      candidateLessons: [],
      noReplacementUnits: [],
      dependentRecords: { DailyProgress: [] },
      ampUnitCount: ampUnits.length,
      ampLessonCount: lessons.filter(function (l) {
        return legacyCleanupIsAmpId_(l.UnitID);
      }).length,
      math8UnitCount: math8Units.length,
      math8LessonCount: math8Lessons.length,
    };
  }

  const classified = legacyCleanupClassifyUnits_(units);
  const candidateUnitIds = classified.superseded.map(function (u) {
    return u.UnitID;
  });

  const candidateLessonsRaw = lessons.filter(function (l) {
    return candidateUnitIds.indexOf(l.UnitID) !== -1;
  });
  const candidateLessonIds = candidateLessonsRaw.map(function (l) {
    return l.LessonID;
  });

  const dependentDailyProgress = legacyCleanupFindDependentDailyProgress_(
    dailyProgress,
    candidateUnitIds,
    candidateLessonIds,
  );
  const dependentUnitIdsWithRecords = new Set(
    dependentDailyProgress.map(function (r) {
      return r.UnitID;
    }),
  );
  const dependentLessonIdsWithRecords = new Set(
    dependentDailyProgress.map(function (r) {
      return r.LessonID;
    }),
  );

  // Lessons classified first (children), so a unit's classification can
  // reflect whether any of its own lessons are blocked (a unit is never
  // deleted while a lesson beneath it remains, and vice versa).
  const candidateLessons = candidateLessonsRaw.map(function (lesson) {
    const teacherFields = legacyCleanupPopulatedFields_(lesson, LEGACY_CLEANUP_LESSON_TEACHER_FIELDS);
    const hasDependents = dependentLessonIdsWithRecords.has(lesson.LessonID);
    const reasons = [];
    if (teacherFields.length > 0) reasons.push("preserve-teacher-fields");
    if (hasDependents) reasons.push("dependent-records-exist");

    return {
      LessonID: lesson.LessonID,
      UnitID: lesson.UnitID,
      LessonTitle: lesson.LessonTitle,
      classification: reasons.length > 0 ? "blocked" : "delete",
      reasons: reasons,
      populatedTeacherFields: teacherFields,
      dependentDailyProgressCount: dailyProgress.filter(function (r) {
        return r.LessonID === lesson.LessonID;
      }).length,
    };
  });

  const anyLessonBlockedByUnit = {};
  candidateLessons.forEach(function (lesson) {
    if (lesson.classification === "blocked") {
      anyLessonBlockedByUnit[lesson.UnitID] = true;
    }
  });

  const candidateUnits = classified.superseded.map(function (unit) {
    const teacherFields = legacyCleanupPopulatedFields_(unit, LEGACY_CLEANUP_UNIT_TEACHER_FIELDS);
    const hasDependents = dependentUnitIdsWithRecords.has(unit.UnitID);
    const hasBlockedLesson = !!anyLessonBlockedByUnit[unit.UnitID];
    const reasons = [];
    if (teacherFields.length > 0) reasons.push("preserve-teacher-fields");
    if (hasDependents) reasons.push("dependent-records-exist");
    if (hasBlockedLesson) reasons.push("child-lesson-blocked");

    return {
      UnitID: unit.UnitID,
      UnitTitle: unit.UnitTitle,
      UnitNumber: unit.UnitNumber,
      classification: reasons.length > 0 ? "blocked" : "delete",
      reasons: reasons,
      populatedTeacherFields: teacherFields,
    };
  });

  const anyBlocked =
    candidateUnits.some(function (u) {
      return u.classification === "blocked";
    }) ||
    candidateLessons.some(function (l) {
      return l.classification === "blocked";
    });

  const hasCandidates = candidateUnits.length > 0 || candidateLessons.length > 0;

  return {
    // All-or-nothing, matching ProductionDataCleanup.js's own convention
    // (planningPass.blocked refuses the entire run) — this file never
    // executes a partial deletion of "the clean subset" while leaving
    // blocked rows in place; a mixed result is refused in full until the
    // blockers are resolved or the scope is explicitly revised.
    safeToExecute: hasCandidates && !anyBlocked,
    structuralBlockingFindings: [],
    candidateUnits: candidateUnits,
    candidateLessons: candidateLessons,
    noReplacementUnits: classified.noReplacement.map(function (u) {
      return { UnitID: u.UnitID, UnitTitle: u.UnitTitle, UnitNumber: u.UnitNumber, reason: "no-amp-replacement" };
    }),
    dependentRecords: { DailyProgress: dependentDailyProgress },
    ampUnitCount: ampUnits.length,
    ampLessonCount: lessons.filter(function (l) {
      return legacyCleanupIsAmpId_(l.UnitID);
    }).length,
    math8UnitCount: math8Units.length,
    math8LessonCount: math8Lessons.length,
  };
}

function legacyCleanupFindDuplicateIds_(rows, idField) {
  const counts = {};
  rows.forEach(function (row) {
    const id = row[idField];
    counts[id] = (counts[id] || 0) + 1;
  });
  return Object.keys(counts).filter(function (id) {
    return counts[id] > 1;
  });
}

// True only when two plans built from legacyCleanupBuildPlan_ select the
// exact same rows for deletion in every category. Used to confirm nothing
// changed between the planning pass and the moment execution is about to
// mutate data (mirrors cleanupPlansMatch_'s row-set-equality technique).
function legacyCleanupPlansMatch_(planA, planB) {
  if (!planA.safeToExecute || !planB.safeToExecute) return false;

  const idSet = function (rows, idField) {
    return new Set(
      rows
        .filter(function (r) {
          return r.classification === "delete";
        })
        .map(function (r) {
          return r[idField];
        }),
    );
  };
  const setsEqual = function (a, b) {
    if (a.size !== b.size) return false;
    for (const value of a) {
      if (!b.has(value)) return false;
    }
    return true;
  };

  return (
    setsEqual(idSet(planA.candidateUnits, "UnitID"), idSet(planB.candidateUnits, "UnitID")) &&
    setsEqual(idSet(planA.candidateLessons, "LessonID"), idSet(planB.candidateLessons, "LessonID"))
  );
}

function legacyCleanupBuildPreviewReport_(plan, startedAt) {
  const unitsToDelete = plan.candidateUnits.filter(function (u) {
    return u.classification === "delete";
  });
  const lessonsToDelete = plan.candidateLessons.filter(function (l) {
    return l.classification === "delete";
  });
  const unitsBlocked = plan.candidateUnits.filter(function (u) {
    return u.classification === "blocked";
  });
  const lessonsBlocked = plan.candidateLessons.filter(function (l) {
    return l.classification === "blocked";
  });

  return {
    mode: "preview",
    timestamp: startedAt.toISOString(),
    writesOccurred: false,
    note: "This preview performed zero writes.",
    legacyUnitsFound: plan.candidateUnits,
    legacyLessonsFound: plan.candidateLessons,
    outOfScopeUnitsPreserved: plan.noReplacementUnits,
    dependentRecordsFoundByTable: plan.dependentRecords,
    recordsThatWouldBeDeleted: {
      units: unitsToDelete.map(function (u) {
        return u.UnitID;
      }),
      lessons: lessonsToDelete.map(function (l) {
        return l.LessonID;
      }),
      unitCount: unitsToDelete.length,
      lessonCount: lessonsToDelete.length,
    },
    recordsPreserved: {
      outOfScopeUnits: plan.noReplacementUnits.map(function (u) {
        return u.UnitID;
      }),
      blockedUnits: unitsBlocked.map(function (u) {
        return { UnitID: u.UnitID, reasons: u.reasons };
      }),
      blockedLessons: lessonsBlocked.map(function (l) {
        return { LessonID: l.LessonID, reasons: l.reasons };
      }),
      ampUnitCount: plan.ampUnitCount,
      ampLessonCount: plan.ampLessonCount,
      math8UnitCount: plan.math8UnitCount,
      math8LessonCount: plan.math8LessonCount,
    },
    safetyValidation: {
      structuralBlockingFindings: plan.structuralBlockingFindings,
      unitsBlockedCount: unitsBlocked.length,
      lessonsBlockedCount: lessonsBlocked.length,
    },
    confirmationRequired: LEGACY_CLEANUP_CONFIRMATION_PHRASE,
    safeToExecute: plan.safeToExecute,
  };
}

function legacyCleanupValidateConfirmation_(provided) {
  return typeof provided === "string" && provided === LEGACY_CLEANUP_CONFIRMATION_PHRASE;
}

// Pure adapter behind the editor wrapper — see amplifyIm1RunEditorWrapper_ /
// lessonsMigrationRunEditorWrapper_ for the identical rationale (testable
// call-log-return behavior with no import/lock/backup logic of its own).
function legacyCleanupRunEditorWrapper_(confirmation, deps) {
  const report = deps.executeCleanup(confirmation);
  deps.log(JSON.stringify(report, null, 2));
  return report;
}

// Post-execution verification, given a before-state unit/lesson count
// snapshot and the current (after) data. Pure function so it is exercised
// identically by the execute path's own post-write step and by the
// standalone verifyLegacyIm1CleanupMigration() — the same "no second,
// hand-written comparison engine" principle AmplifyIm1Importer.js's
// amplifyIm1VerifyAgainstPayload_ documents.
function legacyCleanupVerify_(afterData, expected) {
  const units = afterData.units || [];
  const lessons = afterData.lessons || [];
  const dailyProgress = afterData.dailyProgress || [];
  const errors = [];

  const im1Units = units.filter(function (u) {
    return u.CourseID === LEGACY_CLEANUP_COURSE_ID;
  });
  const nonAmpIm1Units = im1Units.filter(function (u) {
    return !legacyCleanupIsAmpId_(u.UnitID);
  });
  // Only the units this cleanup was actually scoped to touch (superseded,
  // same-UnitNumber-as-an-AMP-unit) are expected to be gone; a
  // no-replacement unit like IM1-U0 remaining is correct, not a failure.
  const remainingSupersededLegacy = nonAmpIm1Units.filter(function (u) {
    return expected.supersededUnitIds.indexOf(u.UnitID) !== -1;
  });

  if (remainingSupersededLegacy.length > 0) {
    errors.push(
      "Legacy superseded IM1 unit(s) still present: " +
        remainingSupersededLegacy.map(function (u) { return u.UnitID; }).join(", ") + ".",
    );
  }

  const ampIm1Units = im1Units.filter(function (u) {
    return legacyCleanupIsAmpId_(u.UnitID);
  });
  // Caller-supplied, never hardcoded here — the real production entry
  // points (legacyCleanupExecuteLocked_, verifyLegacyIm1CleanupMigration)
  // pass the actual known-good counts (7 units / 164 lessons, per the
  // Amplify IM1 import); a fixture-driven test can omit either and this
  // check is skipped rather than failing against an arbitrary fixture size.
  if (expected.expectedAmpUnitCount !== undefined && ampIm1Units.length !== expected.expectedAmpUnitCount) {
    errors.push("Expected exactly " + expected.expectedAmpUnitCount + " AMP-IM1-* units; found " + ampIm1Units.length + ".");
  }
  const nonAmpRemaining = im1Units.filter(function (u) {
    return !legacyCleanupIsAmpId_(u.UnitID) && expected.supersededUnitIds.indexOf(u.UnitID) !== -1;
  });
  if (nonAmpRemaining.length > 0) {
    errors.push(
      "Unit ID(s) not prefixed AMP-IM1- remain among the units this cleanup was scoped to remove: " +
        nonAmpRemaining.map(function (u) { return u.UnitID; }).join(", ") + ".",
    );
  }

  const remainingSupersededLessons = lessons.filter(function (l) {
    return expected.supersededLessonIds.indexOf(l.LessonID) !== -1;
  });
  if (remainingSupersededLessons.length > 0) {
    errors.push(
      "Legacy superseded IM1 lesson(s) still present: " +
        remainingSupersededLessons.map(function (l) { return l.LessonID; }).join(", ") + ".",
    );
  }

  const remainingIm1UnitIds = new Set(im1Units.map(function (u) { return u.UnitID; }));
  const orphanedDailyProgress = dailyProgress.filter(function (r) {
    return r.CourseID === LEGACY_CLEANUP_COURSE_ID && r.UnitID && !remainingIm1UnitIds.has(r.UnitID);
  });
  if (orphanedDailyProgress.length > 0) {
    errors.push(
      "Orphaned DailyProgress row(s) referencing a UnitID that no longer exists: " +
        orphanedDailyProgress.map(function (r) { return r.DailyProgressID; }).join(", ") + ".",
    );
  }

  const ampLessonCount = lessons.filter(function (l) {
    return legacyCleanupIsAmpId_(l.UnitID);
  }).length;
  if (expected.expectedAmpLessonCount !== undefined && ampLessonCount !== expected.expectedAmpLessonCount) {
    errors.push(
      "Expected imported AMP-IM1-* lesson count to remain " + expected.expectedAmpLessonCount +
        "; found " + ampLessonCount + ".",
    );
  }

  const math8UnitCount = units.filter(function (u) { return u.CourseID !== LEGACY_CLEANUP_COURSE_ID; }).length;
  const math8LessonCount = lessons.filter(function (l) { return l.CourseID !== LEGACY_CLEANUP_COURSE_ID; }).length;
  if (expected.math8UnitCount !== undefined && math8UnitCount !== expected.math8UnitCount) {
    errors.push("Math 8 unit count changed: expected " + expected.math8UnitCount + ", found " + math8UnitCount + ".");
  }
  if (expected.math8LessonCount !== undefined && math8LessonCount !== expected.math8LessonCount) {
    errors.push("Math 8 lesson count changed: expected " + expected.math8LessonCount + ", found " + math8LessonCount + ".");
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    counts: {
      im1UnitCount: im1Units.length,
      ampIm1UnitCount: ampIm1Units.length,
      ampIm1LessonCount: ampLessonCount,
      math8UnitCount: math8UnitCount,
      math8LessonCount: math8LessonCount,
    },
  };
}

// ============================================================================
// SECTION 2 — Apps Script I/O boundary. Everything below touches
// SpreadsheetApp/LockService/Utilities (or accepts injected stand-ins for
// them) and is therefore exercised under Node only through the fakes in
// scripts/import-staging/fake-spreadsheet.mjs, exactly like
// AmplifyIm1Importer.js's and LessonsSchemaMigration.js's own Section 2.
// ============================================================================

// Mirrors auditReadSheet_'s shape exactly (ProductionDataAudit.js lives in a
// separate Apps Script project and cannot be imported — a deliberate, small,
// already-reviewed-pattern duplication, not a new invention).
function legacyCleanupReadSheet_(spreadsheet, sheetName) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) return { present: false, name: sheetName };

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow === 0 || lastColumn === 0) {
    return { present: true, name: sheetName, headers: [], rawRows: [], objects: [], rowCount: 0 };
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

  return { present: true, name: sheetName, headers: headers, rawRows: rawRows, objects: objects, rowCount: objects.length };
}

function legacyCleanupReadAllSheets_(spreadsheet) {
  return {
    Units: legacyCleanupReadSheet_(spreadsheet, "Units"),
    Lessons: legacyCleanupReadSheet_(spreadsheet, "Lessons"),
    DailyProgress: legacyCleanupReadSheet_(spreadsheet, "DailyProgress"),
  };
}

function legacyCleanupBuildLivePlan_(spreadsheet) {
  const sheets = legacyCleanupReadAllSheets_(spreadsheet);
  const missing = ["Units", "Lessons", "DailyProgress"].filter(function (name) {
    return !sheets[name].present;
  });
  if (missing.length > 0) {
    return {
      safeToExecute: false,
      structuralBlockingFindings: missing.map(function (name) {
        return "Required sheet '" + name + "' was not found.";
      }),
      candidateUnits: [],
      candidateLessons: [],
      noReplacementUnits: [],
      dependentRecords: { DailyProgress: [] },
      ampUnitCount: 0,
      ampLessonCount: 0,
      math8UnitCount: 0,
      math8LessonCount: 0,
    };
  }

  return legacyCleanupBuildPlan_({
    units: sheets.Units.objects,
    lessons: sheets.Lessons.objects,
    dailyProgress: sheets.DailyProgress.objects,
  });
}

function legacyCleanupCreateBackup_(spreadsheet, formatTimestamp) {
  const timestamp = formatTimestamp();
  const backupName = "Year Planner Database — pre-legacy-im1-cleanup " + timestamp;
  const backupSpreadsheet = spreadsheet.copy(backupName);

  if (!backupSpreadsheet || !backupSpreadsheet.getId()) {
    throw new Error("Spreadsheet.copy() did not return a usable backup spreadsheet.");
  }

  return { id: backupSpreadsheet.getId(), url: backupSpreadsheet.getUrl(), name: backupName };
}

function legacyCleanupDeleteRowsDescending_(sheet, rowNumbers) {
  const sorted = rowNumbers.slice().sort(function (a, b) {
    return b - a;
  });
  sorted.forEach(function (rowNumber) {
    sheet.deleteRow(rowNumber);
  });
  return sorted.length;
}

// Row numbers (1-indexed, header = row 1) for every id in idsToDelete,
// looked up by header name — never assumed positional.
function legacyCleanupRowNumbersForIds_(sheetInfo, idHeader, idsToDelete) {
  const idIndex = sheetInfo.headers.indexOf(idHeader);
  const idSet = new Set(idsToDelete);
  const rowNumbers = [];
  sheetInfo.rawRows.forEach(function (row, index) {
    if (idSet.has(row[idIndex])) {
      rowNumbers.push(index + 2); // +1 for 0-index, +1 for header row
    }
  });
  return rowNumbers;
}

function previewLegacyIm1CleanupMigration() {
  const startedAt = new Date();
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const plan = legacyCleanupBuildLivePlan_(spreadsheet);
  const report = legacyCleanupBuildPreviewReport_(plan, startedAt);
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

// Guarded sequence (mirrors executeProductionDataCleanupV1Locked_'s /
// amplifyIm1ExecuteLocked_'s ordering exactly): (1) validate confirmation,
// (2) acquire lock, (3) planning pass — reread and build the plan fresh
// under lock, refuse if not safeToExecute, (4) create backup, (5)
// revalidation pass — reread and rebuild immediately before mutating; abort
// if the selected row sets changed, (6) delete Lessons rows (children)
// then Units rows (parents), each sheet bottom-to-top in one pass, (7)
// reread and post-write verify against the plan's own expected IDs, (8)
// return a structured report, (9) release the lock in `finally`.
function legacyCleanupExecuteLocked_(confirmation, deps) {
  const startedAt = new Date();
  const report = {
    mode: "execute",
    timestamp: startedAt.toISOString(),
    confirmationAccepted: false,
    lockAcquired: false,
    plan: null,
    backup: null,
    unitsRemoved: 0,
    lessonsRemoved: 0,
    verification: null,
    writesOccurred: false,
    errorStage: null,
    errorMessage: null,
  };

  if (!legacyCleanupValidateConfirmation_(confirmation)) {
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

    const planningPass = legacyCleanupBuildLivePlan_(spreadsheet);
    report.plan = planningPass;

    if (!planningPass.safeToExecute) {
      report.errorStage = "planning";
      report.errorMessage = "Cleanup plan is not safe to execute (blocking findings present); no data was touched.";
      return report;
    }

    let backup;
    try {
      backup = legacyCleanupCreateBackup_(spreadsheet, deps.formatTimestamp);
    } catch (error) {
      report.errorStage = "backup";
      report.errorMessage = "Backup creation failed: " + error.message + ". No data was touched.";
      return report;
    }
    report.backup = backup;

    const revalidationPass = legacyCleanupBuildLivePlan_(spreadsheet);
    if (!legacyCleanupPlansMatch_(planningPass, revalidationPass)) {
      report.errorStage = "revalidation";
      report.errorMessage = "Selected rows changed between planning and mutation; aborted before deleting anything.";
      return report;
    }

    const unitIdsToDelete = planningPass.candidateUnits
      .filter(function (u) { return u.classification === "delete"; })
      .map(function (u) { return u.UnitID; });
    const lessonIdsToDelete = planningPass.candidateLessons
      .filter(function (l) { return l.classification === "delete"; })
      .map(function (l) { return l.LessonID; });

    const lessonsSheetInfo = legacyCleanupReadSheet_(spreadsheet, "Lessons");
    const unitsSheetInfo = legacyCleanupReadSheet_(spreadsheet, "Units");

    // Children before parents — a lesson row referencing an already-deleted
    // unit is a harmless, re-derivable inconsistency; the reverse (a unit
    // deleted while its lessons remain) is more confusing to recover from.
    const lessonRowNumbers = legacyCleanupRowNumbersForIds_(lessonsSheetInfo, "LessonID", lessonIdsToDelete);
    const lessonsSheet = spreadsheet.getSheetByName("Lessons");
    report.lessonsRemoved = legacyCleanupDeleteRowsDescending_(lessonsSheet, lessonRowNumbers);
    report.writesOccurred = report.lessonsRemoved > 0 || report.writesOccurred;

    const unitRowNumbers = legacyCleanupRowNumbersForIds_(unitsSheetInfo, "UnitID", unitIdsToDelete);
    const unitsSheet = spreadsheet.getSheetByName("Units");
    report.unitsRemoved = legacyCleanupDeleteRowsDescending_(unitsSheet, unitRowNumbers);
    report.writesOccurred = report.unitsRemoved > 0 || report.writesOccurred;

    if (typeof deps.spreadsheetApp.flush === "function") {
      deps.spreadsheetApp.flush();
    }

    const afterSheets = legacyCleanupReadAllSheets_(spreadsheet);
    const verification = legacyCleanupVerify_(
      { units: afterSheets.Units.objects, lessons: afterSheets.Lessons.objects, dailyProgress: afterSheets.DailyProgress.objects },
      {
        supersededUnitIds: unitIdsToDelete,
        supersededLessonIds: lessonIdsToDelete,
        math8UnitCount: planningPass.math8UnitCount,
        math8LessonCount: planningPass.math8LessonCount,
        // Known-good production counts (see the read-only provenance trace
        // and AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md): 7 units, 164
        // lessons imported. Deletion here never touches an AMP-IM1-* row,
        // so these must be identical before and after a correct run.
        expectedAmpUnitCount: planningPass.ampUnitCount,
        expectedAmpLessonCount: planningPass.ampLessonCount,
      },
    );
    report.verification = verification;

    if (!verification.valid) {
      report.errorStage = "post-write-verification";
      report.errorMessage =
        "Rows were deleted but post-write verification found mismatches. Manual recovery may be required " +
          "from the backup created this run. No automatic rollback was performed.";
      return report;
    }

    return report;
  } catch (error) {
    report.errorStage = report.errorStage || "exception";
    report.errorMessage = report.backup
      ? error.message +
          " The deletion may have partially applied and was not confirmed complete. Manual recovery may be " +
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

// No default parameter — an accidental zero-argument call (e.g. an Apps
// Script editor "Run" click) passes `confirmation` as `undefined`, which can
// never satisfy legacyCleanupValidateConfirmation_'s exact-string match.
function executeLegacyIm1CleanupMigration(confirmation) {
  return legacyCleanupExecuteLocked_(confirmation, {
    spreadsheetApp: SpreadsheetApp,
    lockService: LockService,
    sheetId: SHEET_ID,
    formatTimestamp: function () {
      return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HHmmss");
    },
  });
}

// Disarmed by construction — see AMPLIFY_IM1_IMPORTER_README.md and
// LessonsSchemaMigration.js's identical wrapper for the full edit-then-run
// production authorization ceremony this pattern exists to support. The
// placeholder below never matches LEGACY_CLEANUP_CONFIRMATION_PHRASE, so
// running this function unedited refuses exactly like calling
// executeLegacyIm1CleanupMigration() with no argument.
function executeLegacyIm1CleanupMigrationFromEditor() {
  // Change ONLY the line below, and only when ready to run the real cleanup
  // against the LIVE production spreadsheet, after previewLegacyIm1CleanupMigration()
  // has been reviewed and shows safeToExecute: true.
  const CONFIRMATION = LEGACY_CLEANUP_EDITOR_PLACEHOLDER_CONFIRMATION;

  return legacyCleanupRunEditorWrapper_(CONFIRMATION, {
    executeCleanup: executeLegacyIm1CleanupMigration,
    log: console.log,
  });
}

// Read-only, standalone. Has no memory of what a specific execute run
// touched — evaluates current state fresh every time (mirrors
// verifyAmplifyIm1Import()'s / verifyLessonsTypePlacementRuleMigration()'s
// same honest limitation). Reports against the *current* superseded-unit
// classification, so if new legacy rows are later reintroduced this would
// (correctly) flag them again rather than silently trusting a past run.
function verifyLegacyIm1CleanupMigration() {
  const startedAt = new Date();
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const sheets = legacyCleanupReadAllSheets_(spreadsheet);
  const currentPlan = legacyCleanupBuildLivePlan_(spreadsheet);

  // A verify call made before any cleanup has ever run will legitimately
  // find the legacy units it's checking for still present — this reports
  // that honestly rather than assuming a prior execute succeeded.
  const stillPresentUnitIds = currentPlan.candidateUnits.map(function (u) {
    return u.UnitID;
  });
  const stillPresentLessonIds = currentPlan.candidateLessons.map(function (l) {
    return l.LessonID;
  });

  const verification = legacyCleanupVerify_(
    { units: sheets.Units.objects, lessons: sheets.Lessons.objects, dailyProgress: sheets.DailyProgress.objects },
    {
      supersededUnitIds: stillPresentUnitIds,
      supersededLessonIds: stillPresentLessonIds,
      // Explicit known-good literals (not derived from the current read)
      // per this sprint's task spec: verification must confirm exactly 7
      // AMP-IM1-* units and 164 AMP-IM1-* lessons — the actual, confirmed
      // Amplify IM1 import counts — not merely "whatever exists right now."
      expectedAmpUnitCount: 7,
      expectedAmpLessonCount: 164,
    },
  );

  const report = {
    mode: "verify",
    timestamp: startedAt.toISOString(),
    currentPlan: currentPlan,
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
    LEGACY_CLEANUP_COURSE_ID,
    LEGACY_CLEANUP_AMP_PREFIX,
    LEGACY_CLEANUP_UNIT_TEACHER_FIELDS,
    LEGACY_CLEANUP_LESSON_TEACHER_FIELDS,
    LEGACY_CLEANUP_CONFIRMATION_PHRASE,
    LEGACY_CLEANUP_EDITOR_PLACEHOLDER_CONFIRMATION,
    legacyCleanupIsBlank_,
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
    legacyCleanupReadSheet_,
    legacyCleanupReadAllSheets_,
    legacyCleanupBuildLivePlan_,
    legacyCleanupCreateBackup_,
    legacyCleanupDeleteRowsDescending_,
    legacyCleanupRowNumbersForIds_,
    legacyCleanupExecuteLocked_,
  };
}
