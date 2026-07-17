import { getPlanningWeek } from "./planningCalendar";
import { sortLessons } from "./plannerUtils";
import { getLessonSessionSummary } from "./lessonSessionStorage";

function getLessonTitle(lesson) {
  return lesson?.LessonTitle || "Lesson Session";
}

function getCurriculumLessonLabel(lesson) {
  if (!lesson) return null;

  return [lesson.LessonCode || lesson.LessonNumber, lesson.LessonTitle]
    .filter(Boolean)
    .join(" ") || null;
}

function getSectionLabel(section) {
  return section?.SectionName || section?.Period || section?.SectionID || "Section";
}

export function getPlanningModel({
  selectedCourseSections,
  selectedNavigation,
  units,
  lessons,
  referenceDate = new Date(),
}) {
  const currentUnit = selectedNavigation?.currentUnit ?? null;
  const currentLesson = selectedNavigation?.currentLesson ?? null;

  const unitLessons = currentUnit
    ? sortLessons(
        lessons.filter((lesson) => lesson.UnitID === currentUnit.UnitID),
        units,
      )
    : [];

  const currentLessonIndex = currentLesson
    ? unitLessons.findIndex((lesson) => lesson.LessonID === currentLesson.LessonID)
    : 0;

  const planningWeek = getPlanningWeek(referenceDate);
  const { weekDays, teachingDays } = planningWeek;

  const sections = selectedCourseSections.map((section) => ({
    id: section.SectionID,
    label: getSectionLabel(section),
  }));

  // A cell exists for every section/teaching-day meeting. Whether it shows
  // a title is entirely driven by real authored content — curriculum is
  // never auto-projected onto a meeting the teacher hasn't planned.
  const sessions = {};

  sections.forEach((section) => {
    teachingDays.forEach((day) => {
      const sessionId = `${section.id}-${day.key}`;
      const summary = getLessonSessionSummary(sessionId);
      const curriculumLesson = summary.curriculumLessonId
        ? lessons.find(
            (lesson) => lesson.LessonID === summary.curriculumLessonId,
          )
        : null;

      sessions[sessionId] = {
        id: sessionId,
        sectionId: section.id,
        sectionLabel: section.label,
        dayKey: day.key,
        unitId: currentUnit?.UnitID ?? null,
        unitLabel: [currentUnit?.UnitNumber, currentUnit?.UnitTitle]
          .filter(Boolean)
          .join(" "),
        ...summary,
        curriculumLabel: getCurriculumLessonLabel(curriculumLesson),
      };
    });
  });

  const shelfItems = unitLessons
    .slice(
      Math.max(currentLessonIndex + teachingDays.length, 0),
      currentLessonIndex + teachingDays.length + 4,
    )
    .map((lesson) => ({
      id: lesson.LessonID,
      title: getLessonTitle(lesson),
    }));

  return {
    title: planningWeek.title,
    schoolDaysLabel: planningWeek.schoolDaysLabel,
    previousWeekDate: planningWeek.previousWeekDate,
    nextWeekDate: planningWeek.nextWeekDate,
    weekDays,
    sections,
    sessions,
    shelf: {
      unitLabel: currentUnit?.UnitNumber || "Unit",
      items: shelfItems,
      summary: `${Math.max(unitLessons.length - currentLessonIndex, 0)} left`,
    },
  };
}
