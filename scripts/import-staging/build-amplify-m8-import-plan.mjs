// Pure, read-only import-plan classifier for the schema-2 Amplify Math 8
// artifact. It deliberately does not share IM1's blank/Boolean coercions:
// Math 8 nulls carry evidence statuses and mean "do not assert a value."

const ITEM_VALUE_FIELDS = [
  ["title", "LessonTitle"],
  ["type", "Type"],
  ["summary", "Description"],
  ["isOptional", "IsOptional"],
];

const blank = (value) => value === null || value === undefined || value === "";
const TEACHER_OWNED_ITEM_FIELDS = ["PlannedDays", "TeacherNotes", "PrimaryLink"];

function groupBy(rows, key) {
  const result = new Map();
  for (const row of rows) {
    const value = row[key];
    if (!result.has(value)) result.set(value, []);
    result.get(value).push(row);
  }
  return result;
}

function evidenceFields(item) {
  return Object.fromEntries(ITEM_VALUE_FIELDS.map(([source]) => [source, {
    value: item[source],
    status: item[`${source}Status`],
  }]));
}

function block(entity, reasons, message, blockers, extra = {}) {
  blockers.push(message);
  return { ...entity, classification: "blocked", reasons, ...extra };
}

function compareItem(item, row) {
  const diffs = [];
  for (const [source, destination] of ITEM_VALUE_FIELDS) {
    // A null is an evidence-bearing non-assertion. It neither compares as an
    // empty cell nor proposes clearing a destination value.
    if (item[source] !== null && row[destination] !== item[source]) {
      diffs.push({ field: destination, current: row[destination], proposed: item[source] });
    }
  }
  if (item.order !== null && row.SortOrder !== item.order) {
    diffs.push({ field: "SortOrder", current: row.SortOrder, proposed: item.order });
  }
  if (item.placementRule !== null && row.PlacementRule !== item.placementRule) {
    diffs.push({ field: "PlacementRule", current: row.PlacementRule, proposed: item.placementRule });
  }
  return diffs;
}

function planItem(unit, item, rowsById, blockers) {
  const entity = { itemId: item.itemId, title: item.title, evidenceFields: evidenceFields(item) };
  const matches = rowsById.get(item.itemId) ?? [];
  if (matches.length > 1) return block(entity, ["duplicate-destination-id"],
    `Duplicate destination LessonID "${item.itemId}" (${matches.length} rows).`, blockers);
  const row = matches[0];
  if (!row) {
    return {
      ...entity,
      classification: "create",
      reasons: [],
      proposedRow: {
        LessonID: item.itemId, UnitID: unit.unitId, CourseID: unit.courseId,
        LessonTitle: item.title, Type: item.type, SortOrder: item.order,
        PlacementRule: item.placementRule, IsOptional: item.isOptional,
        Description: item.summary, LessonNumber: null, PlannedDays: null,
        TeacherNotes: null, PrimaryLink: null,
      },
      nullFieldPolicy: "Blank cells retain the adjacent evidence statuses; they are not asserted values.",
    };
  }
  if (row.CourseID !== unit.courseId || row.UnitID !== unit.unitId) {
    return block(entity, ["incompatible-id-collision"],
      `LessonID "${item.itemId}" collides with a row assigned to CourseID "${row.CourseID ?? ""}" and UnitID "${row.UnitID ?? ""}".`,
      blockers);
  }
  // A fixed item cannot safely erase an existing flexible placement rule;
  // a flexible item cannot safely erase an existing asserted sort order.
  const structuralConflicts = [];
  if (item.order !== null && !blank(row.PlacementRule)) structuralConflicts.push("existing-placement-rule-on-fixed-item");
  if (item.placementRule !== null && !blank(row.SortOrder)) structuralConflicts.push("existing-sort-order-on-flexible-item");
  if (structuralConflicts.length) {
    return block(entity, structuralConflicts,
      `LessonID "${item.itemId}" has incompatible destination placement data that would require destructive clearing.`,
      blockers);
  }
  const diffs = compareItem(item, row);
  if (diffs.length === 0) return { ...entity, classification: "no-op", reasons: [] };
  const populatedTeacherFields = TEACHER_OWNED_ITEM_FIELDS.filter((field) => !blank(row[field]));
  if (populatedTeacherFields.length > 0) {
    return block(entity, ["preserve-teacher-fields"],
      `LessonID "${item.itemId}" has publisher-owned changes but also populated teacher-owned fields; automatic update is blocked.`,
      blockers, { populatedTeacherFields, publisherFieldDiffs: diffs });
  }
  return {
    ...entity,
    classification: "source-update",
    reasons: [],
    publisherFieldDiffs: diffs,
    proposedUpdate: Object.fromEntries(diffs.map((diff) => [diff.field, diff.proposed])),
    preservedTeacherFields: ["PlannedDays", "TeacherNotes", "PrimaryLink"],
  };
}

