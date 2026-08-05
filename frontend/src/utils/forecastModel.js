import {
  isTrue,
  sortUnits,
  getSequencedItems,
  isOptionalItem,
  aggregateActualDayValues,
  aggregatePlanningDayValues,
  parseOptionalDays,
  parsePlannedDays,
  parseRequiredDays,
  getActiveCurriculum,
} from "./plannerUtils.js";

function getSectionForecast({
  section,
  units,
  lessons,
  dailyProgress,
  getProgressForSection,
}) {
  if (!section) return null;

  const { activeUnits, activeLessons } = getActiveCurriculum(units, lessons);

  const courseUnits = sortUnits(
    activeUnits.filter((unit) => unit.CourseID === section.CourseID),
  );

  // Flexible-placement items (no fixed SortOrder) are excluded here, before
  // any sequential walk begins — see
  // docs/Architecture/CURRICULUM_INFORMATION_MODEL.md, §6.
  const courseLessons = getSequencedItems(
    activeLessons.filter((lesson) => lesson.CourseID === section.CourseID),
    courseUnits,
  );

  const sectionProgress = getProgressForSection(dailyProgress, section);
  const activeLessonIds = new Set(
    courseLessons.map((lesson) => lesson.LessonID),
  );
  const activeSectionProgress = sectionProgress.filter((entry) =>
    activeLessonIds.has(entry.LessonID),
  );

  const finishedLessonIds = new Set(
    activeSectionProgress
      .filter((entry) => isTrue(entry.Finished))
      .map((entry) => entry.LessonID),
  );

  const actualDayValues = aggregateActualDayValues(
    activeSectionProgress.map((entry) => entry.DayFraction),
  );
  const actualDays = actualDayValues.total;
  const completedLessons = courseLessons.filter((lesson) =>
    finishedLessonIds.has(lesson.LessonID),
  );
  const completedPlannedDays = aggregatePlanningDayValues(
    completedLessons.map((lesson) => lesson.PlannedDays),
    parsePlannedDays,
  );
  const completedPlansComplete =
    completedLessons.length === 0 || completedPlannedDays.complete;
  const plannedDaysCompleted = completedPlansComplete
    ? completedPlannedDays.total
    : null;

  // D-1 (approved): an unfinished optional item never blocks progression —
  // the walk looks past it for the next unfinished *required* item. A
  // finished optional item is already excluded by finishedLessonIds, same as
  // any other finished item, so no separate case is needed for that side.
  const currentLesson =
    courseLessons.find(
      (lesson) =>
        !finishedLessonIds.has(lesson.LessonID) && !isOptionalItem(lesson),
    ) ?? null;

  const currentLessonIndex = currentLesson
    ? courseLessons.findIndex(
        (lesson) => lesson.LessonID === currentLesson.LessonID,
      )
    : courseLessons.length - 1;

  const currentUnit = currentLesson
    ? courseUnits.find((unit) => unit.UnitID === currentLesson.UnitID)
    : (courseUnits.at(-1) ?? null);

  const requiredDays = aggregatePlanningDayValues(
    courseUnits.map((unit) => unit.RequiredDays),
    parseRequiredDays,
  );
  const optionalDays = aggregatePlanningDayValues(
    courseUnits.map((unit) => unit.OptionalDays),
    parseOptionalDays,
  );
  const dataComplete =
    requiredDays.complete && optionalDays.complete && completedPlansComplete;
  const hasInvalidPlanningData =
    requiredDays.hasInvalidValues ||
    optionalDays.hasInvalidValues ||
    completedPlannedDays.hasInvalidValues;
  const planningState = dataComplete
    ? "complete"
    : hasInvalidPlanningData
      ? "invalid"
      : "incomplete";
  const bufferDays = optionalDays.complete ? optionalDays.total : null;

  const currentUnitIndex = currentLesson
    ? courseUnits.findIndex((unit) => unit.UnitID === currentLesson.UnitID)
    : courseUnits.length;

  const remainingUnits =
    currentUnitIndex >= 0 ? courseUnits.slice(currentUnitIndex) : [];

  const remainingOptionalDays = aggregatePlanningDayValues(
    remainingUnits.map((unit) => unit.OptionalDays),
    parseOptionalDays,
  );
  const remainingRequiredDayValues = aggregatePlanningDayValues(
    remainingUnits.map((unit) => unit.RequiredDays),
    parseRequiredDays,
  );
  const optionalDaysRemaining = remainingOptionalDays.complete
    ? remainingOptionalDays.total
    : null;
  const remainingRequiredDays = remainingRequiredDayValues.complete
    ? remainingRequiredDayValues.total
    : null;
  const currentOptionalDays = parseOptionalDays(currentUnit?.OptionalDays);
  const currentUnitOptionalDays =
    currentOptionalDays.state === "known" ? currentOptionalDays.value : null;

  const variance = dataComplete ? actualDays - plannedDaysCompleted : null;
  const forecastShift = variance;
  const paceRatio =
    dataComplete && plannedDaysCompleted > 0
      ? actualDays / plannedDaysCompleted
      : dataComplete
        ? 1
        : null;
  const projectedActualAtFinish = dataComplete
    ? remainingRequiredDays * paceRatio
    : null;
  const projectedFinishVariance = dataComplete
    ? projectedActualAtFinish + actualDays -
      (plannedDaysCompleted + remainingRequiredDays)
    : null;
  const totalRequiredDays = requiredDays.complete ? requiredDays.total : null;
  const totalTimelineDays = dataComplete
    ? totalRequiredDays + bufferDays
    : null;

  const projectedFinishPercent =
    totalTimelineDays > 0
      ? ((totalRequiredDays + projectedFinishVariance) / totalTimelineDays) *
        100
      : null;

  const endPositionPercent =
    dataComplete && totalTimelineDays > 0
      ? (totalRequiredDays / totalTimelineDays) * 100
      : null;
  const bufferUsed = dataComplete ? Math.max(0, variance) : null;
  const bufferRemaining = dataComplete
    ? Math.max(0, bufferDays - bufferUsed)
    : null;
  const consumedFraction = bufferDays > 0 ? bufferUsed / bufferDays : 0;
  const bufferRemainingPercent =
    dataComplete && bufferDays > 0
      ? (bufferRemaining / bufferDays) * 100
      : dataComplete
        ? 0
        : null;

  let projectionState = dataComplete ? "Fits" : null;

  if (dataComplete && projectedFinishVariance > 0) {
    if (optionalDaysRemaining <= 0) {
      projectionState = "Unlikely To Fit";
    } else if (projectedFinishVariance > optionalDaysRemaining) {
      projectionState = "At Risk";
    } else {
      projectionState = "Recoverable";
    }
  }

  let state = dataComplete ? "On Track" : "Pacing unavailable";
  let recoverabilityMessage = dataComplete ? "No action needed." : null;

  if (dataComplete && variance > 0) {
    if (bufferUsed > bufferDays) {
      state = "Buffer Exhausted";
      recoverabilityMessage =
        "Buffer exhausted — schedule adjustment required.";
    } else if (consumedFraction >= 0.6) {
      state = "Needs Attention";
      recoverabilityMessage = "Consider compressing upcoming optional lessons.";
    } else if (consumedFraction >= 0.1) {
      state = "Monitoring";
      recoverabilityMessage = "Recoverable within current buffer.";
    }
  }

  const visualStateClass = !dataComplete
    ? "unavailable"
    : bufferUsed > bufferDays
      ? "buffer-exhausted"
      : state === "Monitoring" || state === "Needs Attention"
        ? "monitoring"
        : "on-track";

  return {
    section,
    state,
    actualDays,
    actualDayValues,
    plannedDaysCompleted,
    completedPlannedDays,
    variance,
    forecastShift,
    projectedFinishVariance,
    projectedFinishDaysLate: dataComplete
      ? Math.max(0, Math.round(projectedFinishVariance))
      : null,
    projectedFinishPercent,
    endPositionPercent,
    projectionState,
    bufferDays,
    bufferUsed,
    bufferRemaining,
    bufferRemainingPercent,
    optionalDaysRemaining,
    recoverabilityMessage,
    currentLesson,
    currentUnit,
    currentUnitName: currentUnit?.UnitTitle ?? currentUnit?.UnitName ?? null,
    currentUnitOptionalDays,
    remainingUnits,
    remainingRequiredDays,
    visualStateClass,
    currentLessonNumber: currentLessonIndex + 1,
    totalLessons: courseLessons.length,
    dataComplete,
    planningState,
    hasInvalidPlanningData,
    requiredDays,
    optionalDays,
    remainingRequiredDayValues,
    remainingOptionalDays,
  };
}

