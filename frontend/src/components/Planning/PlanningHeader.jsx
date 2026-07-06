function PlanningHeader({
  title,
  schoolDaysLabel,
  onPreviousWeek,
  onNextWeek,
  onJumpToToday,
}) {
  return (
    <header className="planning-header">
      <div className="planning-title-group">
        <p className="eyebrow">Planning</p>
        <h2>{title}</h2>
      </div>

      <div className="planning-controls">
        <button type="button" onClick={onPreviousWeek} aria-label="Previous week">
          ‹
        </button>
        <button type="button" onClick={onJumpToToday}>
          Today
        </button>
        <button type="button" onClick={onNextWeek} aria-label="Next week">
          ›
        </button>
      </div>

      <p className="planning-school-days">{schoolDaysLabel}</p>
    </header>
  );
}

export default PlanningHeader;
