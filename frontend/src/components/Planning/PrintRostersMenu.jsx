import { useState } from "react";
import RosterSortToggle from "./RosterSortToggle";

// Blank-roster print picker, independent of any lesson. Reuses the native
// <details>/<summary> popover pattern already used for "Copy plan to…" and
// the episode template menu (LessonSessionView.jsx) rather than introducing
// a new dropdown mechanism. Section labels and ordering come straight from
// the Planning model (same data WeeklyCommunicationPanel uses), not
// hardcoded text.
function PrintRostersMenu({ sections, onPrint, sortBy, onSortByChange }) {
  const selectableSections = (sections ?? []).filter(
    (section) => !section.isPlaceholder,
  );

  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [error, setError] = useState("");

  function toggleSection(sectionId) {
    setError("");
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }

  function handleSelectAll() {
    setError("");
    setSelectedIds(new Set(selectableSections.map((section) => section.id)));
  }

  function handleClearAll() {
    setError("");
    setSelectedIds(new Set());
  }

  function closeMenu(event) {
    event.currentTarget.closest("details")?.removeAttribute("open");
  }

  function handleCancel(event) {
    setError("");
    closeMenu(event);
  }

  function handlePrintSelected(event) {
    if (selectedIds.size === 0) {
      setError("Select at least one section to print.");
      return;
    }

    const sectionIds = selectableSections
      .filter((section) => selectedIds.has(section.id))
      .map((section) => section.id);

    onPrint?.(sectionIds, sortBy);
    setError("");
    closeMenu(event);
  }

  return (
    <details className="print-rosters-menu">
      <summary className="print-rosters-summary">Print Rosters</summary>

      <div className="print-rosters-menu-options">
        <div className="print-rosters-menu-list">
          {selectableSections.map((section) => (
            <label key={section.id} className="print-rosters-menu-item">
              <input
                type="checkbox"
                checked={selectedIds.has(section.id)}
                onChange={() => toggleSection(section.id)}
              />
              <span>{section.label}</span>
            </label>
          ))}
        </div>

        <RosterSortToggle
          name="print-rosters-sort"
          sortBy={sortBy}
          onChange={onSortByChange}
        />

        {error ? <p className="print-rosters-menu-error">{error}</p> : null}

        <div className="print-rosters-menu-actions">
          <button type="button" onClick={handleSelectAll}>
            Select All
          </button>
          <button type="button" onClick={handleClearAll}>
            Clear All
          </button>
          <button
            type="button"
            className="is-primary"
            onClick={handlePrintSelected}
          >
            Print Selected Rosters
          </button>
          <button type="button" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    </details>
  );
}

export default PrintRostersMenu;
