function NavigationRail({
  navigation,
  activeView,
  onNavigate,
}) {
  return (
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
  );
}

export default NavigationRail;
