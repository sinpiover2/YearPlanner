const WORKSPACES = [
  { id: "today", label: "Today" },
  { id: "units", label: "Units" },
  { id: "forecast", label: "Forecast" },
  { id: "teacherDesk", label: "Teacher Desk" },
];

function ApplicationShell({ status, activeView, setActiveView, children }) {
  return (
    <section className="main-workspace" aria-label="Year Planner workspace">
      <header className="application-shell-header">
        <h1>Year Planner</h1>
        <p>2026–27</p>
        <small>{status}</small>
      </header>

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

      {children}
    </section>
  );
}

export default ApplicationShell;
