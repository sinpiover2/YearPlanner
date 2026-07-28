# Write-Path Inventory

**Sprint 6.0 — Task 1**

**Status:** Analysis / documentation only. No code was changed to produce this
document.

**Purpose:** Enumerate every location in the current codebase where
teacher-authored data is created, edited, deleted, imported, exported,
reordered, or printed, so Sprint 6.0 can reason about data-loss risk and
subsystem boundaries before making changes.

**Method:** Read against `ARCHITECTURE_INDEX.md`, `SUITE_ARCHITECTURE.md`,
`INFORMATION_MODEL.md`, `UNITS_ARCHITECTURE.md`, `POST_CLASS_DEBRIEF.md`,
`ENACTMENT_MODEL.md`, and `ROSTER_INFORMATION_MODEL.md`, then traced every
write against the shipped code in `frontend/src`, `apps-script-planning/`,
and `apps-script-roster-admin/`. Where code and documentation disagree, this
document follows the code (the code is what teachers actually use) and flags
the disagreement.

---

## 0. Headline finding

The architecture documents describe an Enacted Curriculum recorded through a
**Post-Class Debrief** (`POST_CLASS_DEBRIEF.md`, `ENACTMENT_MODEL.md`). No
Post-Class Debrief component exists in the codebase (`grep -ri debrief
frontend/src` returns nothing). The two write paths that currently stand in
for "recording what happened" — the legacy `DailyProgress` **Log** button
(§2) and the localStorage-only Lesson Session planner (§3) — both predate the
Enactment Model and neither implements it. Session Enactment and Placement
Enactment, as defined in `ENACTMENT_MODEL.md`, are not yet real objects
anywhere in the running system. Sprint 6.0 should treat this as the central
fact shaping every recommendation below, not as a side note.

---

## 1. Planned Curriculum — Lessons (owned by Units)

Origin chain: `UnitsView.jsx` → `LessonTable.jsx` (`frontend/src/components/UnitsView.jsx:292`)
→ handlers in `App.jsx` → `frontend/src/api.js` → `apps-script-planning/Code.js`
→ **Lessons** sheet.

| Write path | UI action | Handler | api.js call | Apps Script fn | Sheet op |
|---|---|---|---|---|---|
| Add lesson | "+ Add lesson" → fill title/days/goals → "Add lesson" | `App.jsx:654 handleAddLesson` | `addLesson()` — real fetch, reads JSON | `Code.js:451 addLesson` | `appendRow` to `Lessons` |
| Update lesson | "Edit" → change fields → "Save" | `App.jsx:891 handleUpdateLesson` | `updateLesson()` — **`mode:"no-cors"`** | `Code.js:492 updateLesson` | `setValue` per changed column |
| Delete lesson | "Edit" → "Delete Lesson" → `window.confirm` | `App.jsx:735 handleDeleteLesson` | `deleteLesson()` — **`mode:"no-cors"`** | `Code.js:532 deleteLesson` | `deleteRow`, then batch `setValues` to renumber `SortOrder`/`LessonNumber` for the rest of the unit |
| Reorder (move to position) | "Edit" → set "Move to position" → Enter/"Move" | `App.jsx:813 handleMoveLessonToPosition` | `reorderLessons()` — real fetch, reads JSON | `Code.js:692 reorderLessons` | batch `setValues` of `SortOrder`/`LessonNumber` for the whole unit |
| Reorder (legacy, orphaned) | *(no UI calls this)* | — | *(api.js exports no `moveLesson`)* | `Code.js:614 moveLesson` | swaps `SortOrder`/`LessonNumber` between two adjacent rows |

**Data model:** `Lesson` (Planned Curriculum, `INFORMATION_MODEL.md`), stored
in the `Lessons` tab of the shared spreadsheet (`SHEET_ID` in `Code.js:1`).

**Atomicity:** None of these five operations use `LockService`. Delete and
reorder both read the entire `Lessons` sheet, compute new `SortOrder`
values in memory, and write back in a second step — two concurrent requests
against the same unit (two tabs, a slow retry racing a second click) can
interleave and produce an inconsistent `SortOrder`/`LessonNumber` sequence.
Add computes `nextLessonNumber` by counting existing rows for the unit,
which is itself a read-then-write race if two "Add lesson" submissions land
close together.

