// Guarded, write-capable importer for the Amplify IM1 staging artifact.
//
// SAFETY STATUS AS OF THIS SPRINT: structurally complete and locally
// simulated. executeAmplifyIm1Import() has NEVER been run against the real
// production spreadsheet (SHEET_ID, Code.js:1) — every test in
// scripts/import-staging/importer.test.mjs exercises this file's logic
// against in-memory fakes only. Do not treat "the code exists" as "the code
// has been proven safe against real Sheets."
//
// Precedent this file follows: apps-script-roster-admin/ProductionDataAudit.js
// (read-only reader shape — see amplifyIm1ReadSheet_, modeled on
// auditReadSheet_) and apps-script-roster-admin/ProductionDataCleanup.js
// (preview/execute split, LockService guard, backup-before-write,
// planning-pass + revalidation-pass-under-lock, structured report). Adapted,
// not copied blindly — this project's Lessons/Units sheets have a different
// shape (see docs/Reference/SHEET_STRUCTURE.md) and a different field-
// ownership map (see docs/Architecture/CURRICULUM_INFORMATION_MODEL.md §8/§9).
//
// Hard dependency: SHEET_ID (Code.js, same Apps Script project, shared
// global namespace) and the generated AMPLIFY_IM1_IMPORT_PAYLOAD /
// AMPLIFY_IM1_IMPORT_METADATA constants (AmplifyIm1ImportData.js — generated
// by scripts/import-staging/generate-apps-script-payload.mjs; never
// hand-edit that file).
//
// Every function below prefixed `amplifyIm1` to avoid colliding with the
// global namespace shared by every file in this Apps Script project.
//
// ============================================================================
// SECTION 1 — Pure logic (no SpreadsheetApp/LockService/Utilities calls).
// Every function in this section is a pure function of its arguments and is
// exercised directly from Node via the module.exports guard at the bottom of
// this file — see scripts/import-staging/importer.test.mjs. Keeping
// SpreadsheetApp/LockService/Utilities calls out of this section is what
// makes that possible; do not add them here.
// ============================================================================

const AMPLIFY_IM1_IMPORTER_SUPPORTED_SCHEMA_VERSION = "1.0.0";

// Corrected per the Sprint 5 read-only production audit (see
// AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md's Sprint 6.1 section): the real
// column is UnitTitle, not UnitName, and the real sheet also carries a
// genuine, populated UnitNumber column distinct from SortOrder — both are
// now required and both are publisher-owned (see amplifyIm1PlanUnit_).
const AMPLIFY_IM1_REQUIRED_UNIT_HEADERS = [
  "UnitID",
  "CourseID",
  "UnitNumber",
  "UnitTitle",
  "RequiredDays",
  "OptionalDays",
  "SortOrder",
];

// Type and PlacementRule do not exist on the production Lessons sheet as of
// this sprint (see docs/Reference/SHEET_STRUCTURE.md and
// AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md's Sprint 1 note: "a no-op today,
// since that column doesn't exist in production yet"). Requiring them here
// means schema validation will legitimately report `blocked` against the
// real spreadsheet until that column-addition migration happens — see this
// file's header and the Sprint 4 documentation for why that is correct,
// not a bug.
const AMPLIFY_IM1_REQUIRED_LESSON_HEADERS = [
  "LessonID",
  "UnitID",
  "CourseID",
  "LessonNumber",
  "LessonTitle",
  "PlannedDays",
  "SortOrder",
  "Type",
  "PlacementRule",
  "Description",
  "PrimaryLink",
  "TeacherNotes",
  "IsOptional",
];

// Teacher-owned fields (CURRICULUM_INFORMATION_MODEL.md §8/§9,
// AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md §2/§14 D-2/D-5): never written by
// a create/source-update action beyond leaving them blank on a brand-new
// row, and never overwritten on an existing row.
const AMPLIFY_IM1_TEACHER_OWNED_LESSON_FIELDS = ["PlannedDays", "TeacherNotes", "PrimaryLink"];

// --- Confirmation -----------------------------------------------------------

// Exact match only. No trim, no case-folding, no boolean/truthy acceptance —
// "CONFIRM" or `true` can never satisfy this. A stale confirmation (copied
// from a previous artifact version) fails automatically because
// AMPLIFY_IM1_IMPORT_METADATA.confirmationPhrase is derived from the
// artifact's own SHA-256 plus unit/item counts — any of those changing
// changes the expected string.
function amplifyIm1ValidateConfirmation_(provided, expected) {
  return typeof provided === "string" && typeof expected === "string" && provided === expected;
}

// --- Payload integrity (tamper/drift guard) ---------------------------------

