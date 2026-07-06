function LessonSessionView() {
  const sampleLineItems = [
    {
      title: "Welcome / launch",
      type: "Routine",
      stage: "Draft",
    },
    {
      title: "Load curriculum item here",
      type: "Curriculum",
      stage: "Needs staging",
    },
    {
      title: "Exit ticket / deliverable",
      type: "Assessment",
      stage: "Needs print decision",
    },
  ];

  return (
    <section className="workspace-panel lesson-session-workspace">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">Lesson Planner</p>
          <h2>Lesson Session</h2>
          <p>
            Build a teachable day from curriculum items, routines, deliverables,
            and teacher-created tasks.
          </p>
        </div>
      </header>

      <div className="lesson-session-shell">
        <section className="lesson-session-card">
          <p className="eyebrow">Session</p>
          <h3>Today’s class session</h3>
          <p>
            This will become the detailed editor for one class on one date.
            It will hold multiple line items.
          </p>
        </section>

        <section className="lesson-session-card">
          <p className="eyebrow">Line Items</p>
          <div className="lesson-session-line-items">
            {sampleLineItems.map((item, index) => (
              <article className="lesson-session-line-item" key={item.title}>
                <div>
                  <span className="line-item-number">{index + 1}</span>
                  <h4>{item.title}</h4>
                  <p>{item.type}</p>
                </div>
                <span className="line-item-stage">{item.stage}</span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

export default LessonSessionView;