**Failure risk — the important one:** `updateLesson`, `deleteLesson`, and
`saveDailyProgress` (§2) all fetch with `mode: "no-cors"`. In `no-cors` mode
the response body is opaque to JavaScript and `fetch()` only rejects on a
network-level failure (offline, DNS) — never on an HTTP error or an
exception thrown inside the Apps Script function. `api.js` doesn't attempt to
read the response either; it just returns `{ ok: true }` unconditionally
after the `await`. Consequently the `try/catch` rollback logic in
`handleUpdateLesson`/`handleDeleteLesson`/`handleLogProgress` is reachable
only on total network failure — never on a server-side error (a thrown
exception, a hit execution quota, a spreadsheet permission problem, a
`"Lesson not found"` response). **The optimistic UI update is never rolled
back in the one situation it exists to guard against.** A teacher can edit or
delete a lesson, see it succeed locally, and have the spreadsheet silently
fail to change — with no visible signal, until the next full reload quietly
reverts their edit. `addLesson` and `reorderLessons`, by contrast, use a real
CORS-visible fetch with `response.ok`/`data.ok` checks, so their rollback
paths work as designed. There is no architectural reason for the two groups
to differ; it reads as incremental drift within the same file.

**Current protections:** Optimistic-update-with-rollback exists for all five
handlers in `App.jsx`; it is only *effective* for `addLesson` and
`reorderLessons`. Delete requires an explicit `window.confirm`. Delete and
reorder both validate the unit's lesson set server-side before writing.

**Recovery:** None beyond re-editing by hand. There is no undo, version
history use, or audit trail on the `Lessons` sheet beyond whatever Google
Sheets' own built-in revision history retains.

**Security note (write-path relevant, not hypothetical):** Per
`ROSTER_INFORMATION_MODEL.md`, "Access boundary," the deployed
`apps-script-planning` web app permits **anonymous** access, and its `exec`
URL is hardcoded in `frontend/src/api.js`, which ships in the built,
publicly-servable JS bundle. `doPost` (`Code.js:376`) dispatches on
`payload.action` with no authentication check of any kind. Anyone who has
loaded the site once has the URL and can call `addLesson`/`updateLesson`/
`deleteLesson`/`reorderLessons`/`saveDailyProgress` directly, with no
teacher session, no rate limit, and no confirmation — including scripted,
repeated `deleteLesson` calls that could empty the `Lessons` sheet entirely.
This is a live write path, not a theoretical one, and belongs in the
data-loss ranking below alongside the interrupted-request scenarios.

---

## 2. Legacy instructional logging — DailyProgress

Origin: `LessonTable.jsx` inline "Log" button on each lesson row → day
fraction / finished checkbox / notes → "Save Log".

| Write path | Handler | api.js call | Apps Script fn | Sheet op |
|---|---|---|---|---|
| Log progress | `App.jsx:585 handleLogProgress` | `saveDailyProgress()` — **`mode:"no-cors"`**, `Promise.all` over every section sharing the course | `Code.js:431 saveDailyProgress` | `appendRow` to `DailyProgress`, once per section |

**Data model:** `DailyProgress` (`DailyProgressID` is implicit — the row
itself has no ID column populated by this path; see `SYSTEM_INVENTORY.md`'s
older schema listing). This table and its `dayFraction`/`finished`/`notes`
shape predate the current Information Model's `Session Enactment` /
`Placement Enactment` split (`ENACTMENT_MODEL.md`; see also
`INFORMATION_MODEL.md`'s "Deprecated Terminology" table, which maps
"Lesson Completion" → Placement Enactment status). **This write path is a
pre-Enactment-Model artifact still live in the shipped UI.** It writes
directly into a flat table that the current architecture no longer
describes, using the same no-cors fire-and-forget pattern as §1's
`updateLesson`/`deleteLesson` — a logged entry can silently fail to persist
while the UI shows it as saved.