// Recomputes the payload's own hash from its in-memory content and compares
// it to the value recorded at generation time. Catches: the generated file
// being hand-edited, the generated file going stale relative to a
// regenerated canonical artifact, or an unsupported schema version.
// `computeSha256Hex` is injected so this stays a pure function — Apps
// Script supplies amplifyIm1RealSha256Hex_ (Utilities-based); Node tests
// supply a node:crypto-based equivalent.
function amplifyIm1ValidatePayloadIntegrity_(payload, metadata, computeSha256Hex) {
  const errors = [];

  if (!metadata || typeof metadata.schemaVersion !== "string") {
    errors.push("Import metadata is missing a schemaVersion.");
    return { valid: false, errors };
  }

  if (metadata.schemaVersion !== AMPLIFY_IM1_IMPORTER_SUPPORTED_SCHEMA_VERSION) {
    errors.push(
      `Unsupported artifact schema version "${metadata.schemaVersion}" — this importer supports "${AMPLIFY_IM1_IMPORTER_SUPPORTED_SCHEMA_VERSION}".`,
    );
  }

  const serialized = JSON.stringify(payload, null, 2) + "\n";
  const recomputed = computeSha256Hex(serialized);

  if (recomputed !== metadata.artifactSha256) {
    errors.push(
      "Embedded payload does not match its recorded artifactSha256 — AmplifyIm1ImportData.js may have been " +
        "hand-edited, or is stale relative to data/import-staging/amplify-im1.json. Regenerate it with " +
        "scripts/import-staging/generate-apps-script-payload.mjs before proceeding.",
    );
  }

  return { valid: errors.length === 0, errors };
}

// --- Payload structure (defense-in-depth; artifact was already validated by
// scripts/import-staging/validate-artifact.mjs at generation time, but the
// importer must not blindly trust a payload it did not itself check) -------

