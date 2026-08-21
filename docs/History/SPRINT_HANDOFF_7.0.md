# Sprint 7.0 Handoff

**Year Planner — Classroom workflows shipped; access and persistence safety next (August 21, 2026)**

---

# Layer 1 — 60-Second Startup

## Status

Sprint 7.0 reviewed the teacher's accumulated notes through short lettered
choices, then shipped three complete classroom workflows: cross-day Lesson
Session reuse, guarded roster spreadsheet updates, and assignment-first
Deliverables entry for Synergy. The live product is functioning and 50 Lesson
Sessions were successfully recovered after a browser-storage incident. The next
sprint must secure public production access and design durable Lesson Session
persistence before adding more features.

## Repository State

- Branch: `main`
- Ahead/behind `origin/main`: 0/0 before closeout commits
- Latest pre-closeout commit: `52da5c2` (`Show in-place deliverables copy feedback`)
- Protected tracked edit: `docs/History/BUILD_LOG.md` remains an unrelated user
  change; do not stage, normalize, or overwrite it.
- Protected untracked work: `.obsidian/`, `docs/Assets/`, M1 screenshot/source
  folders, `Curriculm/M8/Unit 1` through `Unit 8`, `frontend/.netlify/`, and
  `tmp/` (including Lesson Session recovery artifacts).

## Recent Commits

```text
52da5c2 Show in-place deliverables copy feedback
663b086 Verify assignment-first deliverables workflow
2189d88 Add assignment-first deliverables view
c8cb374 Document lesson storage recovery need
ed6ea59 Back up browser sessions before recovery
```

## Current Stopping Point

- Production: `https://boisterous-yeot-16920e.netlify.app/`
- Latest production deploy: `6a88d6aab14d3afea05741c8`.
- Frontend: 88/88 tests pass; targeted Deliverables lint and Vite production
  build pass. Teacher verified assignment grouping, course filtering, remembered
  preferences, period-specific controls, and in-place `✓ Copied` feedback.
- Netlify project visibility is public. The anonymous planning read feed does
  not include student rosters, but the production Vite bundle contains the
  current planning write token. Do not share the URL; the first Sprint 7.1
  decision is a secure access boundary followed by token rotation.
- Lesson Sessions remain browser-local. Recovery restored 50 production
  sessions (10 per active class, August 6–21). The validated JSON is in
  Downloads; LevelDB snapshot and generated recovery JSON remain under `tmp/`.
- Roster manager production version 29 successfully applied 34 reviewed changes
  (15 additions, 19 removals) after creating its safety backup.

## First-Hour Plan

1. Preserve every protected dirty/untracked path above and verify branch/origin
   parity.
2. Read `docs/WORKFLOW/START_SPRINT.md`; explain the public write-token risk in
   plain language and present lettered access choices.
3. Approve one secure-access slice with rollback and token rotation; do not
   change production before approval.
4. Separately review durable Lesson Session persistence: canonical server
   source, local cache, visible save state, conflict policy, and export/restore.
5. Implement at most the explicitly approved first slice and verify it in the
   teacher's SVUSD Chrome profile.

## Permanent References

- `docs/Development/PROJECT_CONTEXT.md`
- `docs/Architecture/PRINCIPLES.md`
- `docs/Architecture/LESSON_PLANNER_INFORMATION_MODEL.md`
- `docs/Architecture/ROSTER_INFORMATION_MODEL.md`
- `docs/WORKFLOW/DEVELOPMENT_WORKFLOW.md`
- `docs/WORKFLOW/LESSONS_LEARNED.md`

---

# Layer 2 — Reference

## Sprint Accomplishments

### Reviewed backlog and decision protocol

The raw Obsidian task-board notes were preserved, clarified topic by topic, and
converted into a reviewed Sprint 7.0 backlog. Short lettered choices became the
standing collaboration protocol, reducing the effort required for frequent
teacher decisions.

### Cross-day Lesson Session reuse

Lesson plans can be copied to same-course sessions on later days, including
block-schedule destinations not visible in the source day's column. Copies
receive independent episode identities, destination-appropriate due dates, and
do not inherit Synergy completion state.

### Guarded roster spreadsheet round trip

The authenticated roster manager now supports spreadsheet export/edit/import,
complete-batch validation, explicit previews, stable identities, stale-preview
detection, locking, and a pre-write safety backup. The real 34-change production
run completed successfully.

### Synergy Deliverables workflow

Planning opens a separate Deliverables window for side-by-side Synergy entry.
It supports due dates, title/date copying, per-period `Entered in Synergy`
status, course filtering, remembered class/assignment views, exact-title
assignment grouping, and immediate copy confirmation. All metadata currently
travels with the browser-local Lesson Session.

### Browser-data recovery

When plans appeared empty after the hosting-access change, the sprint stopped
new entry, made a read-only Chrome storage snapshot, extracted and validated 50
production sessions, built a same-origin file-based recovery page, backed up
the browser's visible state, and restored every session. The incident produced
permanent browser-storage and hosting-visibility safety checks.

## Remaining Priorities

1. **Critical — secure production access and rotate the planning write token.**
   The public Vite bundle cannot serve as a secret-bearing authorization
   boundary.
2. **Critical — durable Lesson Session persistence and recovery.** Define one
   canonical server source, safe local caching/offline behavior, visible save
   status, conflict handling, and export/restore.
3. Review the remaining task-board notes before prioritizing another feature:
   week-view lesson deletion, visible deliverable separation/due-date hover,
   Lesson Takeaways, curriculum action-menu cleanup, preparation/photocopy PDF
   workflow, and printed-roster polish.
4. Remove or retire the temporary recovery page only after durable persistence
   and a supported restore path are live.

## Known Issues, Limitations, and Non-Goals

- Do not share the public Netlify URL until the write boundary is fixed.
- `VITE_PLANNING_WRITE_TOKEN` is embedded in the production client bundle by
  design; gitignoring `.env` does not keep a Vite client value secret.
- Lesson Sessions, deliverable due dates, and Synergy status still depend on the
  exact browser profile and origin. The recovery artifacts are safety copies,
  not a supported synchronization system.
- Exact-title grouping intentionally does not merge similar or differently
  cased assignment titles. Manual grouping is deferred.
- The temporary recovery page accepts only a teacher-selected local JSON file;
  it does not upload or publicly embed recovered lesson content.
- Chrome Split View can steal typing focus; two ordinary side-by-side Chrome
  windows remain the classroom workaround.
- Preserve the unrelated BUILD_LOG edit, Obsidian files, curriculum sources,
  screenshots, assets, local Netlify metadata, and recovery files.