**Atomicity:** One `appendRow` per section, unguarded by any lock, executed
in parallel via `Promise.all`. A partial `Promise.all` failure (some sections
log, others don't) is swallowed the same way — `saveDailyProgress()` resolves
`{ ok: true }` regardless.

**Current protections:** Client-side confirmation that inputs are non-empty;
none server-side.

**Recovery:** None. A silently-dropped log entry leaves no trace anywhere in
the client or the sheet.

---

## 3. Lesson Session / Teaching Episode authoring (Lesson Planner prototype)

This is the **largest write surface in the codebase** and the one most
likely to hold irreplaceable teacher work at any given moment. It lives
entirely in `frontend/src/components/LessonSessionView.jsx` (~3,000 lines)
and `frontend/src/utils/lessonSessionStorage.js`, and it is **entirely
client-side `localStorage`** — there is no server call anywhere in this
component except the print POST (§5), which never persists what it sends.

**Data model:** episodes → blocks (text / learning / deliverable / materials)
→ deliverables, keyed per Lesson Session (`activeLessonContext.sessionId`).
This is the closest thing in the running system to authoring a Teaching
Episode / Episode Placement, but nothing here is durable in the sense
`TEACHING_EPISODE_MODEL.md` or `ENACTMENT_MODEL.md` describe — there is no
server-side Teaching Episode record; it is a per-browser draft.

| localStorage key (from `lessonSessionStorage.js` / `LessonSessionView.jsx`) | Written by | Scope |
|---|---|---|
| `year-planner.lesson-session.prototype.v2[.sessionId]` | every plan edit (add/edit/delete/move/duplicate block or episode, toggle deliverable, etc.) via one `useEffect` at `LessonSessionView.jsx:526` | per session |
| `year-planner.lesson-session.collapsed-blocks.v1[.sessionId]` | UI expand/collapse state, `LessonSessionView.jsx:540` | per session |
| `year-planner.lesson-session.episode-clipboard.v1` | `copyEpisodeToClipboard` (`:746`), read by `pasteEpisodeFromClipboard` (`:775`) | **single global slot**, no session scoping |
| `year-planner.lesson-session-items.prototype.v1` (legacy) | never written by current code; only read once, `:295`, to migrate an old draft when a session has no v2 data yet | global, read-only now |

**Cross-session writes that are not part of the currently-open session:**
`copyPlanToSession` (`:708`) and `moveEpisodeToSession` (`:925`) both write
directly into *another* session's localStorage key while the UI is showing
the current session. `copyPlanToSession` overwrites the destination
wholesale if one exists, guarded only by a `window.confirm`.
`moveEpisodeToSession` performs two independent localStorage writes (write
destination, then remove from source) with no shared transaction — if the
second write is interrupted (tab closed between the two `setItem` calls),
the episode now exists in both sessions, or in neither, depending on which
step landed.

**Atomicity:** Each individual `localStorage.setItem` is effectively atomic
at the browser level, but the *plan* (multi-episode, multi-block state) is
serialized as one JSON blob on every state change — there is no partial
write. The risk is not corruption mid-write; it is silent non-persistence
and cross-tab clobbering (below).

**Failure risks:**
- **No server backup of any kind.** This is a single-browser, single-device
  store. Clearing browser data, switching browsers or devices, using a
  different profile, or a browser evicting site storage (e.g. Safari's
  Intelligent Tracking Prevention can purge script-writable storage after a
  period of no interaction) **permanently and silently deletes every
  planned lesson session with no recovery path.** Print (§5) is the only
  export, and the payload it sends is explicitly "never persisted anywhere"
  (`ROSTER_INFORMATION_MODEL.md`) — a paper copy exists if the teacher
  printed, but the editable source is gone.
- **Silent write failure.** Every `localStorage.setItem` call in this file
  is wrapped in `try/catch` that only does `console.warn` on failure
  (`:535`, `:549`, `:741`, `:770`, `:993`). In private/incognito contexts
  where `setItem` can throw, or once a browser's per-origin storage quota is
  hit, the teacher sees no error at all — the UI behaves identically whether
  or not the write succeeded.
- **Multi-tab last-write-wins.** Nothing coordinates two tabs/windows open
  to the same `sessionId`. The `useEffect` at `:526` serializes the *entire*
  plan state on every change; whichever tab writes last wins, silently
  discarding the other tab's edits. This is easy to trigger by accident
  (opening the same Planning-grid cell twice, or a session left open from a
  previous day).
- **Undo/redo is in-memory only** (`useUndoableState`, `:314`) — a page
  refresh clears the undo stack even though the persisted state survives.

**Current protections:** Overwrite confirmation on `copyPlanToSession` only.
Nothing else in this section guards against loss.

**Recovery:** None beyond the browser's own localStorage persistence. There
is no export/import, no versioning, and no way to recover a session's
content once its key is gone.

---

## 4. Roster data (Students, SectionEnrollments, RosterSettings, RosterImport)

Separate, **authenticated** Apps Script project: `apps-script-roster-admin/`.
Per `ROSTER_INFORMATION_MODEL.md`, this project is deliberately isolated
from the anonymous planning API so student-identifying data never has a
public read/write surface.

| Write path | Entry point | Trigger | Sheets touched | Atomicity / guards |
|---|---|---|---|---|
| Fictional roster seed | `setupRosterSheetsV1()` (`Code.js:139`) | manual, Apps Script editor only | `Students`, `SectionEnrollments`, `RosterSettings` | `LockService` (30s), full validation before first write, attempted rollback (delete created sheets / clear appended rows) on any failure — explicitly **not** a true cross-sheet transaction |
| Roster import setup | `setupRosterImportSheetV1()` (`RosterImport.js:21`) | manual / Sheets menu | `RosterImport` | `LockService`; idempotent — leaves a correct existing sheet untouched |
| Roster import | `importRosterFromStaging()` (`RosterImport.js:375`) | teacher-triggered from Sheets menu | reads `RosterImport`, writes `Students` + `SectionEnrollments`, writes back `Status` into `RosterImport` | `LockService`; **full plan built and validated before any mutation**; any single rejected row blocks the *entire batch* (nothing partially imported); `Status` is only ever written as "Imported" *after* the corresponding write succeeds; on write failure, rollback is scoped to exactly the rows this attempt appended (`studentsSheet.deleteRows`/`enrollmentsSheet.deleteRows`) |
| Roster drop / deactivation | *(not implemented)* | — | — | explicitly out of scope; tracked as a gap in `docs/Development/CLASSROOM_READINESS.md` |

**Data model:** `Student`, `SectionEnrollment`, `RosterSettings`,
`RosterImport` (staging only — `Status` is output, never input; see
`ROSTER_INFORMATION_MODEL.md`).

**Failure risk:** Apps Script provides no real cross-sheet transaction
anywhere in this project either, but every guarded function here compensates
deliberately (pre-write validation, scoped rollback, lock, batch-blocking on
any bad row) — this is the most carefully engineered write surface in the
codebase, in contrast to §1/§2's unguarded planning writes.

**Recovery:** Per-row `Status` column gives a durable audit trail of what an
import attempt did to every staging row, including failures.

---

## 5. Print operations — confirmed non-mutating

"Print lesson" (`LessonSessionView.jsx:477 handlePrintLesson`), "Print Day"
(`PlanningView.jsx:78 handlePrintDay`), and "Print Rosters"
(`PlanningView.jsx:102 handlePrintRosters`) all funnel through
`frontend/src/utils/combinedPrint.js`, which builds a hidden `<form>` and
does a top-level `POST` navigation (not `fetch`) to the authenticated roster
Apps Script's `doGet`/`doPost` (`apps-script-roster-admin/Code.js:49,76`).

Verified by reading every function reachable from `doGet`/`doPost` in that
file: they only read (`getSectionRoster_`, `readRosterSheet_`) and render
HTML Service templates. **No `setValue`, `appendRow`, `deleteRow`, or
`clearContent` call exists anywhere in the print path.** The lesson payload
the frontend sends is rendered once and discarded — per
`ROSTER_INFORMATION_MODEL.md`, it is "never persisted anywhere." Print is
safe to invoke any number of times and mutates nothing.

---

## 6. Weekly Communication — confirmed non-mutating

`WeeklyCommunicationPanel.jsx` reads the in-memory Planning model and
localStorage Lesson Session state already established in §3, builds a
plain-text draft in memory (`utils/weeklyCommunication.js`), and offers a
"Copy to Clipboard" button (`navigator.clipboard.writeText`). Nothing is
sent, published, or persisted; the component's own header comment says so
explicitly. Zero write risk — the draft is fully regenerable from existing
state at any time.

---

## 7. Administrative / maintenance write path

`apps-script-roster-admin/ProductionDataCleanup.js` — deletes the confirmed
seeded/fictional roster rows, a matched "Ferd Derfman" test student, four
specifically-fingerprinted malformed `DailyProgress` rows, and clears the
`RosterImport` staging sheet. Not reachable from any UI; run manually from
the Apps Script editor by the maintainer only.

- `previewProductionDataCleanupV1()` — read-only, zero mutations, builds and
  reports the exact plan the execute function would use.
- `executeProductionDataCleanupV1()` — refuses to run unless a hardcoded
  local sentinel string is hand-edited to match exactly
  (`CLEANUP_CONFIRMATION_SENTINEL`); takes `LockService`; takes a full
  `Spreadsheet.copy()` backup *before* mutating; **re-runs the entire
  selection query immediately before deleting** and aborts if anything
  differs from the first pass (`cleanupPlansMatch_`); deletes children
  before parents, bottom-to-top per sheet, in an order chosen so an
  interruption fails toward harmless orphaned rows rather than dangling
  references.

This is by a wide margin the most defensively engineered destructive
operation in the codebase — worth noting as the standard the unguarded
planning writes in §1/§2 do not currently meet.

---

## Write-Path Diagram

```text
┌─────────────────────────── React frontend (frontend/src) ───────────────────────────┐
│                                                                                       │
│  UnitsView → LessonTable ──┐                                                         │
│                             ├─► App.jsx handlers ──► api.js ──(anonymous POST)──┐     │
│  LessonTable "Log" ─────────┘                                                   │     │
│                                                                                  ▼     │
│  LessonSessionView ──► localStorage only (no network) ✕ never reaches sheet     apps- │
│    - plan / episodes / blocks / deliverables                                   script-│
│    - collapsed-block UI state                                                planning │
│    - episode clipboard (global)                                                 │     │
│    - copyPlanToSession / moveEpisodeToSession → OTHER session's localStorage    │     │
│                                                                                  ▼     │
│  PlanningView "Print lesson / Print Day / Print Rosters" ──(hidden form POST)──┐│     │
│  WeeklyCommunicationPanel ──► clipboard only, nothing sent                     ││     │
│                                                                                 ││     │
└─────────────────────────────────────────────────────────────────────────────  ││ ────┘
                                                                                  ││
                    ┌─────────────────────────────────────────────────────────  ││
                    ▼                                                            ▼▼
   apps-script-roster-admin (AUTHENTICATED)                    apps-script-planning (ANONYMOUS)
   doGet/doPost: renders print HTML only — NO WRITES              doGet: reads all tabs
   RosterImport.js: setupRosterImportSheetV1,                     doPost: saveDailyProgress,
     importRosterFromStaging  → Students,                           addLesson, updateLesson,
     SectionEnrollments, RosterImport(Status)                       deleteLesson, moveLesson*,
   Code.js: setupRosterSheetsV1 (manual, guarded)                   reorderLessons
     → Students, SectionEnrollments, RosterSettings                 → Lessons, DailyProgress
   ProductionDataCleanup.js (manual, maintainer-only,
     backed up + revalidated) → Students,
     SectionEnrollments, DailyProgress, RosterImport
                    │                                                            │
                    ▼                                                            ▼
        Google Sheets: SHEET_ID (one shared spreadsheet, both projects target the same file)

   * moveLesson is unreachable from the shipped frontend (api.js exports no caller)
     but remains a live, anonymously-POSTable action on the deployed web app.
```

---

## Highest-Risk Data-Loss Scenarios

Ranked by how bad the outcome is and how easily it happens today, not by
which subsystem owns them.

1. **Anonymous, unauthenticated mutation of Planned Curriculum.** The
   `apps-script-planning` web app is deployed for anonymous access
   (`ROSTER_INFORMATION_MODEL.md`), and its URL ships in the public JS
   bundle. Anyone with that URL can call `deleteLesson`/`updateLesson`/
   `addLesson`/`reorderLessons`/`saveDailyProgress` directly — no teacher
   session, no confirmation, no rate limiting. A scripted loop could empty
   the `Lessons` sheet in seconds. This is the only scenario here that
   doesn't require an interrupted request or a bug — it requires nothing
   but knowledge of a URL already present in the shipped frontend.

2. **Confident silent data loss on `updateLesson`/`deleteLesson`/
   `saveDailyProgress`.** Because these three use `mode: "no-cors"`, a
   server-side failure (thrown exception, quota, permission issue, stale
   row lookup) is invisible to the client. The optimistic UI shows success,
   the teacher moves on, and the change silently reverts on the next reload
   with no error ever shown. This is worse than an obvious failure because
   nothing prompts the teacher to redo the work.

3. **Total, permanent loss of a Lesson Session plan with no recovery path.**
   Everything authored in `LessonSessionView.jsx` — every Teaching Episode,
   block, and deliverable — lives only in one browser's localStorage on one
   device. Clearing site data, switching devices/browsers, or storage
   eviction (e.g. Safari ITP) deletes it permanently. There is no export, no
   server copy, and Print does not save the editable source. Given that
   Lesson Session content is plausibly the single largest investment of
   teacher time in the whole system, this is the highest-*volume* risk even
   though each individual loss is "only" one device's data.

4. **Silent multi-tab clobbering in Lesson Session.** Two tabs/windows open
   to the same session overwrite each other's full plan state with no
   warning, no merge, and no conflict indicator — easy to trigger by
   accident via the Planning grid.

5. **Unguarded concurrent writes to `Lessons`/`DailyProgress`.** No
   `LockService` protects any of `addLesson`/`updateLesson`/`deleteLesson`/
   `reorderLessons`/`saveDailyProgress`, each of which does a read-full-sheet
   → compute → write-back sequence. Two near-simultaneous requests against
   the same unit can interleave and corrupt `SortOrder`/`LessonNumber`.

6. **`moveEpisodeToSession`'s two-step, non-transactional localStorage
   write.** An interruption between "write destination" and "remove from
   source" can duplicate or drop an episode.

---

## Recommendations for Sprint 6.0

Ordered by leverage (risk removed per unit of work), not by subsystem.

1. **Close the anonymous write hole first.** Whatever the long-term auth
   story is, `addLesson`/`updateLesson`/`deleteLesson`/`reorderLessons`/
   `saveDailyProgress` should not be callable by an unauthenticated,
   arbitrary caller. This is the one item on this list that is a live
   exposure today, not a theoretical edge case.

2. **Make `updateLesson`, `deleteLesson`, and `saveDailyProgress` fail
   loudly.** Drop `mode: "no-cors"` and read the response the same way
   `addLesson`/`reorderLessons` already do, so the existing
   rollback-on-error UI logic in `App.jsx` actually fires when the server
   rejects a write. This is a small, contained fix that brings three
   functions in line with a pattern the codebase already proves out
   elsewhere in the same file.

3. **Give Lesson Session content a real recovery story before more teacher
   time goes into it.** It doesn't need to be the full Post-Class Debrief /
   Enacted Curriculum implementation to start — even a manual export/import
   (download the plan as JSON, or a server-side draft save) would remove
   the single-device, no-recovery exposure. This is also naturally the
   on-ramp toward the Post-Class Debrief that `POST_CLASS_DEBRIEF.md` and
   `ENACTMENT_MODEL.md` already specify but that has no code yet — worth
   sequencing deliberately rather than accreting further localStorage-only
   features on top of it.

4. **Decide what to do with the legacy `DailyProgress` "Log" path.** It
   predates the Enactment Model, writes outside the domain the current
   architecture describes, and shares the same silent-failure pattern as
   item 2. Sprint 6.0 should explicitly choose one of: retire it, quarantine
   it behind a clear "legacy" label, or adopt it on purpose as a stopgap
   Enacted Curriculum entry point until Post-Class Debrief exists — but the
   current state (live, undocumented in the current Information Model,
   silently lossy) shouldn't continue by default.

5. **Turn Lesson Session's `console.warn`-only save failures into a visible
   signal.** A teacher should never be in a state where the UI looks saved
   but a private-browsing or quota failure means it wasn't.

6. **Add a lightweight multi-tab guard to Lesson Session** (a
   `storage`-event listener that warns when another tab has since written
   the same session key) to stop silent last-write-wins clobbering.

7. **Add `LockService` around the `apps-script-planning` mutation
   functions**, matching the concurrency guard already standard practice in
   `apps-script-roster-admin`. Low effort, closes a real (if less likely)
   corruption path.

8. **Retire or gate the orphaned `moveLesson` action** in `Code.js` — it has
   no caller in the shipped frontend but remains a live, anonymously-postable
   mutation once item 1 is addressed it becomes moot, but until then it's
   extra unguarded surface for no product value.