function amplifyIm1IsNonBlankString_(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function amplifyIm1ValidatePayloadStructure_(payload) {
  const errors = [];

  if (!payload || !Array.isArray(payload.units)) {
    return { valid: false, errors: ["Payload is missing a units array."] };
  }

  const seenUnitIds = {};
  const seenItemIds = {};

  payload.units.forEach(function (unit) {
    if (seenUnitIds[unit.unitId]) {
      errors.push(`Duplicate unitId in payload: ${unit.unitId}`);
    }
    seenUnitIds[unit.unitId] = true;

    (unit.items || []).forEach(function (item) {
      if (seenItemIds[item.itemId]) {
        errors.push(`Duplicate itemId in payload: ${item.itemId}`);
      }
      seenItemIds[item.itemId] = true;

      const hasOrder = item.order !== null && item.order !== undefined;
      const hasPlacementRule = amplifyIm1IsNonBlankString_(item.placementRule);

      if (hasOrder && hasPlacementRule) {
        errors.push(`${item.itemId}: has both an order and a placementRule.`);
      } else if (!hasOrder && !hasPlacementRule) {
        errors.push(`${item.itemId}: has neither an order nor a placementRule.`);
      }
    });
  });

  return { valid: errors.length === 0, errors };
}

// --- Destination schema validation ------------------------------------------

// headers = { units: [...headerNames], lessons: [...headerNames] }
function amplifyIm1ValidateDestinationSchema_(headers) {
  const missingUnitHeaders = AMPLIFY_IM1_REQUIRED_UNIT_HEADERS.filter(function (h) {
    return (headers.units || []).indexOf(h) === -1;
  });
  const missingLessonHeaders = AMPLIFY_IM1_REQUIRED_LESSON_HEADERS.filter(function (h) {
    return (headers.lessons || []).indexOf(h) === -1;
  });

  const errors = [];
  if (missingUnitHeaders.length > 0) {
    errors.push(`Units sheet is missing required column(s): ${missingUnitHeaders.join(", ")}.`);
  }
  if (missingLessonHeaders.length > 0) {
    errors.push(`Lessons sheet is missing required column(s): ${missingLessonHeaders.join(", ")}.`);
  }

  return { valid: errors.length === 0, errors, missingUnitHeaders, missingLessonHeaders };
}

// --- Import plan (ports the exact decision table already proven in
// scripts/import-staging/build-import-plan.mjs; see that file's own header
// comment for the full rationale. Apps Script has no ES module system, so
// this cannot be a literal `import` — instead this is a direct, near-verbatim
// port of the same functions, and scripts/import-staging/importer.test.mjs
// runs BOTH implementations against the SAME fixtures and asserts identical
// output, so the two can never silently drift without a failing test.) ------

function amplifyIm1IsBlank_(value) {
  return value === null || value === undefined || value === "";
}

function amplifyIm1TeacherFieldsPopulated_(destinationLesson) {
  return AMPLIFY_IM1_TEACHER_OWNED_LESSON_FIELDS.filter(function (field) {
    return !amplifyIm1IsBlank_(destinationLesson[field]);
  });
}

// A round-tripped `null` (write→read) comes back from a real spreadsheet as
// an empty string, never `null` itself. Comparing raw `??` against
// artifactItem.placementRule (genuinely `null` for fixed items) would
// re-detect a false "change" forever on every rerun — normalize through
// amplifyIm1IsBlank_ before comparing. Kept identical to
// scripts/import-staging/build-import-plan.mjs's normalizeBlankToNull; see
// that file's comment for the full rationale.
function amplifyIm1NormalizeBlankToNull_(value) {
  return amplifyIm1IsBlank_(value) ? null : value;
}

function amplifyIm1PublisherFieldsDiffer_(artifactItem, destinationLesson) {
  const diffs = [];
  if (destinationLesson.LessonTitle !== artifactItem.title) {
    diffs.push({ field: "LessonTitle", current: destinationLesson.LessonTitle, proposed: artifactItem.title });
  }
  if (amplifyIm1NormalizeBlankToNull_(destinationLesson.Type) !== artifactItem.type) {
    diffs.push({ field: "Type", current: amplifyIm1NormalizeBlankToNull_(destinationLesson.Type), proposed: artifactItem.type });
  }
  if (amplifyIm1NormalizeBlankToNull_(destinationLesson.SortOrder) !== artifactItem.order) {
    diffs.push({ field: "SortOrder", current: amplifyIm1NormalizeBlankToNull_(destinationLesson.SortOrder), proposed: artifactItem.order });
  }
  if (amplifyIm1NormalizeBlankToNull_(destinationLesson.PlacementRule) !== artifactItem.placementRule) {
    diffs.push({
      field: "PlacementRule",
      current: amplifyIm1NormalizeBlankToNull_(destinationLesson.PlacementRule),
      proposed: artifactItem.placementRule,
    });
  }
  if (Boolean(destinationLesson.IsOptional) !== artifactItem.isOptional) {
    diffs.push({ field: "IsOptional", current: Boolean(destinationLesson.IsOptional), proposed: artifactItem.isOptional });
  }
  if (amplifyIm1NormalizeBlankToNull_(destinationLesson.Description) !== artifactItem.summary) {
    diffs.push({ field: "Description", current: amplifyIm1NormalizeBlankToNull_(destinationLesson.Description), proposed: artifactItem.summary });
  }
  return diffs;
}

function amplifyIm1PlanItem_(unit, artifactItem, destinationLessonsById, blockers) {
  const matches = destinationLessonsById.get(artifactItem.itemId) || [];

  if (matches.length > 1) {
    blockers.push(
      `Duplicate destination LessonID "${artifactItem.itemId}" (${matches.length} rows) — cannot safely determine which row to compare against. Hard fail.`,
    );
    return { itemId: artifactItem.itemId, title: artifactItem.title, classification: "blocked", reasons: ["duplicate-destination-id"] };
  }

  const destinationLesson = matches[0];

  if (!destinationLesson) {
    return {
      itemId: artifactItem.itemId,
      title: artifactItem.title,
      classification: "create",
      proposedRow: {
        LessonID: artifactItem.itemId,
        UnitID: unit.unitId,
        CourseID: unit.courseId,
        LessonTitle: artifactItem.title,
        Type: artifactItem.type,
        SortOrder: artifactItem.order,
        PlacementRule: artifactItem.placementRule,
        IsOptional: artifactItem.isOptional,
        Description: artifactItem.summary,
        // Never fabricated — the extraction does not carry a distinct
        // LessonNumber field (only Order + occasional "Lesson N:" text
        // inside Subtitle). Deriving one by parsing that text would be
        // inventing structured publisher data, which this project's
        // extraction principles explicitly forbid. Left blank; a known,
        // documented gap (see Sprint 4 notes), not a silent guess.
        LessonNumber: null,
        PlannedDays: null,
        TeacherNotes: null,
        PrimaryLink: null,
      },
    };
  }

  if (destinationLesson.CourseID && destinationLesson.CourseID !== unit.courseId) {
    blockers.push(
      `LessonID "${artifactItem.itemId}" already exists under CourseID "${destinationLesson.CourseID}", ` +
        `but the artifact assigns it to course "${unit.courseId}". Hard fail — cross-course ID collision.`,
    );
    return { itemId: artifactItem.itemId, title: artifactItem.title, classification: "blocked", reasons: ["cross-course-id-collision"] };
  }

  const populatedTeacherFields = amplifyIm1TeacherFieldsPopulated_(destinationLesson);
  const diffs = amplifyIm1PublisherFieldsDiffer_(artifactItem, destinationLesson);
  const titleMismatch = destinationLesson.LessonTitle !== artifactItem.title;

  if (diffs.length === 0) {
    return { itemId: artifactItem.itemId, title: artifactItem.title, classification: "no-op", reasons: [] };
  }

  const reasons = [];
  if (titleMismatch) reasons.push("title-mismatch-warning");

  if (populatedTeacherFields.length > 0) {
    reasons.push("preserve-teacher-fields");
    return {
      itemId: artifactItem.itemId,
      title: artifactItem.title,
      classification: "blocked",
      reasons: reasons,
      populatedTeacherFields: populatedTeacherFields,
      publisherFieldDiffs: diffs,
    };
  }

  return {
    itemId: artifactItem.itemId,
    title: artifactItem.title,
    classification: "source-update",
    reasons: reasons,
    publisherFieldDiffs: diffs,
  };
}

// Publisher-owned Unit fields compared for source-update, mirroring
// amplifyIm1PublisherFieldsDiffer_'s item-level pattern. UnitNumber added
// per the Sprint 6.1 correction — confirmed by the Sprint 5 audit to be a
// real, populated production column, not merely encoded in UnitID.
function amplifyIm1UnitPublisherFieldsDiffer_(artifactUnit, destinationUnit) {
  const diffs = [];
  if (destinationUnit.UnitTitle !== artifactUnit.title) {
    diffs.push({ field: "UnitTitle", current: destinationUnit.UnitTitle, proposed: artifactUnit.title });
  }
  if (Number(destinationUnit.UnitNumber) !== artifactUnit.unitNumber) {
    diffs.push({ field: "UnitNumber", current: destinationUnit.UnitNumber, proposed: artifactUnit.unitNumber });
  }
  return diffs;
}

function amplifyIm1PlanUnit_(artifactUnit, destinationUnitsById, destinationLessonsById, blockers) {
  const matches = destinationUnitsById.get(artifactUnit.unitId) || [];

  if (matches.length > 1) {
    blockers.push(`Duplicate destination UnitID "${artifactUnit.unitId}" (${matches.length} rows) — hard fail.`);
    return {
      unitId: artifactUnit.unitId,
      title: artifactUnit.title,
      classification: "blocked",
      reasons: ["duplicate-destination-id"],
      items: [],
    };
  }

  const destinationUnit = matches[0];
  let unitPlan;

  if (!destinationUnit) {
    unitPlan = {
      unitId: artifactUnit.unitId,
      title: artifactUnit.title,
      classification: "create",
      proposedRow: {
        UnitID: artifactUnit.unitId,
        CourseID: artifactUnit.courseId,
        UnitNumber: artifactUnit.unitNumber,
        UnitTitle: artifactUnit.title,
        RequiredDays: artifactUnit.requiredDays.status === "value_provided" ? artifactUnit.requiredDays.value : null,
        OptionalDays: artifactUnit.optionalDays.status === "value_provided" ? artifactUnit.optionalDays.value : null,
        SortOrder: artifactUnit.unitNumber,
      },
      dayBudgetNote:
        "RequiredDays/OptionalDays shown here are the publisher's stated totals where known; per D-2/D-5 these become teacher-owned once the Unit row exists and must be teacher-confirmed, not treated as final.",
    };
  } else if (destinationUnit.CourseID && destinationUnit.CourseID !== artifactUnit.courseId) {
    blockers.push(
      `UnitID "${artifactUnit.unitId}" already exists under CourseID "${destinationUnit.CourseID}", ` +
        `but the artifact assigns it to course "${artifactUnit.courseId}". Hard fail — cross-course ID collision.`,
    );
    unitPlan = { unitId: artifactUnit.unitId, title: artifactUnit.title, classification: "blocked", reasons: ["cross-course-id-collision"] };
  } else {
    const unitDiffs = amplifyIm1UnitPublisherFieldsDiffer_(artifactUnit, destinationUnit);
    if (unitDiffs.length === 0) {
      unitPlan = { unitId: artifactUnit.unitId, title: artifactUnit.title, classification: "no-op", reasons: [] };
    } else {
      const titleMismatch = unitDiffs.some(function (diff) {
        return diff.field === "UnitTitle";
      });
      unitPlan = {
        unitId: artifactUnit.unitId,
        title: artifactUnit.title,
        classification: "source-update",
        reasons: titleMismatch ? ["title-mismatch-warning"] : [],
        publisherFieldDiffs: unitDiffs,
        dayBudgetNote: "RequiredDays/OptionalDays are teacher-owned once the Unit exists and are never proposed for update by this plan.",
      };
    }
  }

  unitPlan.items = artifactUnit.items.map(function (item) {
    return amplifyIm1PlanItem_(artifactUnit, item, destinationLessonsById, blockers);
  });
  return unitPlan;
}

function amplifyIm1GroupBy_(rows, key) {
  const map = new Map();
  rows.forEach(function (row) {
    const k = row[key];
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(row);
  });
  return map;
}

// destination = { units: [...rowObjects], lessons: [...rowObjects] }
function amplifyIm1BuildImportPlan_(payload, destination) {
  const blockers = [];
  const destinationUnits = (destination && destination.units) || [];
  const destinationLessons = (destination && destination.lessons) || [];

  const destinationUnitsById = amplifyIm1GroupBy_(destinationUnits, "UnitID");
  const destinationLessonsById = amplifyIm1GroupBy_(destinationLessons, "LessonID");

  const units = payload.units.map(function (artifactUnit) {
    const unitWithCourse = Object.assign({}, artifactUnit, { courseId: payload.course.courseId });
    return amplifyIm1PlanUnit_(unitWithCourse, destinationUnitsById, destinationLessonsById, blockers);
  });

  const summary = { create: 0, "source-update": 0, "no-op": 0, blocked: 0 };
  const itemSummary = { create: 0, "source-update": 0, "no-op": 0, blocked: 0 };

  units.forEach(function (unit) {
    summary[unit.classification] = (summary[unit.classification] || 0) + 1;
    (unit.items || []).forEach(function (item) {
      itemSummary[item.classification] = (itemSummary[item.classification] || 0) + 1;
    });
  });

  return {
    blocked: blockers.length > 0,
    blockers: blockers,
    units: units,
    summary: { units: summary, items: itemSummary },
  };
}

// --- Post-write verification (pure) -----------------------------------------
//
// Deliberately reuses amplifyIm1BuildImportPlan_ instead of a second,
// hand-written field-comparison implementation — "do not maintain two
// conflicting policy implementations" applies to verification just as much
// as to planning. Classifying the CURRENT state against the payload again
// tells us exactly what verification needs to know:
//   - still "create"           -> the row is missing. Error.
//   - "no-op"                  -> content matches the payload exactly. Fine.
//   - "source-update"          -> content still differs from the payload.
//                                 After a successful write this should never
//                                 happen — it means the intended write did
//                                 not take effect. Error.
//   - "blocked" (teacher-field)-> intentionally left stale to protect
//                                 teacher-authored data. Expected, not an
//                                 error — counted separately as "known
//                                 stale," not silently treated as a match.
//   - "blocked" (other reason) -> duplicate/cross-course collision. Error.
// plan.blockers (duplicate-destination-id, cross-course-id-collision) are
// surfaced directly as errors.
function amplifyIm1VerifyAgainstPayload_(payload, currentUnitsObjects, currentLessonsObjects) {
  const plan = amplifyIm1BuildImportPlan_(payload, { units: currentUnitsObjects, lessons: currentLessonsObjects });
  const errors = plan.blockers.slice();
  let checkedUnitCount = 0;
  let checkedItemCount = 0;
  let knownStaleCount = 0;

  plan.units.forEach(function (unit) {
    if (unit.classification === "create") {
      errors.push(`Missing expected UnitID "${unit.unitId}".`);
    } else if (unit.classification === "source-update") {
      errors.push(`UnitID "${unit.unitId}": expected write did not take effect — still differs from payload.`);
    } else if (unit.classification === "blocked") {
      errors.push(`UnitID "${unit.unitId}" is blocked (${(unit.reasons || []).join(", ")}) and was not verified as fully imported.`);
    } else {
      checkedUnitCount += 1;
    }

    (unit.items || []).forEach(function (item) {
      if (item.classification === "create") {
        errors.push(`Missing expected LessonID "${item.itemId}".`);
      } else if (item.classification === "source-update") {
        errors.push(`LessonID "${item.itemId}": expected write did not take effect — still differs from payload.`);
      } else if (item.classification === "blocked") {
        if ((item.reasons || []).includes("preserve-teacher-fields")) {
          knownStaleCount += 1;
        } else {
          errors.push(`LessonID "${item.itemId}" is blocked (${(item.reasons || []).join(", ")}) and was not verified as fully imported.`);
        }
      } else {
        checkedItemCount += 1;
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors: errors,
    checkedUnitCount: checkedUnitCount,
    checkedItemCount: checkedItemCount,
    knownStaleCount: knownStaleCount,
  };
}

// ============================================================================
// SECTION 2 — Apps Script I/O boundary. Everything below touches
// SpreadsheetApp/LockService/Utilities (or accepts injected stand-ins for
// them) and is therefore NOT exercised by node:test directly — only through
// the fakes in scripts/import-staging/fake-spreadsheet.mjs, which implement
// the same call shape these functions expect.
// ============================================================================

// Mirrors apps-script-roster-admin/ProductionDataAudit.js's auditReadSheet_
// shape exactly (present/headers/rawRows/objects/rowCount/duplicateHeaders) —
// that file lives in a separate Apps Script project and cannot be imported
// here, so this is a deliberate, small duplication of an already-reviewed
// pattern, not a new invention.
function amplifyIm1ReadSheet_(spreadsheet, sheetName) {
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
  const objects = rawRows.map(function (row, rowIndex) {
    const obj = { _rowNumber: rowIndex + 2 };
    headers.forEach(function (header, index) {
      obj[header] = row[index];
    });
    return obj;
  });

  return { present: true, name: sheetName, headers: headers, rawRows: rawRows, objects: objects, rowCount: objects.length };
}

function amplifyIm1RealSha256Hex_(text) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  return bytes
    .map(function (b) {
      const unsigned = b < 0 ? b + 256 : b;
      return (unsigned < 16 ? "0" : "") + unsigned.toString(16);
    })
    .join("");
}

// Mirrors apps-script-roster-admin/ProductionDataCleanup.js's
// cleanupCreateBackup_ exactly: Spreadsheet.copy(name) — a complete,
// independent copy as a new Drive file, never a mutation of the original.
// `formatTimestamp` is injected so this stays testable without real Apps
// Script Utilities/Session globals — Apps Script supplies a real
// Utilities.formatDate-based implementation; Node tests supply a fixed
// stand-in (see fake-spreadsheet.mjs usage in importer.test.mjs).
function amplifyIm1CreateBackup_(spreadsheet, confirmation, metadata, formatTimestamp) {
  const timestamp = formatTimestamp();
  const backupName = `Year Planner Database — pre-amplify-im1-import ${timestamp}`;
  const backupSpreadsheet = spreadsheet.copy(backupName);

  if (!backupSpreadsheet || !backupSpreadsheet.getId()) {
    throw new Error("Spreadsheet.copy() did not return a usable backup spreadsheet.");
  }

  return {
    id: backupSpreadsheet.getId(),
    url: backupSpreadsheet.getUrl(),
    name: backupName,
    artifactSha256: metadata.artifactSha256,
    confirmation: confirmation,
  };
}

function amplifyIm1BuildPreviewReport_(deps, startedAt) {
  const payload = deps.payload;
  const metadata = deps.metadata;

  const integrity = amplifyIm1ValidatePayloadIntegrity_(payload, metadata, deps.computeSha256Hex);
  const structure = amplifyIm1ValidatePayloadStructure_(payload);

  const spreadsheet = deps.spreadsheetApp.openById(deps.sheetId);
  const unitsSheet = amplifyIm1ReadSheet_(spreadsheet, "Units");
  const lessonsSheet = amplifyIm1ReadSheet_(spreadsheet, "Lessons");

  const sheetsPresent = { units: unitsSheet.present, lessons: lessonsSheet.present };
  const schema =
    unitsSheet.present && lessonsSheet.present
      ? amplifyIm1ValidateDestinationSchema_({ units: unitsSheet.headers, lessons: lessonsSheet.headers })
      : { valid: false, errors: ["Units and/or Lessons sheet not found."] };

  const canBuildPlan = integrity.valid && structure.valid && schema.valid;
  const plan = canBuildPlan
    ? amplifyIm1BuildImportPlan_(payload, { units: unitsSheet.objects, lessons: lessonsSheet.objects })
    : null;

  return {
    mode: "preview",
    timestamp: startedAt.toISOString(),
    artifact: { schemaVersion: metadata.schemaVersion, sha256: metadata.artifactSha256, unitCount: metadata.unitCount, itemCount: metadata.itemCount },
    confirmationRequired: metadata.confirmationPhrase,
    spreadsheetId: deps.sheetId,
    sheetsPresent: sheetsPresent,
    payloadIntegrity: integrity,
    payloadStructure: structure,
    destinationSchema: schema,
    plan: plan,
    writesOccurred: false,
    note: "This preview performed zero writes. No spreadsheet was modified.",
  };
}

function previewAmplifyIm1Import() {
  const startedAt = new Date();
  const report = amplifyIm1BuildPreviewReport_(
    {
      spreadsheetApp: SpreadsheetApp,
      sheetId: SHEET_ID,
      computeSha256Hex: amplifyIm1RealSha256Hex_,
      payload: AMPLIFY_IM1_IMPORT_PAYLOAD,
      metadata: AMPLIFY_IM1_IMPORT_METADATA,
    },
    startedAt,
  );
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

// --- Guarded write sequence --------------------------------------------------

function amplifyIm1BuildRowFromHeaders_(headers, rowObject) {
  return headers.map(function (header) {
    const value = rowObject[header];
    return value === undefined || value === null ? "" : value;
  });
}

// Applies only `create` and `source-update` actions from a plan. `no-op` and
// `blocked` entries are never touched. Field-level updates only (never a
// whole-row rewrite) for source-update, per this sprint's requirement — new
// rows are appended in one batch write.
function amplifyIm1ApplyPlan_(spreadsheet, plan) {
  const unitsSheet = spreadsheet.getSheetByName("Units");
  const lessonsSheet = spreadsheet.getSheetByName("Lessons");
  const unitsHeaders = unitsSheet.getRange(1, 1, 1, unitsSheet.getLastColumn()).getValues()[0];
  const lessonsHeaders = lessonsSheet.getRange(1, 1, 1, lessonsSheet.getLastColumn()).getValues()[0];

  const writeCounts = { unitsCreated: 0, unitsUpdated: 0, itemsCreated: 0, itemsUpdated: 0 };

  const newUnitRows = [];
  plan.units.forEach(function (unit) {
    if (unit.classification === "create") {
      newUnitRows.push(amplifyIm1BuildRowFromHeaders_(unitsHeaders, unit.proposedRow));
      writeCounts.unitsCreated += 1;
    } else if (unit.classification === "source-update" && unit.publisherFieldDiffs) {
      const rowIndex = amplifyIm1FindRowIndex_(unitsSheet, unitsHeaders, "UnitID", unit.unitId);
      unit.publisherFieldDiffs.forEach(function (diff) {
        const columnIndex = unitsHeaders.indexOf(diff.field);
        if (columnIndex !== -1 && rowIndex !== -1) {
          unitsSheet.getRange(rowIndex, columnIndex + 1).setValue(diff.proposed);
        }
      });
      writeCounts.unitsUpdated += 1;
    }
  });

  if (newUnitRows.length > 0) {
    unitsSheet.getRange(unitsSheet.getLastRow() + 1, 1, newUnitRows.length, unitsHeaders.length).setValues(newUnitRows);
  }

  const newLessonRows = [];
  plan.units.forEach(function (unit) {
    unit.items.forEach(function (item) {
      if (item.classification === "create") {
        newLessonRows.push(amplifyIm1BuildRowFromHeaders_(lessonsHeaders, item.proposedRow));
        writeCounts.itemsCreated += 1;
      } else if (item.classification === "source-update" && item.publisherFieldDiffs) {
        const rowIndex = amplifyIm1FindRowIndex_(lessonsSheet, lessonsHeaders, "LessonID", item.itemId);
        item.publisherFieldDiffs.forEach(function (diff) {
          const columnIndex = lessonsHeaders.indexOf(diff.field);
          if (columnIndex !== -1 && rowIndex !== -1) {
            lessonsSheet.getRange(rowIndex, columnIndex + 1).setValue(diff.proposed);
          }
        });
        writeCounts.itemsUpdated += 1;
      }
    });
  });

  if (newLessonRows.length > 0) {
    lessonsSheet.getRange(lessonsSheet.getLastRow() + 1, 1, newLessonRows.length, lessonsHeaders.length).setValues(newLessonRows);
  }

  return writeCounts;
}

function amplifyIm1FindRowIndex_(sheet, headers, idField, idValue) {
  const idColumn = headers.indexOf(idField);
  const values = sheet.getRange(1, 1, sheet.getLastRow(), headers.length).getValues();
  for (let i = 1; i < values.length; i += 1) {
    if (values[i][idColumn] === idValue) return i + 1;
  }
  return -1;
}

function amplifyIm1PlansEqual_(planA, planB) {
  if (planA.blocked !== planB.blocked) return false;
  return JSON.stringify(planA) === JSON.stringify(planB);
}

// The one real public execute entry point. No default parameter — calling
// this with zero arguments (e.g. an accidental Apps Script editor "Run"
// click, which always calls with zero arguments) passes `confirmation as
// undefined`, which can never satisfy amplifyIm1ValidateConfirmation_'s
// exact-string-match requirement. There is deliberately no zero-arg wrapper
// with a placeholder default to edit, unlike ProductionDataCleanup.js's
// pattern — that pattern exists there because Apps Script's Run button only
// calls zero-arg functions; here, refusing by construction on zero args is
// simpler and at least as safe.
function executeAmplifyIm1Import(confirmation) {
  return amplifyIm1ExecuteLocked_(confirmation, {
    spreadsheetApp: SpreadsheetApp,
    lockService: LockService,
    sheetId: SHEET_ID,
    computeSha256Hex: amplifyIm1RealSha256Hex_,
    payload: AMPLIFY_IM1_IMPORT_PAYLOAD,
    metadata: AMPLIFY_IM1_IMPORT_METADATA,
    formatTimestamp: function () {
      return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HHmmss");
    },
  });
}

// Guarded sequence (mirrors ProductionDataCleanup.js's
// executeProductionDataCleanupV1Locked_ ordering exactly):
//  1. validate confirmation
//  2. validate embedded payload (integrity + structure)
//  3. acquire lock
//  4. validate destination sheet schema
//  5. read current state (planning pass) + build plan
//  6. refuse if plan is blocked
//  7. create backup
//  8. re-read current state (revalidation pass) + rebuild plan
//  9. abort if planning-pass and revalidation-pass plans differ
// 10. apply Unit writes
// 11. apply Instructional Item writes
// 12. flush (implicit — Apps Script writes are synchronous per call)
// 13. run post-write verification
// 14. release lock (finally) and return a structured report
function amplifyIm1ExecuteLocked_(confirmation, deps) {
  const startedAt = new Date();
  const metadata = deps.metadata;
  const payload = deps.payload;
  const report = {
    mode: "execute",
    timestamp: startedAt.toISOString(),
    artifact: { schemaVersion: metadata.schemaVersion, sha256: metadata.artifactSha256, unitCount: metadata.unitCount, itemCount: metadata.itemCount },
    confirmationAccepted: false,
    spreadsheetId: deps.sheetId,
    lockAcquired: false,
    backup: null,
    writeCounts: null,
    verification: null,
    writesOccurred: false,
    errorStage: null,
    errorMessage: null,
  };

  // 1. confirmation
  if (!amplifyIm1ValidateConfirmation_(confirmation, metadata.confirmationPhrase)) {
    report.errorStage = "confirmation";
    report.errorMessage = "Confirmation did not match exactly. No data was read or touched.";
    return report;
  }
  report.confirmationAccepted = true;

  // 2. payload validation
  const integrity = amplifyIm1ValidatePayloadIntegrity_(payload, metadata, deps.computeSha256Hex);
  const structure = amplifyIm1ValidatePayloadStructure_(payload);
  if (!integrity.valid || !structure.valid) {
    report.errorStage = "payload-validation";
    report.errorMessage = "Embedded payload failed validation. No data was touched.";
    report.payloadIntegrity = integrity;
    report.payloadStructure = structure;
    return report;
  }

  // 3. acquire lock
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

    // 4. schema validation
    const unitsSheetInfo = amplifyIm1ReadSheet_(spreadsheet, "Units");
    const lessonsSheetInfo = amplifyIm1ReadSheet_(spreadsheet, "Lessons");
    if (!unitsSheetInfo.present || !lessonsSheetInfo.present) {
      report.errorStage = "schema";
      report.errorMessage = "Units and/or Lessons sheet not found. No data was touched.";
      return report;
    }
    const schema = amplifyIm1ValidateDestinationSchema_({ units: unitsSheetInfo.headers, lessons: lessonsSheetInfo.headers });
    if (!schema.valid) {
      report.errorStage = "schema";
      report.errorMessage = "Destination schema is missing required columns. No data was touched.";
      report.destinationSchema = schema;
      return report;
    }

    // 5. planning pass
    const planningPass = amplifyIm1BuildImportPlan_(payload, { units: unitsSheetInfo.objects, lessons: lessonsSheetInfo.objects });

    // 6. refuse blocked plan
    if (planningPass.blocked) {
      report.errorStage = "planning";
      report.errorMessage = "Import plan has blocking findings. No data was touched.";
      report.plan = planningPass;
      return report;
    }

    // 7. backup
    let backup;
    try {
      backup = amplifyIm1CreateBackup_(spreadsheet, confirmation, metadata, deps.formatTimestamp);
    } catch (error) {
      report.errorStage = "backup";
      report.errorMessage = `Backup creation failed: ${error.message}. No curriculum data was touched.`;
      return report;
    }
    report.backup = backup;

    // 8. revalidation pass
    const revalUnitsInfo = amplifyIm1ReadSheet_(spreadsheet, "Units");
    const revalLessonsInfo = amplifyIm1ReadSheet_(spreadsheet, "Lessons");
    const revalidationPass = amplifyIm1BuildImportPlan_(payload, { units: revalUnitsInfo.objects, lessons: revalLessonsInfo.objects });

    // 9. abort if state changed
    if (!amplifyIm1PlansEqual_(planningPass, revalidationPass)) {
      report.errorStage = "revalidation";
      report.errorMessage = "Destination state changed between planning and mutation. Aborted before writing anything.";
      return report;
    }

    if (revalidationPass.blocked) {
      report.errorStage = "planning";
      report.errorMessage = "Revalidated import plan has blocking findings. No data was touched.";
      report.plan = revalidationPass;
      return report;
    }

    // 10-11. apply writes
    const writeCounts = amplifyIm1ApplyPlan_(spreadsheet, revalidationPass);
    report.writeCounts = writeCounts;
    report.writesOccurred = true;

    // 13. post-write verification
    const postUnitsInfo = amplifyIm1ReadSheet_(spreadsheet, "Units");
    const postLessonsInfo = amplifyIm1ReadSheet_(spreadsheet, "Lessons");
    const verification = amplifyIm1VerifyAgainstPayload_(payload, postUnitsInfo.objects, postLessonsInfo.objects);
    report.verification = verification;

    if (!verification.valid) {
      report.errorStage = "post-write-verification";
      report.errorMessage =
        "Writes completed but post-write verification found mismatches. Manual recovery may be required from the backup created this run. No automatic rollback was performed.";
      return report;
    }

    report.errorStage = null;
    report.errorMessage = null;
    return report;
  } catch (error) {
    report.errorStage = report.errorStage || "exception";
    // If a backup already exists, this exception could have happened during
    // or after the write step — writesOccurred is only ever set to true
    // after amplifyIm1ApplyPlan_ returns without throwing, so `false` here
    // means "not confirmed complete," not "confirmed nothing happened."
    // Fail closed: tell the operator recovery may be required rather than
    // implying safety by omission.
    report.errorMessage = report.backup
      ? `${error.message} Writes may have partially applied and were not confirmed complete. Manual recovery may be required from the backup created this run (see report.backup). No automatic rollback was performed.`
      : error.message;
    return report;
  } finally {
    if (lockAcquired) {
      lock.releaseLock();
    }
  }
}

// --- Standalone read-only verification (no pre-write baseline available;
// checks structural correctness against the payload only) ------------------

function verifyAmplifyIm1Import() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const unitsSheetInfo = amplifyIm1ReadSheet_(spreadsheet, "Units");
  const lessonsSheetInfo = amplifyIm1ReadSheet_(spreadsheet, "Lessons");
  const result = amplifyIm1VerifyAgainstPayload_(AMPLIFY_IM1_IMPORT_PAYLOAD, unitsSheetInfo.objects, lessonsSheetInfo.objects);
  const report = { mode: "verify", timestamp: new Date().toISOString(), ...result };
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

// ============================================================================
// Node test access. `module` does not exist in the Apps Script runtime, so
// this block never executes there — `typeof` guards against the
// ReferenceError that a direct reference would otherwise throw.
// ============================================================================
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    AMPLIFY_IM1_IMPORTER_SUPPORTED_SCHEMA_VERSION,
    AMPLIFY_IM1_REQUIRED_UNIT_HEADERS,
    AMPLIFY_IM1_REQUIRED_LESSON_HEADERS,
    AMPLIFY_IM1_TEACHER_OWNED_LESSON_FIELDS,
    amplifyIm1ValidateConfirmation_,
    amplifyIm1ValidatePayloadIntegrity_,
    amplifyIm1ValidatePayloadStructure_,
    amplifyIm1ValidateDestinationSchema_,
    amplifyIm1BuildImportPlan_,
    amplifyIm1VerifyAgainstPayload_,
    amplifyIm1ReadSheet_,
    amplifyIm1CreateBackup_,
    amplifyIm1ApplyPlan_,
    amplifyIm1PlansEqual_,
    amplifyIm1BuildPreviewReport_,
    amplifyIm1ExecuteLocked_,
  };
}
