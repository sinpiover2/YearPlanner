import { useEffect, useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import TodayView from "./components/TodayView";
import UnitsView from "./components/UnitsView";
import ForecastView from "./components/ForecastView";
import TeacherDeskView from "./components/TeacherDeskView";
import {
  isTrue,
  formatDate,
  formatVariance,
  formatVarianceCompact,
  formatDays,
  formatDayPhrase,
  calculateProgressPercent,
  getOutcomeList,
  getRequiredDays,
  getOptionalDays,
  sortUnits,
  sortLessons,
  getCourseLabel,
} from "./utils/plannerUtils";
import {
  addLesson,
  deleteLesson,
  fetchPlannerData,
  moveLesson,
  saveDailyProgress,
  updateLesson,
} from "./api";

function getProjectedUnits(courseUnits, schoolCalendar) {
  const schoolDays = schoolCalendar.filter((day) =>
    isTrue(day.InstructionalDay),
  );
  let cursor = 0;

  return sortUnits(courseUnits).map((unit) => {
    const requiredDays = Number(unit.RequiredDays || 0);
    const startDay = schoolDays[cursor];
    const endDay = schoolDays[cursor + requiredDays - 1];

    cursor += requiredDays;

    return {
      ...unit,
      projectedStart: startDay?.Date ?? null,
      projectedEnd: endDay?.Date ?? null,
    };
  });
}

function getLessonProgress(lessonId, dailyProgress) {
  const entries = dailyProgress.filter((entry) => entry.LessonID === lessonId);

  const actualDays = entries.reduce(
    (sum, entry) => sum + Number(entry.DayFraction || 0),
    0,
  );

  const finished = entries.some((entry) => isTrue(entry.Finished));

  return { actualDays, finished };
}

function getCourseStatus(courseId, units, lessons, dailyProgress) {
  const courseUnits = sortUnits(
    units.filter((unit) => unit.CourseID === courseId),
  );

  const courseLessons = sortLessons(
    lessons.filter((lesson) => lesson.CourseID === courseId),
    courseUnits,
  );

  const completedLessonIds = new Set(
    dailyProgress
      .filter((entry) => entry.CourseID === courseId && isTrue(entry.Finished))
      .map((entry) => entry.LessonID),
  );

  const completedLessons = courseLessons.filter((lesson) =>
    completedLessonIds.has(lesson.LessonID),
  );

  const actualDays = dailyProgress
    .filter((entry) => entry.CourseID === courseId)
    .reduce((sum, entry) => sum + Number(entry.DayFraction || 0), 0);

  const plannedDaysCompleted = completedLessons.reduce(
    (sum, lesson) => sum + Number(lesson.PlannedDays || 0),
    0,
  );

  const currentLesson =
    courseLessons.find((lesson) => !completedLessonIds.has(lesson.LessonID)) ??
    null;

  return {
    currentLesson,
    completedCount: completedLessons.length,
    plannedDaysCompleted,
    actualDays,
    variance: actualDays - plannedDaysCompleted,
  };
}

function getCourseNavigation(courseId, units, lessons, dailyProgress) {
  const courseUnits = sortUnits(
    units.filter((unit) => unit.CourseID === courseId),
  );

  const courseLessons = sortLessons(
    lessons.filter((lesson) => lesson.CourseID === courseId),
    courseUnits,
  );

  const completedLessonIds = new Set(
    dailyProgress
      .filter((entry) => entry.CourseID === courseId && isTrue(entry.Finished))
      .map((entry) => entry.LessonID),
  );

  const currentIndex = courseLessons.findIndex(
    (lesson) => !completedLessonIds.has(lesson.LessonID),
  );

  const currentLesson = currentIndex >= 0 ? courseLessons[currentIndex] : null;

  const previousLesson =
    currentIndex > 0 ? courseLessons[currentIndex - 1] : null;

  const nextLesson =
    currentIndex >= 0 && currentIndex < courseLessons.length - 1
      ? courseLessons[currentIndex + 1]
      : null;

  const currentUnit = currentLesson
    ? courseUnits.find((unit) => unit.UnitID === currentLesson.UnitID)
    : (courseUnits.at(-1) ?? null);

  const currentUnitLessons = currentUnit
    ? courseLessons.filter((lesson) => lesson.UnitID === currentUnit.UnitID)
    : [];

  const currentUnitIndex = currentLesson
    ? currentUnitLessons.findIndex(
        (lesson) => lesson.LessonID === currentLesson.LessonID,
      )
    : -1;

  const completedInUnit = currentUnitLessons.filter((lesson) =>
    completedLessonIds.has(lesson.LessonID),
  ).length;

  const plannedDays = currentUnitLessons.reduce(
    (sum, lesson) => sum + Number(lesson.PlannedDays || 0),
    0,
  );

  const actualDays = currentUnitLessons.reduce(
    (sum, lesson) =>
      sum + getLessonProgress(lesson.LessonID, dailyProgress).actualDays,
    0,
  );

  return {
    courseUnits,
    courseLessons,
    currentUnit,
    currentUnitLessons,
    currentLesson,
    previousLesson,
    nextLesson,
    completedLessonIds,
    currentLessonNumber: currentUnitIndex >= 0 ? currentUnitIndex + 1 : 0,
    totalLessonsInUnit: currentUnitLessons.length,
    completedInUnit,
    remainingInUnit: Math.max(
      currentUnitLessons.length - completedInUnit - (currentLesson ? 1 : 0),
      0,
    ),
    plannedDays,
    actualDays,
    unitVariance: actualDays - plannedDays,
  };
}

function getPrepareNext(courseId, units, lessons, dailyProgress, count = 3) {
  const navigation = getCourseNavigation(
    courseId,
    units,
    lessons,
    dailyProgress,
  );

  const currentIndex = navigation.currentLesson
    ? navigation.courseLessons.findIndex(
        (lesson) => lesson.LessonID === navigation.currentLesson.LessonID,
      )
    : -1;

  const upcomingLessons =
    currentIndex >= 0
      ? navigation.courseLessons.slice(
          currentIndex + 1,
          currentIndex + 1 + count,
        )
      : [];

  const visibleLessons = [navigation.currentLesson, ...upcomingLessons].filter(
    Boolean,
  );

  const missingResourceCount = visibleLessons.filter(
    (lesson) => !lesson.PrimaryLink,
  ).length;

  return {
    currentLesson: navigation.currentLesson,
    upcomingLessons,
    missingResourceCount,
  };
}

function getSectionsForCourse(courseId, sections) {
  return sections
    .filter((section) => {
      const activeValue = section.Active;
      const isActive =
        activeValue === undefined || activeValue === "" || isTrue(activeValue);

      return section.CourseID === courseId && isActive;
    })
    .sort((a, b) => Number(a.SortOrder || 999) - Number(b.SortOrder || 999));
}

function getSelectedSectionForCourse(courseId, sections, selectedSectionId) {
  const courseSections = getSectionsForCourse(courseId, sections);

  return (
    courseSections.find((section) => section.SectionID === selectedSectionId) ??
    courseSections[0] ??
    null
  );
}

const TODAY_TIME_LABELS_BY_PERIOD = {
  1: "8:15",
  2: "9:40",
  3: "11:00",
  5: "1:10",
  6: "2:35",
};

function getTodayTimeLabel(section) {
  return TODAY_TIME_LABELS_BY_PERIOD[Number(section?.Period)] ?? "—";
}

function getTodayDateParts(date = new Date()) {
  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "long" }),
    dateLabel: date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    }),
  };
}

