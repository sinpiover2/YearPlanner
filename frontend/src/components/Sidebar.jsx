function getVarianceLabel(variance) {
  const numericVariance = Number(variance || 0);
  const absoluteVariance = Math.abs(numericVariance);

  if (numericVariance === 0) return "On pace";

  return `${absoluteVariance}d ${numericVariance > 0 ? "behind" : "ahead"}`;
}

function getVarianceClassName(variance) {
  const numericVariance = Number(variance || 0);

  if (numericVariance === 0) return "on-pace";
  if (numericVariance > 0) return "behind";
  return "ahead";
}

function Sidebar({
  timeLens,
  setTimeLens,
  timeLensInfo,
  selectedCourseId,
  setSelectedCourseId,
  setSelectedUnitId,
  math8Navigation,
  math1Navigation,
  math8Status,
  math1Status,
  math8OptionalDays,
  math1OptionalDays,
  calculateProgressPercent,
  selectedSection,
  selectedCourseSections,
  setSelectedSectionId,
  renderUnitChips,
  math8Units,
  math1Units,
}) {
  return (
    <aside className="sidebar">
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
          <em className={getVarianceClassName(math8Status.variance)}>
            {getVarianceLabel(math8Status.variance)}
          </em>
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
              width: `${calculateProgressPercent(
                math8Navigation.actualDays,
                math8Navigation.plannedDays,
              )}%`,
            }}
          />
        </div>
        <small>
          {math8Navigation.actualDays} of {math8Navigation.plannedDays} days in
          unit · {math8OptionalDays}d buffer
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
          <em className={getVarianceClassName(math1Status.variance)}>
            {getVarianceLabel(math1Status.variance)}
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
              width: `${calculateProgressPercent(
                math1Navigation.actualDays,
                math1Navigation.plannedDays,
              )}%`,
            }}
          />
        </div>
        <small>
          {math1Navigation.actualDays} of {math1Navigation.plannedDays} days in
          unit · {math1OptionalDays}d buffer
        </small>
      </button>

      <div className="sidebar-section-title">Section</div>

      <select
        className="section-select"
        value={selectedSection?.SectionID ?? ""}
        onChange={(event) => setSelectedSectionId(event.target.value)}
      >
        {selectedCourseSections.length === 0 ? (
          <option value="">No sections entered</option>
        ) : (
          selectedCourseSections.map((section) => (
            <option key={section.SectionID} value={section.SectionID}>
              {section.SectionName}
            </option>
          ))
        )}
      </select>

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
  );
}

export default Sidebar;
