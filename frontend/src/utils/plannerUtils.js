export function isTrue(value) {
  return value === true || String(value).toLowerCase() === "true";
}

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });
}

export function formatVariance(variance) {
  if (variance === 0) return "On pace";

  const absoluteValue = Math.abs(variance);
  const dayLabel = absoluteValue === 1 ? "day" : "days";

  return variance > 0
    ? `${absoluteValue} ${dayLabel} behind pace`
    : `${absoluteValue} ${dayLabel} ahead of pace`;
}

export function formatVarianceCompact(variance) {
  if (variance === 0) return "—";

  const absoluteValue = Math.abs(variance);

  return variance > 0 ? `+${absoluteValue}d` : `-${absoluteValue}d`;
}

export function formatDays(value) {
  const number = Number(value || 0);

  if (Number.isInteger(number)) return String(number);

  return number.toFixed(1).replace(/\.0$/, "");
}

export function formatDayPhrase(value) {
  const formattedValue = formatDays(value);
  const label = Number(value) === 1 ? "day" : "days";

  return `${formattedValue} ${label}`;
}

export function calculateProgressPercent(actual, planned) {
  return Math.min(100, (actual / Math.max(planned, 1)) * 100);
}

// Deliberately a distinct field/convention from Sections' Active (see
// docs/WORKFLOW/LESSONS_LEARNED.md, Sprint 6.5): Active represents Sections'
// operational availability; IsArchived represents a Unit's curriculum
// lifecycle (is this historical/superseded content), a different domain
// concept that happens to also gate default visibility. Opposite polarity
// from isSectionActive: blank/missing/false means NOT archived (visible);
// only an explicit truthy value means archived (hidden by default). Every
// existing row (none of which has an IsArchived value yet) keeps rendering
// exactly as before until a migration explicitly marks it archived.
export function isUnitArchived(unit) {
  return isTrue(unit?.IsArchived);
}

// Canonical publisher-neutral curriculum lifecycle selector. Complete source
// collections remain available to callers for historical-reference lookup;
// these returned collections are exclusively for active calculations and
// choices. Filter Units first so equal SortOrder values from different
// curriculum generations can never interleave during a later sort.
export function getActiveCurriculum(units = [], lessons = []) {
  const activeUnits = units.filter((unit) => !isUnitArchived(unit));
  const activeUnitIds = new Set(activeUnits.map((unit) => unit.UnitID));
  const activeLessons = lessons.filter((lesson) =>
    activeUnitIds.has(lesson.UnitID),
  );

  return { activeUnits, activeLessons };
}

export function getOutcomeList(value) {
  if (!value) return [];

  return String(value)
    .split(/\||\n/)
    .map((outcome) => outcome.trim())
    .filter(Boolean);
}

// Sprint 2: resolved the Sprint 1 TODO. An unconfirmed unit still contributes
// 0 to this sum — unchanged from before — but that 0 is now reached via
// parseKnownNumber() rather than the bare Number(x || 0) pattern, so this
// stays consistent with every other planning-day read in this file and in
// forecastModel.js. Neither of these two functions currently has a caller
// that renders their result, so this is not yet a user-visible fix — see
// docs/Architecture/CURRICULUM_INFORMATION_MODEL.md, §10.
export function getRequiredDays(courseUnits) {
  return courseUnits.reduce(
    (sum, unit) => sum + (parseKnownNumber(unit.RequiredDays) ?? 0),
    0,
  );
}

export function getOptionalDays(courseUnits) {
  return courseUnits.reduce(
    (sum, unit) => sum + (parseKnownNumber(unit.OptionalDays) ?? 0),
    0,
  );
}

// Distinguishes a genuinely unknown planning value (blank cell, or missing
// entirely) from a real, teacher-entered zero. Google Sheets returns "" for a
// blank cell, and the Number(x || 0) pattern used throughout this file and
// forecastModel.js collapses that to 0 — indistinguishable from an actual
// zero. Not yet wired into any consumer (see the TODOs above and in
// forecastModel.js) — introduced now so Sprint 2 can replace those call
// sites without inventing this distinction from scratch. See
// docs/Architecture/CURRICULUM_INFORMATION_MODEL.md, §9–§10.
export function parseKnownNumber(value) {
  if (value === "" || value === null || value === undefined) return null;

  const number = Number(value);

  return Number.isNaN(number) ? null : number;
}

