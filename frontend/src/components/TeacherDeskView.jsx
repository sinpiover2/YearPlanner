function TeacherDeskView() {
  const segments = [
    { title: "Welcome", duration: "3 min", note: "Settle, attendance, quick reset." },
    { title: "Warm-Up", duration: "7 min", note: "Review proportional relationships from yesterday." },
    { title: "Launch", duration: "8 min", note: "Introduce today’s investigation context." },
    { title: "Investigation", duration: "22 min", note: "Pairs work. Watch for table-to-graph confusion." },
    { title: "Discussion", duration: "10 min", note: "Compare strategies. Press on slope meaning." },
    { title: "Exit Ticket", duration: "5 min", note: "Collect before dismissal." },
  ];

  const materials = ["Amplify lesson", "Graph paper", "Exit ticket", "Whiteboards"];

  return (
    <section className="workspace-panel teacher-desk-workspace">
      <header className="teacher-desk-header">
        <div>
          <span className="teacher-desk-eyebrow">Teacher Desk</span>
          <h2>Math 8 · Period 2</h2>
          <p>Tuesday, September 14 · Unit 2 · Lesson 3.2 · 55 minutes</p>
        </div>

        <button className="teacher-desk-print-button" type="button">
          Print Lesson Sheet
        </button>
      </header>

      <main className="teacher-desk-main">
        <section className="teacher-desk-flow-card">
          <div className="teacher-desk-section-header">
            <h3>Instructional Flow</h3>
            <p>Focus moves. Layout doesn’t.</p>
          </div>

          <div className="teacher-desk-segments">
            {segments.map((segment, index) => (
              <article
                className={`teacher-desk-segment ${
                  index === 2 ? "is-current" : ""
                }`}
                key={segment.title}
              >
                <div className="teacher-desk-segment-marker">
                  <span>{index + 1}</span>
                </div>

                <div className="teacher-desk-segment-copy">
                  <div className="teacher-desk-segment-title-row">
                    <h4>{segment.title}</h4>
                    <span>{segment.duration}</span>
                  </div>
                  <p>{segment.note}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="teacher-desk-side-panel">
          <section className="teacher-desk-card">
            <h3>Materials</h3>
            <ul>
              {materials.map((material) => (
                <li key={material}>{material}</li>
              ))}
            </ul>
          </section>

          <section className="teacher-desk-card">
            <h3>Teacher Notes</h3>
            <p>
              Students may need extra support connecting the table pattern to
              the graph. Slow down during the discussion.
            </p>
          </section>

          <section className="teacher-desk-card">
            <h3>After Class</h3>
            <p>Reflection and enacted progress will live here.</p>
          </section>
        </aside>
      </main>
    </section>
  );
}

export default TeacherDeskView;
