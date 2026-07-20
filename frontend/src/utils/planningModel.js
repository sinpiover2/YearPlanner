import {
  getPlanningWeek,
  buildCalendarIndex,
  buildScheduleIndex,
  buildSectionMeetingMaps,
} from "./planningCalendar";
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

// Resolves a single course's current unit/lesson into the shape sessions
// and the shelf need. Each course navigates independently, so this must be
// computed per CourseID rather than once globally — otherwise sections
// from the non-selected course inherit the wrong curriculum context.
function getCourseContext(courseNavigation, lessons, units) {
  const currentUnit = courseNavigation?.currentUnit ?? null;
  const currentLesson = courseNavigation?.currentLesson ?? null;

  const unitLessons = currentUnit
    ? sortLessons(
        lessons.filter((lesson) => lesson.UnitID === currentUnit.UnitID),
        units,
      )
    : [];

  const currentLessonIndex = currentLesson
    ? unitLessons.findIndex((lesson) => lesson.LessonID === currentLesson.LessonID)
    : 0;

  return { currentUnit, currentLesson, unitLessons, currentLessonIndex };
}

const PERIOD_FOUR_PLACEHOLDER = {
  id: "planning-period-4-placeholder",
  label: "Period 4",
  isPlaceholder: true,
};

// Period 4 currently has no active section, so the grid would otherwise
// skip straight from Period 3 to Period 5. Reserve an always-empty row for
// it, positioned by each section's real Period number rather than array
// order, until Period 4 scheduling is designed.
function insertPeriodFourPlaceholder(sections, rawSections) {
  const hasPeriodFour = rawSections.some(
    (section) => Number(section.Period) === 4,
  );
  if (hasPeriodFour) return sections;

  const insertIndex = rawSections.findIndex(
    (section) => Number(section.Period) > 4,
  );
  const index = insertIndex === -1 ? sections.length : insertIndex;

  return [
    ...sections.slice(0, index),
    PERIOD_FOUR_PLACEHOLDER,
    ...sections.slice(index),
  ];
}

export function getPlanningModel({
  planningSections,
  planningNavigationByCourse = {},
  selectedCourseId,
  units,
  lessons,
  schoolCalendar = [],
  schedulePatterns = [],
  referenceDate = new Date(),
}) {
  const courseContextCache = new Map();
  function getCachedCourseContext(courseId) {
    if (!courseContextCache.has(courseId)) {
      courseContextCache.set(
        courseId,
        getCourseContext(planningNavigationByCourse[courseId], lessons, units),
      );
    }
    return courseContextCache.get(courseId);
  }

  const calendarIndex = buildCalendarIndex(schoolCalendar);
  const scheduleIndex = buildScheduleIndex(schedulePatterns);
  const sectionMeetingMaps = buildSectionMeetingMaps(
    planningSections,
    calendarIndex,
    scheduleIndex,
  );

  const planningWeek = getPlanningWeek({ referenceDate, calendarIndex });
  const { weekDays, teachingDays } = planningWeek;

  const sections = insertPeriodFourPlaceholder(
    planningSections.map((section) => ({
      id: section.SectionID,
      label: getSectionLabel(section),
      courseId: section.CourseID,
      blockGroup: section.BlockGroup,
    })),
    planningSections,
  );

  // A cell exists only for a real section meeting: InstructionalDay must be
  // true and the section's BlockGroup must meet that weekday per
  // SchedulePatterns. Non-meeting days simply have no entry, so the grid
  // renders its existing "open" empty state rather than inviting a lesson
  // that can't happen. Whether a meeting shows a title is entirely driven
  // by real authored content — curriculum is never auto-projected onto a
  // meeting the teacher hasn't planned.
  const sessions = {};

  sections.forEach((section) => {
    const meetingMap = sectionMeetingMaps.get(section.id);

    teachingDays.forEach((day) => {
      const courseSessionNumber = meetingMap?.get(day.key) ?? null;
      if (courseSessionNumber == null) return;

      const sessionId = `${section.id}-${day.key}`;
      const summary = getLessonSessionSummary(sessionId);
      const curriculumLesson = summary.curriculumLessonId
        ? lessons.find(
            (lesson) => lesson.LessonID === summary.curriculumLessonId,
          )
        : null;

      const { currentUnit } = getCachedCourseContext(section.courseId);

      sessions[sessionId] = {
        id: sessionId,
        sectionId: section.id,
        sectionLabel: section.label,
        dayKey: day.key,
        schoolDayNumber: day.schoolDayNumber,
        courseSessionNumber,
        event: day.event,
        notes: day.notes,
        dayType: day.dayType,
        unitId: currentUnit?.UnitID ?? null,
        unitLabel: [currentUnit?.UnitNumber, currentUnit?.UnitTitle]
          .filter(Boolean)
          .join(" "),
        ...summary,
        curriculumLabel: getCurriculumLessonLabel(curriculumLesson),
      };
    });
  });

  const selectedCourseContext = getCachedCourseContext(selectedCourseId);
  const { currentUnit, unitLessons, currentLessonIndex } = selectedCourseContext;

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
