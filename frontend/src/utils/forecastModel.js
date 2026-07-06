import { isTrue, sortLessons, sortUnits } from "./plannerUtils";

function getSectionForecast({
  section,
  units,
  lessons,
  dailyProgress,
  getProgressForSection,
}) {
  if (!section) return null;

  const courseUnits = sortUnits(
    units.filter((unit) => unit.CourseID === section.CourseID),
  );

  const courseLessons = sortLessons(
    lessons.filter((lesson) => lesson.CourseID === section.CourseID),
    courseUnits,
  );

  const sectionProgress = getProgressForSection(dailyProgress, section);

  const finishedLessonIds = new Set(
    sectionProgress
      .filter((entry) => isTrue(entry.Finished))
      .map((entry) => entry.LessonID),
  );

  const actualDays = sectionProgress.reduce(
    (sum, entry) => sum + Number(entry.DayFraction || 0),
    0,
  );

  const plannedDaysCompleted = courseLessons
    .filter((lesson) => finishedLessonIds.has(lesson.LessonID))
    .reduce((sum, lesson) => sum + Number(lesson.PlannedDays || 0), 0);

  const currentLesson =
    courseLessons.find((lesson) => !finishedLessonIds.has(lesson.LessonID)) ??
    null;

  const currentLessonIndex = currentLesson
    ? courseLessons.findIndex(
        (lesson) => lesson.LessonID === currentLesson.LessonID,
      )
    : courseLessons.length - 1;

  const currentUnit = currentLesson
    ? courseUnits.find((unit) => unit.UnitID === currentLesson.UnitID)
    : (courseUnits.at(-1) ?? null);

  const bufferDays = courseUnits.reduce(
    (sum, unit) => sum + Number(unit.OptionalDays || 0),
    0,
  );

  const currentUnitIndex = currentLesson
    ? courseUnits.findIndex((unit) => unit.UnitID === currentLesson.UnitID)
    : courseUnits.length;

  const remainingUnits =
    currentUnitIndex >= 0 ? courseUnits.slice(currentUnitIndex) : [];

  const optionalDaysRemaining = remainingUnits.reduce(
    (sum, unit) => sum + Number(unit.OptionalDays || 0),
    0,
  );

  const remainingRequiredDays = remainingUnits.reduce(
    (sum, unit) => sum + Number(unit.RequiredDays || 0),
    0,
  );

  const currentUnitOptionalDays = Number(currentUnit?.OptionalDays || 0);

  const variance = actualDays - plannedDaysCompleted;
  const forecastShift = variance;
  const paceRatio =
    plannedDaysCompleted > 0 ? actualDays / plannedDaysCompleted : 1;
  const projectedActualAtFinish = remainingRequiredDays * paceRatio;
  const projectedFinishVariance =
    projectedActualAtFinish +
    actualDays -
    (plannedDaysCompleted + remainingRequiredDays);
  const totalRequiredDays = courseUnits.reduce(
    (sum, unit) => sum + Number(unit.RequiredDays || 0),
    0,
  );

  const totalTimelineDays = totalRequiredDays + bufferDays;

  const projectedFinishPercent =
    totalTimelineDays > 0
      ? ((totalRequiredDays + projectedFinishVariance) / totalTimelineDays) *
        100
      : null;

  const endPositionPercent =
    totalTimelineDays > 0 ? (totalRequiredDays / totalTimelineDays) * 100 : 100;
  const bufferUsed = Math.max(0, variance);
  const bufferRemaining = Math.max(0, bufferDays - bufferUsed);
  const consumedFraction = bufferDays > 0 ? bufferUsed / bufferDays : 0;
  const bufferRemainingPercent =
    bufferDays > 0 ? (bufferRemaining / bufferDays) * 100 : 0;

  let projectionState = "Fits";

  if (projectedFinishVariance > 0) {
    if (optionalDaysRemaining <= 0) {
      projectionState = "Unlikely To Fit";
    } else if (projectedFinishVariance > optionalDaysRemaining) {
      projectionState = "At Risk";
    } else {
      projectionState = "Recoverable";
    }
  }

  let state = "On Track";
  let recoverabilityMessage = "No action needed.";

  if (variance > 0) {
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

  const visualStateClass =
    bufferUsed > bufferDays
      ? "buffer-exhausted"
      : state === "Monitoring" || state === "Needs Attention"
        ? "monitoring"
        : "on-track";

  return {
    section,
    state,
    actualDays,
    plannedDaysCompleted,
    variance,
    forecastShift,
    projectedFinishVariance,
    projectedFinishDaysLate: Math.max(0, Math.round(projectedFinishVariance)),
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
  };
}

function getSectionTimeline(forecast, units, lessons) {
  const section = forecast.section;

  const courseUnits = sortUnits(
    units.filter((unit) => unit.CourseID === section.CourseID),
  );

  const courseLessons = sortLessons(
    lessons.filter((lesson) => lesson.CourseID === section.CourseID),
    courseUnits,
  );

  const totalRequiredDays = courseUnits.reduce(
    (sum, unit) => sum + Number(unit.RequiredDays || 0),
    0,
  );

  const bufferDays = courseUnits.reduce(
    (sum, unit) => sum + Number(unit.OptionalDays || 0),
    0,
  );

  const totalTimelineDays = totalRequiredDays + bufferDays;

  const currentLessonIndex = courseLessons.findIndex(
    (lesson) => lesson.LessonID === forecast.currentLesson?.LessonID,
  );

  const completedRequiredDays =
    currentLessonIndex >= 0
      ? courseLessons
          .slice(0, currentLessonIndex)
          .reduce((sum, lesson) => sum + Number(lesson.PlannedDays || 0), 0)
      : totalRequiredDays;

  const currentPositionPercent =
    totalTimelineDays > 0
      ? Math.min(
          100,
          Math.max(0, (completedRequiredDays / totalTimelineDays) * 100),
        )
      : 0;

  const expectedPositionPercent =
    totalTimelineDays > 0
      ? Math.min(
          100,
          Math.max(
            0,
            ((completedRequiredDays + forecast.variance) / totalTimelineDays) *
              100,
          ),
        )
      : 0;

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

    const variances = sortedForecasts.map((forecast) =>
      Number(forecast.variance || 0),
    );

    const spread = Math.max(...variances) - Math.min(...variances);

    const sectionLabels = sortedForecasts
      .map((forecast) => `P${forecast.section?.Period || "—"}`)
      .join("/");

    return {
      courseId,
      message:
        spread <= 0.1
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