function getSectionTimeline(forecast, units, lessons) {
  const section = forecast.section;
  const { activeUnits, activeLessons } = getActiveCurriculum(units, lessons);

  const courseUnits = sortUnits(
    activeUnits.filter((unit) => unit.CourseID === section.CourseID),
  );

  const courseLessons = getSequencedItems(
    activeLessons.filter((lesson) => lesson.CourseID === section.CourseID),
    courseUnits,
  );

  const requiredDays = aggregatePlanningDayValues(
    courseUnits.map((unit) => unit.RequiredDays),
    parseRequiredDays,
  );
  const optionalDays = aggregatePlanningDayValues(
    courseUnits.map((unit) => unit.OptionalDays),
    parseOptionalDays,
  );
  const totalsComplete = requiredDays.complete && optionalDays.complete;
  const totalRequiredDays = requiredDays.complete ? requiredDays.total : null;
  const bufferDays = optionalDays.complete ? optionalDays.total : null;
  const totalTimelineDays = totalsComplete
    ? totalRequiredDays + bufferDays
    : null;

  const currentLessonIndex = courseLessons.findIndex(
    (lesson) => lesson.LessonID === forecast.currentLesson?.LessonID,
  );

  const precedingLessons =
    currentLessonIndex >= 0 ? courseLessons.slice(0, currentLessonIndex) : [];
  const precedingPlannedDays = aggregatePlanningDayValues(
    precedingLessons.map((lesson) => lesson.PlannedDays),
    parsePlannedDays,
  );
  const completedRequiredDays =
    currentLessonIndex >= 0
      ? precedingLessons.length === 0 || precedingPlannedDays.complete
        ? precedingPlannedDays.total
        : null
      : totalRequiredDays;
  const dataComplete =
    totalsComplete && completedRequiredDays !== null && forecast.dataComplete;

  const currentPositionPercent =
    dataComplete && totalTimelineDays > 0
      ? Math.min(
          100,
          Math.max(0, (completedRequiredDays / totalTimelineDays) * 100),
        )
      : null;

  const expectedPositionPercent =
    dataComplete && totalTimelineDays > 0
      ? Math.min(
          100,
          Math.max(
            0,
            ((completedRequiredDays + forecast.variance) / totalTimelineDays) *
              100,
          ),
        )
      : null;

  return {
    section,
    courseUnits,
    totalRequiredDays,
    completedRequiredDays,
    bufferDays,
    totalTimelineDays,
    currentPositionPercent,
    projectedFinishPercent: forecast.projectedFinishPercent,
    endPositionPercent: forecast.endPositionPercent,
    expectedPositionPercent,
    // Reused rather than recomputed — forecast already carries this from
    // getSectionForecast, and both describe the same section.
    dataComplete,
    planningState: forecast.planningState,
    requiredDays,
    optionalDays,
  };
}

