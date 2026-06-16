import { useEffect, useState } from "react";
import "./App.css";
import {
  addLesson,
  deleteLesson,
  fetchPlannerData,
  moveLesson,
  saveDailyProgress,
  updateLesson,
} from "./api";

function isTrue(value) {
  return value === true || String(value).toLowerCase() === "true";
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });
}

function formatVariance(variance) {
  if (variance === 0) return "On pace";

  const absoluteValue = Math.abs(variance);
  const dayLabel = absoluteValue === 1 ? "day" : "days";

  return variance > 0
    ? `${absoluteValue} ${dayLabel} behind pace`
    : `${absoluteValue} ${dayLabel} ahead of pace`;
}

function formatVarianceCompact(variance) {
  if (variance === 0) return "—";

  const absoluteValue = Math.abs(variance);

  return variance > 0 ? `+${absoluteValue}d` : `-${absoluteValue}d`;
}

function formatForecastShift(variance) {
  if (variance === 0) return "No forecast shift.";

  const absoluteValue = Math.abs(variance);
  const dayLabel = absoluteValue === 1 ? "day" : "days";
  const direction = variance > 0 ? "later" : "earlier";

  return `Future unit dates shift ${absoluteValue} instructional ${dayLabel} ${direction}.`;
}

function getOutcomeList(value) {
  if (!value) return [];

  return String(value)
    .split(/\||\n/)
    .map((outcome) => outcome.trim())
    .filter(Boolean);
}

function getRequiredDays(courseUnits) {
  return courseUnits.reduce(
    (sum, unit) => sum + Number(unit.RequiredDays || 0),
    0,
  );
}

function getOptionalDays(courseUnits) {
  return courseUnits.reduce(
    (sum, unit) => sum + Number(unit.OptionalDays || 0),
    0,
  );
}

function sortUnits(units) {
  return [...units].sort((a, b) => Number(a.SortOrder) - Number(b.SortOrder));
}

function sortLessons(lessons, units) {
  const unitOrder = new Map(
    units.map((unit) => [unit.UnitID, Number(unit.SortOrder)]),
  );

  return [...lessons].sort((a, b) => {
    const unitCompare =
      (unitOrder.get(a.UnitID) ?? 999) - (unitOrder.get(b.UnitID) ?? 999);

    if (unitCompare !== 0) return unitCompare;

    return Number(a.SortOrder) - Number(b.SortOrder);
  });
}

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

