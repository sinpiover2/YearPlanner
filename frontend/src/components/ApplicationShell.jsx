const WORKSPACES = [
  { id: "today", label: "Today" },
  { id: "units", label: "Units" },
  { id: "forecast", label: "Forecast" },
  { id: "teacherDesk", label: "Teacher Desk" },
];

function ApplicationShell({ status, activeView, setActiveView, children }) {
  return (
    <section className="main-workspace" aria-label="Year Planner workspace">
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

      <p className="application-status" role="status">
        {status}
      </p>
    </section>
  );
}

export default ApplicationShell;
