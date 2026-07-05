function ApplicationShell({
  title,
  subtitle,
  navigation,
  activeView,
  onNavigate,
}) {
  return (
    <aside className="application-shell">
      <header className="application-shell-header">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </header>

      <nav
        className="application-shell-nav"
        aria-label="Application Navigation"
      >
        {navigation.map((item) => (
          <button
            key={item.id}
            className={activeView === item.id ? "active" : ""}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <footer className="application-shell-footer">
        <small>Connected</small>
      </footer>
    </aside>
  );
}

export default ApplicationShell;
