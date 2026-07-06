function PlanningHeader({ title, schoolDaysLabel }) {
  return (
    <header className="planning-header">
      <div className="planning-title-group">
        <p className="eyebrow">Planning</p>
        <h2>{title}</h2>
      </div>

      <div className="planning-controls">
        <button>‹</button>
        <button>Jump</button>
        <button>›</button>
      </div>

      <p className="planning-school-days">{schoolDaysLabel}</p>
    </header>
  );
}

export default PlanningHeader;
