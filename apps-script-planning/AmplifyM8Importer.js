// Guarded, write-capable importer for the Amplify Math 8 staging artifact.
//
// SAFETY STATUS AS OF THIS SPRINT: structurally complete and locally
// simulated. executeAmplifyM8Import() has NEVER been run against the real
// production spreadsheet (SHEET_ID, Code.js:1) — every test in
// scripts/import-staging/importer.test.mjs exercises this file's logic
// against in-memory fakes only. Do not treat "the code exists" as "the code
// has been proven safe against real Sheets."
//
// Precedent this file follows: apps-script-roster-admin/ProductionDataAudit.js
// (read-only reader shape — see amplifyM8ReadSheet_, modeled on
// auditReadSheet_) and apps-script-roster-admin/ProductionDataCleanup.js
// (preview/execute split, LockService guard, backup-before-write,
// planning-pass + revalidation-pass-under-lock, structured report). Adapted,
// not copied blindly — this project's Lessons/Units sheets have a different
// shape (see docs/Reference/SHEET_STRUCTURE.md) and a different field-
// ownership map (see docs/Architecture/CURRICULUM_INFORMATION_MODEL.md §8/§9).
//
// Hard dependency: SHEET_ID (Code.js, same Apps Script project, shared
// global namespace) and the generated AMPLIFY_M8_IMPORT_PAYLOAD /
// AMPLIFY_M8_IMPORT_METADATA constants (AmplifyM8ImportData.js — generated
// by scripts/import-staging/generate-apps-script-payload.mjs; never
// hand-edit that file).
//
// Every function below prefixed `amplifyM8` to avoid colliding with the
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

const AMPLIFY_M8_IMPORTER_SUPPORTED_SCHEMA_VERSION = "2.0.0";

const AMPLIFY_M8_REQUIRED_COURSE_HEADERS = ["CourseID", "Course Name"];

// Corrected per the Sprint 5 read-only production audit (see
// AMPLIFY_M8_IMPORT_IMPLEMENTATION_SPEC.md's Sprint 6.1 section): the real
// column is UnitTitle, not UnitName, and the real sheet also carries a
// genuine, populated UnitNumber column distinct from SortOrder — both are
// now required and both are publisher-owned (see amplifyM8PlanUnit_).
const AMPLIFY_M8_REQUIRED_UNIT_HEADERS = [
  "UnitID",
  "CourseID",
  "UnitNumber",
  "UnitTitle",
  "UnitPurpose",
  "RequiredDays",
  "OptionalDays",
  "SortOrder",
];