export const PLANNING_DAY_POLICIES = Object.freeze({
  RequiredDays: Object.freeze({ minimum: 0, minimumInclusive: false }),
  OptionalDays: Object.freeze({ minimum: 0, minimumInclusive: true }),
  PlannedDays: Object.freeze({
    minimum: 0,
    minimumInclusive: false,
    increment: 0.5,
  }),
});

// Additive tri-state contract for planning-day values. Existing callers keep
// using parseKnownNumber() until later slices deliberately adopt this stricter
// distinction between an unset value and malformed data.
export function parsePlanningDayValue(value) {
  if (value === null || value === undefined) {
    return { state: "unknown", value: null };
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();

    if (trimmedValue === "") {
      return { state: "unknown", value: null };
    }

    const number = Number(trimmedValue);

    return Number.isFinite(number)
      ? { state: "known", value: number }
      : { state: "invalid", raw: value };
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return { state: "known", value };
  }

  return { state: "invalid", raw: value };
}

export function parsePlanningDayValueWithPolicy(value, policy) {
  const parsed = parsePlanningDayValue(value);
  if (parsed.state !== "known") return parsed;

  const { minimum, minimumInclusive, increment } = policy;
  const belowMinimum = minimumInclusive
    ? parsed.value < minimum
    : parsed.value <= minimum;
  const violatesIncrement =
    increment !== undefined &&
    !Number.isInteger(parsed.value / increment);

  return belowMinimum || violatesIncrement
    ? { state: "invalid", raw: value }
    : parsed;
}

export function parseRequiredDays(value) {
  return parsePlanningDayValueWithPolicy(
    value,
    PLANNING_DAY_POLICIES.RequiredDays,
  );
}

export function parseOptionalDays(value) {
  return parsePlanningDayValueWithPolicy(
    value,
    PLANNING_DAY_POLICIES.OptionalDays,
  );
}

export function parsePlannedDays(value) {
  return parsePlanningDayValueWithPolicy(
    value,
    PLANNING_DAY_POLICIES.PlannedDays,
  );
}

export const PLANNED_DAYS_VALIDATION_MESSAGE =
  "Planned days must be blank or a positive number in 0.5-day increments.";

export function serializePlannedDays(value) {
  const parsed = parsePlannedDays(value);

  if (parsed.state === "known") {
    return { ok: true, value: parsed.value };
  }

  if (parsed.state === "unknown") {
    return { ok: true, value: "" };
  }

  return { ok: false, error: PLANNED_DAYS_VALIDATION_MESSAGE };
}

// Logged DayFraction values have a separate contract from planned values:
// zero is meaningful, arbitrary precision is preserved, and negative actual
// use is invalid.
export function parseActualDays(value) {
  const parsed = parsePlanningDayValue(value);

  return parsed.state === "known" && parsed.value < 0
    ? { state: "invalid", raw: value }
    : parsed;
}

// Empty input is explicitly incomplete: a zero total is only an accumulation
// identity here, never an assertion that an empty plan contains zero days.
export function aggregatePlanningDayValues(
  values,
  parseValue = parsePlanningDayValue,
) {
  let total = 0;
  let knownCount = 0;
  let unknownCount = 0;
  let invalidCount = 0;

  for (const value of values) {
    const parsed = parseValue(value);

    if (parsed.state === "known") {
      total += parsed.value;
      knownCount += 1;
    } else if (parsed.state === "unknown") {
      unknownCount += 1;
    } else {
      invalidCount += 1;
    }
  }

  const count = knownCount + unknownCount + invalidCount;

  return {
    total,
    count,
    knownCount,
    unknownCount,
    invalidCount,
    empty: count === 0,
    complete: count > 0 && unknownCount === 0 && invalidCount === 0,
    hasInvalidValues: invalidCount > 0,
  };
}

export function aggregateActualDayValues(values) {
  return aggregatePlanningDayValues(values, parseActualDays);
}

