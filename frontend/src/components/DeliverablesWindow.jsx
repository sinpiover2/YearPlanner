import { useEffect, useState } from "react";
import {
  getAllLessonSessionStates,
  updateLessonSessionEpisode,
} from "../utils/lessonSessionStorage.js";
import { buildDeliverablesOverview } from "../utils/deliverablesOverview.js";
import { buildDeliverablesAssignmentOverview } from "../utils/deliverablesOverview.js";

const VIEW_STORAGE_KEY = "year-planner.deliverables.view.v1";
const COURSE_STORAGE_KEY = "year-planner.deliverables.course-filter.v1";

function loadPreference(key, fallback) {
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

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
  const [view, setView] = useState(() => loadPreference(VIEW_STORAGE_KEY, "assignment"));
  const [courseFilter, setCourseFilter] = useState(() => loadPreference(COURSE_STORAGE_KEY, "all"));
  const [revision, setRevision] = useState(0);
  const [copyStatus, setCopyStatus] = useState("");
  const [copiedControlId, setCopiedControlId] = useState("");

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
  const courseOptions = [...new Map(groups.map((group) => [group.courseId, group.courseLabel])).entries()]
    .sort((left, right) => left[1].localeCompare(right[1]));
  const filteredGroups = courseFilter === "all"
    ? groups
    : groups.filter((group) => group.courseId === courseFilter);
  const assignmentGroups = buildDeliverablesAssignmentOverview(filteredGroups);

  function changeView(nextView) {
    setView(nextView);
    window.localStorage.setItem(VIEW_STORAGE_KEY, nextView);
  }

  function changeCourseFilter(nextCourse) {
    setCourseFilter(nextCourse);
    window.localStorage.setItem(COURSE_STORAGE_KEY, nextCourse);
  }

  function updateItem(item, patch) {
    if (updateLessonSessionEpisode(item.sessionId, item.episodeId, patch)) {
      setRevision((current) => current + 1);
    }
  }

  async function copyText(text, label, controlId) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(`${label} copied.`);
      setCopiedControlId(controlId);
      window.setTimeout(() => {
        setCopiedControlId((current) => current === controlId ? "" : current);
      }, 2000);
    } catch {
      setCopyStatus("Could not copy automatically. Select the text and copy it.");
      setCopiedControlId("");
    }
  }

  function openLesson(item) {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("session", item.sessionId);
    window.open(url.toString(), "year-planner-lesson-session");
  }

  function renderPeriodRow(item, { showTitle = true } = {}) {
    return (
      <article className="deliverables-item" key={item.id}>
        <div className="deliverables-item-main">
          {showTitle ? (
            <button className="deliverables-title" type="button" onClick={() => openLesson(item)}>
              {item.title}
            </button>
          ) : (
            <button className="deliverables-title deliverables-period-link" type="button" onClick={() => openLesson(item)}>
              {item.sectionLabel}
            </button>
          )}
          <span className="deliverables-source">
            Lesson Session · {formatDate(item.lessonDate)}
          </span>
        </div>

        {showTitle ? (
          <div className="deliverables-copy-actions">
            <button
              type="button"
              disabled={item.skipSynergy}
              onClick={() => copyText(item.title, "Title", `title:${item.id}`)}
            >
              {copiedControlId === `title:${item.id}` ? "✓ Copied" : "Copy title"}
            </button>
          </div>
        ) : <span aria-hidden="true" />}

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
            disabled={!item.dueDate || item.skipSynergy}
            onClick={() => copyText(formatCopyDate(item.dueDate), "Due date", `date:${item.id}`)}
          >
            {copiedControlId === `date:${item.id}` ? "✓ Copied" : "Copy date"}
          </button>
        </div>

        <label className="deliverables-synergy-check deliverables-skip-check">
          <input
            type="checkbox"
            checked={item.skipSynergy}
            onChange={(event) => updateItem(item, {
              skipSynergy: event.target.checked,
              enteredInSynergy: event.target.checked ? false : item.enteredInSynergy,
            })}
          />
          Not graded in Synergy
        </label>

        <label className="deliverables-synergy-check">
          <input
            type="checkbox"
            checked={item.enteredInSynergy}
            disabled={item.skipSynergy}
            onChange={(event) => updateItem(item, { enteredInSynergy: event.target.checked })}
          />
          {item.skipSynergy ? "Synergy entry skipped" : "Entered in Synergy"}
        </label>
      </article>
    );
  }

  return (
    <main className="deliverables-window">
      <header className="deliverables-window-header">
        <div>
          <p className="eyebrow">Planning utility</p>
          <h1>Deliverables for Synergy</h1>
          <p>Recent past deliverables, ready for grade entry by class or assignment.</p>
        </div>
        <div className="deliverables-controls">
          <fieldset className="deliverables-view-control">
            <legend>Order by</legend>
            <button className={view === "assignment" ? "active" : ""} type="button" onClick={() => changeView("assignment")}>Assignment</button>
            <button className={view === "class" ? "active" : ""} type="button" onClick={() => changeView("class")}>Class</button>
          </fieldset>
          <label className="deliverables-limit-control">
            Course
            <select value={courseFilter} onChange={(event) => changeCourseFilter(event.target.value)}>
              <option value="all">All courses</option>
              {courseOptions.map(([courseId, courseLabel]) => (
                <option value={courseId} key={courseId}>{courseLabel}</option>
              ))}
            </select>
          </label>
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
        </div>
      </header>

      {copyStatus ? <p className="deliverables-copy-status" role="status">{copyStatus}</p> : null}

      {filteredGroups.length && view === "class" ? filteredGroups.map((group) => (
        <section className="deliverables-class" key={group.sectionId}>
          <h2>{group.sectionLabel}</h2>
          <div className="deliverables-list">
            {group.items.map((item) => renderPeriodRow(item))}
          </div>
        </section>
      )) : null}

      {filteredGroups.length && view === "assignment" ? assignmentGroups.map((course) => (
        <section className="deliverables-course" key={course.courseId}>
          <h2>{course.courseLabel}</h2>
          {course.assignments.map((assignment) => (
            <article className="deliverables-assignment" key={assignment.title}>
              <header className="deliverables-assignment-header">
                <div>
                  <h3>{assignment.title}</h3>
                  <span>Most recent due date · {formatDate(assignment.mostRecentDate)}</span>
                  {assignment.items.every((item) => item.skipSynergy) ? (
                    <strong className="deliverables-not-graded">Not graded in Synergy</strong>
                  ) : null}
                </div>
                <div className="deliverables-copy-actions">
                  <button
                    type="button"
                    disabled={assignment.items.every((item) => item.skipSynergy)}
                    onClick={() => copyText(assignment.title, "Title", `assignment:${course.courseId}:${assignment.title}`)}
                  >
                    {copiedControlId === `assignment:${course.courseId}:${assignment.title}` ? "✓ Copied" : "Copy title"}
                  </button>
                </div>
              </header>
              <div className="deliverables-list">
                {assignment.items.map((item) => renderPeriodRow(item, { showTitle: false }))}
              </div>
            </article>
          ))}
        </section>
      )) : null}

      {!filteredGroups.length ? (
        <section className="deliverables-empty">
          <h2>No past deliverables yet</h2>
          <p>{courseFilter === "all" ? "Mark a Teaching Episode as Deliverable in Lesson Planner." : "No matching deliverables for this course."}</p>
        </section>
      ) : null}
    </main>
  );
}

export default DeliverablesWindow;
