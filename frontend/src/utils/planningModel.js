import { sortLessons } from "./plannerUtils";

function getLessonTitle(lesson) {
  return lesson?.LessonTitle || "Lesson Session";
}

function getSectionLabel(section) {
  return section?.SectionName || section?.Period || section?.SectionID || "Section";
}

export function getPlanningModel({
  selectedCourseSections,
  selectedNavigation,
  units,
  lessons,
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

  const weekDays = [
    { key: "shoulder-before", label: "Fri 11", shoulder: true },
    { key: "mon", label: "Mon 14" },
    { key: "tue", label: "Tue 15", active: true },
    { key: "wed", label: "Wed 16" },
    { key: "thu", label: "Thu 17", alert: true },
    { key: "fri", label: "Fri 18" },
    { key: "shoulder-after", label: "Mon 21", shoulder: true },
  ];

  const teachingDays = weekDays.filter((day) => !day.shoulder);

  const sections = selectedCourseSections.map((section) => ({
    id: section.SectionID,
    label: getSectionLabel(section),
  }));

  const sessions = {};

  sections.forEach((section, sectionIndex) => {
    teachingDays.forEach((day, dayIndex) => {
      const lesson = unitLessons[currentLessonIndex + dayIndex];

      if (!lesson) return;

      const used = Math.min(55, Number(lesson.PlannedDays || 1) * 40 + 7);

      sessions[`${section.id}-${day.key}`] = {
        id: `${section.id}-${day.key}`,
        sectionId: section.id,
        dayKey: day.key,
        title: getLessonTitle(lesson),
        core: getLessonTitle(lesson),
        lessonId: lesson.LessonID,
        unitId: lesson.UnitID,
        minutes: 55,
        used,
        status:
          dayIndex <= sectionIndex
            ? "prepared"
            : dayIndex === 1
              ? "planned"
              : "draft",
        chips: dayIndex === 1 ? ["next up"] : [],
        open: used < 55 ? `${55 - used} min open` : "",
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
    title: "Week of Sep 14",
    schoolDaysLabel: "School days 4–8 of 180",
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