export function formatPlanningDayValue(parsed) {
  if (parsed.state === "unknown") return "Not planned";
  if (parsed.state === "invalid") return "Invalid value";
  return String(parsed.value);
}

export function formatPlanningDayValueCompact(parsed) {
  if (parsed.state === "unknown") return "—";
  if (parsed.state === "invalid") return "Invalid value";
  return String(parsed.value);
}

export function getCompactPlanningDayDisplay(parsed) {
  return {
    text: formatPlanningDayValueCompact(parsed),
    accessibleText: formatPlanningDayValue(parsed),
  };
}

const DEFAULT_INSTRUCTIONAL_ITEM_TYPE = "Lesson";

// A blank or missing Type means an ordinary Lesson — true of every row in
// the sheet today, so this default requires no migration. Unrecognized
// future Type values are returned as-is; callers that need to branch on a
// known set of types must treat anything else as Lesson-like rather than
// failing. Not yet consumed anywhere. See
// docs/Architecture/CURRICULUM_INFORMATION_MODEL.md, §5.
export function getItemType(item) {
  const type = item?.Type;

  return typeof type === "string" && type.trim()
    ? type.trim()
    : DEFAULT_INSTRUCTIONAL_ITEM_TYPE;
}

// A blank PlacementRule means the item has a fixed sequence position
// (SortOrder). A populated PlacementRule means the publisher itself defines
// no fixed position for this item (e.g. Amplify's "Investigate" items,
// usable "anytime after Lesson N"). Not yet consumed anywhere — Sprint 2 will
// use this to exclude flexible items from sequential consumers (Forecast's
// current-item walk, Planning's shelf) instead of letting them sort by a
// fabricated or NaN SortOrder. See
// docs/Architecture/CURRICULUM_INFORMATION_MODEL.md, §6.
export function getPlacementRule(item) {
  const rule = item?.PlacementRule;

  return typeof rule === "string" && rule.trim() ? rule.trim() : null;
}

export function hasFixedPlacement(item) {
  return getPlacementRule(item) === null;
}

// Item-level skippability (Amplify's optional Explores, Pre-Unit Checks,
// etc.) — distinct from Unit.OptionalDays, which is a pacing buffer, not a
// per-item flag. See docs/Architecture/CURRICULUM_INFORMATION_MODEL.md, §7.
export function isOptionalItem(item) {
  return isTrue(item?.IsOptional);
}

export function sortUnits(units) {
  return [...units].sort((a, b) => Number(a.SortOrder) - Number(b.SortOrder));
}

// Sorts by unit order, then SortOrder within the unit. Does not filter —
// callers that only want the strict, fixed sequence should call
// getSequencedItems() instead, which excludes flexible-placement items
// first. Calling this directly on a list that includes flexible items (no
// SortOrder) is unsafe: Number(undefined) is NaN, and comparator behavior
// with NaN is unstable.
export function sortLessons(lessons, units) {
  const unitOrder = new Map(
    units.map((unit) => [unit.UnitID, Number(unit.SortOrder)]),
  );

  return [...lessons].sort((a, b) => {
    const unitCompare =
      (unitOrder.get(a.UnitID) ?? 999) - (unitOrder.get(b.UnitID) ?? 999);

    if (unitCompare !== 0) return unitCompare;

    return Number(a.SortOrder) - Number(b.SortOrder);
  });
}

// The one safe way to get an ordered, strictly-sequential list of
// Instructional Items for a unit or course: excludes flexible-placement
// items (e.g. Amplify's "Investigate") before sorting, so no item without a
// real SortOrder ever enters the sort. This is what Forecast's current-item
// walk and Planning's fixed-sequence shelf should both call, instead of
// sortLessons() directly, per
// docs/Architecture/CURRICULUM_INFORMATION_MODEL.md, §6.
export function getSequencedItems(items, units) {
  return sortLessons(items.filter(hasFixedPlacement), units);
}

export function getCourseLabel(courseId) {
  if (courseId === "M8") return "Math 8";
  if (courseId === "IM1") return "Math 1";
  return courseId;
}
