import {
  getActiveCurriculum,
  isTrue,
  sortLessons,
  sortUnits,
} from "./plannerUtils.js";

function getLessonProgress(lessonId, dailyProgress) {
  const entries = dailyProgress.filter((entry) => entry.LessonID === lessonId);
  return {
    actualDays: entries.reduce((sum, entry) => sum + Number(entry.DayFraction || 0), 0),
    finished: entries.some((entry) => isTrue(entry.Finished)),
  };
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

export function getCourseStatus(courseId, units, lessons, dailyProgress) {
  const { courseLessons } = getActiveCourseCurriculum(courseId, units, lessons);
  const completedLessonIds = new Set(
    dailyProgress
      .filter((entry) => entry.CourseID === courseId && isTrue(entry.Finished))
      .map((entry) => entry.LessonID),
  );
  const completedLessons = courseLessons.filter((lesson) => completedLessonIds.has(lesson.LessonID));
  const activeLessonIds = new Set(courseLessons.map((lesson) => lesson.LessonID));
  const actualDays = dailyProgress
    .filter((entry) => entry.CourseID === courseId && activeLessonIds.has(entry.LessonID))
    .reduce((sum, entry) => sum + Number(entry.DayFraction || 0), 0);
  const plannedDaysCompleted = completedLessons.reduce(
    (sum, lesson) => sum + Number(lesson.PlannedDays || 0),
    0,
  );

  return {
    currentLesson: courseLessons.find((lesson) => !completedLessonIds.has(lesson.LessonID)) ?? null,
    completedCount: completedLessons.length,
    plannedDaysCompleted,
    actualDays,
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