function getTodayModel({
  selectedCourseId,
  selectedSection,
  selectedCourseSections,
  units,
  lessons,
  dailyProgress,
  getCourseLabel,
}) {
  const orderedSections = [...selectedCourseSections].sort(
    (a, b) => Number(a.Period || 999) - Number(b.Period || 999),
  );

  const currentSection =
    orderedSections.find(
      (section) => section.SectionID === selectedSection?.SectionID,
    ) ??
    orderedSections[0] ??
    null;

  const currentIndex = currentSection
    ? orderedSections.findIndex(
        (section) => section.SectionID === currentSection.SectionID,
      )
    : -1;

  const flowItems = orderedSections.map((section, index) => {
    const sectionProgress = getProgressForSection(dailyProgress, section);
    const navigation = getCourseNavigation(
      section.CourseID,
      units,
      lessons,
      sectionProgress,
    );

    const state =
      index < currentIndex
        ? "complete"
        : index === currentIndex
          ? "current"
          : "upcoming";

    return {
      id: section.SectionID,
      section,
      state,
      timeLabel: getTodayTimeLabel(section),
      courseLabel: getCourseLabel(section.CourseID),
      lesson: navigation.currentLesson,
      unit: navigation.currentUnit,
      lessonNumber: navigation.currentLessonNumber,
      totalLessonsInUnit: navigation.totalLessonsInUnit,
    };
  });

  const currentItem =
    flowItems.find((item) => item.state === "current") ?? flowItems[0] ?? null;

  const { weekday, dateLabel } = getTodayDateParts();

  return {
    weekday,
    dateLabel,
    statusText: currentItem ? "You're set for today." : "No classes scheduled.",
    currentItem,
    flowItems,
    selectedCourseLabel: getCourseLabel(selectedCourseId),
  };
}

