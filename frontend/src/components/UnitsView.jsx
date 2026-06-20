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
  return (
    <section className="workspace-panel">
      <h2>Units</h2>

      {courses.map((course) => {
        const courseUnits = units.filter(
          (unit) => unit.CourseID === course.CourseID,
        );
        const projectedUnits = getProjectedUnits(courseUnits, schoolCalendar);

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
