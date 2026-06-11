import { useEffect, useState } from "react";
import "./App.css";
import { fetchPlannerData } from "./api";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });
}

function getProjectedUnits(courseUnits, schoolCalendar) {
  const schoolDays = schoolCalendar.filter((day) => day.DayType === "School");

  let cursor = 0;

  return courseUnits.map((unit) => {
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

function getCourseStatus(courseId, lessons, dailyProgress) {
  const courseLessons = lessons
    .filter((lesson) => lesson.CourseID === courseId)
    .sort((a, b) => Number(a.SortOrder) - Number(b.SortOrder));

  const courseProgress = dailyProgress.filter(
    (entry) => entry.CourseID === courseId,
  );

  const completedLessonIds = new Set(
    courseProgress
      .filter((entry) => entry.Finished)
      .map((entry) => entry.LessonID),
  );

  const actualDays = courseProgress.reduce(
    (sum, entry) => sum + Number(entry.DayFraction || 0),
    0,
  );

  const completedLessons = courseLessons.filter((lesson) =>
    completedLessonIds.has(lesson.LessonID),
  );

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

function formatVariance(variance) {
  if (variance === 0) return "On pace";

  const absoluteValue = Math.abs(variance);
  const dayLabel = absoluteValue === 1 ? "day" : "days";

  return variance > 0
    ? `${absoluteValue} ${dayLabel} behind pace`
    : `${absoluteValue} ${dayLabel} ahead of pace`;
}

function formatForecastShift(variance) {
  if (variance === 0) return "No forecast shift.";

  const absoluteValue = Math.abs(variance);
  const dayLabel = absoluteValue === 1 ? "day" : "days";
  const direction = variance > 0 ? "later" : "earlier";

  return `Future unit dates shift ${absoluteValue} instructional ${dayLabel} ${direction}.`;
}

function formatVarianceCompact(variance) {
  if (variance === 0) return "On plan";

  const absoluteValue = Math.abs(variance);
  const dayLabel = absoluteValue === 1 ? "day" : "days";

  return variance > 0
    ? `+${absoluteValue} ${dayLabel}`
    : `-${absoluteValue} ${dayLabel}`;
}

function getDateKey(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function shiftByInstructionalDays(dateValue, schoolCalendar, shiftDays) {
  if (!dateValue || shiftDays === 0) {
    return dateValue;
  }

  const schoolDays = schoolCalendar.filter((day) => day.DayType === "School");
  const dateKey = getDateKey(dateValue);

  const currentIndex = schoolDays.findIndex(
    (day) => getDateKey(day.Date) === dateKey,
  );

  if (currentIndex < 0) {
    return null;
  }

  const shiftedIndex = currentIndex + shiftDays;

  if (shiftedIndex < 0 || shiftedIndex >= schoolDays.length) {
    return null;
  }

  return schoolDays[shiftedIndex].Date;
}

function getCourseProjectedUnits(courseId, units, schoolCalendar) {
  const courseUnits = units
    .filter((unit) => unit.CourseID === courseId)
    .sort((a, b) => Number(a.SortOrder) - Number(b.SortOrder));

  return getProjectedUnits(courseUnits, schoolCalendar);
}

function App() {
  const [plannerData, setPlannerData] = useState(null);
  const [status, setStatus] = useState("Loading planner data...");
  const [selectedUnitId, setSelectedUnitId] = useState(null);

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

  const getRequiredDays = (courseUnits) =>
    courseUnits.reduce((sum, unit) => sum + Number(unit.RequiredDays || 0), 0);

  const getOptionalDays = (courseUnits) =>
    courseUnits.reduce((sum, unit) => sum + Number(unit.OptionalDays || 0), 0);

  const math8RequiredDays = getRequiredDays(math8Units);
  const math1RequiredDays = getRequiredDays(math1Units);

  const math8OptionalDays = getOptionalDays(math8Units);
  const math1OptionalDays = getOptionalDays(math1Units);

  const math8Remaining = instructionalDays - math8RequiredDays;
  const math1Remaining = instructionalDays - math1RequiredDays;

  const math8Status = getCourseStatus("M8", lessons, dailyProgress);
  const math1Status = getCourseStatus("IM1", lessons, dailyProgress);

  const selectedUnit = units.find((unit) => unit.UnitID === selectedUnitId);

  const selectedUnitLessons = lessons
    .filter((lesson) => lesson.UnitID === selectedUnitId)
    .sort((a, b) => Number(a.SortOrder) - Number(b.SortOrder));

  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="eyebrow">2026–2027</p>
          <h1>Year Planner</h1>
          <p className="subtitle">
            Curriculum timeline for Math 8 and Integrated Math 1
          </p>
        </div>
      </header>

      <section className="cards">
        <div className="card">
          <p>Total instructional days</p>
          <h2>{instructionalDays || "—"}</h2>
        </div>

        <div className="card course-metric">
          <p>Math 8</p>
          <h2>{math8RequiredDays || "—"}</h2>
          <span>
            {math8OptionalDays} optional • {math8Remaining} buffer
          </span>
        </div>

        <div className="card course-metric">
          <p>Math 1</p>
          <h2>{math1RequiredDays || "—"}</h2>
          <span>
            {math1OptionalDays} optional • {math1Remaining} buffer
          </span>
        </div>
      </section>

      <section className="panel">
        <h2>Current Status</h2>

        <div className="cards">
          <div className="card course-status">
            <p>Math 8</p>
            <h3>{math8Status.currentLesson?.LessonTitle ?? "Complete"}</h3>
            <span>{math8Status.completedCount} lessons completed</span>
            <span>
              {math8Status.plannedDaysCompleted} planned days completed
            </span>
            <span>{math8Status.actualDays} actual days used</span>
            <strong>{formatVariance(math8Status.variance)}</strong>
          </div>

          <div className="card course-status">
            <p>Integrated Math 1</p>
            <h3>{math1Status.currentLesson?.LessonTitle ?? "Complete"}</h3>
            <span>{math1Status.completedCount} lessons completed</span>
            <span>
              {math1Status.plannedDaysCompleted} planned days completed
            </span>
            <span>{math1Status.actualDays} actual days used</span>
            <strong>{formatVariance(math1Status.variance)}</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Forecast Preview</h2>

        <div className="cards">
          <div className="card course-status">
            <p>Math 8</p>
            <h3>{formatVariance(math8Status.variance)}</h3>
            <span>{formatForecastShift(math8Status.variance)}</span>
          </div>

          <div className="card course-status">
            <p>Integrated Math 1</p>
            <h3>{formatVariance(math1Status.variance)}</h3>
            <span>{formatForecastShift(math1Status.variance)}</span>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Timeline Dashboard</h2>

        {courses.map((course) => {
          const courseUnits = units
            .filter((unit) => unit.CourseID === course.CourseID)
            .sort((a, b) => Number(a.SortOrder) - Number(b.SortOrder));

          const projectedUnits = getProjectedUnits(courseUnits, schoolCalendar);
          const totalDays = getRequiredDays(courseUnits);
          const optionalDays = getOptionalDays(courseUnits);

          return (
            <div className="timeline-course" key={course.CourseID}>
              <div className="timeline-header">
                <div>
                  <h3>{course.CourseName}</h3>
                  <p className="timeline-meta">
                    {totalDays} required • {optionalDays} optional
                  </p>
                </div>
              </div>

              <div className="timeline-row">
                {projectedUnits.map((unit) => {
                  const requiredDays = Number(unit.RequiredDays || 0);
                  const hasProjectedDates =
                    unit.projectedStart && unit.projectedEnd;

                  return (
                    <div
                      className={
                        selectedUnitId === unit.UnitID
                          ? "unit-block selected-unit"
                          : "unit-block"
                      }
                      key={unit.UnitID}
                      style={{ flexGrow: requiredDays }}
                      title={`${unit.UnitTitle}: ${requiredDays} days`}
                      onClick={() => setSelectedUnitId(unit.UnitID)}
                    >
                      <span>U{unit.UnitNumber}</span>
                      <strong>{unit.UnitTitle}</strong>
                      <small>{requiredDays}d</small>

                      <em
                        className={
                          hasProjectedDates ? "date-pill" : "date-pill pending"
                        }
                      >
                        {hasProjectedDates
                          ? `${formatDate(unit.projectedStart)}–${formatDate(
                              unit.projectedEnd,
                            )}`
                          : "Pending"}
                      </em>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {selectedUnit && (
        <section className="panel">
          <h2>Unit Detail</h2>

          {(() => {
            const unitLessons = lessons.filter(
              (lesson) => lesson.UnitID === selectedUnit.UnitID,
            );

            const plannedDays = unitLessons.reduce(
              (sum, lesson) => sum + Number(lesson.PlannedDays || 0),
              0,
            );

            const actualDays = unitLessons.reduce((sum, lesson) => {
              const entries = dailyProgress.filter(
                (entry) => entry.LessonID === lesson.LessonID,
              );

              return (
                sum +
                entries.reduce(
                  (entrySum, entry) =>
                    entrySum + Number(entry.DayFraction || 0),
                  0,
                )
              );
            }, 0);

            const variance = actualDays - plannedDays;

            const unitFinished =
              unitLessons.length > 0 &&
              unitLessons.every((lesson) =>
                dailyProgress.some(
                  (entry) =>
                    entry.LessonID === lesson.LessonID && entry.Finished,
                ),
              );

            const varianceText = unitFinished
              ? formatVariance(variance)
              : "In Progress";

            const forecastImpactText =
              unitLessons.length === 0
                ? "No lesson data yet."
                : unitFinished
                  ? formatForecastShift(variance)
                  : `Unit in progress: ${actualDays} of ${plannedDays} planned days used.`;

            const selectedCourseProjectedUnits = getCourseProjectedUnits(
              selectedUnit.CourseID,
              units,
              schoolCalendar,
            );

            const selectedProjectedUnitIndex =
              selectedCourseProjectedUnits.findIndex(
                (unit) => unit.UnitID === selectedUnit.UnitID,
              );

            const impactedUnits =
              selectedProjectedUnitIndex >= 0
                ? selectedCourseProjectedUnits.slice(
                    selectedProjectedUnitIndex + 1,
                    selectedProjectedUnitIndex + 4,
                  )
                : [];

            return (
              <>
                <div className="unit-summary">
                  <div className="summary-card">
                    <p>Planned Days</p>
                    <h3>{plannedDays}</h3>
                  </div>

                  <div className="summary-card">
                    <p>Actual Days</p>
                    <h3>{actualDays}</h3>
                  </div>

                  <div className="summary-card">
                    <p>Status</p>
                    <h3>{varianceText}</h3>
                  </div>

                  <div className="summary-card forecast-impact-card">
                    <p>Forecast Impact</p>
                    <h3>{forecastImpactText}</h3>
                  </div>
                </div>

                {unitFinished && variance !== 0 && impactedUnits.length > 0 && (
                  <div className="future-impact-panel">
                    <h3>Future Impact</h3>

                    <p>
                      If this unit&apos;s pacing holds, the next units in this
                      course move by{" "}
                      <strong>{formatVarianceCompact(variance)}</strong>.
                    </p>

                    <div className="impact-list">
                      {impactedUnits.map((unit) => {
                        const shiftedStart = shiftByInstructionalDays(
                          unit.projectedStart,
                          schoolCalendar,
                          variance,
                        );

                        const shiftedEnd = shiftByInstructionalDays(
                          unit.projectedEnd,
                          schoolCalendar,
                          variance,
                        );

                        return (
                          <div className="impact-row" key={unit.UnitID}>
                            <strong>
                              U{unit.UnitNumber}: {unit.UnitTitle}
                            </strong>

                            <span>
                              {formatDate(unit.projectedStart)}–
                              {formatDate(unit.projectedEnd)} →{" "}
                              {shiftedStart && shiftedEnd
                                ? `${formatDate(shiftedStart)}–${formatDate(
                                    shiftedEnd,
                                  )}`
                                : "outside calendar"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          <div className="unit-detail-header">
            <div>
              <h3>
                {selectedUnit.CourseID} — U{selectedUnit.UnitNumber}
              </h3>
              <p>{selectedUnit.UnitTitle}</p>
            </div>

            <button
              className="clear-selection"
              onClick={() => setSelectedUnitId(null)}
            >
              Close
            </button>
          </div>

          <div className="lesson-list">
            {selectedUnitLessons.length === 0 ? (
              <p className="empty-message">
                No lessons entered for this unit yet.
              </p>
            ) : (
              selectedUnitLessons.map((lesson) => {
                const lessonProgress = dailyProgress.filter(
                  (entry) => entry.LessonID === lesson.LessonID,
                );

                const actualDays = lessonProgress.reduce(
                  (sum, entry) => sum + Number(entry.DayFraction || 0),
                  0,
                );

                const isFinished = lessonProgress.some(
                  (entry) => entry.Finished,
                );

                const lessonVariance =
                  actualDays - Number(lesson.PlannedDays || 0);

                return (
                  <div className="lesson-row" key={lesson.LessonID}>
                    <strong>
                      Lesson {lesson.LessonNumber}: {lesson.LessonTitle}
                    </strong>

                    <p>
                      Planned: {lesson.PlannedDays} day
                      {Number(lesson.PlannedDays) === 1 ? "" : "s"} • Actual:{" "}
                      {actualDays || "—"} day
                      {actualDays === 1 ? "" : "s"} • Variance:{" "}
                      {actualDays
                        ? formatVarianceCompact(lessonVariance)
                        : "Not started"}
                    </p>

                    {lesson.KeyOutcome && (
                      <p>
                        <strong>Outcome:</strong> {lesson.KeyOutcome}
                      </p>
                    )}

                    {lesson.Description && (
                      <p>
                        <strong>Description:</strong> {lesson.Description}
                      </p>
                    )}

                    {lesson.TeacherNotes && (
                      <p>
                        <strong>Notes:</strong> {lesson.TeacherNotes}
                      </p>
                    )}

                    {lesson.PrimaryLink && (
                      <p>
                        <a
                          href={lesson.PrimaryLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open lesson resource
                        </a>
                      </p>
                    )}

                    <span
                      className={isFinished ? "lesson-done" : "lesson-open"}
                    >
                      {isFinished ? "Complete" : "Upcoming"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}
    </main>
  );
}

export default App;
