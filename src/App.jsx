import { useEffect, useState } from "react";
import "./App.css";
import { fetchPlannerData, saveDailyProgress } from "./api";

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
  const schoolDays = schoolCalendar.filter((day) => day.DayType === "School");
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

function App() {
  const [plannerData, setPlannerData] = useState(null);
  const [status, setStatus] = useState("Loading planner data...");
  const [activeView, setActiveView] = useState("today");
  const [timeLens, setTimeLens] = useState("school");
  const [selectedCourseId, setSelectedCourseId] = useState("M8");
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [progressInputs, setProgressInputs] = useState({});
  const [savingLessonId, setSavingLessonId] = useState(null);
  const [activeProgressLessonId, setActiveProgressLessonId] = useState(null);

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
  const lessons = plannerData?.lessons ?? [];
  const dailyProgress = plannerData?.dailyProgress ?? [];

  const instructionalDays = schoolCalendar.filter(
    (day) => day.DayType === "School",
  ).length;

  const math8Units = units.filter((unit) => unit.CourseID === "M8");
  const math1Units = units.filter((unit) => unit.CourseID === "IM1");

  const math8RequiredDays = getRequiredDays(math8Units);
  const math1RequiredDays = getRequiredDays(math1Units);
  const math8OptionalDays = getOptionalDays(math8Units);
  const math1OptionalDays = getOptionalDays(math1Units);

  const math8Status = getCourseStatus("M8", units, lessons, dailyProgress);
  const math1Status = getCourseStatus("IM1", units, lessons, dailyProgress);

  const math8Navigation = getCourseNavigation(
    "M8",
    units,
    lessons,
    dailyProgress,
  );

  const math1Navigation = getCourseNavigation(
    "IM1",
    units,
    lessons,
    dailyProgress,
  );

  const math8PrepareNext = getPrepareNext("M8", units, lessons, dailyProgress);
  const math1PrepareNext = getPrepareNext("IM1", units, lessons, dailyProgress);

  const actualDaysLogged = math8Status.actualDays + math1Status.actualDays;
  const curriculumDaysPlanned = math8RequiredDays + math1RequiredDays;

  const timeLensInfo = {
    school: {
      label: "School calendar loaded",
      value: instructionalDays || "—",
      unit: "days",
      bar: Math.min(100, ((instructionalDays || 0) / 180) * 100),
    },
    curriculum: {
      label: "Curriculum days planned",
      value: curriculumDaysPlanned || "—",
      unit: "days",
      bar: Math.min(100, (curriculumDaysPlanned / 273) * 100),
    },
    actual: {
      label: "Actual days logged",
      value: actualDaysLogged || "—",
      unit: "days",
      bar: Math.min(100, (actualDaysLogged / 273) * 100),
    },
  }[timeLens];

  const selectedNavigation =
    selectedCourseId === "IM1" ? math1Navigation : math8Navigation;

  const selectedStatus = selectedCourseId === "IM1" ? math1Status : math8Status;

  const selectedPrepareNext =
    selectedCourseId === "IM1" ? math1PrepareNext : math8PrepareNext;

  const selectedUnit =
    units.find((unit) => unit.UnitID === selectedUnitId) ??
    selectedNavigation.currentUnit;

  const selectedUnitLessons = selectedUnit
    ? sortLessons(
        lessons.filter((lesson) => lesson.UnitID === selectedUnit.UnitID),
        units,
      )
    : [];

  async function handleLogProgress(lesson) {
    try {
      setSavingLessonId(lesson.LessonID);

      const input = progressInputs[lesson.LessonID] || {};

      await saveDailyProgress({
        date: new Date().toISOString(),
        courseId: lesson.CourseID,
        unitId: lesson.UnitID,
        lessonId: lesson.LessonID,
        dayFraction: Number(input.dayFraction || 1),
        finished: Boolean(input.finished),
        notes: "",
      });

      const refreshedData = await fetchPlannerData();
      setPlannerData(refreshedData);
      setActiveProgressLessonId(null);
    } catch (error) {
      console.error(error);
      alert("Could not save progress.");
    } finally {
      setSavingLessonId(null);
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
            dailyProgress,
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

                <p>
                  {outcomes[0] ?? lesson.Description ?? "No outcome entered."}
                </p>

                {activeProgressLessonId === lesson.LessonID && (
                  <div className="lesson-progress-entry">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="Days"
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
                      Complete
                    </label>

                    <button
                      onClick={() => handleLogProgress(lesson)}
                      disabled={savingLessonId === lesson.LessonID}
                    >
                      {savingLessonId === lesson.LessonID
                        ? "Saving..."
                        : "Save"}
                    </button>

                    <button
                      className="secondary-button"
                      onClick={() => setActiveProgressLessonId(null)}
                      disabled={savingLessonId === lesson.LessonID}
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

              <button
                className="log-button"
                onClick={() => setActiveProgressLessonId(lesson.LessonID)}
              >
                Log
              </button>
            </div>
          );
        })}
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
            <section className="workspace-panel">
              <h2>Forecast</h2>

              <div className="forecast-grid">
                <div className="forecast-card">
                  <span>Math 8</span>
                  <strong>{formatVariance(math8Status.variance)}</strong>
                  <p>{formatForecastShift(math8Status.variance)}</p>
                  <small>
                    {math8RequiredDays} required · {math8OptionalDays} optional
                  </small>
                </div>

                <div className="forecast-card">
                  <span>Math 1</span>
                  <strong>{formatVariance(math1Status.variance)}</strong>
                  <p>{formatForecastShift(math1Status.variance)}</p>
                  <small>
                    {math1RequiredDays} required · {math1OptionalDays} optional
                  </small>
                </div>
              </div>
            </section>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;
