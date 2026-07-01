import { useEffect, useState } from "react";
import LessonTable from "./LessonTable";

function getUnitPurpose(unit) {
  return [unit?.Purpose, unit?.UnitPurpose, unit?.purpose, unit?.unitPurpose]
    .map((value) => String(value || "").trim())
    .find(Boolean);
}

function UnitsView({
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
}) {
  const activeCourse =
    courses.find((course) => course.CourseID === selectedCourseId) ??
    courses[0];

  const activeCourseUnits = activeCourse
    ? units.filter((unit) => unit.CourseID === activeCourse.CourseID)
    : [];

  const projectedUnits = getProjectedUnits(activeCourseUnits, schoolCalendar);

  const selectedUnitPurpose = getUnitPurpose(selectedUnit);

  const [showAllOutcomes, setShowAllOutcomes] = useState(false);

  useEffect(() => {
    setShowAllOutcomes(false);
  }, [selectedUnit?.UnitID]);

  const selectedUnitOutcomes = selectedUnit
    ? [
        ...new Set(
          selectedUnitLessons
            .flatMap((lesson) => getOutcomeList(lesson.KeyOutcome))
            .map((outcome) => outcome.trim())
            .filter(Boolean),
        ),
      ]
    : [];

  const visibleUnitOutcomes = showAllOutcomes
    ? selectedUnitOutcomes
    : selectedUnitOutcomes.slice(0, 5);

  const hasHiddenOutcomes = selectedUnitOutcomes.length > 5;

  return (
    <section className="workspace-panel units-workspace">
      <header className="units-page-header">
        <div>
          <h2>Units</h2>
          <p>I’m working in this curriculum. Where am I in it?</p>
        </div>
      </header>

      <nav className="units-course-tabs" aria-label="Course navigation">
        {courses.map((course) => (
          <button
            type="button"
            className={
              activeCourse?.CourseID === course.CourseID
                ? "units-course-tab active"
                : "units-course-tab"
            }
            key={course.CourseID}
            onClick={() => {
              const nextCourseUnits = units.filter(
                (unit) => unit.CourseID === course.CourseID,
              );

              setSelectedCourseId(course.CourseID);
              setSelectedUnitId(nextCourseUnits[0]?.UnitID || "");
            }}
          >
            {course.CourseName}
          </button>
        ))}
      </nav>

      <hr className="units-divider" />

      {activeCourse && (
        <section className="units-map">
          <div className="units-map-heading">
            <h3>{activeCourse.CourseName}</h3>
            <p>
              {projectedUnits.length} units · click any unit to navigate the
              curriculum
            </p>
          </div>

          <div className="units-map-row">
            {projectedUnits.map((unit) => {
              const isSelected = selectedUnit?.UnitID === unit.UnitID;

              return (
                <button
                  className={
                    isSelected
                      ? "units-map-card selected-unit"
                      : "units-map-card"
                  }
                  key={unit.UnitID}
                  onClick={() => {
                    setSelectedCourseId(unit.CourseID);
                    setSelectedUnitId(unit.UnitID);
                  }}
                >
                  <span className="units-map-card-number">
                    U{unit.UnitNumber}
                  </span>

                  <strong>{unit.UnitTitle}</strong>

                  <span className="units-map-card-days">
                    {unit.RequiredDays} days
                  </span>

                  <em>
                    {unit.projectedStart && unit.projectedEnd
                      ? `${formatDate(unit.projectedStart)} – ${formatDate(
                          unit.projectedEnd,
                        )}`
                      : "Pending"}
                  </em>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {selectedUnit && (
        <>
          <section className="units-summary">
            <div className="units-summary-top">
              <div className="units-summary-title-block">
                <span className="units-summary-unit-number">
                  U{selectedUnit.UnitNumber}
                </span>

                <div>
                  <h3>{selectedUnit.UnitTitle}</h3>
                  {selectedUnitPurpose && <p>{selectedUnitPurpose}</p>}
                </div>
              </div>

              <div className="units-days-badge">
                {selectedUnit.RequiredDays} Days Planned
              </div>
            </div>

            <div className="units-summary-brief">
              <section className="units-brief-section units-purpose-section">
                <h4>Unit Purpose</h4>
                <p>
                  {selectedUnitPurpose ||
                    "This unit purpose has not been added yet."}
                </p>
              </section>

              {selectedUnitOutcomes.length > 0 && (
                <section className="units-brief-section units-outcomes-section">
                  <h4>Main Outcomes</h4>

                  <ul
                    className={
                      showAllOutcomes && selectedUnitOutcomes.length >= 8
                        ? "units-outcome-list expanded"
                        : "units-outcome-list"
                    }
                  >
                    {visibleUnitOutcomes.map((outcome, index) => (
                      <li key={`units-outcome-${index}`}>{outcome}</li>
                    ))}
                  </ul>

                  {hasHiddenOutcomes && (
                    <button
                      type="button"
                      className="units-show-outcomes"
                      onClick={() => setShowAllOutcomes((value) => !value)}
                    >
                      {showAllOutcomes ? "Show fewer" : "Show all outcomes"}
                    </button>
                  )}
                </section>
              )}
            </div>
          </section>

          <LessonTable
            lessonList={selectedUnitLessons}
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
          />
        </>
      )}
    </section>
  );
}

export default UnitsView;
