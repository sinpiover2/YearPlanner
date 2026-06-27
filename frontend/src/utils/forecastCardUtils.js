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
  const projectionState = forecast.projectionState || "Fits";

  if (state === "Monitoring") {
    if (projectionState === "Recoverable") {
      return "Current pacing remains recoverable within available flexibility.";
    }

    return "Recovery may require using additional optional time.";
  }

  if (projectionState === "Unlikely To Fit") {
    return "Recovery is unlikely without schedule or scope changes.";
  }

  if (projectionState === "At Risk") {
    return "Recovery may require using additional optional time.";
  }

  if (projectionState === "Recoverable") {
    return "Current pacing remains recoverable within available flexibility.";
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
      return `Use ~${currentUnitOptionalDays} optional days in ${currentUnitName} before cutting required content.`;
    }

    return `Protect remaining buffer before changing required content.`;
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

export function getForecastCardSummary(forecast = {}) {
  const section = forecast.section ?? {};
  const rawState = forecast.state || "On Track";
  const stateClass = forecast.visualStateClass || "on-track";
  const variance = Number(forecast.variance || 0);
  const bufferRemaining = formatDays(forecast.bufferRemaining);
  const bufferUsed = formatDays(forecast.bufferUsed);
  const recommendationText = getRecommendationText(rawState, forecast);
  const projectedFinishDaysLate = forecast.projectedFinishDaysLate ?? null;
  const meterWidth = Math.min(
    100,
    Math.max(0, Number(forecast.bufferRemainingPercent || 0)),
  );

  const projectionHeadline = getProjectionLabel(
    rawState,
    forecast.projectionState,
  );
  const projectionDetail = getProjectedText(forecast);
  const projectionFinishDate =
    forecast.projectedFinishDate ??
    forecast.finishDate ??
    forecast.forecastFinishDate ??
    null;

  // Preserve existing behavior by deriving runway percentages from available fields only.
  const projectedFinishPercent = Number.isFinite(
    Number(forecast.forecastedEndPercent),
  )
    ? Number(forecast.forecastedEndPercent)
    : Number.isFinite(Number(forecast.projectedFinishPercent))
      ? Number(forecast.projectedFinishPercent)
      : Number.isFinite(Number(forecast.currentPositionPercent))
        ? Number(forecast.currentPositionPercent)
        : null;
  const runwayCurrentPositionPercent = Number.isFinite(
    Number(forecast.currentPositionPercent),
  )
    ? Number(forecast.currentPositionPercent)
    : null;
  const runwayEndPositionPercent = Number.isFinite(
    Number(forecast.endPositionPercent),
  )
    ? Number(forecast.endPositionPercent)
    : 100;
  const runwayOverflowPercent =
    projectedFinishPercent !== null
      ? Math.max(0, projectedFinishPercent - runwayEndPositionPercent)
      : 0;

  return {
    key: section.SectionID || `${section.CourseID}-${section.Period}`,
    state: getCalmStateLabel(rawState),
    projectionState: projectionHeadline,
    stateClass,
    heading: `${getCourseLabel(section.CourseID)} · Period ${
      section.Period || "—"
    }`,
    currentLessonText: forecast.currentLesson?.LessonTitle ?? null,
    paceText: getPaceText(variance),
    projectedText: projectionDetail,
    recoverabilityText: getRecoverabilityText(forecast),
    bufferRemainingText: bufferRemaining,
    bufferUsedText: bufferUsed,
    bufferAriaLabel: `${bufferRemaining} buffer days remaining`,
    meterWidth,
    recommendation: recommendationText,
    projectedFinishDaysLate,
    projection: {
      headline: projectionHeadline,
      detail: projectionDetail,
      finishDate: projectionFinishDate,
      daysFromEnd: projectedFinishDaysLate,
      state: rawState,
    },
    flexibility: {
      remaining: forecast.bufferRemaining ?? 0,
      total:
        forecast.totalBufferDays ??
        Number(forecast.bufferRemaining || 0) +
          Number(forecast.bufferUsed || 0),
      label: bufferRemaining,
      detail: `${bufferUsed} used`,
    },
    runway: {
      currentPositionPercent: runwayCurrentPositionPercent,
      projectedFinishPercent,
      endPositionPercent: runwayEndPositionPercent,
      overflowPercent: runwayOverflowPercent,
      stateClass,
    },
    recommendationModel: {
      text: recommendationText,
    },
  };
}
