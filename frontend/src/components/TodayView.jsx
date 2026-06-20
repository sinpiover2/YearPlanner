import LessonTable from "./LessonTable";

function TodayView({
  selectedCourseId,
  selectedNavigation,
  selectedStatus,
  selectedPrepareNext,
  getCourseLabel,
  formatVariance,
  calculateProgressPercent,
  selectedDailyProgress,
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
}) {
  return (
    <section className="workspace-panel">
      <div className="breadcrumb">
        {getCourseLabel(selectedCourseId)} ›{" "}
        {selectedNavigation.currentUnit
          ? `U${selectedNavigation.currentUnit.UnitNumber}: ${selectedNavigation.currentUnit.UnitTitle}`
          : "Course complete"}{" "}
        › <strong>Lesson {selectedNavigation.currentLessonNumber}</strong>
        <span>{formatVariance(selectedStatus.variance)}</span>
      </div>

      <header className="unit-header">
        <div>
          <h2>
            {selectedNavigation.currentUnit?.UnitTitle ?? "Course Complete"}
          </h2>
          <p>
            {getCourseLabel(selectedCourseId)} ·{" "}
            {selectedNavigation.totalLessonsInUnit} lessons ·{" "}
            {selectedNavigation.plannedDays} days planned
          </p>
        </div>

        <span className="status-pill">
          {selectedNavigation.currentLesson ? "In progress" : "Complete"}
        </span>
      </header>

      <div className="unit-progress">
        <div
          style={{
            width: `${calculateProgressPercent(
              selectedNavigation.actualDays,
              selectedNavigation.plannedDays,
            )}%`,
          }}
        />
      </div>

      <p className="progress-caption">
        {selectedNavigation.actualDays} of {selectedNavigation.plannedDays} days
        used
      </p>

      <LessonTable
        lessonList={selectedNavigation.currentUnitLessons}
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
            {selectedNavigation.nextLesson?.LessonTitle ?? "No next lesson"}
          </strong>
        </div>
      </div>
    </section>
  );
}

export default TodayView;
