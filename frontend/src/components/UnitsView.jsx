import LessonTable from "./LessonTable";

function UnitsView({
  courses,
  units,
  schoolCalendar,
  getProjectedUnits,
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
  const selectedUnitPurpose = selectedUnit
    ? [
        selectedUnit.Purpose,
        selectedUnit.UnitPurpose,
        selectedUnit.purpose,
        selectedUnit.unitPurpose,
      ]
        .map((value) => String(value || "").trim())
        .find(Boolean)
    : "";

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

  return (
    <section className="workspace-panel units-workspace">
      <header className="units-page-header">
        <h2>Units</h2>
        <p>Explore unit purpose, instructional time, and lesson sequence.</p>
      </header>

      <section className="units-selector">
        {courses.map((course) => {
          const courseUnits = units.filter(
            (unit) => unit.CourseID === course.CourseID,
          );
          const projectedUnits = getProjectedUnits(courseUnits, schoolCalendar);

          return (
            <div className="units-course-map" key={course.CourseID}>
              <h3>{course.CourseName}</h3>

              <div className="units-map-row">
                {projectedUnits.map((unit) => {
                  const unitPurpose = [
                    unit.Purpose,
                    unit.UnitPurpose,
                    unit.purpose,
                    unit.unitPurpose,
                  ]
                    .map((value) => String(value || "").trim())
                    .find(Boolean);

                  return (
                    <button
                      className={
                        selectedUnit?.UnitID === unit.UnitID
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

                      {unitPurpose && (
                        <p className="units-map-card-purpose">{unitPurpose}</p>
                      )}

                      <small>{unit.RequiredDays}d</small>
                      <em>
                        {unit.projectedStart && unit.projectedEnd
                          ? `${formatDate(unit.projectedStart)}–${formatDate(
                              unit.projectedEnd,
                            )}`
                          : "Pending"}
                      </em>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {selectedUnit && (
        <>
          <section className="units-summary">
            <div className="units-summary-header">
              <h3>
                {getCourseLabel(selectedUnit.CourseID)} — U
                {selectedUnit.UnitNumber}
              </h3>
              <p>{selectedUnit.UnitTitle}</p>
            </div>

            {(selectedUnitPurpose || selectedUnitOutcomes.length > 0) && (
              <div className="units-summary-brief">
                {selectedUnitPurpose && (
                  <section className="units-brief-section">
                    <h4>Unit Purpose</h4>
                    <p>{selectedUnitPurpose}</p>
                  </section>
                )}

                {selectedUnitOutcomes.length > 0 && (
                  <section className="units-brief-section">
                    <h4>Main Outcomes</h4>
                    <ul>
                      {selectedUnitOutcomes.map((outcome, index) => (
                        <li key={`units-outcome-${index}`}>{outcome}</li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}
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
