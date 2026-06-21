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

function getRecommendationText(state) {
  if (state === "Buffer Exhausted") {
    return "Schedule adjustments are recommended.";
  }

  if (state === "Needs Attention") {
    return "Consider trimming optional lessons or protecting time in upcoming units.";
  }

  if (state === "Monitoring") {
    return "No immediate change is needed, but keep an eye on this section.";
  }

  return "No action needed.";
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
    recommendation: getRecommendationText(rawState),
  };
}
