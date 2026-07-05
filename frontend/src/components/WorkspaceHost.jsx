import TodayView from "./TodayView";
import UnitsView from "./UnitsView";
import ForecastView from "./ForecastView";
import TeacherDeskView from "./TeacherDeskView";

function WorkspaceHost({
  activeView,
  todayModel,
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
  overallForecastStateClass,
  overallForecastMessage,
  overallForecastDetail,
  forecastedSections,
  lessons,
  timelineSyncSummaries,
  sectionForecasts,
  hasForecastProgress,
}) {
  if (activeView === "today") {
    return <TodayView todayModel={todayModel} />;
  }

  if (activeView === "teacherDesk") {
    return <TeacherDeskView />;
  }

  if (activeView === "units") {
    return (
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
    );
  }

  if (activeView === "forecast") {
    return (
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
    );
  }

  return null;
}

export default WorkspaceHost;
