import {
  aggregateActualDayValues,
  aggregatePlanningDayValues,
  getActiveCurriculum,
  isUnitArchived,
  isTrue,
  parseOptionalDays,
  parsePlannedDays,
  parseRequiredDays,
  sortLessons,
  sortUnits,
} from "./plannerUtils.js";

export function reconcileUnitSelection({
  selectedUnitId,
  courseUnits = [],
  fallbackUnitId = null,
  showArchivedUnits = false,
}) {
  const selectableUnits = showArchivedUnits
    ? courseUnits
    : courseUnits.filter((unit) => !isUnitArchived(unit));
  const selectableUnitIds = new Set(selectableUnits.map((unit) => unit.UnitID));

  if (selectedUnitId && selectableUnitIds.has(selectedUnitId)) {
    return selectedUnitId;
  }

  if (
    !selectedUnitId &&
    fallbackUnitId &&
    selectableUnitIds.has(fallbackUnitId)
  ) {
    return fallbackUnitId;
  }

  return selectableUnits[0]?.UnitID ?? null;
}

function getLessonProgress(lessonId, dailyProgress) {
  const entries = dailyProgress.filter((entry) => entry.LessonID === lessonId);
  return {
    actualDays: getActualDayValues(entries).total,
    finished: entries.some((entry) => isTrue(entry.Finished)),
  };
}

function getActualDayValues(entries) {
  return aggregateActualDayValues(entries.map((entry) => entry.DayFraction));
}

function getActiveCourseCurriculum(courseId, units, lessons) {
  const { activeUnits, activeLessons } = getActiveCurriculum(units, lessons);
  const courseUnits = sortUnits(activeUnits.filter((unit) => unit.CourseID === courseId));
  const courseLessons = sortLessons(
    activeLessons.filter((lesson) => lesson.CourseID === courseId),
    courseUnits,
  );
  return { courseUnits, courseLessons };
}

function getCourseUnitDayPlanning(courseUnits) {
  const requiredDays = aggregatePlanningDayValues(
    courseUnits.map((unit) => unit.RequiredDays),
    parseRequiredDays,
  );
  const optionalDays = aggregatePlanningDayValues(
    courseUnits.map((unit) => unit.OptionalDays),
    parseOptionalDays,
  );

  return {
    requiredDays,
    optionalDays,
    complete: requiredDays.complete && optionalDays.complete,
    hasInvalidValues:
      requiredDays.hasInvalidValues || optionalDays.hasInvalidValues,
  };
}

function getLessonDayPlanning(lessons, actualDays) {
  const plannedDays = aggregatePlanningDayValues(
    lessons.map((lesson) => lesson.PlannedDays),
    parsePlannedDays,
  );

  return {
    plannedDays,
    variance: plannedDays.complete ? actualDays - plannedDays.total : null,
    complete: plannedDays.complete,
    hasInvalidValues: plannedDays.hasInvalidValues,
  };
}

export function getCourseStatus(courseId, units, lessons, dailyProgress) {
  const { courseUnits, courseLessons } = getActiveCourseCurriculum(courseId, units, lessons);
  const completedLessonIds = new Set(
    dailyProgress
      .filter((entry) => entry.CourseID === courseId && isTrue(entry.Finished))
      .map((entry) => entry.LessonID),
  );
  const completedLessons = courseLessons.filter((lesson) => completedLessonIds.has(lesson.LessonID));
  const activeLessonIds = new Set(courseLessons.map((lesson) => lesson.LessonID));
  const activeProgress = dailyProgress.filter(
    (entry) =>
      entry.CourseID === courseId && activeLessonIds.has(entry.LessonID),
  );
  const actualDayValues = getActualDayValues(activeProgress);
  const actualDays = actualDayValues.total;
  const plannedDaysCompleted = completedLessons.reduce(
    (sum, lesson) => sum + Number(lesson.PlannedDays || 0),
    0,
  );
  const unitDays = getCourseUnitDayPlanning(courseUnits);
  const completedLessonsPlanning = getLessonDayPlanning(
    completedLessons,
    actualDays,
  );

  return {
    currentLesson: courseLessons.find((lesson) => !completedLessonIds.has(lesson.LessonID)) ?? null,
    completedCount: completedLessons.length,
    plannedDaysCompleted,
    actualDays,
    // Canonical read-only contract for later presentation slices. The legacy
    // numeric fields above/below remain until their current UI consumers move
    // together, preserving visible behavior in this foundation slice.
    planning: {
      actualDays,
      actualDayValues,
      requiredDays: unitDays.requiredDays,
      optionalDays: unitDays.optionalDays,
      completedPlannedDays: completedLessonsPlanning.plannedDays,
      variance: completedLessonsPlanning.variance,
      unitDaysComplete: unitDays.complete,
      completedPlannedDaysComplete: completedLessonsPlanning.complete,
      complete: unitDays.complete && completedLessonsPlanning.complete,
      hasInvalidValues:
        actualDayValues.hasInvalidValues ||
        unitDays.hasInvalidValues ||
        completedLessonsPlanning.hasInvalidValues,
    },
    variance: actualDays - plannedDaysCompleted,
  };
}

