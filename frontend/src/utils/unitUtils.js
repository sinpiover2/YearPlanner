import { parseOptionalDays, parseRequiredDays } from "./plannerUtils.js";

export function getUnitLoggedDays(dailyProgress, unitId) {
  return dailyProgress
    .filter((entry) => entry.UnitID === unitId)
    .reduce((total, entry) => total + Number(entry.DayFraction || 0), 0);
}

function getSafeUnitLoggedDays(dailyProgress, unitId) {
  return dailyProgress
    .filter((entry) => entry.UnitID === unitId)
    .reduce((total, entry) => {
      const dayFraction = Number(entry.DayFraction);
      return Number.isFinite(dayFraction) ? total + dayFraction : total;
    }, 0);
}

export function getUnitPlanningModel(dailyProgress, unit) {
  const requiredDays = parseRequiredDays(unit?.RequiredDays);
  const optionalDays = parseOptionalDays(unit?.OptionalDays);
  const actualDays = getSafeUnitLoggedDays(dailyProgress, unit?.UnitID);
  const requiredDaysComplete = requiredDays.state === "known";
  const optionalDaysComplete = optionalDays.state === "known";

  return {
    requiredDays,
    optionalDays,
    actualDays,
    requiredDaysComplete,
    optionalDaysComplete,
    hasInvalidRequiredDays: requiredDays.state === "invalid",
    hasInvalidOptionalDays: optionalDays.state === "invalid",
    hasInvalidPlanningDays:
      requiredDays.state === "invalid" || optionalDays.state === "invalid",
    requiredDayStatus: requiredDaysComplete
      ? actualDays >= requiredDays.value
        ? "complete"
        : "in-progress"
      : null,
    remainingRequiredDays: requiredDaysComplete
      ? Math.max(0, requiredDays.value - actualDays)
      : null,
    progressPercent: requiredDaysComplete
      ? Math.min(
          100,
          Math.round((actualDays / requiredDays.value) * 100),
        )
      : null,
  };
}

// Temporary compatibility helpers for current Unit components. Presentation
// will migrate atomically to getUnitPlanningModel() in a later slice.
export function getUnitRequiredDays(unit) {
  return Number(unit?.RequiredDays || 0);
}

export function getUnitRemainingDays(dailyProgress, unit) {
  return Math.max(
    0,
    getUnitRequiredDays(unit) - getUnitLoggedDays(dailyProgress, unit?.UnitID),
  );
}

export function getUnitProgressPercent(dailyProgress, unit) {
  const requiredDays = getUnitRequiredDays(unit);

  if (!requiredDays) return 0;

  return Math.min(
    100,
    Math.round(
      (getUnitLoggedDays(dailyProgress, unit.UnitID) / requiredDays) * 100,
    ),
  );
}

export function getUnitState(dailyProgress, unit, courseUnits) {
  const loggedDays = getUnitLoggedDays(dailyProgress, unit?.UnitID);
  const requiredDays = getUnitRequiredDays(unit);

  if (requiredDays && loggedDays >= requiredDays) {
    return "complete";
  }

  const currentUnit =
    courseUnits.find((courseUnit) => {
      const courseUnitLoggedDays = getUnitLoggedDays(
        dailyProgress,
        courseUnit.UnitID,
      );
      const courseUnitRequiredDays = getUnitRequiredDays(courseUnit);

      return (
        !courseUnitRequiredDays ||
        courseUnitLoggedDays < courseUnitRequiredDays
      );
    }) ?? courseUnits[0];

  if (currentUnit?.UnitID === unit?.UnitID) {
    return "current";
  }

  return "upcoming";
}