function getTimelineSyncSummary(forecasts) {
  const byCourse = forecasts.reduce((groups, forecast) => {
    const courseId = forecast.section?.CourseID || "UNKNOWN";
    if (!groups[courseId]) groups[courseId] = [];
    groups[courseId].push(forecast);
    return groups;
  }, {});

  return Object.entries(byCourse).map(([courseId, courseForecasts]) => {
    const sortedForecasts = [...courseForecasts].sort(
      (a, b) =>
        Number(a.section?.Period || 999) - Number(b.section?.Period || 999),
    );

    const variances = sortedForecasts
      .map((forecast) => forecast.variance)
      .filter((variance) => Number.isFinite(variance));

    const spread = variances.length
      ? Math.max(...variances) - Math.min(...variances)
      : null;

    const sectionLabels = sortedForecasts
      .map((forecast) => `P${forecast.section?.Period || "—"}`)
      .join("/");

    return {
      courseId,
      message:
        spread === null
          ? `${sectionLabels} pacing unavailable`
          : spread <= 0.1
          ? `${sectionLabels} synchronized`
          : `${sectionLabels} diverging`,
    };
  });
}

function buildForecastModel({
  sections,
  units,
  lessons,
  dailyProgress,
  getProgressForSection,
}) {
  const activeSections = sections.filter((section) => {
    return (
      section.Active === undefined ||
      section.Active === "" ||
      isTrue(section.Active)
    );
  });

  const sectionForecasts = activeSections
    .map((section) =>
      getSectionForecast({
        section,
        units,
        lessons,
        dailyProgress,
        getProgressForSection,
      }),
    )
    .filter(Boolean);

  const forecastedSections = sectionForecasts
    .filter((forecast) => forecast.actualDays > 0)
    .sort((a, b) => {
      const severityRank = {
        "buffer-exhausted": 0,
        monitoring: 1,
        "on-track": 2,
      };

      const severityCompare =
        (severityRank[a.visualStateClass] ?? 3) -
        (severityRank[b.visualStateClass] ?? 3);

      if (severityCompare !== 0) return severityCompare;

      const courseCompare = String(a.section.CourseID || "").localeCompare(
        String(b.section.CourseID || ""),
      );

      if (courseCompare !== 0) return courseCompare;

      return (
        Number(a.section.SortOrder || 999) - Number(b.section.SortOrder || 999)
      );
    });

  const timelineSyncSummaries = getTimelineSyncSummary(forecastedSections);
  const hasForecastProgress = forecastedSections.length > 0;
  const unloggedSectionCount = Math.max(
    sectionForecasts.length - forecastedSections.length,
    0,
  );

  const bufferExhaustedForecasts = forecastedSections.filter(
    (forecast) => forecast.state === "Buffer Exhausted",
  );

  const needsAttentionForecasts = forecastedSections.filter(
    (forecast) => forecast.state === "Needs Attention",
  );

  const monitoringForecasts = forecastedSections.filter(
    (forecast) => forecast.state === "Monitoring",
  );

  let overallForecastMessage = "All logged sections are on track.";
  let overallForecastDetail =
    unloggedSectionCount > 0
      ? `${unloggedSectionCount} active section${
          unloggedSectionCount === 1 ? "" : "s"
        } do not have progress logged yet.`
      : "No action needed right now.";
  let overallForecastStateClass = "on-track";

  if (sectionForecasts.length === 0) {
    overallForecastMessage =
      "No active sections are available for forecasting.";
    overallForecastDetail =
      "Check the Sections sheet if this does not look right.";
  } else if (!hasForecastProgress) {
    overallForecastMessage = "Nothing to report yet.";
    overallForecastDetail = "Check back after logging your first lessons.";
  } else if (forecastedSections.some((forecast) => !forecast.dataComplete)) {
    const hasInvalidPlanning = forecastedSections.some(
      (forecast) => forecast.planningState === "invalid",
    );
    overallForecastMessage = hasInvalidPlanning
      ? "Planning data is invalid."
      : "Planning days incomplete.";
    overallForecastDetail =
      "Pacing unavailable until planning days are resolved.";
    overallForecastStateClass = "unavailable";
  } else if (bufferExhaustedForecasts.length > 0) {
    overallForecastMessage =
      bufferExhaustedForecasts.length === 1
        ? "1 section has exhausted its buffer."
        : `${bufferExhaustedForecasts.length} sections have exhausted their buffer.`;
    overallForecastDetail = "Schedule adjustment is required.";
    overallForecastStateClass = "buffer-exhausted";
  } else if (needsAttentionForecasts.length > 0) {
    overallForecastMessage =
      needsAttentionForecasts.length === 1
        ? "1 section is consuming significant buffer."
        : `${needsAttentionForecasts.length} sections are consuming significant buffer.`;
    overallForecastDetail = "Start with sections using the most buffer.";
    overallForecastStateClass = "monitoring";
  } else if (monitoringForecasts.length > 0) {
    overallForecastMessage =
      monitoringForecasts.length === 1
        ? "1 section is using buffer."
        : `${monitoringForecasts.length} sections are using buffer.`;
    overallForecastDetail =
      "Recovery is still possible within the current plan.";

    overallForecastStateClass = "monitoring";
  }

  return {
    overallForecastStateClass,
    overallForecastMessage,
    overallForecastDetail,
    forecastedSections,
    units,
    lessons,
    timelineSyncSummaries,
    sectionForecasts,
    hasForecastProgress,
  };
}

export { buildForecastModel, getSectionForecast, getSectionTimeline };