function getCourseLabel(courseId) {
  if (courseId === "M8") return "Math 8";
  if (courseId === "IM1") return "Math 1";
  return courseId;
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

  const bufferDays = courseUnits.reduce(
    (sum, unit) => sum + Number(unit.OptionalDays || 0),
    0,
  );

  const variance = actualDays - plannedDaysCompleted;
  const forecastShift = variance;
  const bufferUsed = Math.max(0, variance);
  const bufferRemaining = Math.max(0, bufferDays - bufferUsed);
  const consumedFraction = bufferDays > 0 ? bufferUsed / bufferDays : 0;

  let state = "On Track";
  let recoverabilityMessage = "No action needed.";

  if (variance > 0) {
    state = "Monitoring";

    if (consumedFraction >= 0.75) {
      state = "Needs Attention";
      recoverabilityMessage = "Consider compressing upcoming optional lessons.";
    } else if (consumedFraction >= 0.25) {
      recoverabilityMessage = "Recoverable within current buffer.";
    }

    if (bufferUsed > bufferDays) {
      state = "Needs Attention";
      recoverabilityMessage =
        "Buffer exhausted — schedule adjustment required.";
    }
  }

  return {
    section,
    state,
    actualDays,
    plannedDaysCompleted,
    variance,
    forecastShift,
    bufferDays,
    bufferUsed,
    bufferRemaining,
    recoverabilityMessage,
    currentLesson,
    currentLessonNumber: currentLessonIndex + 1,
    totalLessons: courseLessons.length,
  };
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

  const sectionForecasts = sections
    .map((section) =>
      getSectionForecast(section, units, lessons, dailyProgress),
    )
    .filter(Boolean);

  const needsAttentionForecasts = sectionForecasts.filter(
    (forecast) => forecast.state === "Needs Attention",
  );

  const monitoringForecasts = sectionForecasts.filter(
    (forecast) => forecast.state === "Monitoring",
  );

  const onTrackForecasts = sectionForecasts.filter(
    (forecast) => forecast.state === "On Track",
  );

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

  function renderLessonTable(lessonList) {
    return (
      <div className="lesson-table">
        <div className="lesson-table-head">
          <span></span>
          <span>Lesson</span>
          <span>Plan</span>
          <span>Actual</span>
          <span>Var</span>
          <span></span>
        </div>

        {lessonList.map((lesson) => {
          const { actualDays, finished } = getLessonProgress(
            lesson.LessonID,
            selectedDailyProgress,
          );
          const isCurrent =
            lesson.LessonID === selectedNavigation.currentLesson?.LessonID;

          const isNext =
            lesson.LessonID === selectedNavigation.nextLesson?.LessonID;

          const variance = actualDays - Number(lesson.PlannedDays || 0);
          const outcomes = getOutcomeList(lesson.KeyOutcome);

          return (
            <div
              className={isCurrent ? "lesson-row current-row" : "lesson-row"}
              key={lesson.LessonID}
            >
              <span className="lesson-index">{lesson.LessonNumber}</span>

              <div className="lesson-name-cell">
                <strong>{lesson.LessonTitle}</strong>

                <span
                  className={
                    finished
                      ? "lesson-pill done"
                      : isCurrent
                        ? "lesson-pill now"
                        : isNext
                          ? "lesson-pill next"
                          : "lesson-pill upcoming"
                  }
                >
                  {finished
                    ? "Done"
                    : isCurrent
                      ? "Now"
                      : isNext
                        ? "Next"
                        : "Upcoming"}
                </span>

                {outcomes.length > 0 ? (
                  <div className="lesson-goals-display">
                    {outcomes.map((outcome, index) => (
                      <p key={`${lesson.LessonID}-${index}`}>{outcome}</p>
                    ))}
                  </div>
                ) : (
                  <p>No outcome entered.</p>
                )}

                {activeProgressLessonId === lesson.LessonID && (
                  <div className="lesson-progress-entry">
                    <input
                      type="number"
                      min="0.25"
                      max="1"
                      step="0.25"
                      placeholder="Add Days"
                      value={progressInputs[lesson.LessonID]?.dayFraction ?? ""}
                      onChange={(e) =>
                        setProgressInputs((prev) => ({
                          ...prev,
                          [lesson.LessonID]: {
                            ...prev[lesson.LessonID],
                            dayFraction: e.target.value,
                          },
                        }))
                      }
                    />

                    <label>
                      <input
                        type="checkbox"
                        checked={
                          progressInputs[lesson.LessonID]?.finished ?? false
                        }
                        onChange={(e) =>
                          setProgressInputs((prev) => ({
                            ...prev,
                            [lesson.LessonID]: {
                              ...prev[lesson.LessonID],
                              finished: e.target.checked,
                            },
                          }))
                        }
                      />
                      Finished
                    </label>

                    <textarea
                      className="log-notes-input"
                      placeholder="Notes — what happened today?"
                      value={progressInputs[lesson.LessonID]?.notes ?? ""}
                      onChange={(e) =>
                        setProgressInputs((prev) => ({
                          ...prev,
                          [lesson.LessonID]: {
                            ...prev[lesson.LessonID],
                            notes: e.target.value,
                          },
                        }))
                      }
                    />

                    <button onClick={() => handleLogProgress(lesson)}>
                      Save Log
                    </button>

                    <button
                      className="secondary-button"
                      onClick={() => setActiveProgressLessonId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <strong>{lesson.PlannedDays || "—"}d</strong>

              <strong>{actualDays || "—"}</strong>

              <strong className={variance > 0 ? "variance-warning" : ""}>
                {actualDays ? formatVarianceCompact(variance) : "—"}
              </strong>

              <div className="lesson-actions">
                <button
                  className="edit-link"
                  onClick={() => startEditingLesson(lesson)}
                >
                  Edit
                </button>

                <button
                  className="log-button"
                  onClick={() => setActiveProgressLessonId(lesson.LessonID)}
                >
                  Log
                </button>
              </div>

              {editingLessonId === lesson.LessonID && editLessonDraft && (
                <div className="lesson-edit-form">
                  <div className="days-row">
                    <div className="days-box" />

                    <label>Days</label>

                    <input
                      className="days-input"
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={editLessonDraft.plannedDays}
                      onChange={(e) =>
                        setEditLessonDraft((prev) => ({
                          ...prev,
                          plannedDays: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="goal-editor">
                    <span>Learning goals</span>

                    {editLessonDraft.goals.map((goal, index) => (
                      <div className="goal-input-row" key={index}>
                        <strong>{index + 1}</strong>

                        <input
                          type="text"
                          value={goal}
                          placeholder="I can..."
                          onChange={(e) => updateGoal(index, e.target.value)}
                        />

                        {editLessonDraft.goals.length > 1 && (
                          <button
                            type="button"
                            className="remove-goal-button"
                            onClick={() => removeGoal(index)}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      className="add-goal-button"
                      onClick={addGoal}
                    >
                      + Add another goal
                    </button>
                  </div>

                  <div className="edit-actions">
                    <button onClick={() => handleUpdateLesson(lesson)}>
                      Save
                    </button>

                    <button
                      className="secondary-button"
                      onClick={() => {
                        setEditingLessonId(null);
                        setEditLessonDraft(null);
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => handleMoveLesson(lesson, "up")}
                    >
                      Move up
                    </button>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => handleMoveLesson(lesson, "down")}
                    >
                      Move down
                    </button>

                    <button
                      className="delete-button"
                      onClick={() => handleDeleteLesson(lesson)}
                    >
                      Delete Lesson
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="add-lesson-row">
          {!isAddingLesson ? (
            <button
              className="add-lesson-button"
              onClick={() => setIsAddingLesson(true)}
            >
              + Add lesson
            </button>
          ) : (
            <div className="add-lesson-form">
              <div className="add-lesson-top-row">
                <input
                  type="text"
                  placeholder="Lesson title"
                  value={newLesson.lessonTitle}
                  onChange={(e) =>
                    setNewLesson((prev) => ({
                      ...prev,
                      lessonTitle: e.target.value,
                    }))
                  }
                />

                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={newLesson.plannedDays}
                  onChange={(e) =>
                    setNewLesson((prev) => ({
                      ...prev,
                      plannedDays: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="goal-editor">
                <span>Learning goals</span>

                {newLesson.keyOutcomes.map((goal, index) => (
                  <div className="goal-input-row" key={`new-goal-${index}`}>
                    <strong>{index + 1}</strong>

                    <input
                      type="text"
                      placeholder="I can..."
                      value={goal}
                      onChange={(e) =>
                        updateNewLessonGoal(index, e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addNewLessonGoal();
                        }
                      }}
                    />

                    {newLesson.keyOutcomes.length > 1 && (
                      <button
                        type="button"
                        className="remove-goal-button"
                        onClick={() => removeNewLessonGoal(index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className="add-goal-button"
                  onClick={addNewLessonGoal}
                >
                  + Add another goal
                </button>
              </div>

              <div className="edit-actions">
                <button onClick={handleAddLesson}>Add lesson</button>

                <button
                  className="secondary-button"
                  onClick={() => {
                    setNewLesson({
                      lessonTitle: "",
                      plannedDays: 1,
                      keyOutcomes: [""],
                    });
                    setIsAddingLesson(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
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
        <aside className="sidebar">
          <div className="sidebar-title">
            <h1>Year Planner</h1>
            <p>2026–27</p>
            <small>{status}</small>
          </div>

          <div className="time-toggle">
            <button
              className={timeLens === "school" ? "active-time-lens" : ""}
              onClick={() => setTimeLens("school")}
            >
              School days
            </button>

            <button
              className={timeLens === "curriculum" ? "active-time-lens" : ""}
              onClick={() => setTimeLens("curriculum")}
            >
              Curriculum days
            </button>

            <button
              className={timeLens === "actual" ? "active-time-lens" : ""}
              onClick={() => setTimeLens("actual")}
            >
              Actual days
            </button>
          </div>

          <div className="sidebar-stat">
            <span>{timeLensInfo.label}</span>
            <strong>
              {timeLensInfo.value}
              <small> {timeLensInfo.unit}</small>
            </strong>
            <div className="mini-bar">
              <div style={{ width: `${timeLensInfo.bar}%` }} />
            </div>
          </div>

          <div className="sidebar-section-title">Courses</div>

          <button
            className={
              selectedCourseId === "M8"
                ? "course-sidebar-card active"
                : "course-sidebar-card"
            }
            onClick={() => {
              setSelectedCourseId("M8");
              setSelectedUnitId(math8Navigation.currentUnit?.UnitID ?? null);
            }}
          >
            <div>
              <strong>Math 8</strong>
              <em>{formatVarianceCompact(math8Status.variance)}</em>
            </div>
            <p>
              {math8Navigation.currentUnit
                ? `U${math8Navigation.currentUnit.UnitNumber} · ${
                    math8Navigation.currentLesson?.LessonTitle ?? "Complete"
                  }`
                : "No unit selected"}
            </p>
            <div className="mini-bar blue">
              <div
                style={{
                  width: `${Math.min(
                    100,
                    (math8Navigation.actualDays /
                      Math.max(math8Navigation.plannedDays, 1)) *
                      100,
                  )}%`,
                }}
              />
            </div>
            <small>
              {math8Navigation.actualDays} of {math8Navigation.plannedDays} days
              in unit · {math8OptionalDays}d buffer
            </small>
          </button>

          <button
            className={
              selectedCourseId === "IM1"
                ? "course-sidebar-card active"
                : "course-sidebar-card"
            }
            onClick={() => {
              setSelectedCourseId("IM1");
              setSelectedUnitId(math1Navigation.currentUnit?.UnitID ?? null);
            }}
          >
            <div>
              <strong>Math 1</strong>
              <em className="good">
                {formatVarianceCompact(math1Status.variance)}
              </em>
            </div>
            <p>
              {math1Navigation.currentUnit
                ? `U${math1Navigation.currentUnit.UnitNumber} · ${
                    math1Navigation.currentLesson?.LessonTitle ?? "Complete"
                  }`
                : "No unit selected"}
            </p>
            <div className="mini-bar green">
              <div
                style={{
                  width: `${Math.min(
                    100,
                    (math1Navigation.actualDays /
                      Math.max(math1Navigation.plannedDays, 1)) *
                      100,
                  )}%`,
                }}
              />
            </div>
            <small>
              {math1Navigation.actualDays} of {math1Navigation.plannedDays} days
              in unit · {math1OptionalDays}d buffer
            </small>
          </button>

          <div className="sidebar-section-title">Section</div>

          <select
            className="section-select"
            value={selectedSection?.SectionID ?? ""}
            onChange={(event) => setSelectedSectionId(event.target.value)}
          >
            {selectedCourseSections.length === 0 ? (
              <option value="">No sections entered</option>
            ) : (
              selectedCourseSections.map((section) => (
                <option key={section.SectionID} value={section.SectionID}>
                  {section.SectionName}
                </option>
              ))
            )}
          </select>

          <div className="sidebar-section-title">Timeline</div>

          <div className="unit-chip-group">
            <span>Math 8</span>
            {renderUnitChips("M8", math8Units)}
          </div>

          <div className="unit-chip-group">
            <span>Math 1</span>
            {renderUnitChips("IM1", math1Units)}
          </div>
        </aside>

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
          </nav>

          {activeView === "today" && (
            <section className="workspace-panel">
              <div className="breadcrumb">
                {getCourseLabel(selectedCourseId)} ›{" "}
                {selectedNavigation.currentUnit
                  ? `U${selectedNavigation.currentUnit.UnitNumber}: ${selectedNavigation.currentUnit.UnitTitle}`
                  : "Course complete"}{" "}
                ›{" "}
                <strong>Lesson {selectedNavigation.currentLessonNumber}</strong>
                <span>{formatVariance(selectedStatus.variance)}</span>
              </div>

              <header className="unit-header">
                <div>
                  <h2>
                    {selectedNavigation.currentUnit?.UnitTitle ??
                      "Course Complete"}
                  </h2>
                  <p>
                    {getCourseLabel(selectedCourseId)} ·{" "}
                    {selectedNavigation.totalLessonsInUnit} lessons ·{" "}
                    {selectedNavigation.plannedDays} days planned
                  </p>
                </div>

                <span className="status-pill">
                  {selectedNavigation.currentLesson
                    ? "In progress"
                    : "Complete"}
                </span>
              </header>

              <div className="unit-progress">
                <div
                  style={{
                    width: `${Math.min(
                      100,
                      (selectedNavigation.actualDays /
                        Math.max(selectedNavigation.plannedDays, 1)) *
                        100,
                    )}%`,
                  }}
                />
              </div>

              <p className="progress-caption">
                {selectedNavigation.actualDays} of{" "}
                {selectedNavigation.plannedDays} days used
              </p>

              {renderLessonTable(selectedNavigation.currentUnitLessons)}

              <div className="bottom-strip">
                <div>
                  <span>Pacing</span>
                  <strong>{formatVariance(selectedStatus.variance)}</strong>
                </div>

                <div>
                  <span>Readiness</span>
                  <strong>
                    {selectedPrepareNext.missingResourceCount === 0
                      ? "Ready"
                      : `${selectedPrepareNext.missingResourceCount} missing links`}
                  </strong>
                </div>

                <div>
                  <span>Coming Next</span>
                  <strong>
                    {selectedNavigation.nextLesson?.LessonTitle ??
                      "No next lesson"}
                  </strong>
                </div>
              </div>
            </section>
          )}

          {activeView === "units" && (
            <section className="workspace-panel">
              <h2>Units</h2>

              {courses.map((course) => {
                const courseUnits = units.filter(
                  (unit) => unit.CourseID === course.CourseID,
                );
                const projectedUnits = getProjectedUnits(
                  courseUnits,
                  schoolCalendar,
                );

                return (
                  <div className="timeline-course" key={course.CourseID}>
                    <h3>{course.CourseName}</h3>

                    <div className="timeline-row">
                      {projectedUnits.map((unit) => (
                        <button
                          className={
                            selectedUnit?.UnitID === unit.UnitID
                              ? "unit-block selected-unit"
                              : "unit-block"
                          }
                          key={unit.UnitID}
                          onClick={() => {
                            setSelectedCourseId(unit.CourseID);
                            setSelectedUnitId(unit.UnitID);
                          }}
                        >
                          <span>U{unit.UnitNumber}</span>
                          <strong>{unit.UnitTitle}</strong>
                          <small>{unit.RequiredDays}d</small>
                          <em>
                            {unit.projectedStart && unit.projectedEnd
                              ? `${formatDate(unit.projectedStart)}–${formatDate(
                                  unit.projectedEnd,
                                )}`
                              : "Pending"}
                          </em>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {selectedUnit && (
                <>
                  <div className="unit-header compact">
                    <div>
                      <h2>
                        {getCourseLabel(selectedUnit.CourseID)} — U
                        {selectedUnit.UnitNumber}
                      </h2>
                      <p>{selectedUnit.UnitTitle}</p>
                    </div>
                  </div>

                  {renderLessonTable(selectedUnitLessons)}
                </>
              )}
            </section>
          )}

          {activeView === "forecast" && (
            <section className="workspace-panel forecast-panel">
              <div className="forecast-header">
                <h2>Pacing Forecast</h2>
                <p>
                  A calm check on section pacing, buffer remaining, and whether
                  anything needs attention.
                </p>
              </div>

              <section className="forecast-section">
                <h3>Pacing Summary</h3>

                {sectionForecasts.length === 0 ? (
                  <p>No active sections are available for forecasting yet.</p>
                ) : (
                  <div className="forecast-summary-grid">
                    {sectionForecasts.map((forecast) => {
                      const section = forecast.section ?? {};
                      const state = forecast.state || "On Track";
                      const stateClass = state
                        .toLowerCase()
                        .replace(/\s+/g, "-");
                      const variance = Number(forecast.variance || 0);
                      const forecastShift = Number(forecast.forecastShift || 0);

                      return (
                        <article
                          className={`forecast-summary-card ${stateClass}`}
                          key={
                            section.SectionID ||
                            `${section.CourseID}-${section.Period}`
                          }
                        >
                          <span>
                            {getCourseLabel(section.CourseID)} · Period{" "}
                            {section.Period || "—"}
                          </span>

                          <strong>{state}</strong>

                          <p>
                            Lesson {forecast.currentLessonNumber || "—"} of{" "}
                            {forecast.totalLessons || "—"}
                          </p>

                          <p>
                            {variance === 0
                              ? "On pace."
                              : `${Math.abs(variance)} days ${
                                  variance > 0 ? "behind" : "ahead"
                                }.`}
                          </p>

                          <p>
                            {forecastShift === 0
                              ? "Future units stay on schedule."
                              : `Future units begin ${Math.abs(
                                  forecastShift,
                                )} days ${forecastShift > 0 ? "later" : "earlier"}.`}
                          </p>

                          <p>
                            {forecast.bufferRemaining || 0} of{" "}
                            {forecast.bufferDays || 0} buffer days remaining.
                          </p>

                          <em>
                            {forecast.recoverabilityMessage ||
                              "No action needed."}
                          </em>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </section>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;
