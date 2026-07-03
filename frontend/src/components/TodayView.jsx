function TodayView({ todayModel }) {
  const currentItem = todayModel.currentItem;
  const currentLesson = currentItem?.lesson;
  const currentUnit = currentItem?.unit;
  const currentSection = currentItem?.section;

  return (
    <section className="workspace-panel today-workspace">
      <aside className="today-sidebar">
        <div className="today-date-card">
          <span className="today-eyebrow">Today</span>
          <h2>{todayModel.weekday}</h2>
          <p>{todayModel.dateLabel}</p>
        </div>

        <nav className="today-side-nav" aria-label="Today quick navigation">
          <a href="#today-next-up">Next Up</a>
          <a href="#today-flow">Today's Flow</a>
          <a href="#before-tomorrow">Before Tomorrow</a>
        </nav>
      </aside>

      <div className="today-main">
        <section id="today-next-up" className="today-hero-card">
          <p className="today-status">{todayModel.statusText}</p>

          <div className="today-hero-content">
            <div className="today-hero-copy">
              <span className="today-eyebrow">Next Lesson</span>
              <h2>{currentLesson?.LessonTitle ?? "No lesson selected"}</h2>
              <p>
                {currentItem?.courseLabel ?? todayModel.selectedCourseLabel} ·
                Period {currentSection?.Period ?? "—"} · Lesson{" "}
                {currentItem?.lessonNumber ?? "—"} of{" "}
                {currentItem?.totalLessonsInUnit ?? "—"}
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
            {todayModel.flowItems.map((item) => {
              const stateClass =
                item.state === "complete"
                  ? " is-complete"
                  : item.state === "current"
                    ? " is-current"
                    : "";

              return (
                <article
                  className={`today-flow-stop${stateClass}`}
                  key={item.id}
                >
                  <time dateTime={item.timeLabel}>{item.timeLabel}</time>
                  <span className="today-flow-node" aria-hidden="true" />
                  <div className="today-flow-copy">
                    <strong>
                      Period {item.section?.Period ?? "—"}
                      {item.state === "current" && item.lesson
                        ? ` — ${item.lesson.LessonTitle}`
                        : ""}
                    </strong>
                    {item.state === "complete" && <p>Completed</p>}
                    {item.state !== "complete" && item.state !== "current" && (
                      <p>{item.courseLabel}</p>
                    )}
                  </div>
                </article>
              );
            })}
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
