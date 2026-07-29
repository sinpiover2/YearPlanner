// Builds a read-only import plan: given an Amplify IM1 staging artifact and
// a "destination" snapshot (the same shape getSheetData() would return for
// Units/Lessons — see docs/Reference/SHEET_STRUCTURE.md), classify what an
// eventual write step would do to each unit and item, without writing
// anything. Pure function of its two inputs — same artifact + destination
// always produces the same plan (idempotent, safe to call any number of
// times), the same discipline ProductionDataCleanup.js's cleanupBuildPlan_
// follows for its own preview/execute split.
//
// Field ownership map (per CURRICULUM_INFORMATION_MODEL.md §8/§9 and
// AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md §2, §14 D-2/D-5):
//   Publisher-owned (safe to propose updating): UnitTitle, UnitNumber
//     (corrected per Sprint 6.1 — the real production column is UnitTitle,
//     not UnitName, and UnitNumber is a real, populated column, not merely
//     encoded in UnitID), item Title, Type, Subtitle-derived fields,
//     Description/Summary, SortOrder, PlacementRule, IsOptional.
//   Teacher-owned (never written by this plan, never compared for "is this
//     stale" purposes beyond detecting that they're populated): Unit
//     RequiredDays/OptionalDays, Lesson PlannedDays, TeacherNotes,
//     PrimaryLink. Unit day budgets look publisher-guidance-adjacent (the
//     extraction does record them where the source states them), but D-2/D-5
//     make them teacher-owned in Year Planner once a Unit row exists — a
//     teacher's already-confirmed day budget must never be silently
//     overwritten by re-running an import.

const TEACHER_OWNED_LESSON_FIELDS = ["PlannedDays", "TeacherNotes", "PrimaryLink"];

function isBlank(value) {
  return value === null || value === undefined || value === "";
}

function teacherFieldsPopulated(destinationLesson) {
  return TEACHER_OWNED_LESSON_FIELDS.filter((field) => !isBlank(destinationLesson[field]));
}

// A round-tripped `null` (write→read) comes back from a real spreadsheet as
// an empty string, never `null` itself — a blank cell has no way to
// represent "null" as distinct from "blank." Comparing raw `??` against
// artifact.placementRule (which is genuinely `null` for fixed items) would
// otherwise re-detect a false "change" forever on every rerun. Normalize
// through `isBlank` (already null/undefined/"" aware) before comparing.
function normalizeBlankToNull(value) {
  return isBlank(value) ? null : value;
}

function publisherFieldsDiffer(artifactItem, destinationLesson) {
  const diffs = [];
  if (destinationLesson.LessonTitle !== artifactItem.title) {
    diffs.push({ field: "LessonTitle", current: destinationLesson.LessonTitle, proposed: artifactItem.title });
  }
  if (normalizeBlankToNull(destinationLesson.Type) !== artifactItem.type) {
    diffs.push({ field: "Type", current: normalizeBlankToNull(destinationLesson.Type), proposed: artifactItem.type });
  }
  if (normalizeBlankToNull(destinationLesson.SortOrder) !== artifactItem.order) {
    diffs.push({ field: "SortOrder", current: normalizeBlankToNull(destinationLesson.SortOrder), proposed: artifactItem.order });
  }
  if (normalizeBlankToNull(destinationLesson.PlacementRule) !== artifactItem.placementRule) {
    diffs.push({
      field: "PlacementRule",
      current: normalizeBlankToNull(destinationLesson.PlacementRule),
      proposed: artifactItem.placementRule,
    });
  }
  if (Boolean(destinationLesson.IsOptional) !== artifactItem.isOptional) {
    diffs.push({ field: "IsOptional", current: Boolean(destinationLesson.IsOptional), proposed: artifactItem.isOptional });
  }
  if (normalizeBlankToNull(destinationLesson.Description) !== artifactItem.summary) {
    diffs.push({ field: "Description", current: normalizeBlankToNull(destinationLesson.Description), proposed: artifactItem.summary });
  }
  return diffs;
}

