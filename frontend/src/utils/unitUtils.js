export function getUnitLoggedDays(dailyProgress, unitId) {
  return dailyProgress
    .filter((entry) => entry.UnitID === unitId)
    .reduce((total, entry) => total + Number(entry.DayFraction || 0), 0);
}

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
