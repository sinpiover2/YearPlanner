import { useState } from "react";
import LessonTable from "./LessonTable";
import {
  getUnitPlanningModel,
  getUnitPlanningPresentation,
  getUnitState,
} from "../utils/unitUtils";
import { getActiveCurriculum, isUnitArchived } from "../utils/plannerUtils";

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
  showArchivedUnits,
  setShowArchivedUnits,
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
}) {
  const activeCourse =
    courses.find((course) => course.CourseID === selectedCourseId) ??
    courses[0];

  const activeCourseUnits = activeCourse
    ? units.filter((unit) => unit.CourseID === activeCourse.CourseID)
    : [];
  const { activeUnits: selectableCourseUnits } = getActiveCurriculum(
    activeCourseUnits,
  );

  const visibleCourseUnits = showArchivedUnits
    ? activeCourseUnits
    : selectableCourseUnits;

  const archivedUnitCount = activeCourseUnits.filter(isUnitArchived).length;

  const projectedUnits = getProjectedUnits(visibleCourseUnits, schoolCalendar);

  const selectedUnitPurpose = getUnitPurpose(selectedUnit);

  const [expandedOutcomesUnitId, setExpandedOutcomesUnitId] = useState(null);
  const showAllOutcomes = expandedOutcomesUnitId === selectedUnit?.UnitID;

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

  const selectedUnitPlanning = getUnitPlanningModel(selectedDailyProgress, selectedUnit);
  const selectedUnitPresentation = getUnitPlanningPresentation(selectedUnitPlanning);

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
              const { activeUnits: nextActiveCourseUnits } =
                getActiveCurriculum(nextCourseUnits);

              setSelectedCourseId(course.CourseID);
              setSelectedUnitId(
                nextActiveCourseUnits[0]?.UnitID || "",
              );
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

            {archivedUnitCount > 0 && (
              <label className="units-show-archived-toggle">
                <input
                  type="checkbox"
                  checked={showArchivedUnits}
                  onChange={(event) => {
                    setSelectedUnitId(selectedUnit?.UnitID ?? null);
                    setShowArchivedUnits(event.target.checked);
                  }}
                />
                Show Archived Curriculum ({archivedUnitCount})
              </label>
            )}
          </div>

          <div className="units-map-row">
            {projectedUnits.map((unit) => {
              const isSelected = selectedUnit?.UnitID === unit.UnitID;
              const isArchived = isUnitArchived(unit);
              const planning = getUnitPlanningModel(selectedDailyProgress, unit);
              const presentation = getUnitPlanningPresentation(planning, { compact: true });
              const unitState = planning.requiredDaysComplete
                ? getUnitState(selectedDailyProgress, unit, activeCourseUnits)
                : null;

              return (
                <button
                  className={[
                    "units-map-card",
                    isSelected ? "selected-unit" : "",
                    isArchived ? "archived-unit" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
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

                  {isArchived ? (
                    <span className="units-map-card-state archived">
                      Archived
                    </span>
                  ) : unitState ? (
                    <span
                      className={`units-map-card-state ${unitState}`}
                    >
                      {unitState === "complete"
                        ? "✓ Complete"
                        : unitState === "current"
                          ? "Current"
                          : "Upcoming"}
                    </span>
                  ) : null}

                  <span
                    className="units-map-card-days"
                    aria-label={presentation.daysAccessibleLabel ?? undefined}
                  >
                    {presentation.daysLabel}
                  </span>

                  {presentation.progressPercent === null ? (
                    <div className="units-map-card-progress incomplete" role="status">
                      {presentation.progressLabel}
                    </div>
                  ) : (
                    <div className="units-map-card-progress" aria-label={presentation.progressLabel}>
                      <span style={{ width: `${presentation.progressPercent}%` }} />
                    </div>
                  )}

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

              <div className={`units-days-badge${selectedUnitPlanning.requiredDaysComplete ? "" : " incomplete"}`}>
                {selectedUnitPresentation.daysLabel}
              </div>

              {selectedUnitPresentation.progressPercent === null ? (
                <div className="units-summary-progress incomplete" role="status">
                  {selectedUnitPresentation.progressLabel}
                </div>
              ) : (
                <div className="units-summary-progress" aria-label={selectedUnitPresentation.progressLabel}>
                  <span style={{ width: `${selectedUnitPresentation.progressPercent}%` }} />
                </div>
              )}
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
                      onClick={() =>
                        setExpandedOutcomesUnitId((unitId) =>
                          unitId === selectedUnit.UnitID
                            ? null
                            : selectedUnit.UnitID,
                        )
                      }
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
            handleMoveLessonToPosition={handleMoveLessonToPosition}
            reorderingUnitId={reorderingUnitId}
            handleDeleteLesson={handleDeleteLesson}
            isAddingLesson={isAddingLesson}
            setIsAddingLesson={setIsAddingLesson}
            isAddingLessonSaving={isAddingLessonSaving}
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