function getSectionMeetingDays(section, schoolCalendar, schedulePatterns) {
  if (!section) return [];

  return schoolCalendar.filter((day) => {
    if (!isTrue(day.InstructionalDay)) return false;

    const date = new Date(day.Date);
    const dayOfWeek = date.toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "America/Los_Angeles",
    });

    const pattern = schedulePatterns.find(
      (item) => item.DayOfWeek === dayOfWeek,
    );

    if (!pattern) return false;

    return isTrue(pattern[section.BlockGroup]);
  });
}

function getProgressForSection(dailyProgress, section) {
  if (!section) return [];

  return dailyProgress.filter((entry) => {
    return entry.CourseSectionID === section.SectionID;
  });
}

function getSectionForecast(section, units, lessons, dailyProgress) {
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

function App() {
  const [plannerData, setPlannerData] = useState(null);
  const [status, setStatus] = useState("Loading planner data...");
  const [activeView, setActiveView] = useState("today");
  const [timeLens, setTimeLens] = useState("school");
  const [selectedCourseId, setSelectedCourseId] = useState("M8");
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [progressInputs, setProgressInputs] = useState({});
  const [savingLessonId, setSavingLessonId] = useState(null);
  const [activeProgressLessonId, setActiveProgressLessonId] = useState(null);
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [newLesson, setNewLesson] = useState({
    lessonTitle: "",
    plannedDays: 1,
    keyOutcomes: [""],
  });
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [editLessonDraft, setEditLessonDraft] = useState(null);

  useEffect(() => {
    fetchPlannerData()
      .then((data) => {
        setPlannerData(data);
        setStatus("Connected to Google Sheets");
      })
      .catch((error) => {
        console.error(error);
        setStatus("Could not connect to Google Sheets");
      });
  }, []);

  const courses = plannerData?.courses ?? [];
  const units = plannerData?.units ?? [];
  const schoolCalendar = plannerData?.schoolCalendar ?? [];
  const schedulePatterns = plannerData?.schedulePatterns ?? [];
  const sections = plannerData?.sections ?? [];
  const lessons = plannerData?.lessons ?? [];
  const dailyProgress = plannerData?.dailyProgress ?? [];

  const instructionalDays = schoolCalendar.filter((day) =>
    isTrue(day.InstructionalDay),
  ).length;

  const math8Units = units.filter((unit) => unit.CourseID === "M8");
  const math1Units = units.filter((unit) => unit.CourseID === "IM1");

  const math8RequiredDays = getRequiredDays(math8Units);
  const math1RequiredDays = getRequiredDays(math1Units);
  const math8OptionalDays = getOptionalDays(math8Units);
  const math1OptionalDays = getOptionalDays(math1Units);

  const math8Sections = getSectionsForCourse("M8", sections);
  const math1Sections = getSectionsForCourse("IM1", sections);

  const selectedMath8Section = getSelectedSectionForCourse(
    "M8",
    sections,
    selectedSectionId,
  );

  const selectedMath1Section = getSelectedSectionForCourse(
    "IM1",
    sections,
    selectedSectionId,
  );

  const selectedSection =
    selectedCourseId === "IM1" ? selectedMath1Section : selectedMath8Section;

  const selectedCourseSections =
    selectedCourseId === "IM1" ? math1Sections : math8Sections;

  const math8MeetingDays = getSectionMeetingDays(
    selectedMath8Section,
    schoolCalendar,
    schedulePatterns,
  ).length;

  const math1MeetingDays = getSectionMeetingDays(
    selectedMath1Section,
    schoolCalendar,
    schedulePatterns,
  ).length;

  const math8DailyProgress = getProgressForSection(
    dailyProgress,
    selectedMath8Section,
  );

  const math1DailyProgress = getProgressForSection(
    dailyProgress,
    selectedMath1Section,
  );

  const selectedDailyProgress =
    selectedCourseId === "IM1" ? math1DailyProgress : math8DailyProgress;

  const math8Status = getCourseStatus("M8", units, lessons, math8DailyProgress);
  const math1Status = getCourseStatus(
    "IM1",
    units,
    lessons,
    math1DailyProgress,
  );

  const math8Navigation = getCourseNavigation(
    "M8",
    units,
    lessons,
    math8DailyProgress,
  );

  const math1Navigation = getCourseNavigation(
    "IM1",
    units,
    lessons,
    math1DailyProgress,
  );

  const math8PrepareNext = getPrepareNext(
    "M8",
    units,
    lessons,
    math8DailyProgress,
  );

  const math1PrepareNext = getPrepareNext(
    "IM1",
    units,
    lessons,
    math1DailyProgress,
  );

  const actualDaysLogged =
    selectedCourseId === "IM1"
      ? math1Status.actualDays
      : math8Status.actualDays;

  const curriculumDaysPlanned =
    selectedCourseId === "IM1" ? math1MeetingDays : math8MeetingDays;

  const timeLensInfo = {
    school: {
      label: "School calendar loaded",
      value: instructionalDays || "—",
      unit: "days",
      bar: Math.min(100, ((instructionalDays || 0) / 180) * 100),
    },
    curriculum: {
      label: selectedSection
        ? `${selectedSection.SectionName} meetings available`
        : "Class meetings available",
      value: curriculumDaysPlanned || "—",
      unit: "days",
      bar: Math.min(
        100,
        (curriculumDaysPlanned / Math.max(instructionalDays, 1)) * 100,
      ),
    },
    actual: {
      label: selectedSection
        ? `${selectedSection.SectionName} days used`
        : "Days used",
      value: actualDaysLogged || "—",
      unit: "days",
      bar: Math.min(
        100,
        (actualDaysLogged / Math.max(curriculumDaysPlanned, 1)) * 100,
      ),
    },
  }[timeLens];

  const selectedNavigation =
    selectedCourseId === "IM1" ? math1Navigation : math8Navigation;

  const selectedStatus = selectedCourseId === "IM1" ? math1Status : math8Status;

  const selectedPrepareNext =
    selectedCourseId === "IM1" ? math1PrepareNext : math8PrepareNext;

  const todayModel = getTodayModel({
    selectedCourseId,
    selectedSection,
    selectedCourseSections,
    units,
    lessons,
    dailyProgress,
    getCourseLabel,
  });

  const activeSections = sections.filter((section) => {
    return (
      section.Active === undefined ||
      section.Active === "" ||
      isTrue(section.Active)
    );
  });

  const sectionForecasts = activeSections
    .map((section) =>
      getSectionForecast(section, units, lessons, dailyProgress),
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

  const selectedUnit =
    units.find((unit) => unit.UnitID === selectedUnitId) ??
    selectedNavigation.currentUnit;

  const selectedUnitLessons = selectedUnit
    ? sortLessons(
        lessons.filter((lesson) => lesson.UnitID === selectedUnit.UnitID),
        units,
      )
    : [];

  function startEditingLesson(lesson) {
    console.log("EDITING", lesson.LessonID);
    setEditingLessonId(lesson.LessonID);
    setEditLessonDraft({
      lessonTitle: lesson.LessonTitle || "",
      plannedDays: lesson.PlannedDays || 1,
      goals: getOutcomeList(lesson.KeyOutcome).length
        ? getOutcomeList(lesson.KeyOutcome)
        : [""],
      primaryLink: lesson.PrimaryLink || "",
      teacherNotes: lesson.TeacherNotes || "",
    });
  }

  function updateGoal(index, value) {
    setEditLessonDraft((prev) => ({
      ...prev,
      goals: prev.goals.map((goal, goalIndex) =>
        goalIndex === index ? value : goal,
      ),
    }));
  }

  function addGoal() {
    setEditLessonDraft((prev) => ({
      ...prev,
      goals: [...prev.goals, ""],
    }));
  }

  function removeGoal(index) {
    setEditLessonDraft((prev) => ({
      ...prev,
      goals: prev.goals.filter((_, goalIndex) => goalIndex !== index),
    }));
  }

  function updateNewLessonGoal(index, value) {
    setNewLesson((prev) => ({
      ...prev,
      keyOutcomes: prev.keyOutcomes.map((goal, goalIndex) =>
        goalIndex === index ? value : goal,
      ),
    }));
  }

  function addNewLessonGoal() {
    setNewLesson((prev) => ({
      ...prev,
      keyOutcomes: [...prev.keyOutcomes, ""],
    }));
  }

  function removeNewLessonGoal(index) {
    setNewLesson((prev) => ({
      ...prev,
      keyOutcomes: prev.keyOutcomes.filter(
        (_, goalIndex) => goalIndex !== index,
      ),
    }));
  }

  async function handleLogProgress(lesson) {
    try {
      setSavingLessonId(lesson.LessonID);

      const input = progressInputs[lesson.LessonID] || {};

      const targetSections =
        selectedCourseSections.length > 0
          ? selectedCourseSections
          : selectedSection
            ? [selectedSection]
            : [];

      if (targetSections.length === 0) {
        alert("No sections are available for this course.");
        return;
      }

      await Promise.all(
        targetSections.map((section) =>
          saveDailyProgress({
            date: new Date().toISOString(),
            courseSectionId: section.SectionID,
            courseId: lesson.CourseID,
            unitId: lesson.UnitID,
            lessonId: lesson.LessonID,
            dayFraction: Number(input.dayFraction || 0),
            finished: Boolean(input.finished),
            notes: input.notes || "",
          }),
        ),
      );

      const refreshedData = await fetchPlannerData();
      setPlannerData(refreshedData);
      setActiveProgressLessonId(null);

      setProgressInputs((prev) => ({
        ...prev,
        [lesson.LessonID]: {
          dayFraction: "",
          finished: false,
          notes: "",
        },
      }));
    } catch (error) {
      console.error(error);
      alert("Could not save progress.");
    } finally {
      setSavingLessonId(null);
    }
  }

  async function handleAddLesson() {
    console.log("ADD LESSON CLICKED", newLesson);
    if (!selectedUnit || !newLesson.lessonTitle.trim()) {
      alert("Please enter a lesson title.");
      return;
    }

    try {
      await addLesson({
        courseId: selectedUnit.CourseID,
        unitId: selectedUnit.UnitID,
        lessonTitle: newLesson.lessonTitle.trim(),
        plannedDays: Number(newLesson.plannedDays || 1),
        keyOutcome: newLesson.keyOutcomes
          .map((goal) => goal.trim())
          .filter(Boolean)
          .join("|"),
        primaryLink: "",
      });

      const refreshedData = await fetchPlannerData();
      setPlannerData(refreshedData);

      setNewLesson({
        lessonTitle: "",
        plannedDays: 1,
        keyOutcomes: [""],
      });

      setIsAddingLesson(false);
    } catch (error) {
      console.error(error);
      alert("Could not add lesson.");
    }
  }

  async function handleDeleteLesson(lesson) {
    const confirmed = window.confirm(`Delete "${lesson.LessonTitle}"?`);

    if (!confirmed) return;

    try {
      await deleteLesson({
        lessonId: lesson.LessonID,
      });

      const refreshedData = await fetchPlannerData();

      setPlannerData(refreshedData);
      setEditingLessonId(null);
      setEditLessonDraft(null);
    } catch (error) {
      console.error(error);
      alert("Could not delete lesson.");
    }
  }

  async function handleMoveLesson(lesson, direction) {
    try {
      await moveLesson({
        lessonId: lesson.LessonID,
        unitId: lesson.UnitID,
        direction,
      });

      const refreshedData = await fetchPlannerData();
      setPlannerData(refreshedData);
    } catch (error) {
      console.error(error);
      alert("Could not move lesson.");
    }
  }

  async function handleUpdateLesson(lesson) {
    if (!editLessonDraft.lessonTitle.trim()) {
      alert("Please enter a lesson title.");
      return;
    }

    try {
      await updateLesson({
        lessonId: lesson.LessonID,
        lessonTitle: editLessonDraft.lessonTitle.trim(),
        plannedDays: Number(editLessonDraft.plannedDays || 1),
        keyOutcome: editLessonDraft.goals
          .map((goal) => goal.trim())
          .filter(Boolean)
          .join("|"),
        primaryLink: editLessonDraft.primaryLink || "",
        teacherNotes: editLessonDraft.teacherNotes || "",
      });

      const refreshedData = await fetchPlannerData();
      setPlannerData(refreshedData);
      setEditingLessonId(null);
      setEditLessonDraft(null);
    } catch (error) {
      console.error(error);
      alert("Could not update lesson.");
    }
  }

  function renderUnitChips(courseId, courseUnits) {
    return (
      <div className="unit-chip-grid">
        {sortUnits(courseUnits).map((unit) => (
          <button
            key={unit.UnitID}
            className={
              selectedUnit?.UnitID === unit.UnitID
                ? "unit-chip active"
                : "unit-chip"
            }
            onClick={() => {
              setSelectedCourseId(courseId);
              setSelectedUnitId(unit.UnitID);
              setActiveView("units");
            }}
          >
            {unit.UnitNumber}
          </button>
        ))}
      </div>
    );
  }

  return (
    <main className="app">
      <section className="planner-shell">
        <Sidebar
          status={status}
          timeLens={timeLens}
          setTimeLens={setTimeLens}
          timeLensInfo={timeLensInfo}
          selectedCourseId={selectedCourseId}
          setSelectedCourseId={setSelectedCourseId}
          setSelectedUnitId={setSelectedUnitId}
          math8Navigation={math8Navigation}
          math1Navigation={math1Navigation}
          math8Status={math8Status}
          math1Status={math1Status}
          math8OptionalDays={math8OptionalDays}
          math1OptionalDays={math1OptionalDays}
          calculateProgressPercent={calculateProgressPercent}
          formatVarianceCompact={formatVarianceCompact}
          selectedSection={selectedSection}
          selectedCourseSections={selectedCourseSections}
          setSelectedSectionId={setSelectedSectionId}
          renderUnitChips={renderUnitChips}
          math8Units={math8Units}
          math1Units={math1Units}
        />

        <section className="main-workspace">
          <nav className="view-tabs">
            <button
              className={activeView === "today" ? "active-view" : ""}
              onClick={() => setActiveView("today")}
            >
              Today
            </button>

            <button
              className={activeView === "units" ? "active-view" : ""}
              onClick={() => setActiveView("units")}
            >
              Units
            </button>

            <button
              className={activeView === "forecast" ? "active-view" : ""}
              onClick={() => setActiveView("forecast")}
            >
              Forecast
            </button>

            <button
              className={activeView === "teacherDesk" ? "active-view" : ""}
              onClick={() => setActiveView("teacherDesk")}
            >
              Teacher Desk
            </button>
          </nav>

          {activeView === "today" && (
            <TodayView todayModel={todayModel} />
          )}

          {activeView === "teacherDesk" && <TeacherDeskView />}

          {activeView === "units" && (
            <UnitsView
              courses={courses}
              units={units}
              schoolCalendar={schoolCalendar}
              getProjectedUnits={getProjectedUnits}
              selectedCourseId={selectedCourseId}
              selectedUnit={selectedUnit}
              selectedUnitLessons={selectedUnitLessons}
              setSelectedCourseId={setSelectedCourseId}
              setSelectedUnitId={setSelectedUnitId}
              getCourseLabel={getCourseLabel}
              selectedDailyProgress={selectedDailyProgress}
              selectedNavigation={selectedNavigation}
              activeProgressLessonId={activeProgressLessonId}
              progressInputs={progressInputs}
              setProgressInputs={setProgressInputs}
              setActiveProgressLessonId={setActiveProgressLessonId}
              handleLogProgress={handleLogProgress}
              editingLessonId={editingLessonId}
              editLessonDraft={editLessonDraft}
              setEditLessonDraft={setEditLessonDraft}
              setEditingLessonId={setEditingLessonId}
              startEditingLesson={startEditingLesson}
              updateGoal={updateGoal}
              removeGoal={removeGoal}
              addGoal={addGoal}
              handleUpdateLesson={handleUpdateLesson}
              handleMoveLesson={handleMoveLesson}
              handleDeleteLesson={handleDeleteLesson}
              isAddingLesson={isAddingLesson}
              setIsAddingLesson={setIsAddingLesson}
              newLesson={newLesson}
              setNewLesson={setNewLesson}
              updateNewLessonGoal={updateNewLessonGoal}
              addNewLessonGoal={addNewLessonGoal}
              removeNewLessonGoal={removeNewLessonGoal}
              handleAddLesson={handleAddLesson}
              getLessonProgress={getLessonProgress}
              getOutcomeList={getOutcomeList}
              formatVarianceCompact={formatVarianceCompact}
              formatDate={formatDate}
            />
          )}

          {activeView === "forecast" && (
            <ForecastView
              overallForecastStateClass={overallForecastStateClass}
              overallForecastMessage={overallForecastMessage}
              overallForecastDetail={overallForecastDetail}
              forecastedSections={forecastedSections}
              units={units}
              lessons={lessons}
              timelineSyncSummaries={timelineSyncSummaries}
              sectionForecasts={sectionForecasts}
              hasForecastProgress={hasForecastProgress}
            />
          )}
        </section>
      </section>
    </main>
  );
}

export { getSectionTimeline };

export default App;
