import { useEffect, useState } from "react";
import {
  getAllLessonSessionStates,
  updateLessonSessionEpisode,
} from "../utils/lessonSessionStorage.js";
import { buildDeliverablesOverview } from "../utils/deliverablesOverview.js";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function localTodayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(dateKey) {
  if (!dateKey) return "—";
  return DATE_FORMATTER.format(new Date(`${dateKey}T12:00:00`));
}

function formatCopyDate(dateKey) {
  if (!dateKey) return "";
  const [year, month, day] = dateKey.split("-").map(Number);
  return `${month}/${day}/${year}`;
}

function DeliverablesWindow({ sections }) {
  const [limit, setLimit] = useState(10);
  const [revision, setRevision] = useState(0);
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    function handleStorage(event) {
      if (event.key?.startsWith("year-planner.lesson-session.prototype.v2.")) {
        setRevision((current) => current + 1);
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  void revision;
  const groups = buildDeliverablesOverview({
    sessionStates: getAllLessonSessionStates(),
    sections,
    todayKey: localTodayKey(),
    limit,
  });

  function updateItem(item, patch) {
    if (updateLessonSessionEpisode(item.sessionId, item.episodeId, patch)) {
      setRevision((current) => current + 1);
    }
  }

  async function copyText(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(`${label} copied.`);
    } catch {
      setCopyStatus("Could not copy automatically. Select the text and copy it.");
    }
  }

  function openLesson(item) {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("session", item.sessionId);
    window.open(url.toString(), "year-planner-lesson-session");
  }

  return (
    <main className="deliverables-window">
      <header className="deliverables-window-header">
        <div>
          <p className="eyebrow">Planning utility</p>
          <h1>Deliverables for Synergy</h1>
          <p>Recent past deliverables, grouped by class.</p>
        </div>
        <label className="deliverables-limit-control">
          Show
          <select
            value={Number.isFinite(limit) ? String(limit) : "all"}
            onChange={(event) =>
              setLimit(event.target.value === "all" ? Infinity : Number(event.target.value))
            }
          >
            <option value="5">Past 5 per class</option>
            <option value="10">Past 10 per class</option>
            <option value="20">Past 20 per class</option>
            <option value="all">All past</option>
          </select>
        </label>
      </header>

      {copyStatus ? <p className="deliverables-copy-status" role="status">{copyStatus}</p> : null}

      {groups.length ? groups.map((group) => (
        <section className="deliverables-class" key={group.sectionId}>
          <h2>{group.sectionLabel}</h2>
          <div className="deliverables-list">
            {group.items.map((item) => (
              <article className="deliverables-item" key={item.id}>
                <div className="deliverables-item-main">
                  <button className="deliverables-title" type="button" onClick={() => openLesson(item)}>
                    {item.title}
                  </button>
                  <span className="deliverables-source">
                    Lesson Session · {formatDate(item.lessonDate)}
                  </span>
                </div>

                <div className="deliverables-copy-actions">
                  <button type="button" onClick={() => copyText(item.title, "Title")}>Copy title</button>
                </div>

                <label className="deliverables-date">
                  <span>{item.dateSource}</span>
                  <strong>{formatDate(item.effectiveDate)}</strong>
                  <input
                    type="date"
                    value={item.dueDate ?? ""}
                    onChange={(event) => updateItem(item, { deliverableDueDate: event.target.value || null })}
                  />
                </label>

                <div className="deliverables-copy-actions">
                  <button
                    type="button"
                    disabled={!item.dueDate}
                    onClick={() => copyText(formatCopyDate(item.dueDate), "Due date")}
                  >
                    Copy date
                  </button>
                </div>

                <label className="deliverables-synergy-check">
                  <input
                    type="checkbox"
                    checked={item.enteredInSynergy}
                    onChange={(event) => updateItem(item, { enteredInSynergy: event.target.checked })}
                  />
                  Entered in Synergy
                </label>
              </article>
            ))}
          </div>
        </section>
      )) : (
        <section className="deliverables-empty">
          <h2>No past deliverables yet</h2>
          <p>Mark a Teaching Episode as Deliverable in Lesson Planner.</p>
        </section>
      )}
    </main>
  );
}

export default DeliverablesWindow;
