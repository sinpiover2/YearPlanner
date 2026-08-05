import { getSidebarCoursePresentation } from "../utils/courseCurriculumModel";

function CourseCard({ courseId, name, color, selectedCourseId, status, navigation, onSelect }) {
  const presentation = getSidebarCoursePresentation(status, navigation);

  return (
    <button
      className={selectedCourseId === courseId ? "course-sidebar-card active" : "course-sidebar-card"}
      onClick={onSelect}
    >
      <div>
        <strong>{name}</strong>
        <em className={presentation.paceClassName}>{presentation.paceLabel}</em>
      </div>
      <p>
        {navigation.currentUnit
          ? `U${navigation.currentUnit.UnitNumber} · ${navigation.currentLesson?.LessonTitle ?? "Complete"}`
          : "No unit selected"}
      </p>
      {presentation.progressPercent === null ? (
        <div className={`mini-bar ${color} incomplete`} role="status">
          {presentation.planningLabel ?? presentation.pacingPlanningLabel}
        </div>
      ) : (
        <div className={`mini-bar ${color}`}>
          <div style={{ width: `${presentation.progressPercent}%` }} />
        </div>
      )}
      <small>
        {[presentation.unitDaysLabel, presentation.requiredDaysLabel, presentation.planningLabel, presentation.pacingPlanningLabel, presentation.bufferLabel]
          .filter(Boolean)
          .join(" · ")}
      </small>
      <small>{status.completedCount} lessons complete</small>
    </button>
  );
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

      <CourseCard
        courseId="M8"
        name="Math 8"
        color="blue"
        selectedCourseId={selectedCourseId}
        status={math8Status}
        navigation={math8Navigation}
        onSelect={() => {
          setSelectedCourseId("M8");
          setSelectedUnitId(math8Navigation.currentUnit?.UnitID ?? null);
        }}
      />

      <CourseCard
        courseId="IM1"
        name="Math 1"
        color="green"
        selectedCourseId={selectedCourseId}
        status={math1Status}
        navigation={math1Navigation}
        onSelect={() => {
          setSelectedCourseId("IM1");
          setSelectedUnitId(math1Navigation.currentUnit?.UnitID ?? null);
        }}
      />

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