// Type and PlacementRule do not exist on the production Lessons sheet as of
// this sprint (see docs/Reference/SHEET_STRUCTURE.md and
// AMPLIFY_M8_IMPORT_IMPLEMENTATION_SPEC.md's Sprint 1 note: "a no-op today,
// since that column doesn't exist in production yet"). Requiring them here
// means schema validation will legitimately report `blocked` against the
// real spreadsheet until that column-addition migration happens — see this
// file's header and the Sprint 4 documentation for why that is correct,
// not a bug.
const AMPLIFY_M8_REQUIRED_LESSON_HEADERS = [
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
// AMPLIFY_M8_IMPORT_IMPLEMENTATION_SPEC.md §2/§14 D-2/D-5): never written by
// a create/source-update action beyond leaving them blank on a brand-new
// row, and never overwritten on an existing row.
const AMPLIFY_M8_TEACHER_OWNED_LESSON_FIELDS = ["PlannedDays", "TeacherNotes", "PrimaryLink"];

// --- Confirmation -----------------------------------------------------------

// Exact match only. No trim, no case-folding, no boolean/truthy acceptance —
// "CONFIRM" or `true` can never satisfy this. A stale confirmation (copied
// from a previous artifact version) fails automatically because
// AMPLIFY_M8_IMPORT_METADATA.confirmationPhrase is derived from the
// artifact's own SHA-256 plus unit/item counts — any of those changing
// changes the expected string.
function amplifyM8ValidateConfirmation_(provided, expected) {
  return typeof provided === "string" && typeof expected === "string" && provided === expected;
}

// The editor wrapper's default, intentionally non-matching value. Running
// executeAmplifyM8ImportFromEditor() unedited must refuse, exactly like
// calling executeAmplifyM8Import() with no argument does — see that
// wrapper, below, and this file's README for the edit-then-run production
// authorization ceremony this value exists to support. Never equal to
// AMPLIFY_M8_IMPORT_METADATA.confirmationPhrase by construction (asserted
// directly in importer.test.mjs). Mirrors
// LessonsSchemaMigration.js's LESSONS_MIGRATION_EDITOR_PLACEHOLDER_CONFIRMATION
// exactly, per the same Sprint 6.3B pattern — kept as its own copy here
// (not a shared constant) so this file remains independently reviewable,
// consistent with this file's own header comment on why small, deliberate
// duplication is preferred over cross-file coupling.
const AMPLIFY_M8_EDITOR_PLACEHOLDER_CONFIRMATION = "REPLACE_WITH_EXACT_AUTHORIZATION_PHRASE_BEFORE_RUNNING";

// Pure adapter behind the editor wrapper: call the injected executor, log
// the exact structured result it returns, then return that same object
// unchanged. Exists only so this call-log-return behavior is testable under
// Node — the real executeAmplifyM8ImportFromEditor() below calls this with
// deps.executeImport bound to the live, real executeAmplifyM8Import (which
// itself references SpreadsheetApp/LockService/SHEET_ID globals this file's
// tests cannot supply). Contains no import/planning/lock/backup logic of
// its own — deps.executeImport is the only thing that can mutate anything;
// this function never inspects, branches on, or modifies what it returns.
function amplifyM8RunEditorWrapper_(confirmation, deps) {
  const report = deps.executeImport(confirmation);
  deps.log(JSON.stringify(report, null, 2));
  return report;
}

// --- Payload integrity (tamper/drift guard) ---------------------------------

// Recomputes the payload's own hash from its in-memory content and compares
// it to the value recorded at generation time. Catches: the generated file
// being hand-edited, the generated file going stale relative to a
// regenerated canonical artifact, or an unsupported schema version.
// `computeSha256Hex` is injected so this stays a pure function — Apps
// Script supplies amplifyM8RealSha256Hex_ (Utilities-based); Node tests
// supply a node:crypto-based equivalent.
function amplifyM8ValidatePayloadIntegrity_(payload, metadata, computeSha256Hex) {
  const errors = [];

  if (!metadata || typeof metadata.schemaVersion !== "string") {
    errors.push("Import metadata is missing a schemaVersion.");
    return { valid: false, errors };
  }

  if (metadata.schemaVersion !== AMPLIFY_M8_IMPORTER_SUPPORTED_SCHEMA_VERSION) {
    errors.push(
      `Unsupported artifact schema version "${metadata.schemaVersion}" — this importer supports "${AMPLIFY_M8_IMPORTER_SUPPORTED_SCHEMA_VERSION}".`,
    );
  }
  if (metadata.profile !== "amplify-m8") errors.push('Unsupported validation profile; expected "amplify-m8".');
  const items = payload && payload.units ? payload.units.reduce(function (all, unit) { return all.concat(unit.items || []); }, []) : [];
  if (metadata.unitCount !== (payload.units || []).length || metadata.itemCount !== items.length ||
      metadata.fixedItemCount !== items.filter(function (item) { return item.order !== null; }).length ||
      metadata.flexibleItemCount !== items.filter(function (item) { return item.order === null; }).length) {
    errors.push("Embedded payload counts do not match generated metadata.");
  }

  const serialized = JSON.stringify(payload, null, 2) + "\n";
  const recomputed = computeSha256Hex(serialized);

  if (recomputed !== metadata.artifactSha256) {
    errors.push(
      "Embedded payload does not match its recorded artifactSha256 — AmplifyM8ImportData.js may have been " +
        "hand-edited, or is stale relative to data/import-staging/amplify-m8.json. Regenerate it with " +
        "scripts/import-staging/generate-apps-script-payload.mjs before proceeding.",
    );
  }

  return { valid: errors.length === 0, errors };
}

// --- Payload structure (defense-in-depth; artifact was already validated by
// scripts/import-staging/validate-artifact.mjs at generation time, but the
// importer must not blindly trust a payload it did not itself check) -------

function amplifyM8IsNonBlankString_(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function amplifyM8ValidatePayloadStructure_(payload) {
  const errors = [];

  if (!payload || !Array.isArray(payload.units)) {
    return { valid: false, errors: ["Payload is missing a units array."] };
  }

  const seenUnitIds = {};
  const seenItemIds = {};

  payload.units.forEach(function (unit) {
    if (!/^AMP-M8-U[1-8]$/.test(unit.unitId || "")) errors.push(`Invalid Math 8 unitId: ${unit.unitId}`);
    if (seenUnitIds[unit.unitId]) {
      errors.push(`Duplicate unitId in payload: ${unit.unitId}`);
    }
    seenUnitIds[unit.unitId] = true;

    (unit.items || []).forEach(function (item) {
      if (!/^AMP-M8-U[1-8]-(?:I\d{2}|F\d+)$/.test(item.itemId || "")) errors.push(`Invalid Math 8 itemId: ${item.itemId}`);
      if (seenItemIds[item.itemId]) {
        errors.push(`Duplicate itemId in payload: ${item.itemId}`);
      }
      seenItemIds[item.itemId] = true;

      const hasOrder = item.order !== null && item.order !== undefined;
      const hasPlacementRule = amplifyM8IsNonBlankString_(item.placementRule);

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
function amplifyM8ValidateDestinationSchema_(headers) {
  const validateCourses = Object.prototype.hasOwnProperty.call(headers, "courses");
  const missingCourseHeaders = validateCourses ? AMPLIFY_M8_REQUIRED_COURSE_HEADERS.filter(function (h) {
    return (headers.courses || []).indexOf(h) === -1;
  }) : [];
  const missingUnitHeaders = AMPLIFY_M8_REQUIRED_UNIT_HEADERS.filter(function (h) {
    return (headers.units || []).indexOf(h) === -1;
  });
  const missingLessonHeaders = AMPLIFY_M8_REQUIRED_LESSON_HEADERS.filter(function (h) {
    return (headers.lessons || []).indexOf(h) === -1;
  });

  const errors = [];
  if (missingCourseHeaders.length > 0) {
    errors.push(`Courses sheet is missing required column(s): ${missingCourseHeaders.join(", ")}.`);
  }
  if (missingUnitHeaders.length > 0) {
    errors.push(`Units sheet is missing required column(s): ${missingUnitHeaders.join(", ")}.`);
  }
  if (missingLessonHeaders.length > 0) {
    errors.push(`Lessons sheet is missing required column(s): ${missingLessonHeaders.join(", ")}.`);
  }

  return { valid: errors.length === 0, errors, missingCourseHeaders, missingUnitHeaders, missingLessonHeaders };
}

// --- Import plan (ports the exact decision table already proven in
// scripts/import-staging/build-import-plan.mjs; see that file's own header
// comment for the full rationale. Apps Script has no ES module system, so
// this cannot be a literal `import` — instead this is a direct, near-verbatim
// port of the same functions, and scripts/import-staging/importer.test.mjs
// runs BOTH implementations against the SAME fixtures and asserts identical
// output, so the two can never silently drift without a failing test.) ------

function amplifyM8IsBlank_(value) {
  return value === null || value === undefined || value === "";
}

function amplifyM8TeacherFieldsPopulated_(destinationLesson) {
  return AMPLIFY_M8_TEACHER_OWNED_LESSON_FIELDS.filter(function (field) {
    return !amplifyM8IsBlank_(destinationLesson[field]);
  });
}

// A round-tripped `null` (write→read) comes back from a real spreadsheet as
// an empty string, never `null` itself. Comparing raw `??` against
// artifactItem.placementRule (genuinely `null` for fixed items) would
// re-detect a false "change" forever on every rerun — normalize through
// amplifyM8IsBlank_ before comparing. Kept identical to
// scripts/import-staging/build-import-plan.mjs's normalizeBlankToNull; see
// that file's comment for the full rationale.
function amplifyM8NormalizeBlankToNull_(value) {
  return amplifyM8IsBlank_(value) ? null : value;
}

function amplifyM8PublisherFieldsDiffer_(artifactItem, destinationLesson) {
  const diffs = [];
  if (artifactItem.title !== null && destinationLesson.LessonTitle !== artifactItem.title) {
    diffs.push({ field: "LessonTitle", current: destinationLesson.LessonTitle, proposed: artifactItem.title });
  }
  if (artifactItem.type !== null && amplifyM8NormalizeBlankToNull_(destinationLesson.Type) !== artifactItem.type) {
    diffs.push({ field: "Type", current: amplifyM8NormalizeBlankToNull_(destinationLesson.Type), proposed: artifactItem.type });
  }
  if (artifactItem.order !== null && amplifyM8NormalizeBlankToNull_(destinationLesson.SortOrder) !== artifactItem.order) {
    diffs.push({ field: "SortOrder", current: amplifyM8NormalizeBlankToNull_(destinationLesson.SortOrder), proposed: artifactItem.order });
  }
  if (artifactItem.placementRule !== null && amplifyM8NormalizeBlankToNull_(destinationLesson.PlacementRule) !== artifactItem.placementRule) {
    diffs.push({
      field: "PlacementRule",
      current: amplifyM8NormalizeBlankToNull_(destinationLesson.PlacementRule),
      proposed: artifactItem.placementRule,
    });
  }
  if (artifactItem.isOptional !== null && destinationLesson.IsOptional !== artifactItem.isOptional) {
    diffs.push({ field: "IsOptional", current: destinationLesson.IsOptional, proposed: artifactItem.isOptional });
  }
  if (artifactItem.summary !== null && amplifyM8NormalizeBlankToNull_(destinationLesson.Description) !== artifactItem.summary) {
    diffs.push({ field: "Description", current: amplifyM8NormalizeBlankToNull_(destinationLesson.Description), proposed: artifactItem.summary });
  }
  return diffs;
}

function amplifyM8PlanItem_(unit, artifactItem, destinationLessonsById, blockers) {
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

  const structuralReasons = [];
  if (artifactItem.order !== null && !amplifyM8IsBlank_(destinationLesson.PlacementRule)) {
    structuralReasons.push("existing-placement-rule-on-fixed-item");
  }
  if (artifactItem.placementRule !== null && !amplifyM8IsBlank_(destinationLesson.SortOrder)) {
    structuralReasons.push("existing-sort-order-on-flexible-item");
  }
  if (structuralReasons.length > 0) {
    blockers.push(`LessonID "${artifactItem.itemId}" has placement data that would require destructive clearing.`);
    return { itemId: artifactItem.itemId, title: artifactItem.title, classification: "blocked", reasons: structuralReasons };
  }

  const populatedTeacherFields = amplifyM8TeacherFieldsPopulated_(destinationLesson);
  const diffs = amplifyM8PublisherFieldsDiffer_(artifactItem, destinationLesson);
  const titleMismatch = artifactItem.title !== null && destinationLesson.LessonTitle !== artifactItem.title;

  if (diffs.length === 0) {
    return { itemId: artifactItem.itemId, title: artifactItem.title, classification: "no-op", reasons: [] };
  }

  const reasons = [];
  if (titleMismatch) reasons.push("title-mismatch-warning");

  if (populatedTeacherFields.length > 0) {
    reasons.push("preserve-teacher-fields");
    blockers.push(
      `LessonID "${artifactItem.itemId}" has publisher-owned changes but also populated teacher-owned fields; automatic update is blocked.`,
    );
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
// amplifyM8PublisherFieldsDiffer_'s item-level pattern. UnitNumber added
// per the Sprint 6.1 correction — confirmed by the Sprint 5 audit to be a
// real, populated production column, not merely encoded in UnitID.
function amplifyM8UnitPublisherFieldsDiffer_(artifactUnit, destinationUnit) {
  const diffs = [];
  if (destinationUnit.UnitTitle !== artifactUnit.title) {
    diffs.push({ field: "UnitTitle", current: destinationUnit.UnitTitle, proposed: artifactUnit.title });
  }
  if (Number(destinationUnit.UnitNumber) !== artifactUnit.unitNumber) {
    diffs.push({ field: "UnitNumber", current: destinationUnit.UnitNumber, proposed: artifactUnit.unitNumber });
  }
  if (artifactUnit.purpose !== null && destinationUnit.UnitPurpose !== artifactUnit.purpose) {
    diffs.push({ field: "UnitPurpose", current: destinationUnit.UnitPurpose, proposed: artifactUnit.purpose });
  }
  return diffs;
}

function amplifyM8PlanUnit_(artifactUnit, destinationUnitsById, destinationLessonsById, blockers) {
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
        UnitPurpose: artifactUnit.purpose,
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
    const unitDiffs = amplifyM8UnitPublisherFieldsDiffer_(artifactUnit, destinationUnit);
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
    return amplifyM8PlanItem_(artifactUnit, item, destinationLessonsById, blockers);
  });
  return unitPlan;
}

function amplifyM8GroupBy_(rows, key) {
  const map = new Map();
  rows.forEach(function (row) {
    const k = row[key];
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(row);
  });
  return map;
}

// destination = { units: [...rowObjects], lessons: [...rowObjects] }
function amplifyM8BuildImportPlan_(payload, destination) {
  const blockers = [];
  const destinationUnits = (destination && destination.units) || [];
  const destinationLessons = (destination && destination.lessons) || [];

  const destinationUnitsById = amplifyM8GroupBy_(destinationUnits, "UnitID");
  const destinationLessonsById = amplifyM8GroupBy_(destinationLessons, "LessonID");

  const units = payload.units.map(function (artifactUnit) {
    const unitWithCourse = Object.assign({}, artifactUnit, { courseId: payload.course.courseId });
    return amplifyM8PlanUnit_(unitWithCourse, destinationUnitsById, destinationLessonsById, blockers);
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

function amplifyM8ValidateCourse_(courses) {
  const matches = (courses || []).filter(function (course) { return course.CourseID === "M8"; });
  if (matches.length !== 1) {
    return { valid: false, errors: [`Expected exactly one existing M8 course; found ${matches.length}.`] };
  }
  if (matches[0]["Course Name"] !== "Math 8") {
    return {
      valid: false,
      errors: [`CourseID "M8" must have course label "Math 8"; found ${JSON.stringify(matches[0]["Course Name"])}.`],
    };
  }
  return { valid: true, errors: [], course: matches[0] };
}

// --- Post-write verification (pure) -----------------------------------------
//
// Deliberately reuses amplifyM8BuildImportPlan_ instead of a second,
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
function amplifyM8VerifyAgainstPayload_(payload, currentUnitsObjects, currentLessonsObjects) {
  const plan = amplifyM8BuildImportPlan_(payload, { units: currentUnitsObjects, lessons: currentLessonsObjects });
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

// --- Compact preview summary (pure) -----------------------------------------
//
// Production use found previewAmplifyM8Import()'s full report — every
// proposed row for all 164 items — exceeds the Apps Script execution log's
// size limit ("Logging output too large. Truncating output."). This does
// not change that full report at all; it is a pure, read-only transform of
// an already-built report into a compact aggregate, so a human can review
// plan.blocked/classification counts/conflicts without the log truncating
// before showing them. Never recomputes the plan itself — it only
// aggregates amplifyM8BuildImportPlan_'s own classifications, the same
// "do not maintain two conflicting policy implementations" rule
// amplifyM8VerifyAgainstPayload_ above already follows.
//
// Classification-bucket mapping (this importer's real classifications are
// "create" / "source-update" / "no-op" / "blocked" — there is no "delete"
// classification anywhere in this importer, by design: it never deletes a
// row, so that bucket is always 0, not invented):
//   "create"          -> create
//   "source-update"    -> update
//   "no-op"            -> unchanged
//   "blocked", reasons include "preserve-teacher-fields" and neither
//     "duplicate-destination-id" nor "cross-course-id-collision"
//                      -> teacherFieldProtected (intentional, expected
//                         protection of teacher-authored data — mirrors
//                         amplifyM8VerifyAgainstPayload_'s own
//                         "knownStaleCount is not an error" rule above;
//                         counted separately, never folded into "conflict")
//   "blocked", any other reason (duplicate-destination-id,
//     cross-course-id-collision)
//                      -> conflict
function amplifyM8ClassifyForSummary_(classification, reasons) {
  if (classification === "create") return "create";
  if (classification === "source-update") return "update";
  if (classification === "no-op") return "unchanged";
  if (classification === "blocked") {
    const list = reasons || [];
    const isTeacherFieldProtectionOnly =
      list.indexOf("preserve-teacher-fields") !== -1 &&
      list.indexOf("duplicate-destination-id") === -1 &&
      list.indexOf("cross-course-id-collision") === -1;
    return isTeacherFieldProtectionOnly ? "teacherFieldProtected" : "conflict";
  }
  return "unchanged";
}

function amplifyM8EmptyClassificationCounts_() {
  return { create: 0, update: 0, unchanged: 0, conflict: 0, delete: 0 };
}

// Pure function of an already-built preview report (from
// amplifyM8BuildPreviewReport_/previewAmplifyM8Import() — never mutated,
// never re-fetched). Contains no planning/import logic of its own: every
// classification it aggregates was already decided by
// amplifyM8BuildImportPlan_; this only counts and summarizes. Never
// includes a proposedRow, Description/summary, PrimaryLink, TeacherNotes,
// or any of the 164 raw item objects — only IDs, titles (publisher
// content, not teacher-authored), counts, and short reason strings.
function amplifyM8BuildPreviewSummary_(fullReport) {
  const plan = fullReport.plan;

  const unitCounts = amplifyM8EmptyClassificationCounts_();
  const itemCounts = Object.assign(amplifyM8EmptyClassificationCounts_(), { teacherFieldProtected: 0 });
  const units = [];
  const warnings = [];
  const teacherFieldsAffected = {};

  if (plan) {
    plan.units.forEach(function (unit) {
      const unitBucket = amplifyM8ClassifyForSummary_(unit.classification, unit.reasons);
      // Units never carry teacher-owned fields the way lessons do (RequiredDays/
      // OptionalDays are teacher-owned but are never compared for source-update,
      // per D-2/D-5 — see amplifyM8PlanUnit_), so a unit can never classify as
      // teacherFieldProtected; this branch exists only to be structurally
      // honest if that ever changed, not because it's reachable today.
      unitCounts[unitBucket === "teacherFieldProtected" ? "conflict" : unitBucket] += 1;

      if ((unit.reasons || []).indexOf("title-mismatch-warning") !== -1) {
        warnings.push(`Unit ${unit.unitId}: title-mismatch-warning`);
      }

      const itemBuckets = amplifyM8EmptyClassificationCounts_();
      const unitMessages = [];

      (unit.items || []).forEach(function (item) {
        const bucket = amplifyM8ClassifyForSummary_(item.classification, item.reasons);

        if (bucket === "teacherFieldProtected") {
          (item.populatedTeacherFields || []).forEach(function (field) {
            teacherFieldsAffected[field] = (teacherFieldsAffected[field] || 0) + 1;
          });
          unitMessages.push(`${item.itemId}: preserve-teacher-fields`);
        } else {
          itemBuckets[bucket] += 1;
          if (bucket === "conflict") {
            unitMessages.push(`${item.itemId}: ${(item.reasons || []).join(", ")}`);
          }
        }
        itemCounts[bucket] += 1;

        if ((item.reasons || []).indexOf("title-mismatch-warning") !== -1) {
          warnings.push(`Item ${item.itemId}: title-mismatch-warning`);
        }
      });

      units.push({
        unitId: unit.unitId,
        title: unit.title,
        classification: unitBucket,
        itemCounts: itemBuckets,
        messages: unitMessages,
      });
    });
  }

  // "Conflict" for the safety gate below deliberately excludes
  // teacherFieldProtected — that state is intentional, expected, and
  // already proven safe by amplifyM8VerifyAgainstPayload_'s own
  // knownStaleCount rule; only a true duplicate/cross-course collision
  // should be able to block authorization.
  const trueConflictCount = unitCounts.conflict + itemCounts.conflict;

  const collectedErrors = []
    .concat(fullReport.payloadIntegrity ? fullReport.payloadIntegrity.errors || [] : [])
    .concat(fullReport.payloadStructure ? fullReport.payloadStructure.errors || [] : [])
    .concat(fullReport.destinationSchema ? fullReport.destinationSchema.errors || [] : [])
    .concat(fullReport.courseValidation ? fullReport.courseValidation.errors || [] : [])
    .concat(plan ? plan.blockers || [] : []);

  const safeToAuthorizeExecute =
    fullReport.mode === "preview" &&
    fullReport.writesOccurred === false &&
    !!fullReport.payloadIntegrity && fullReport.payloadIntegrity.valid === true &&
    !!fullReport.payloadStructure && fullReport.payloadStructure.valid === true &&
    !!fullReport.destinationSchema && fullReport.destinationSchema.valid === true &&
    !!fullReport.courseValidation && fullReport.courseValidation.valid === true &&
    !!plan && plan.blocked === false &&
    trueConflictCount === 0 &&
    collectedErrors.length === 0;

  return {
    mode: fullReport.mode || null,
    timestamp: fullReport.timestamp || null,
    artifact: fullReport.artifact || null,
    confirmationRequired: fullReport.confirmationRequired || null,
    // Safely represented: the sheet ID itself (not a secret, but not
    // reproduced here in full to keep this summary's own footprint small
    // and avoid a second place that identifier lives at rest) is reduced to
    // a short, non-reversible-looking prefix/suffix — matches this
    // project's own convention elsewhere of not printing full private IDs.
    spreadsheetIdentity:
      typeof fullReport.spreadsheetId === "string" && fullReport.spreadsheetId.length > 12
        ? fullReport.spreadsheetId.slice(0, 6) + "..." + fullReport.spreadsheetId.slice(-4)
        : fullReport.spreadsheetId || null,
    sheetsPresent: fullReport.sheetsPresent || null,
    payloadIntegrity: fullReport.payloadIntegrity
      ? { valid: fullReport.payloadIntegrity.valid, errors: fullReport.payloadIntegrity.errors || [] }
      : null,
    payloadStructure: fullReport.payloadStructure
      ? { valid: fullReport.payloadStructure.valid, errors: fullReport.payloadStructure.errors || [] }
      : null,
    destinationSchema: fullReport.destinationSchema
      ? {
          valid: fullReport.destinationSchema.valid,
          errors: fullReport.destinationSchema.errors || [],
          missingUnitHeaders: fullReport.destinationSchema.missingUnitHeaders || [],
          missingLessonHeaders: fullReport.destinationSchema.missingLessonHeaders || [],
        }
      : null,
    courseValidation: fullReport.courseValidation
      ? { valid: fullReport.courseValidation.valid, errors: fullReport.courseValidation.errors || [] }
      : null,
    plan: plan ? { blocked: plan.blocked, blockers: plan.blockers || [] } : null,
    unitClassificationCounts: unitCounts,
    itemClassificationCounts: itemCounts,
    units: units,
    teacherFieldPreservation: {
      // Count of Lesson rows intentionally left stale to protect
      // teacher-authored data, plus which teacher-owned fields were the
      // reason, by field name only — never the field's actual value.
      itemsProtected: itemCounts.teacherFieldProtected,
      fieldsAffected: teacherFieldsAffected,
    },
    // Not present on the full preview report at all (amplifyM8BuildPreviewReport_
    // never reads or returns a row count) — reported honestly as null rather
    // than invented.
    rowsExpected: null,
    writesOccurred: typeof fullReport.writesOccurred === "boolean" ? fullReport.writesOccurred : null,
    // The full preview report has no backup field — preview never creates
    // one, by design (see amplifyM8BuildPreviewReport_'s own note field).
    backup: null,
    // errorStage/errorMessage belong to the execute()/verify() report
    // shapes only; a preview report never carries either.
    errorStage: null,
    errorMessage: null,
    warnings: warnings,
    omissions:
      "Full proposed row content, item descriptions, teacher notes, links, and per-item field diffs are " +
      "intentionally excluded from this summary to stay well under the Apps Script logging limit. See " +
      "previewAmplifyM8Import()'s full report for complete per-item detail.",
    safeToAuthorizeExecute: safeToAuthorizeExecute,
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
function amplifyM8ReadSheet_(spreadsheet, sheetName) {
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

// Read-only projection used only by the future preview. The header row is
// read first so schema validation can happen before classification; data is
// then fetched only for explicitly approved fields. No range is ever written.
function amplifyM8ReadProjectedSheet_(spreadsheet, sheetName, requiredFields) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) return { present: false, name: sheetName };

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow === 0 || lastColumn === 0) {
    return { present: true, name: sheetName, headers: [], objects: [], rowCount: 0 };
  }

  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function (h) { return String(h); });
  const rowCount = Math.max(0, lastRow - 1);
  const objects = Array.from({ length: rowCount }, function (_, index) { return { _rowNumber: index + 2 }; });

  if (rowCount > 0) {
    requiredFields.forEach(function (field) {
      const columnIndex = headers.indexOf(field);
      if (columnIndex === -1) return;
      const values = sheet.getRange(2, columnIndex + 1, rowCount, 1).getValues();
      values.forEach(function (row, index) { objects[index][field] = row[0]; });
    });
  }

  return { present: true, name: sheetName, headers: headers, objects: objects, rowCount: rowCount };
}

function amplifyM8RealSha256Hex_(text) {
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
function amplifyM8CreateBackup_(spreadsheet, confirmation, metadata, formatTimestamp) {
  const timestamp = formatTimestamp();
  const backupName = `Year Planner Database — pre-amplify-m8-import ${timestamp}`;
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

function amplifyM8BuildPreviewReport_(deps, startedAt) {
  const payload = deps.payload;
  const metadata = deps.metadata;

  const integrity = amplifyM8ValidatePayloadIntegrity_(payload, metadata, deps.computeSha256Hex);
  const structure = amplifyM8ValidatePayloadStructure_(payload);

  const spreadsheet = deps.spreadsheetApp.openById(deps.sheetId);
  const coursesSheet = amplifyM8ReadProjectedSheet_(spreadsheet, "Courses", AMPLIFY_M8_REQUIRED_COURSE_HEADERS);
  const unitsSheet = amplifyM8ReadProjectedSheet_(spreadsheet, "Units", AMPLIFY_M8_REQUIRED_UNIT_HEADERS);
  const lessonsSheet = amplifyM8ReadProjectedSheet_(spreadsheet, "Lessons", AMPLIFY_M8_REQUIRED_LESSON_HEADERS);

  const sheetsPresent = { courses: coursesSheet.present, units: unitsSheet.present, lessons: lessonsSheet.present };
  const missingSheets = [coursesSheet, unitsSheet, lessonsSheet].filter(function (sheet) { return !sheet.present; }).map(function (sheet) { return sheet.name; });
  const schema =
    missingSheets.length === 0
      ? amplifyM8ValidateDestinationSchema_({ courses: coursesSheet.headers, units: unitsSheet.headers, lessons: lessonsSheet.headers })
      : { valid: false, errors: [`Required sheet(s) not found: ${missingSheets.join(", ")}.`], missingCourseHeaders: [], missingUnitHeaders: [], missingLessonHeaders: [] };
  const courseValidation = schema.valid
    ? amplifyM8ValidateCourse_(coursesSheet.objects)
    : { valid: false, errors: ["Course identity was not evaluated because required sheet schema validation failed."] };

  const canBuildPlan = integrity.valid && structure.valid && schema.valid && courseValidation.valid;
  const plan = canBuildPlan
    ? amplifyM8BuildImportPlan_(payload, { units: unitsSheet.objects, lessons: lessonsSheet.objects })
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
    courseValidation: courseValidation,
    plan: plan,
    writesOccurred: false,
    note: "This preview performed zero writes. No spreadsheet was modified.",
  };
}

function previewAmplifyM8Import() {
  throw new Error("DISARMED: Math 8 live spreadsheet entry points are intentionally unavailable.");
  /* istanbul ignore next */
  const startedAt = new Date();
  const report = amplifyM8BuildPreviewReport_(
    {
      spreadsheetApp: SpreadsheetApp,
      sheetId: SHEET_ID,
      computeSha256Hex: amplifyM8RealSha256Hex_,
      payload: AMPLIFY_M8_IMPORT_PAYLOAD,
      metadata: AMPLIFY_M8_IMPORT_METADATA,
    },
    startedAt,
  );
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

// Production use of previewAmplifyM8Import() found its full report — every
// proposed row across all 164 items — exceeds the Apps Script execution
// log's size limit ("Logging output too large. Truncating output."),
// truncating before the top-level plan.blocked/classification-count
// information a reviewer actually needs was ever shown. This calls the
// exact same underlying report builder previewAmplifyM8Import() itself
// calls — never a second, duplicated preview implementation — and logs
// only the compact aggregate amplifyM8BuildPreviewSummary_ produces.
// Read-only: performs no writes, creates no backup, and does not change
// previewAmplifyM8Import()'s own full report in any way.
function previewAmplifyM8ImportSummary() {
  throw new Error("DISARMED: Math 8 live spreadsheet entry points are intentionally unavailable.");
  /* istanbul ignore next */
  const startedAt = new Date();
  const fullReport = amplifyM8BuildPreviewReport_(
    {
      spreadsheetApp: SpreadsheetApp,
      sheetId: SHEET_ID,
      computeSha256Hex: amplifyM8RealSha256Hex_,
      payload: AMPLIFY_M8_IMPORT_PAYLOAD,
      metadata: AMPLIFY_M8_IMPORT_METADATA,
    },
    startedAt,
  );
  const summary = amplifyM8BuildPreviewSummary_(fullReport);
  Logger.log(JSON.stringify(summary, null, 2));
  return summary;
}

// --- Guarded write sequence --------------------------------------------------

function amplifyM8BuildRowFromHeaders_(headers, rowObject) {
  return headers.map(function (header) {
    const value = rowObject[header];
    return value === undefined || value === null ? "" : value;
  });
}

// Applies only `create` and `source-update` actions from a plan. `no-op` and
// `blocked` entries are never touched. Field-level updates only (never a
// whole-row rewrite) for source-update, per this sprint's requirement — new
// rows are appended in one batch write.
function amplifyM8ApplyPlan_(spreadsheet, plan) {
  const unitsSheet = spreadsheet.getSheetByName("Units");
  const lessonsSheet = spreadsheet.getSheetByName("Lessons");
  const unitsHeaders = unitsSheet.getRange(1, 1, 1, unitsSheet.getLastColumn()).getValues()[0];
  const lessonsHeaders = lessonsSheet.getRange(1, 1, 1, lessonsSheet.getLastColumn()).getValues()[0];

  const writeCounts = { unitsCreated: 0, unitsUpdated: 0, itemsCreated: 0, itemsUpdated: 0 };

  const newUnitRows = [];
  plan.units.forEach(function (unit) {
    if (unit.classification === "create") {
      newUnitRows.push(amplifyM8BuildRowFromHeaders_(unitsHeaders, unit.proposedRow));
      writeCounts.unitsCreated += 1;
    } else if (unit.classification === "source-update" && unit.publisherFieldDiffs) {
      const rowIndex = amplifyM8FindRowIndex_(unitsSheet, unitsHeaders, "UnitID", unit.unitId);
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
        newLessonRows.push(amplifyM8BuildRowFromHeaders_(lessonsHeaders, item.proposedRow));
        writeCounts.itemsCreated += 1;
      } else if (item.classification === "source-update" && item.publisherFieldDiffs) {
        const rowIndex = amplifyM8FindRowIndex_(lessonsSheet, lessonsHeaders, "LessonID", item.itemId);
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

function amplifyM8FindRowIndex_(sheet, headers, idField, idValue) {
  const idColumn = headers.indexOf(idField);
  const values = sheet.getRange(1, 1, sheet.getLastRow(), headers.length).getValues();
  for (let i = 1; i < values.length; i += 1) {
    if (values[i][idColumn] === idValue) return i + 1;
  }
  return -1;
}

function amplifyM8PlansEqual_(planA, planB) {
  if (planA.blocked !== planB.blocked) return false;
  return JSON.stringify(planA) === JSON.stringify(planB);
}

// The one real authoritative execute entry point. No default parameter —
// calling this with zero arguments (e.g. an accidental Apps Script editor
// "Run" click, which always calls with zero arguments) passes `confirmation
// as undefined`, which can never satisfy amplifyM8ValidateConfirmation_'s
// exact-string-match requirement. This function itself logs nothing — see
// executeAmplifyM8ImportFromEditor(), below, for the editor-safe
// invocation path (added Sprint 6.3F, after production use of this file's
// own previewAmplifyM8ImportSummary() confirmed the editor does not
// display a function's return value, the same finding that motivated
// LessonsSchemaMigration.js's own wrapper in Sprint 6.3B).
function executeAmplifyM8Import(confirmation) {
  throw new Error("DISARMED: Math 8 live spreadsheet entry points are intentionally unavailable.");
  /* istanbul ignore next */
  return amplifyM8ExecuteLocked_(confirmation, {
    spreadsheetApp: SpreadsheetApp,
    lockService: LockService,
    sheetId: SHEET_ID,
    computeSha256Hex: amplifyM8RealSha256Hex_,
    payload: AMPLIFY_M8_IMPORT_PAYLOAD,
    metadata: AMPLIFY_M8_IMPORT_METADATA,
    formatTimestamp: function () {
      return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HHmmss");
    },
  });
}

// Apps Script's Run button always calls the selected function with zero
// arguments, so executeAmplifyM8Import(confirmation) has no working
// invocation path from the editor's primary workflow — selecting it and
// clicking Run always passes `confirmation` as `undefined`, which correctly
// refuses. The editor also does not reliably display a function's returned
// value (only "Execution started" / "Execution completed"), so a wrapper
// that merely returned the report would leave the operator with no visible
// confirmation of what happened — including no visible backup ID/URL if a
// write partially failed. This wrapper explicitly logs the full report
// before returning it, via the pure amplifyM8RunEditorWrapper_ helper
// above (kept there, not here, purely so that call-log-return behavior can
// be exercised under Node without live Apps Script globals).
//
// Follows LessonsSchemaMigration.js's executeLessonsTypePlacementRuleMigrationFromEditor()
// pattern exactly (itself following apps-script-roster-admin/
// ProductionDataCleanup.js's executeProductionDataCleanupV1()) — not a
// wrapper with the real phrase hardcoded. The placeholder below does not
// match AMPLIFY_M8_IMPORT_METADATA.confirmationPhrase, so running this
// function as-is, unedited, still refuses, exactly like clicking Run on the
// guarded function itself. The only way to actually execute the import is
// to open this file in the editor, replace the placeholder on the line
// below with the real phrase (from a preview report's confirmationRequired
// field, or AMPLIFY_M8_IMPORT_METADATA.confirmationPhrase), save, and only
// then run this function — a deliberate source edit is the confirmation
// act, not a click. Revert the placeholder immediately afterward so the
// live source never carries the real phrase at rest.
function executeAmplifyM8ImportFromEditor() {
  throw new Error("DISARMED: Math 8 live spreadsheet entry points are intentionally unavailable.");
  /* istanbul ignore next */
  // Change ONLY the line below, and only when ready to run the real import
  // against the LIVE production spreadsheet. Any value other than the exact
  // phrase in AMPLIFY_M8_IMPORT_METADATA.confirmationPhrase refuses to
  // mutate anything — no partial phrase, no boolean, no accidental truthy
  // value will work.
  const CONFIRMATION = AMPLIFY_M8_EDITOR_PLACEHOLDER_CONFIRMATION;

  return amplifyM8RunEditorWrapper_(CONFIRMATION, {
    executeImport: executeAmplifyM8Import,
    log: function (text) {
      Logger.log(text);
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
function amplifyM8ExecuteLocked_(confirmation, deps) {
  const startedAt = new Date();
  const metadata = deps.metadata;
  const payload = deps.payload;
  const report = {
    mode: "execute",
    success: false,
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
  if (!amplifyM8ValidateConfirmation_(confirmation, metadata.confirmationPhrase)) {
    report.errorStage = "confirmation";
    report.errorMessage = "Confirmation did not match exactly. No data was read or touched.";
    return report;
  }
  report.confirmationAccepted = true;

  const courseValidation = amplifyM8ValidateCourse_(deps.courses);
  if (!courseValidation.valid) {
    report.errorStage = "course";
    report.errorMessage = courseValidation.errors[0] + " No data was touched.";
    report.courseValidation = courseValidation;
    return report;
  }

  // 2. payload validation
  const integrity = amplifyM8ValidatePayloadIntegrity_(payload, metadata, deps.computeSha256Hex);
  const structure = amplifyM8ValidatePayloadStructure_(payload);
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
    const unitsSheetInfo = amplifyM8ReadSheet_(spreadsheet, "Units");
    const lessonsSheetInfo = amplifyM8ReadSheet_(spreadsheet, "Lessons");
    if (!unitsSheetInfo.present || !lessonsSheetInfo.present) {
      report.errorStage = "schema";
      report.errorMessage = "Units and/or Lessons sheet not found. No data was touched.";
      return report;
    }
    const schema = amplifyM8ValidateDestinationSchema_({ units: unitsSheetInfo.headers, lessons: lessonsSheetInfo.headers });
    if (!schema.valid) {
      report.errorStage = "schema";
      report.errorMessage = "Destination schema is missing required columns. No data was touched.";
      report.destinationSchema = schema;
      return report;
    }

    // 5. planning pass
    const planningPass = amplifyM8BuildImportPlan_(payload, { units: unitsSheetInfo.objects, lessons: lessonsSheetInfo.objects });

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
      backup = amplifyM8CreateBackup_(spreadsheet, confirmation, metadata, deps.formatTimestamp);
    } catch (error) {
      report.errorStage = "backup";
      report.errorMessage = `Backup creation failed: ${error.message}. No curriculum data was touched.`;
      return report;
    }
    report.backup = backup;

    // 8. revalidation pass
    const revalUnitsInfo = amplifyM8ReadSheet_(spreadsheet, "Units");
    const revalLessonsInfo = amplifyM8ReadSheet_(spreadsheet, "Lessons");
    const revalidationPass = amplifyM8BuildImportPlan_(payload, { units: revalUnitsInfo.objects, lessons: revalLessonsInfo.objects });

    // 9. abort if state changed
    if (!amplifyM8PlansEqual_(planningPass, revalidationPass)) {
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
    const writeCounts = amplifyM8ApplyPlan_(spreadsheet, revalidationPass);
    report.writeCounts = writeCounts;
    report.writesOccurred = true;

    // 13. post-write verification
    const postUnitsInfo = amplifyM8ReadSheet_(spreadsheet, "Units");
    const postLessonsInfo = amplifyM8ReadSheet_(spreadsheet, "Lessons");
    const verification = amplifyM8VerifyAgainstPayload_(payload, postUnitsInfo.objects, postLessonsInfo.objects);
    report.verification = verification;

    if (!verification.valid) {
      report.errorStage = "post-write-verification";
      report.errorMessage =
        "Writes completed but post-write verification found mismatches. Manual recovery may be required from the backup created this run. No automatic rollback was performed.";
      return report;
    }

    report.errorStage = null;
    report.errorMessage = null;
    report.success = true;
    return report;
  } catch (error) {
    report.errorStage = report.errorStage || "exception";
    // If a backup already exists, this exception could have happened during
    // or after the write step — writesOccurred is only ever set to true
    // after amplifyM8ApplyPlan_ returns without throwing, so `false` here
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

function verifyAmplifyM8Import() {
  throw new Error("DISARMED: Math 8 live spreadsheet entry points are intentionally unavailable.");
  /* istanbul ignore next */
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const unitsSheetInfo = amplifyM8ReadSheet_(spreadsheet, "Units");
  const lessonsSheetInfo = amplifyM8ReadSheet_(spreadsheet, "Lessons");
  const result = amplifyM8VerifyAgainstPayload_(AMPLIFY_M8_IMPORT_PAYLOAD, unitsSheetInfo.objects, lessonsSheetInfo.objects);
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
    AMPLIFY_M8_IMPORTER_SUPPORTED_SCHEMA_VERSION,
    AMPLIFY_M8_REQUIRED_COURSE_HEADERS,
    AMPLIFY_M8_REQUIRED_UNIT_HEADERS,
    AMPLIFY_M8_REQUIRED_LESSON_HEADERS,
    AMPLIFY_M8_TEACHER_OWNED_LESSON_FIELDS,
    amplifyM8ValidateConfirmation_,
    AMPLIFY_M8_EDITOR_PLACEHOLDER_CONFIRMATION,
    amplifyM8RunEditorWrapper_,
    amplifyM8ValidatePayloadIntegrity_,
    amplifyM8ValidatePayloadStructure_,
    amplifyM8ValidateDestinationSchema_,
    amplifyM8ValidateCourse_,
    amplifyM8BuildImportPlan_,
    amplifyM8VerifyAgainstPayload_,
    amplifyM8ClassifyForSummary_,
    amplifyM8EmptyClassificationCounts_,
    amplifyM8BuildPreviewSummary_,
    amplifyM8ReadSheet_,
    amplifyM8ReadProjectedSheet_,
    amplifyM8CreateBackup_,
    amplifyM8ApplyPlan_,
    amplifyM8PlansEqual_,
    amplifyM8BuildPreviewReport_,
    amplifyM8ExecuteLocked_,
  };
}
