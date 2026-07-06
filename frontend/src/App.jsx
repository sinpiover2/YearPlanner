import { useEffect, useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import ApplicationShell from "./components/ApplicationShell";
import WorkspaceHost from "./components/WorkspaceHost";
import { buildForecastModel } from "./utils/forecastModel";
import { getTodayModel } from "./utils/todayModel";
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
    getProgressForSection,
    getCourseNavigation,
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

  const todayWorkspaceModel = {
    todayModel,
  };

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
    handleMoveLesson,
    handleDeleteLesson,
    isAddingLesson,
    setIsAddingLesson,
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

  const teacherDeskWorkspaceModel = {};
  const lessonSessionWorkspaceModel = {};
  const planningWorkspaceModel = {};

  return (
    <main className="app">
      <section className="planner-shell">
        <Sidebar
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

        <ApplicationShell
          status={status}
          activeView={activeView}
          setActiveView={setActiveView}
        >
          <WorkspaceHost
            activeView={activeView}
            todayWorkspaceModel={todayWorkspaceModel}
            unitsWorkspaceModel={unitsWorkspaceModel}
            forecastWorkspaceModel={forecastWorkspaceModel}
            teacherDeskWorkspaceModel={teacherDeskWorkspaceModel}
            lessonSessionWorkspaceModel={lessonSessionWorkspaceModel}
            planningWorkspaceModel={planningWorkspaceModel}
          />
        </ApplicationShell>
      </section>
    </main>
  );
}

export default App;
