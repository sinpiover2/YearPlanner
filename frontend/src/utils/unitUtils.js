import {
  aggregateActualDayValues,
  getCompactPlanningDayDisplay,
  parseOptionalDays,
  parseRequiredDays,
} from "./plannerUtils.js";

function getUnitActualDays(dailyProgress, unitId) {
  return aggregateActualDayValues(
    dailyProgress
      .filter((entry) => entry.UnitID === unitId)
      .map((entry) => entry.DayFraction),
  );
}

export function getUnitLoggedDays(dailyProgress, unitId) {
  return getUnitActualDays(dailyProgress, unitId).total;
}

export function getUnitPlanningModel(dailyProgress, unit) {
  const requiredDays = parseRequiredDays(unit?.RequiredDays);
  const optionalDays = parseOptionalDays(unit?.OptionalDays);
  const actualDayValues = getUnitActualDays(dailyProgress, unit?.UnitID);
  const actualDays = actualDayValues.total;
  const requiredDaysComplete = requiredDays.state === "known";
  const optionalDaysComplete = optionalDays.state === "known";

  return {
    requiredDays,
    optionalDays,
    actualDays,
    actualDayValues,
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

export function getUnitPlanningPresentation(planningModel, { compact = false } = {}) {
  const { actualDays, requiredDays } = planningModel;

  if (requiredDays.state === "unknown") {
    const compactDisplay = getCompactPlanningDayDisplay(requiredDays);
    return {
      daysLabel: compact
        ? `${actualDays} logged · ${compactDisplay.text}`
        : `${actualDays} logged · Not planned`,
      daysAccessibleLabel: `${actualDays} logged · ${compactDisplay.accessibleText}`,
      status: null,
      statusLabel: null,
      progressPercent: null,
      progressLabel: "Not planned",
      requiredDaysLabel: "Not planned",
    };
  }

  if (requiredDays.state === "invalid") {
    return {
      daysLabel: actualDays ? `${actualDays} logged · Invalid value` : "Invalid value",
      daysAccessibleLabel: null,
      status: null,
      statusLabel: null,
      progressPercent: null,
      progressLabel: "Invalid value",
      requiredDaysLabel: "Invalid value",
    };
  }

  return {
    daysLabel: compact
      ? `${actualDays} / ${requiredDays.value} days`
      : `${actualDays}/${requiredDays.value} days · ${planningModel.remainingRequiredDays} remaining`,
    daysAccessibleLabel: null,
    status: planningModel.requiredDayStatus,
    statusLabel:
      planningModel.requiredDayStatus === "complete" ? "✓ Complete" : null,
    progressPercent: planningModel.progressPercent,
    progressLabel: `${planningModel.progressPercent}% complete`,
    requiredDaysLabel: String(requiredDays.value),
  };
}

export function getOptionalDaysPresentation(planningModel) {
  if (planningModel.optionalDays.state === "known") {
    return `${planningModel.optionalDays.value}d buffer`;
  }

  return planningModel.optionalDays.state === "invalid"
    ? "Invalid buffer value"
    : "Buffer not planned";
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
