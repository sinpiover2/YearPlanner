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

export function getOutcomeList(value) {
  if (!value) return [];

  return String(value)
    .split(/\||\n/)
    .map((outcome) => outcome.trim())
    .filter(Boolean);
}

export function getRequiredDays(courseUnits) {
  return courseUnits.reduce(
    (sum, unit) => sum + Number(unit.RequiredDays || 0),
    0,
  );
}

export function getOptionalDays(courseUnits) {
  return courseUnits.reduce(
    (sum, unit) => sum + Number(unit.OptionalDays || 0),
    0,
  );
}

export function sortUnits(units) {
  return [...units].sort((a, b) => Number(a.SortOrder) - Number(b.SortOrder));
}

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

export function getCourseLabel(courseId) {
  if (courseId === "M8") return "Math 8";
  if (courseId === "IM1") return "Math 1";
  return courseId;
}
