import { useState } from "react";
import PrintRostersMenu from "./PrintRostersMenu";

function PlanningHeader({
  title,
  schoolDaysLabel,
  onPreviousWeek,
  onNextWeek,
  onJumpToToday,
  onJumpToDate,
  dateBounds,
  onPrintDay,
  canPrintDay,
  printDayLabel,
  onOpenWeeklyCommunication,
  onOpenDeliverables,
  sections,
  onPrintRosters,
  rosterSortBy,
  onRosterSortByChange,
}) {
  const [datePickerValue, setDatePickerValue] = useState("");

  function handleDatePickerChange(event) {
    const { value } = event.target;
    setDatePickerValue("");
    if (value) onJumpToDate?.(value);
  }

  return (
    <header className="planning-header">
      <div className="planning-header-row">
        <div className="planning-title-group">
          <p className="eyebrow">Planning</p>
          <h2>{title}</h2>
        </div>

        <div className="planning-nav-controls">
          <label className="planning-date-picker">
            <span className="planning-date-picker-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect
                  x="3.5"
                  y="5"
                  width="17"
                  height="16"
                  rx="2.5"
                  strokeWidth="1.6"
                />
                <path d="M3.5 9.5h17" strokeWidth="1.6" />
                <path d="M8 3v4M16 3v4" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
            <span className="planning-date-picker-text">Jump to date</span>
            <span className="planning-date-picker-chevron" aria-hidden="true">
              ⌄
            </span>
            <input
              type="date"
              value={datePickerValue}
              min={dateBounds?.min ?? undefined}
              max={dateBounds?.max ?? undefined}
              onChange={handleDatePickerChange}
              aria-label="Jump to date"
            />
          </label>

          <div className="planning-week-nav">
            <button
              type="button"
              onClick={onPreviousWeek}
              aria-label="Previous week"
            >
              ‹
            </button>
            <button type="button" onClick={onJumpToToday}>
              Today
            </button>
            <button type="button" onClick={onNextWeek} aria-label="Next week">
              ›
            </button>
          </div>
        </div>
      </div>

      <div className="planning-header-row planning-header-row-secondary">
        <div className="planning-secondary-actions">
          <button
            type="button"
            className="planning-secondary-action"
            onClick={onOpenWeeklyCommunication}
          >
            <span aria-hidden="true">✉</span> Weekly communication
          </button>
          <button
            type="button"
            className="planning-secondary-action"
            onClick={onOpenDeliverables}
          >
            <span aria-hidden="true">▢</span> Deliverables
          </button>
          <button
            type="button"
            className="planning-secondary-action"
            onClick={onPrintDay}
            disabled={!canPrintDay}
            title={
              canPrintDay
                ? `Print ${printDayLabel}`
                : `No printable lessons on ${printDayLabel}`
            }
          >
            Print {printDayLabel}
          </button>
          <PrintRostersMenu
            sections={sections}
            onPrint={onPrintRosters}
            sortBy={rosterSortBy}
            onSortByChange={onRosterSortByChange}
          />
        </div>

        <p className="planning-school-days">{schoolDaysLabel}</p>
      </div>
    </header>
  );
}

export default PlanningHeader;
