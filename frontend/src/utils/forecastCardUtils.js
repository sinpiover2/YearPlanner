import { getCourseLabel, formatDayPhrase, formatDays } from "./plannerUtils";

function getCalmStateLabel(state) {
  if (state === "Monitoring") return "Worth watching.";
  if (state === "Needs Attention") return "Pacing needs attention.";
  if (state === "Buffer Exhausted") return "Plan no longer fits.";
  return "Comfortably on pace.";
}

function getPaceText(variance) {
  if (variance === 0) return "Current pace matches plan.";

  return `${formatDayPhrase(Math.abs(variance))} ${
    variance > 0 ? "behind plan" : "ahead of plan"
  }.`;
}

function getProjectionLabel(rawState, projectionState) {
  if (rawState === "Monitoring") {
    if (projectionState === "Recoverable") {
      return "Likely recoverable.";
    }

    return "May use additional buffer.";
  }

  if (rawState === "Buffer Exhausted") {
    return "Required content may not fit.";
  }

  if (rawState === "Needs Attention" && projectionState === "Unlikely To Fit") {
    return "Required content may not fit.";
  }

  if (projectionState === "Recoverable") {
    return "Likely recoverable.";
  }

  if (projectionState === "At Risk") {
    return "At risk of finishing late.";
  }

  return "Plan still fits.";
}

function getProjectedText(forecast = {}) {
  const state = forecast.state || "On Track";
  const projectionState = forecast.projectionState || "Fits";
  const forecastShift = Number(forecast.forecastShift || 0);
  const bufferRemaining = Number(forecast.bufferRemaining || 0);
  const bufferUsed = Number(forecast.bufferUsed || 0);
  const optionalDaysRemaining = Number(
    forecast.optionalDaysRemaining ?? forecast.optionalDays ?? 0,
  );

  const shiftedDays = Math.abs(forecastShift);

  if (state === "Monitoring") {
    if (forecastShift > 0) {
      return `Current pacing suggests this section may drift further behind by about ${formatDayPhrase(
        shiftedDays,
      )} without small adjustments.`;
    }

    return "Current pacing suggests this section may drift further behind without small adjustments.";
  }

  if (state === "Needs Attention") {
    if (forecastShift > 0 && optionalDaysRemaining > 0) {
      return `Current pacing suggests this section may finish meaningfully behind schedule unless time is recovered; about ${formatDayPhrase(
        optionalDaysRemaining,
      )} of optional time remains available.`;
    }

    return "Current pacing suggests this section may finish meaningfully behind schedule unless time is recovered.";
  }

  if (state === "Buffer Exhausted") {
    if (bufferRemaining <= 0 && bufferUsed > 0) {
      return "Current pacing suggests required content may no longer fit within available instructional time, and flexibility appears depleted.";
    }

    return "Current pacing suggests required content may no longer fit within available instructional time.";
  }

  if (projectionState === "Recoverable") {
    return "Current pacing remains recoverable within available flexibility.";
  }

  if (projectionState === "At Risk") {
    return "Current pacing suggests available flexibility may become insufficient.";
  }

  if (projectionState === "Unlikely To Fit") {
    return "Current pacing suggests required content may not fit within available time.";
  }

  return "Current pacing remains within the plan.";
}

export function getRecoverabilityText(forecast = {}) {
  const state = forecast.state || "On Track";
  const optionalDaysRemaining = Number(
    forecast.optionalDaysRemaining ?? forecast.optionalDays ?? 0,
  );

  if (state === "Monitoring") {
    return "Current pacing remains recoverable within available flexibility.";
  }

  if (state === "Needs Attention") {
    if (optionalDaysRemaining > 0) {
      return `Remaining flexibility may still absorb part of this variance. About ${formatDayPhrase(
        optionalDaysRemaining,
      )} could still be recovered from optional lessons.`;
    }

    return "Remaining flexibility may still absorb part of this variance.";
  }

  if (state === "Buffer Exhausted") {
    return "Available flexibility appears exhausted.";
  }

  return "Available flexibility remains intact.";
}

function getRecommendationText(state, forecast = {}) {
  const bufferRemaining = Number(forecast.bufferRemaining || 0);
  const bufferUsed = Number(forecast.bufferUsed || 0);
  const optionalDaysRemaining = Number(forecast.optionalDaysRemaining || 0);
  const currentUnitOptionalDays = Number(forecast.currentUnitOptionalDays || 0);
  const currentUnitName = forecast.currentUnitName || "the current unit";

  if (state === "Buffer Exhausted") {
    return "Current buffer is exhausted. Required content no longer fits without changing the schedule or reducing required scope.";
  }

  if (state === "Needs Attention") {
    if (currentUnitOptionalDays > 0) {
      return `${currentUnitName} includes about ${formatDayPhrase(
        currentUnitOptionalDays,
      )} of optional time. Protect upcoming instructional days before cutting required lessons.`;
    }

    return `This section is using significant buffer, but about ${formatDayPhrase(
      bufferRemaining,
    )} remains. Protect upcoming instructional days before changing the plan.`;
  }

  if (state === "Monitoring") {
    if (optionalDaysRemaining > 0) {
      return `No immediate adjustment is needed. About ${formatDayPhrase(
        optionalDaysRemaining,
      )} of optional time remains across upcoming units.`;
    }

    return "No immediate adjustment is needed. Keep watching this section as upcoming units begin.";
  }

  if (bufferUsed > 0) {
    return `No action needed. About ${formatDayPhrase(
      bufferUsed,
    )} of buffer has been used, and the plan still fits.`;
  }

  return "No action needed. Current pacing remains within the plan.";
}

export function getForecastCardSummary(forecast) {
  const section = forecast.section ?? {};
  const rawState = forecast.state || "On Track";
  const stateClass = forecast.visualStateClass || "on-track";
  const variance = Number(forecast.variance || 0);
  const bufferRemaining = formatDays(forecast.bufferRemaining);
  const bufferUsed = formatDays(forecast.bufferUsed);
  const meterWidth = Math.min(
    100,
    Math.max(0, Number(forecast.bufferRemainingPercent || 0)),
  );

  return {
    key: section.SectionID || `${section.CourseID}-${section.Period}`,
    state: getCalmStateLabel(rawState),
    projectionState: getProjectionLabel(rawState, forecast.projectionState),
    stateClass,
    heading: `${getCourseLabel(section.CourseID)} · Period ${
      section.Period || "—"
    }`,
    currentLessonText: forecast.currentLesson?.LessonTitle ?? "Course complete",
    paceText: getPaceText(variance),
    projectedText: getProjectedText(forecast),
    recoverabilityText: getRecoverabilityText(forecast),
    bufferRemainingText: bufferRemaining,
    bufferUsedText: bufferUsed,
    bufferAriaLabel: `${bufferRemaining} buffer days remaining`,
    meterWidth,
    recommendation: getRecommendationText(rawState, forecast),
  };
}
