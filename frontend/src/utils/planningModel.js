import {
  getPlanningWeek,
  buildCalendarIndex,
  buildScheduleIndex,
  buildSectionMeetingMaps,
} from "./planningCalendar.js";
import {
  getActiveCurriculum,
  getSequencedItems,
  getItemType,
} from "./plannerUtils.js";
import { getLessonSessionSummary } from "./lessonSessionStorage.js";

function getLessonTitle(lesson) {
  return lesson?.LessonTitle || "Lesson Session";
}

// D-3 (approved): Instructional Item Type appears subtly in Planning. An
// ordinary Lesson shows exactly as it always has; any other type is
// prefixed so the citation reads e.g. "Practice Day · M1.3 Practice Day 1"
// instead of an unlabeled title. See
// docs/Architecture/CURRICULUM_INFORMATION_MODEL.md, §5.
function getCurriculumLessonLabel(lesson) {
  if (!lesson) return null;

  const type = getItemType(lesson);
  const typePrefix = type !== "Lesson" ? type : null;

  return (
    [typePrefix, lesson.LessonCode || lesson.LessonNumber, lesson.LessonTitle]
      .filter(Boolean)
      .join(" ") || null
  );
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

  // Flexible-placement items (no fixed SortOrder) are excluded before the
  // shelf/current-lesson walk begins — see
  // docs/Architecture/CURRICULUM_INFORMATION_MODEL.md, §6.
  const unitLessons = currentUnit
    ? getSequencedItems(
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
  const { activeUnits, activeLessons } = getActiveCurriculum(units, lessons);
  const courseContextCache = new Map();
  function getCachedCourseContext(courseId) {
    if (!courseContextCache.has(courseId)) {
      courseContextCache.set(
        courseId,
        getCourseContext(
          planningNavigationByCourse[courseId],
          activeLessons,
          activeUnits,
        ),
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

  // Bounds for direct date navigation: calendarIndex is already sorted
  // chronologically (buildCalendarIndex), so its first/last keys are the
  // school year's date range as maintained in SchoolCalendar.
  const calendarDateKeys = [...calendarIndex.keys()];
  const dateBounds = {
    min: calendarDateKeys[0] ?? null,
    max: calendarDateKeys[calendarDateKeys.length - 1] ?? null,
  };

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
  // that can't happen. Planning contains only teacher-authored Lesson Session
  // content. Curriculum pacing projections belong exclusively to Forecast.
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

  // unitLessons already excludes flexible-placement items (see
  // getCourseContext, above), so this slice is always the fixed sequence —
  // no separate filtering needed here.
  const shelfItems = unitLessons
    .slice(
      Math.max(currentLessonIndex + teachingDays.length, 0),
      currentLessonIndex + teachingDays.length + 4,
    )
    .map((lesson) => ({
      id: lesson.LessonID,
      title: getLessonTitle(lesson),
      type: getItemType(lesson),
    }));

  return {
    title: planningWeek.title,
    schoolDaysLabel: planningWeek.schoolDaysLabel,
    previousWeekDate: planningWeek.previousWeekDate,
    nextWeekDate: planningWeek.nextWeekDate,
    dateBounds,
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
