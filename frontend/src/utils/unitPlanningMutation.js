import {
  serializeOptionalDays,
  serializeRequiredDays,
} from "./plannerUtils.js";

export function getUnitPlanningEditorKey(unit) {
  return `${unit.CourseID}\u0000${unit.UnitID}`;
}

export function buildUnitPlanningSubmission(requiredDays, optionalDays) {
  const required = serializeRequiredDays(requiredDays);
  const optional = serializeOptionalDays(optionalDays);

  if (!required.ok || !optional.ok) {
    return { ok: false, error: required.error || optional.error };
  }

  return {
    ok: true,
    value: {
      requiredDays: required.value,
      optionalDays: optional.value,
    },
  };
}

export function updateUnitPlanningRecords(units, identity, planning) {
  return units.map((entry) =>
    entry.UnitID === identity.unitId && entry.CourseID === identity.courseId
      ? {
          ...entry,
          RequiredDays: planning.requiredDays,
          OptionalDays: planning.optionalDays,
        }
      : entry,
  );
}

export async function saveUnitPlanningOptimistically({
  unit,
  planning,
  setPlannerData,
  request,
}) {
  const identity = { unitId: unit.UnitID, courseId: unit.CourseID };
  const originalPlanning = {
    requiredDays: unit.RequiredDays,
    optionalDays: unit.OptionalDays,
  };

  setPlannerData((previous) => ({
    ...previous,
    units: updateUnitPlanningRecords(previous.units, identity, planning),
  }));

  try {
    return await request({
      ...identity,
      requiredDays: planning.requiredDays,
      optionalDays: planning.optionalDays,
    });
  } catch (error) {
    setPlannerData((previous) => ({
      ...previous,
      units: updateUnitPlanningRecords(
        previous.units,
        identity,
        originalPlanning,
      ),
    }));
    throw error;
  }
}