function planItem(unit, artifactItem, destinationLessonsById, blockers) {
  const matches = destinationLessonsById.get(artifactItem.itemId) ?? [];

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
        // inventing structured publisher data. Left blank; a known,
        // documented gap, not a silent guess.
        LessonNumber: null,
        // Never initialized by the importer — D-5. Left blank for the
        // teacher to fill in, exactly as a brand-new row would be today.
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

  const populatedTeacherFields = teacherFieldsPopulated(destinationLesson);
  const diffs = publisherFieldsDiffer(artifactItem, destinationLesson);
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
      reasons,
      populatedTeacherFields,
      publisherFieldDiffs: diffs,
    };
  }

  return {
    itemId: artifactItem.itemId,
    title: artifactItem.title,
    classification: "source-update",
    reasons,
    publisherFieldDiffs: diffs,
  };
}

// Publisher-owned Unit fields compared for source-update, mirroring
// publisherFieldsDiffer's item-level pattern. UnitNumber added per the
// Sprint 6.1 correction — confirmed by the Sprint 5 audit to be a real,
// populated production column, not merely encoded in UnitID.
function unitPublisherFieldsDiffer(artifactUnit, destinationUnit) {
  const diffs = [];
  if (destinationUnit.UnitTitle !== artifactUnit.title) {
    diffs.push({ field: "UnitTitle", current: destinationUnit.UnitTitle, proposed: artifactUnit.title });
  }
  if (Number(destinationUnit.UnitNumber) !== artifactUnit.unitNumber) {
    diffs.push({ field: "UnitNumber", current: destinationUnit.UnitNumber, proposed: artifactUnit.unitNumber });
  }
  return diffs;
}

function planUnit(artifactUnit, destinationUnitsById, destinationLessonsById, blockers) {
  const matches = destinationUnitsById.get(artifactUnit.unitId) ?? [];

  if (matches.length > 1) {
    blockers.push(
      `Duplicate destination UnitID "${artifactUnit.unitId}" (${matches.length} rows) — hard fail.`,
    );
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
        // Populated only because there's no existing teacher value to
        // preserve yet. Still explicitly informational, not authoritative —
        // see the "informational only" note in the preview report.
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
    const unitDiffs = unitPublisherFieldsDiffer(artifactUnit, destinationUnit);
    if (unitDiffs.length === 0) {
      unitPlan = { unitId: artifactUnit.unitId, title: artifactUnit.title, classification: "no-op", reasons: [] };
    } else {
      const titleMismatch = unitDiffs.some((diff) => diff.field === "UnitTitle");
      unitPlan = {
        unitId: artifactUnit.unitId,
        title: artifactUnit.title,
        classification: "source-update",
        reasons: titleMismatch ? ["title-mismatch-warning"] : [],
        publisherFieldDiffs: unitDiffs,
        dayBudgetNote:
          "RequiredDays/OptionalDays are teacher-owned once the Unit exists and are never proposed for update by this plan.",
      };
    }
  }

  unitPlan.items = artifactUnit.items.map((item) => planItem(artifactUnit, item, destinationLessonsById, blockers));
  return unitPlan;
}

function groupBy(rows, key) {
  const map = new Map();
  for (const row of rows) {
    const k = row[key];
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(row);
  }
  return map;
}

export function buildImportPlan(artifact, destination) {
  const blockers = [];
  const destinationUnits = destination?.units ?? [];
  const destinationLessons = destination?.lessons ?? [];

  const destinationUnitsById = groupBy(destinationUnits, "UnitID");
  const destinationLessonsById = groupBy(destinationLessons, "LessonID");

  const units = artifact.units.map((artifactUnit) =>
    planUnit(
      { ...artifactUnit, courseId: artifact.course.courseId },
      destinationUnitsById,
      destinationLessonsById,
      blockers,
    ),
  );

  const summary = { create: 0, "source-update": 0, "no-op": 0, blocked: 0 };
  const itemSummary = { create: 0, "source-update": 0, "no-op": 0, blocked: 0 };

  for (const unit of units) {
    summary[unit.classification] = (summary[unit.classification] ?? 0) + 1;
    for (const item of unit.items ?? []) {
      itemSummary[item.classification] = (itemSummary[item.classification] ?? 0) + 1;
    }
  }

  return {
    blocked: blockers.length > 0,
    blockers,
    units,
    summary: { units: summary, items: itemSummary },
  };
}
