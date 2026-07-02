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
