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

function getProjectedText(state, forecastShift) {
  if (forecastShift === 0) {
    return state === "On Track"
      ? "If nothing changes, this section remains on schedule."
      : "The current projection does not require a schedule change yet.";
  }

  return `If nothing changes, this section is projected about ${formatDayPhrase(
    Math.abs(forecastShift),
  )} ${forecastShift > 0 ? "behind" : "ahead"}.`;
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
  const forecastShift = Number(forecast.forecastShift || 0);
  const bufferRemaining = formatDays(forecast.bufferRemaining);
  const bufferUsed = formatDays(forecast.bufferUsed);
  const meterWidth = Math.min(
    100,
    Math.max(0, Number(forecast.bufferRemainingPercent || 0)),
  );

  return {
    key: section.SectionID || `${section.CourseID}-${section.Period}`,
    state: getCalmStateLabel(rawState),
    stateClass,
    heading: `${getCourseLabel(section.CourseID)} · Period ${
      section.Period || "—"
    }`,
    currentLessonText: forecast.currentLesson?.LessonTitle ?? "Course complete",
    paceText: getPaceText(variance),
    projectedText: getProjectedText(rawState, forecastShift),
    bufferRemainingText: bufferRemaining,
    bufferUsedText: bufferUsed,
    bufferAriaLabel: `${bufferRemaining} buffer days remaining`,
    meterWidth,
    recommendation: getRecommendationText(rawState, forecast),
  };
}
