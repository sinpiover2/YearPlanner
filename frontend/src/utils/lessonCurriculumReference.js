import { isUnitArchived } from "./plannerUtils.js";

export function classifyLessonCurriculumReference(
  lessonId,
  units = [],
  lessons = [],
) {
  if (!lessonId) {
    return { status: "none", label: null, lesson: null };
  }

  const lesson = lessons.find((entry) => entry.LessonID === lessonId) ?? null;

  if (!lesson) {
    return {
      status: "unavailable",
      label: "Unavailable curriculum",
      lesson: null,
    };
  }

  const parentUnit = units.find((unit) => unit.UnitID === lesson.UnitID) ?? null;

  if (!parentUnit) {
    return { status: "unavailable", label: "Unavailable curriculum", lesson };
  }

  if (isUnitArchived(parentUnit)) {
    return { status: "historical", label: "Historical curriculum", lesson };
  }

  return { status: "active", label: "Curriculum", lesson };
}
