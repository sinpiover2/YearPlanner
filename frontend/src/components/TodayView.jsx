function TodayView({
  selectedCourseId,
  selectedNavigation,
  getCourseLabel,
}) {
  const courseLabel = getCourseLabel(selectedCourseId);
  const currentLesson = selectedNavigation.currentLesson;
  const currentUnit = selectedNavigation.currentUnit;

  return (
    <section className="workspace-panel today-workspace">
      <aside className="today-sidebar">
        <div className="today-date-card">
          <span className="today-eyebrow">Today</span>
          <h2>Thursday</h2>
          <p>July 2</p>
        </div>

        <nav className="today-side-nav" aria-label="Today quick navigation">
          <a href="#today-next-up">Next Up</a>
          <a href="#today-flow">Today's Flow</a>
          <a href="#before-tomorrow">Before Tomorrow</a>
        </nav>
      </aside>

      <div className="today-main">
        <p className="today-status">You're set for today.</p>

        <section id="today-next-up" className="today-hero-card">
          <div className="today-hero-copy">
            <span className="today-eyebrow">Next up · 12 min</span>
            <p>{courseLabel} · Period 2</p>
            <h2>{currentLesson?.LessonTitle ?? "No lesson selected"}</h2>
            <p>
              {currentUnit
                ? `Unit ${currentUnit.UnitNumber}: ${currentUnit.UnitTitle}`
                : "Course complete"}
            </p>
          </div>

          <button className="today-start-button" type="button">
            Start Lesson
          </button>
        </section>

        <section id="today-flow" className="today-section">
          <div className="today-section-header">
            <h3>Today's Flow</h3>
            <p>Teaching sequence for the day</p>
          </div>

          <div className="today-flow-list">
            <article className="today-flow-item is-complete">
              <span className="today-flow-marker" aria-hidden="true">✓</span>
              <div>
                <strong>Period 1</strong>
                <p>Completed</p>
              </div>
            </article>

            <article className="today-flow-item is-current">
              <span className="today-flow-marker" aria-hidden="true">▶</span>
              <div>
                <strong>Period 2 · {courseLabel}</strong>
                <p>{currentLesson?.LessonTitle ?? "Ready when selected"}</p>
              </div>
            </article>

            <article className="today-flow-item">
              <span className="today-flow-marker" aria-hidden="true">○</span>
              <div>
                <strong>Prep</strong>
                <p>Later today</p>
              </div>
            </article>

            <article className="today-flow-item">
              <span className="today-flow-marker" aria-hidden="true">○</span>
              <div>
                <strong>Period 5</strong>
                <p>Later today</p>
              </div>
            </article>
          </div>
        </section>

        <section id="before-tomorrow" className="today-section before-tomorrow">
          <div className="today-section-header">
            <h3>Before Tomorrow</h3>
            <p>Nothing needs your attention.</p>
          </div>
        </section>
      </div>
    </section>
  );
}

export default TodayView;
