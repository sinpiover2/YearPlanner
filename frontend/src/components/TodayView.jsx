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
        <section id="today-next-up" className="today-hero-card">
          <p className="today-status">You're set for today.</p>

          <div className="today-hero-content">
            <div className="today-hero-copy">
              <span className="today-eyebrow">Next Lesson</span>
              <h2>{currentLesson?.LessonTitle ?? "No lesson selected"}</h2>
              <p>
                {courseLabel} · Period 2 · Lesson{" "}
                {selectedNavigation.currentLessonNumber ?? "—"} of{" "}
                {selectedNavigation.totalLessonsInUnit ?? "—"}
              </p>
              <p>
                {currentUnit
                  ? `Unit ${currentUnit.UnitNumber}: ${currentUnit.UnitTitle}`
                  : "Course complete"}
              </p>
              <p className="today-countdown">Starts in 12 minutes</p>
            </div>

            <button className="today-start-button" type="button">
              Start Lesson
            </button>
          </div>
        </section>

        <section id="today-flow" className="today-section">
          <div className="today-section-header">
            <h3>Today's Flow</h3>
            <p>Teaching sequence for the day</p>
          </div>

          <div className="today-flow-timeline" aria-label="Today teaching timeline">
            <article className="today-flow-stop is-complete">
              <time dateTime="08:15">8:15</time>
              <span className="today-flow-node" aria-hidden="true" />
              <div className="today-flow-copy">
                <strong>Period 1</strong>
                <p>Completed</p>
              </div>
            </article>

            <article className="today-flow-stop is-current">
              <time dateTime="09:40">9:40</time>
              <span className="today-flow-node" aria-hidden="true" />
              <div className="today-flow-copy">
                <strong>Period 2 — {currentLesson?.LessonTitle ?? "Ready when selected"}</strong>
              </div>
            </article>

            <article className="today-flow-stop">
              <time dateTime="11:00">11:00</time>
              <span className="today-flow-node" aria-hidden="true" />
              <div className="today-flow-copy">
                <strong>Prep</strong>
              </div>
            </article>

            <article className="today-flow-stop">
              <time dateTime="13:10">1:10</time>
              <span className="today-flow-node" aria-hidden="true" />
              <div className="today-flow-copy">
                <strong>Period 5</strong>
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
