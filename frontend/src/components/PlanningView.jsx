const WEEK_DAYS = [
  "Mon, Sep 14",
  "Tue, Sep 15",
  "Wed, Sep 16",
  "Thu, Sep 17",
  "Fri, Sep 18",
];

const SECTIONS = ["Math 8 P2", "Math 8 P3", "Math 1 P5", "Math 1 P6"];

function PlanningView() {
  return (
    <section className="workspace-panel planning-workspace">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">Planning</p>
          <h2>Week Planning Board</h2>
          <p>
            Build the teaching week first. Open a Lesson Session only when a day
            needs more space.
          </p>
        </div>

        <div className="planning-controls">
          <button>← Previous</button>
          <button>Today</button>
          <button>Next →</button>
        </div>
      </header>

      <div className="planning-board">
        <div className="planning-grid planning-grid-header">
          <div className="planning-section-heading">Section</div>
          {WEEK_DAYS.map((day) => (
            <div className="planning-day-heading" key={day}>
              {day}
            </div>
          ))}
        </div>

        {SECTIONS.map((section) => (
          <div className="planning-grid planning-row" key={section}>
            <div className="planning-section-label">{section}</div>

            {WEEK_DAYS.map((day) => (
              <button className="planning-session-card" key={`${section}-${day}`}>
                <span className="planning-session-title">Lesson Session</span>
                <span className="planning-session-line">0) Welcome</span>
                <span className="planning-session-line">1) Load curriculum item</span>
                <span className="planning-session-status">Draft</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export default PlanningView;