export function getCourseNavigation(courseId, units, lessons, dailyProgress) {
  const { courseUnits, courseLessons } = getActiveCourseCurriculum(courseId, units, lessons);
  const completedLessonIds = new Set(
    dailyProgress
      .filter((entry) => entry.CourseID === courseId && isTrue(entry.Finished))
      .map((entry) => entry.LessonID),
  );
  const currentIndex = courseLessons.findIndex((lesson) => !completedLessonIds.has(lesson.LessonID));
  const currentLesson = currentIndex >= 0 ? courseLessons[currentIndex] : null;
  const currentUnit = currentLesson
    ? courseUnits.find((unit) => unit.UnitID === currentLesson.UnitID)
    : (courseUnits.at(-1) ?? null);
  const currentUnitLessons = currentUnit
    ? courseLessons.filter((lesson) => lesson.UnitID === currentUnit.UnitID)
    : [];
  const currentUnitIndex = currentLesson
    ? currentUnitLessons.findIndex((lesson) => lesson.LessonID === currentLesson.LessonID)
    : -1;
  const completedInUnit = currentUnitLessons.filter((lesson) => completedLessonIds.has(lesson.LessonID)).length;
  const plannedDays = currentUnitLessons.reduce((sum, lesson) => sum + Number(lesson.PlannedDays || 0), 0);
  const actualDays = currentUnitLessons.reduce(
    (sum, lesson) => sum + getLessonProgress(lesson.LessonID, dailyProgress).actualDays,
    0,
  );
  const currentUnitLessonIds = new Set(
    currentUnitLessons.map((lesson) => lesson.LessonID),
  );
  const actualDayValues = getActualDayValues(
    dailyProgress.filter((entry) => currentUnitLessonIds.has(entry.LessonID)),
  );
  const currentUnitPlanning = getLessonDayPlanning(
    currentUnitLessons,
    actualDayValues.total,
  );

  return {
    courseUnits,
    courseLessons,
    currentUnit,
    currentUnitLessons,
    currentLesson,
    previousLesson: currentIndex > 0 ? courseLessons[currentIndex - 1] : null,
    nextLesson: currentIndex >= 0 && currentIndex < courseLessons.length - 1
      ? courseLessons[currentIndex + 1]
      : null,
    completedLessonIds,
    currentLessonNumber: currentUnitIndex >= 0 ? currentUnitIndex + 1 : 0,
    totalLessonsInUnit: currentUnitLessons.length,
    completedInUnit,
    remainingInUnit: Math.max(currentUnitLessons.length - completedInUnit - (currentLesson ? 1 : 0), 0),
    plannedDays,
    actualDays,
    // Canonical nullable current-Unit calculation; legacy plannedDays and
    // unitVariance stay numeric until the Unit/Sidebar presentation migration.
    planning: {
      actualDays: actualDayValues.total,
      actualDayValues,
      plannedDays: currentUnitPlanning.plannedDays,
      variance: currentUnitPlanning.variance,
      complete: currentUnitPlanning.complete,
      hasInvalidValues:
        actualDayValues.hasInvalidValues || currentUnitPlanning.hasInvalidValues,
    },
    unitVariance: actualDays - plannedDays,
  };
}

export function getPrepareNext(courseId, units, lessons, dailyProgress, count = 3) {
  const navigation = getCourseNavigation(courseId, units, lessons, dailyProgress);
  const currentIndex = navigation.currentLesson
    ? navigation.courseLessons.findIndex((lesson) => lesson.LessonID === navigation.currentLesson.LessonID)
    : -1;
  const upcomingLessons = currentIndex >= 0
    ? navigation.courseLessons.slice(currentIndex + 1, currentIndex + 1 + count)
    : [];
  const visibleLessons = [navigation.currentLesson, ...upcomingLessons].filter(Boolean);

  return {
    currentLesson: navigation.currentLesson,
    upcomingLessons,
    missingResourceCount: visibleLessons.filter((lesson) => !lesson.PrimaryLink).length,
  };
}
