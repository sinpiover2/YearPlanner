const WORKSPACES = [
  { id: "planning", label: "Planning" },
  { id: "lesson", label: "Lesson Planner" },
  { id: "units", label: "Units" },
  { id: "forecast", label: "Forecast" },
];

function ApplicationShell({ status, activeView, setActiveView, children }) {
  return (
    <section className="main-workspace" aria-label="Year Planner workspace">
      <header className="application-shell-header">
        <div className="application-shell-brand">
          <h1>Year Planner</h1>
          <span>2026–27</span>
        </div>

        <nav className="view-tabs" aria-label="Workspace navigation">
          {WORKSPACES.map((workspace) => (
            <button
              key={workspace.id}
              className={activeView === workspace.id ? "active-view" : ""}
              onClick={() => setActiveView(workspace.id)}
            >
              {workspace.label}
            </button>
          ))}
        </nav>

        <small>{status}</small>
      </header>

      {children}
    </section>
  );
}

export default ApplicationShell;
