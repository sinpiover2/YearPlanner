import { useEffect, useState } from "react";
import { buildWeeklyCommunicationDraft } from "../../utils/weeklyCommunication";

// Sprint 5.8 Weekly Communication MVP. Frontend-only: reads the existing
// Planning model and Lesson Session content already in memory/localStorage,
// generates a deterministic plain-text draft, and lets the teacher review
// and copy it. Nothing here sends, publishes, or persists anything new.
// See docs/Architecture/PLANNING_WORKSPACE.md, Section 15.
function WeeklyCommunicationPanel({
  open,
  onClose,
  sections,
  weekTitle,
  weekDays,
  sessions,
  courseLabel,
  curriculumLessons,
}) {
  const selectableSections = (sections ?? []).filter(
    (section) => !section.isPlaceholder,
  );

  const [sectionId, setSectionId] = useState(selectableSections[0]?.id ?? "");
  const [draft, setDraft] = useState(null);
  const [copyStatus, setCopyStatus] = useState("idle");

  useEffect(() => {
    if (!open) return;

    setDraft(null);
    setCopyStatus("idle");
    setSectionId((current) =>
      selectableSections.some((section) => section.id === current)
        ? current
        : selectableSections[0]?.id ?? "",
    );
    // Only re-run when the panel opens or the section list changes shape —
    // not on every planning-model recompute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectableSections.map((section) => section.id).join(",")]);

  if (!open) return null;

  const selectedSection =
    selectableSections.find((section) => section.id === sectionId) ?? null;

  function handleSectionChange(event) {
    setSectionId(event.target.value);
    setDraft(null);
    setCopyStatus("idle");
  }

  function handleGenerate() {
    if (!selectedSection) return;

    setCopyStatus("idle");
    setDraft(
      buildWeeklyCommunicationDraft({
        section: selectedSection,
        weekTitle,
        weekDays,
        sessions,
        courseLabel,
        curriculumLessons,
      }),
    );
  }

  async function handleCopy() {
    if (!draft?.text) return;

    try {
      await navigator.clipboard.writeText(draft.text);
      setCopyStatus("copied");
    } catch (error) {
      setCopyStatus("error");
    }
  }

  return (
    <div
      className="weekly-communication-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="weekly-communication-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Weekly Communication"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="weekly-communication-header">
          <h2>Weekly Communication</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <p className="weekly-communication-subtitle">
          A plain-text draft built from this week's planned lessons. Review
          it, then copy it into Monday Manager or wherever you send weekly
          updates. Nothing is sent automatically.
        </p>

        <label className="weekly-communication-field">
          <span>Section</span>
          <select value={sectionId} onChange={handleSectionChange}>
            {selectableSections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.label}
              </option>
            ))}
          </select>
        </label>

        <div className="weekly-communication-actions">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!selectedSection}
          >
            Generate Draft
          </button>
          <button type="button" onClick={handleCopy} disabled={!draft?.text}>
            {copyStatus === "copied" ? "Copied" : "Copy to Clipboard"}
          </button>
        </div>

        {copyStatus === "error" ? (
          <p className="weekly-communication-status error">
            Couldn't copy automatically — select the text below and copy it
            manually.
          </p>
        ) : null}

        {draft ? (
          draft.days.length ? (
            <textarea
              className="weekly-communication-draft"
              value={draft.text}
              readOnly
              rows={14}
            />
          ) : (
            <p className="weekly-communication-empty">
              Nothing has been planned for {selectedSection?.label} this week
              yet. Plan a session to generate a draft.
            </p>
          )
        ) : (
          <p className="weekly-communication-empty">
            Choose a section and generate a draft to review it here.
          </p>
        )}
      </div>
    </div>
  );
}

export default WeeklyCommunicationPanel;
