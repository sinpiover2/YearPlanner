function LessonTable({
  lessonList,
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
}) {
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
          selectedDailyProgress,
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

              {outcomes.length > 0 ? (
                <div className="lesson-goals-display">
                  {outcomes.map((outcome, index) => (
                    <p key={`${lesson.LessonID}-${index}`}>{outcome}</p>
                  ))}
                </div>
              ) : (
                <p>No outcome entered.</p>
              )}

              {activeProgressLessonId === lesson.LessonID && (
                <div className="lesson-progress-entry">
                  <input
                    type="number"
                    min="0.25"
                    max="1"
                    step="0.25"
                    placeholder="Add Days"
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
                    Finished
                  </label>

                  <textarea
                    className="log-notes-input"
                    placeholder="Notes — what happened today?"
                    value={progressInputs[lesson.LessonID]?.notes ?? ""}
                    onChange={(e) =>
                      setProgressInputs((prev) => ({
                        ...prev,
                        [lesson.LessonID]: {
                          ...prev[lesson.LessonID],
                          notes: e.target.value,
                        },
                      }))
                    }
                  />

                  <button onClick={() => handleLogProgress(lesson)}>
                    Save Log
                  </button>

                  <button
                    className="secondary-button"
                    onClick={() => setActiveProgressLessonId(null)}
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

            <div className="lesson-actions">
              <button
                className="edit-link"
                onClick={() => startEditingLesson(lesson)}
              >
                Edit
              </button>

              <button
                className="log-button"
                onClick={() => setActiveProgressLessonId(lesson.LessonID)}
              >
                Log
              </button>
            </div>

            {editingLessonId === lesson.LessonID && editLessonDraft && (
              <div className="lesson-edit-form">
                <div className="days-row">
                  <div className="days-box" />

                  <label>Days</label>

                  <input
                    className="days-input"
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={editLessonDraft.plannedDays}
                    onChange={(e) =>
                      setEditLessonDraft((prev) => ({
                        ...prev,
                        plannedDays: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="goal-editor">
                  <span>Learning goals</span>

                  {editLessonDraft.goals.map((goal, index) => (
                    <div className="goal-input-row" key={index}>
                      <strong>{index + 1}</strong>

                      <input
                        type="text"
                        value={goal}
                        placeholder="I can..."
                        onChange={(e) => updateGoal(index, e.target.value)}
                      />

                      {editLessonDraft.goals.length > 1 && (
                        <button
                          type="button"
                          className="remove-goal-button"
                          onClick={() => removeGoal(index)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    className="add-goal-button"
                    onClick={addGoal}
                  >
                    + Add another goal
                  </button>
                </div>

                <div className="edit-actions">
                  <button onClick={() => handleUpdateLesson(lesson)}>
                    Save
                  </button>

                  <button
                    className="secondary-button"
                    onClick={() => {
                      setEditingLessonId(null);
                      setEditLessonDraft(null);
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleMoveLesson(lesson, "up")}
                  >
                    Move up
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleMoveLesson(lesson, "down")}
                  >
                    Move down
                  </button>

                  <button
                    className="delete-button"
                    onClick={() => handleDeleteLesson(lesson)}
                  >
                    Delete Lesson
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="add-lesson-row">
        {!isAddingLesson ? (
          <button
            className="add-lesson-button"
            onClick={() => setIsAddingLesson(true)}
          >
            + Add lesson
          </button>
        ) : (
          <div className="add-lesson-form">
            <div className="add-lesson-top-row">
              <input
                type="text"
                placeholder="Lesson title"
                value={newLesson.lessonTitle}
                onChange={(e) =>
                  setNewLesson((prev) => ({
                    ...prev,
                    lessonTitle: e.target.value,
                  }))
                }
              />

              <input
                type="number"
                min="0.5"
                step="0.5"
                value={newLesson.plannedDays}
                onChange={(e) =>
                  setNewLesson((prev) => ({
                    ...prev,
                    plannedDays: e.target.value,
                  }))
                }
              />
            </div>

            <div className="goal-editor">
              <span>Learning goals</span>

              {newLesson.keyOutcomes.map((goal, index) => (
                <div className="goal-input-row" key={`new-goal-${index}`}>
                  <strong>{index + 1}</strong>

                  <input
                    type="text"
                    placeholder="I can..."
                    value={goal}
                    onChange={(e) => updateNewLessonGoal(index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addNewLessonGoal();
                      }
                    }}
                  />

                  {newLesson.keyOutcomes.length > 1 && (
                    <button
                      type="button"
                      className="remove-goal-button"
                      onClick={() => removeNewLessonGoal(index)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="add-goal-button"
                onClick={addNewLessonGoal}
              >
                + Add another goal
              </button>
            </div>

            <div className="edit-actions">
              <button
                onClick={handleAddLesson}
                disabled={isAddingLessonSaving}
                aria-busy={isAddingLessonSaving}
              >
                {isAddingLessonSaving ? "Adding…" : "Add lesson"}
              </button>

              <button
                className="secondary-button"
                disabled={isAddingLessonSaving}
                onClick={() => {
                  setNewLesson({
                    lessonTitle: "",
                    plannedDays: 1,
                    keyOutcomes: [""],
                  });
                  setIsAddingLesson(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LessonTable;
