import { useEffect, useState } from "react";
import "./App.css";
import ApplicationShell from "./components/ApplicationShell";
import WorkspaceHost from "./components/WorkspaceHost";
import { buildForecastModel } from "./utils/forecastModel";
import { getPlanningModel } from "./utils/planningModel";
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
  reorderLessons,
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

function isSectionActive(section) {
  const activeValue = section.Active;
  return activeValue === undefined || activeValue === "" || isTrue(activeValue);
}

function getSectionsForCourse(courseId, sections) {
  return sections
    .filter((section) => section.CourseID === courseId && isSectionActive(section))
    .sort((a, b) => Number(a.SortOrder || 999) - Number(b.SortOrder || 999));
}

// Planning shows the full teaching-day period structure (every active
// section across every course), independent of whichever course is
// selected elsewhere in the app.
function getPlanningSections(sections) {
  return sections
    .filter(isSectionActive)
    .sort((a, b) => Number(a.Period || 999) - Number(b.Period || 999));
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

function App() {
  const [plannerData, setPlannerData] = useState(null);
  const [status, setStatus] = useState("Loading planner data...");
  const [activeView, setActiveView] = useState("planning");
  const [timeLens, setTimeLens] = useState("school");
  const [selectedCourseId, setSelectedCourseId] = useState("M8");
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [progressInputs, setProgressInputs] = useState({});
  const [savingLessonId, setSavingLessonId] = useState(null);
  const [activeProgressLessonId, setActiveProgressLessonId] = useState(null);
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [isAddingLessonSaving, setIsAddingLessonSaving] = useState(false);
  const [newLesson, setNewLesson] = useState({
    lessonTitle: "",
    plannedDays: 1,
    keyOutcomes: [""],
  });
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [editLessonDraft, setEditLessonDraft] = useState(null);
  const [deletingLessonId, setDeletingLessonId] = useState(null);
  const [reorderingUnitId, setReorderingUnitId] = useState(null);
  const [planningReferenceDate, setPlanningReferenceDate] = useState(new Date());
  const [planningSelectedDayKey, setPlanningSelectedDayKey] = useState(null);
  const [activeLessonContext, setActiveLessonContext] = useState(null);

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

  const planningSections = getPlanningSections(sections);

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

  const planningNavigationByCourse = {
    M8: math8Navigation,
    IM1: math1Navigation,
  };

  const planningModel = getPlanningModel({
    planningSections,
    planningNavigationByCourse,
    selectedCourseId,
    units,
    lessons,
    schoolCalendar,
    schedulePatterns,
    referenceDate: planningReferenceDate,
  });

  const forecastWorkspaceModel = buildForecastModel({
    sections,
    units,
    lessons,
    dailyProgress,
    getProgressForSection,
  });

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
    const unitLessons = sortLessons(
      lessons.filter((entry) => entry.UnitID === lesson.UnitID),
      units,
    );
    const currentPosition =
      unitLessons.findIndex((entry) => entry.LessonID === lesson.LessonID) + 1;

    setEditingLessonId(lesson.LessonID);
    setEditLessonDraft({
      lessonTitle: lesson.LessonTitle || "",
      plannedDays: lesson.PlannedDays || 1,
      goals: getOutcomeList(lesson.KeyOutcome).length
        ? getOutcomeList(lesson.KeyOutcome)
        : [""],
      primaryLink: lesson.PrimaryLink || "",
      teacherNotes: lesson.TeacherNotes || "",
      targetPosition: currentPosition > 0 ? currentPosition : 1,
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

      const progressDate = new Date().toISOString();

      const newProgressEntries = targetSections.map((section) => ({
        Date: progressDate,
        CourseSectionID: section.SectionID,
        CourseID: lesson.CourseID,
        UnitID: lesson.UnitID,
        LessonID: lesson.LessonID,
        DayFraction: Number(input.dayFraction || 0),
        Finished: Boolean(input.finished),
        Notes: input.notes || "",
      }));

      await Promise.all(
        newProgressEntries.map((entry) =>
          saveDailyProgress({
            date: entry.Date,
            courseSectionId: entry.CourseSectionID,
            courseId: entry.CourseID,
            unitId: entry.UnitID,
            lessonId: entry.LessonID,
            dayFraction: entry.DayFraction,
            finished: entry.Finished,
            notes: entry.Notes,
          }),
        ),
      );

      setPlannerData((prev) => ({
        ...prev,
        dailyProgress: [...(prev?.dailyProgress || []), ...newProgressEntries],
      }));

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
    if (isAddingLessonSaving) return;

    if (!selectedUnit || !newLesson.lessonTitle.trim()) {
      alert("Please enter a lesson title.");
      return;
    }

    setIsAddingLessonSaving(true);

    const courseId = selectedUnit.CourseID;
    const unitId = selectedUnit.UnitID;
    const lessonTitle = newLesson.lessonTitle.trim();
    const plannedDays = Number(newLesson.plannedDays || 1);
    const keyOutcome = newLesson.keyOutcomes
      .map((goal) => goal.trim())
      .filter(Boolean)
      .join("|");
    const primaryLink = "";
    const provisionalLessonNumber = selectedUnitLessons.length + 1;

    const temporaryLesson = {
      LessonID: `temp-${Date.now()}`,
      CourseID: courseId,
      UnitID: unitId,
      LessonNumber: provisionalLessonNumber,
      SortOrder: provisionalLessonNumber,
      LessonTitle: lessonTitle,
      PlannedDays: plannedDays,
      KeyOutcome: keyOutcome,
      PrimaryLink: primaryLink,
      TeacherNotes: "",
    };

    setPlannerData((prev) => ({
      ...prev,
      lessons: [...prev.lessons, temporaryLesson],
    }));

    setNewLesson({
      lessonTitle: "",
      plannedDays: 1,
      keyOutcomes: [""],
    });

    setIsAddingLesson(false);

    try {
      const createdLesson = await addLesson({
        courseId,
        unitId,
        lessonTitle,
        plannedDays,
        keyOutcome,
        primaryLink,
      });

      setPlannerData((prev) => ({
        ...prev,
        lessons: prev.lessons.map((lesson) =>
          lesson.LessonID === temporaryLesson.LessonID
            ? createdLesson
            : lesson,
        ),
      }));
    } catch (error) {
      console.error(error);

      setPlannerData((prev) => ({
        ...prev,
        lessons: prev.lessons.filter(
          (lesson) => lesson.LessonID !== temporaryLesson.LessonID,
        ),
      }));

      alert("Could not add lesson.");
    } finally {
      setIsAddingLessonSaving(false);
    }
  }

  async function handleDeleteLesson(lesson) {
    if (deletingLessonId === lesson.LessonID) return;

    const confirmed = window.confirm(`Delete "${lesson.LessonTitle}"?`);

    if (!confirmed) return;

    const lessonId = lesson.LessonID;

    setEditingLessonId(null);
    setEditLessonDraft(null);

    const unitLessons = sortLessons(
      lessons.filter((entry) => entry.UnitID === lesson.UnitID),
      units,
    );

    const remainingUnitLessons = unitLessons.filter(
      (entry) => entry.LessonID !== lessonId,
    );

    const renumberedById = new Map(
      remainingUnitLessons.map((entry, index) => [
        entry.LessonID,
        { ...entry, SortOrder: index + 1, LessonNumber: index + 1 },
      ]),
    );

    if (lessonId.startsWith("temp-")) {
      setPlannerData((prev) => ({
        ...prev,
        lessons: prev.lessons
          .filter((entry) => entry.LessonID !== lessonId)
          .map((entry) => renumberedById.get(entry.LessonID) ?? entry),
      }));
      return;
    }

    const originalIndex = plannerData.lessons.findIndex(
      (entry) => entry.LessonID === lessonId,
    );
    const deletedLesson = plannerData.lessons[originalIndex];

    setDeletingLessonId(lessonId);

    setPlannerData((prev) => ({
      ...prev,
      lessons: prev.lessons
        .filter((entry) => entry.LessonID !== lessonId)
        .map((entry) => renumberedById.get(entry.LessonID) ?? entry),
    }));

    try {
      await deleteLesson({
        lessonId,
      });
    } catch (error) {
      console.error(error);

      const originalById = new Map(
        unitLessons.map((entry) => [entry.LessonID, entry]),
      );

      setPlannerData((prev) => {
        const lessons = prev.lessons.map(
          (entry) => originalById.get(entry.LessonID) ?? entry,
        );
        const insertAt = Math.min(originalIndex, lessons.length);
        lessons.splice(insertAt, 0, deletedLesson);
        return { ...prev, lessons };
      });

      alert("Could not delete lesson.");
    } finally {
      setDeletingLessonId(null);
    }
  }

  async function handleMoveLessonToPosition(lesson, targetPosition) {
    if (lesson.LessonID.startsWith("temp-")) {
      alert("Could not move lesson.");
      return;
    }

    if (reorderingUnitId === lesson.UnitID) return;

    const unitLessons = sortLessons(
      lessons.filter((entry) => entry.UnitID === lesson.UnitID),
      units,
    );

    const targetPositionNumber = Number(targetPosition);

    if (
      !Number.isInteger(targetPositionNumber) ||
      targetPositionNumber < 1 ||
      targetPositionNumber > unitLessons.length
    ) {
      alert("Could not move lesson.");
      return;
    }

    const currentIndex = unitLessons.findIndex(
      (entry) => entry.LessonID === lesson.LessonID,
    );

    if (currentIndex === -1 || currentIndex === targetPositionNumber - 1) return;

    const previousUnitLessons = unitLessons;

    const reordered = unitLessons.filter(
      (entry) => entry.LessonID !== lesson.LessonID,
    );
    reordered.splice(targetPositionNumber - 1, 0, lesson);

    const renumberedById = new Map(
      reordered.map((entry, index) => [
        entry.LessonID,
        { ...entry, SortOrder: index + 1, LessonNumber: index + 1 },
      ]),
    );

    setPlannerData((prev) => ({
      ...prev,
      lessons: prev.lessons.map(
        (entry) => renumberedById.get(entry.LessonID) ?? entry,
      ),
    }));

    setReorderingUnitId(lesson.UnitID);

    try {
      await reorderLessons({
        unitId: lesson.UnitID,
        orderedLessonIds: reordered.map((entry) => entry.LessonID),
      });
    } catch (error) {
      console.error(error);

      const previousById = new Map(
        previousUnitLessons.map((entry) => [entry.LessonID, entry]),
      );

      setPlannerData((prev) => ({
        ...prev,
        lessons: prev.lessons.map(
          (entry) => previousById.get(entry.LessonID) ?? entry,
        ),
      }));

      alert("Could not move lesson.");
    } finally {
      setReorderingUnitId(null);
    }
  }

  async function handleUpdateLesson(lesson) {
    if (!editLessonDraft.lessonTitle.trim()) {
      alert("Please enter a lesson title.");
      return;
    }

    const lessonTitle = editLessonDraft.lessonTitle.trim();
    const plannedDays = Number(editLessonDraft.plannedDays || 1);
    const keyOutcome = editLessonDraft.goals
      .map((goal) => goal.trim())
      .filter(Boolean)
      .join("|");
    const primaryLink = editLessonDraft.primaryLink || "";
    const teacherNotes = editLessonDraft.teacherNotes || "";

    const originalLesson = { ...lesson };

    setPlannerData((prev) => ({
      ...prev,
      lessons: prev.lessons.map((entry) =>
        entry.LessonID === lesson.LessonID
          ? {
              ...entry,
              LessonTitle: lessonTitle,
              PlannedDays: plannedDays,
              KeyOutcome: keyOutcome,
              PrimaryLink: primaryLink,
              TeacherNotes: teacherNotes,
            }
          : entry,
      ),
    }));

    setEditingLessonId(null);
    setEditLessonDraft(null);

    try {
      await updateLesson({
        lessonId: lesson.LessonID,
        lessonTitle,
        plannedDays,
        keyOutcome,
        primaryLink,
        teacherNotes,
      });
    } catch (error) {
      console.error(error);
      setPlannerData((prev) => ({
        ...prev,
        lessons: prev.lessons.map((entry) =>
          entry.LessonID === originalLesson.LessonID ? originalLesson : entry,
        ),
      }));
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

  const unitsWorkspaceModel = {
    courses,
    units,
    schoolCalendar,
    getProjectedUnits,
    selectedCourseId,
    selectedUnit,
    selectedUnitLessons,
    setSelectedCourseId,
    setSelectedUnitId,
    getCourseLabel,
    selectedDailyProgress,
    selectedNavigation,
    activeProgressLessonId,
    progressInputs,
    setProgressInputs,
    setActiveProgressLessonId,
    handleLogProgress,
    editingLessonId,
    editLessonDraft,
    setEditLessonDraft,
    setEditingLessonId,
    startEditingLesson,
    updateGoal,
    removeGoal,
    addGoal,
    handleUpdateLesson,
    handleMoveLessonToPosition,
    reorderingUnitId,
    handleDeleteLesson,
    isAddingLesson,
    setIsAddingLesson,
    isAddingLessonSaving,
    newLesson,
    setNewLesson,
    updateNewLessonGoal,
    addNewLessonGoal,
    removeNewLessonGoal,
    handleAddLesson,
    getLessonProgress,
    getOutcomeList,
    formatVarianceCompact,
    formatDate,
  };

  const planningWorkspaceModel = {
    planningModel,
    curriculumLessons: lessons,
    courseLabel: getCourseLabel(selectedCourseId),
    selectedDayKey: planningSelectedDayKey,
    onSelectDay: setPlanningSelectedDayKey,
    activeLessonContext,
    onOpenLessonSession: (lessonSessionContext) => {
      setActiveLessonContext(lessonSessionContext);
      setActiveView("lesson");
    },
    onPreviousWeek: () => setPlanningReferenceDate(planningModel.previousWeekDate),
    onNextWeek: () => setPlanningReferenceDate(planningModel.nextWeekDate),
    onJumpToToday: () => setPlanningReferenceDate(new Date()),
  };

  const curriculumLessons = activeLessonContext?.unitId
    ? lessons
        .filter(
          (lesson) => lesson.UnitID === activeLessonContext.unitId,
        )
        .sort(
          (a, b) =>
            Number(a.SortOrder || a.LessonNumber || 0) -
            Number(b.SortOrder || b.LessonNumber || 0),
        )
    : [];

  const lessonSessionCopyTargets = Object.values(
    planningModel.sessions,
  ).filter(
    (session) =>
      session.dayKey === activeLessonContext?.date &&
      session.sectionId !== activeLessonContext?.sectionId,
  );

  // "Bump" targets are later meetings of the *same* section — the only
  // sessions a Teaching Episode can be moved forward into within this
  // planning window.
  const lessonSessionBumpTargets = Object.values(planningModel.sessions)
    .filter(
      (session) =>
        session.sectionId === activeLessonContext?.sectionId &&
        session.dayKey > (activeLessonContext?.date ?? ""),
    )
    .sort((a, b) => (a.dayKey < b.dayKey ? -1 : a.dayKey > b.dayKey ? 1 : 0));

  const activeSession = activeLessonContext?.sessionId
    ? planningModel.sessions[activeLessonContext.sessionId]
    : null;

  const lessonSessionWorkspaceModel = {
    activeLessonContext,
    curriculumLessons,
    copyTargets: lessonSessionCopyTargets,
    bumpTargets: lessonSessionBumpTargets,
    getOutcomeList,
    courseLabel: getCourseLabel(selectedCourseId),
    unitLabel: activeSession?.unitLabel ?? "",
  };

  return (
    <main className="app">
      <section className="planner-shell">
        <ApplicationShell
          status={status}
          activeView={activeView}
          setActiveView={setActiveView}
        >
          <WorkspaceHost
            activeView={activeView}
            unitsWorkspaceModel={unitsWorkspaceModel}
            forecastWorkspaceModel={forecastWorkspaceModel}
            planningWorkspaceModel={planningWorkspaceModel}
            lessonSessionWorkspaceModel={lessonSessionWorkspaceModel}
          />
        </ApplicationShell>
      </section>
    </main>
  );
}

export default App;