function planUnit(unit, rowsById, lessonRowsById, blockers, courseId) {
  const entity = { unitId: unit.unitId, title: unit.title };
  const matches = rowsById.get(unit.unitId) ?? [];
  let result;
  if (matches.length > 1) {
    result = block(entity, ["duplicate-destination-id"],
      `Duplicate destination UnitID "${unit.unitId}" (${matches.length} rows).`, blockers);
  } else if (!matches[0]) {
    result = {
      ...entity, classification: "create", reasons: [],
      proposedRow: {
        UnitID: unit.unitId, CourseID: courseId, UnitNumber: unit.unitNumber,
        UnitTitle: unit.title, UnitPurpose: unit.purpose,
        RequiredDays: null, OptionalDays: null, SortOrder: unit.unitNumber,
      },
      evidenceFields: { requiredDays: unit.requiredDays, optionalDays: unit.optionalDays },
    };
  } else if (matches[0].CourseID !== courseId) {
    result = block(entity, ["incompatible-id-collision"],
      `UnitID "${unit.unitId}" collides with a row assigned to CourseID "${matches[0].CourseID ?? ""}".`, blockers);
  } else {
    const row = matches[0];
    const diffs = [];
    for (const [field, proposed] of [["UnitTitle", unit.title], ["UnitNumber", unit.unitNumber], ["UnitPurpose", unit.purpose]]) {
      if (row[field] !== proposed) diffs.push({ field, current: row[field], proposed });
    }
    result = diffs.length === 0
      ? { ...entity, classification: "no-op", reasons: [] }
      : { ...entity, classification: "source-update", reasons: [], publisherFieldDiffs: diffs,
          proposedUpdate: Object.fromEntries(diffs.map((diff) => [diff.field, diff.proposed])),
          preservedTeacherFields: ["RequiredDays", "OptionalDays"] };
  }
  result.items = unit.items.map((item) => planItem({ ...unit, courseId }, item, lessonRowsById, blockers));
  return result;
}

export function buildAmplifyM8ImportPlan(artifact, destination) {
  const destinationUnits = destination?.units ?? [];
  const destinationLessons = destination?.lessons ?? [];
  const blockers = [];
  const unitRowsById = groupBy(destinationUnits, "UnitID");
  const lessonRowsById = groupBy(destinationLessons, "LessonID");
  const units = artifact.units.map((unit) => planUnit(unit, unitRowsById, lessonRowsById, blockers, artifact.course.courseId));
  const counts = (rows) => rows.reduce((summary, row) => {
    summary[row.classification] += 1;
    return summary;
  }, { create: 0, "source-update": 0, "no-op": 0, blocked: 0 });
  const protectedLegacy = {
    units: destinationUnits.filter((row) => /^M8-U/.test(row.UnitID ?? "")).length,
    items: destinationLessons.filter((row) => /^M8-U/.test(row.LessonID ?? "") || /^M8-U/.test(row.UnitID ?? "")).length,
  };
  protectedLegacy.total = protectedLegacy.units + protectedLegacy.items;
  return {
    blocked: blockers.length > 0,
    blockers,
    units,
    summary: { units: counts(units), items: counts(units.flatMap((unit) => unit.items)) },
    protectedLegacy,
    writesPerformed: 0,
  };
}
