# Classroom Readiness Checklist

> Purpose:
>
> This document tracks everything required before Year Planner is considered
> classroom-ready for daily use. It is intentionally teacher-centered rather
> than feature-centered.
>
> Guiding question:
>
> **"Can I confidently teach with this tomorrow?"**

---

# Current Status

**Overall Readiness:** 🟢 Core Workflow Complete — Real School Data Next

The following capabilities are now complete:

- Planning workflow
- Lesson Planner workflow
- Units workflow
- Forecast workflow
- Weekly Communication generation
- Planning workspace visual refinement
- Print workflow
- Classroom roster management (import, validation, and printing)

The core classroom workflow has now been exercised successfully, end to end:

Forecast → Units → Planning → Lesson Session → Print → Teach

Planning has been validated through actual teacher use by planning the first
week of school, including creation of the U0 – Class Orientation unit. This
confirms the workflow supports real classroom preparation, not just
theoretical use.

Optimistic UI is complete across Planning:

- Optimistic lesson creation is complete
- Optimistic lesson editing is complete
- Optimistic progress logging is complete
- Optimistic lesson deletion is complete
- Optimistic lesson reordering is complete

Weekly Communication (Section F) is now complete as a Planning-owned output
utility, closing the last of the three August 1 Success Criteria below.

Classroom roster management is now operational: production roster import
(from a staging sheet, with read-only audit and guarded cleanup tooling),
lesson + roster printing, standalone roster printing (single section or
multiple sections at once), and configurable print sorting (last name or
first name, remembered for the browser session) are all in place. See
Section A below for what's left before real class lists are loaded.

The remaining work is primarily real-data migration, performance, workflow
polish, and further classroom validation.

## Next Classroom Milestone: Load the Real School

**Next Classroom-Readiness Priority:** Real Data (see Section A) — the school
calendar and curriculum currently powering Planning and Weekly Communication
are working data, not yet the verified official import; roster import,
audit, cleanup, and printing tooling now exists, but real class lists have
not yet been loaded through it. This is the largest remaining gap between
"the workflow works" and "the workflow is trustworthy for daily use." Note
that `docs/Development/PROJECT_CONTEXT.md` now lists Protect Teacher Work
ahead of Real Data in overall project priority; this checklist tracks
classroom-readiness gaps specifically and remains accurate on its own terms.

**Active curriculum objective: Amplify Math 8.** With the Amplify IM1 import
pipeline generalized into a reusable, documented process
(`docs/Development/CURRICULUM_IMPORT_WORKFLOW.md`), the active curriculum
work is now extracting and importing Amplify Math 8 using that same
canonical workflow. Amplify IM1's own production import is **not yet
complete** — the `Lessons` schema migration and the importer itself remain
undeployed (see the Integrated Math 1 checklist below) — but it is no longer
the sprint-to-sprint focus; it is tracked as deferred, still-open work
rather than abandoned or considered finished.

Loading the real school means importing and verifying:

- actual student rosters
- actual course sections
- actual school calendar
- actual curriculum

After loading real data, Year Planner should be used to prepare the opening
weeks of instruction, and future improvements should come from actual
classroom experience rather than speculative features.

---

# August 1 Success Criteria

✓ Plan an instructional week.

✓ Teach from printed lesson plans.

✓ Generate weekly communication for students and families without retyping lesson information.

All three success criteria defined for Version 1 are now met.

---

# Sprint 5.7 Summary

Planning responsiveness work is complete. Lesson creation, editing, progress
logging, deletion, and reordering are all optimistic, so the teacher never
wonders whether a click worked. The workflow was validated by planning the
first week of school, including the U0 – Class Orientation unit. Planning is
now considered classroom-ready.

---

# A. Real Data

## School Calendar

### District Instructional Calendar

- [ ] Import official 2026�2027 school calendar
- [ ] Verify holidays
- [ ] Verify breaks
- [ ] Verify recurring weekly bell schedule patterns
- [ ] Verify session numbering
- [ ] Verify forecasting against the real calendar

### Site-Specific Schedule Overrides

- [ ] Verify site-specific days that override the recurring weekly schedule
- [ ] Verify minimum-day schedules
- [ ] Verify session numbering and forecasting remain correct on override days

---

## Curriculum

### Math 8 (active curriculum objective)

- [ ] Extract and import complete curriculum — using the canonical process in
      `docs/Development/CURRICULUM_IMPORT_WORKFLOW.md`, generalized from the
      Amplify IM1 pipeline built in Sprints 6.1–6.6
- [ ] Verify units
- [ ] Verify lessons
- [ ] Verify required instructional days
- [ ] Verify learning goals

### Integrated Math 1 (deferred, not abandoned)

- [ ] Import complete curriculum — guarded tooling now exists
      (`apps-script-planning/AmplifyIm1Importer.js`, `LessonsSchemaMigration.js`)
      for Amplify Math 1; this item is about running it against production, not
      building it. **Not yet deployed or executed.** No longer the active
      sprint objective (Math 8 is, above) — see
      `docs/History/SPRINT_HANDOFF_6.6.md`.
- [ ] Verify units
- [ ] Verify lessons
- [ ] Verify required instructional days
- [ ] Verify learning goals
- [x] Archive legacy pre-Amplify IM1 curriculum — executed successfully
      against production in Sprint 6.6
      (`apps-script-planning/UnitsArchiveMigration.js`): the `IsArchived`
      column now exists on the live `Units` sheet, all 9 legacy `IM1-U0`…
      `IM1-U8` units are archived (`verifyUnitsArchiveMigration()`:
      `archivedCount: 9`), and the Units workspace hides them by default
      behind a "Show Archived Curriculum" toggle. See
      `docs/History/SPRINT_HANDOFF_6.6.md`.

---

## Student Rosters

(When district data becomes available.)

- [ ] Import sections
- [ ] Import students — guarded tooling now exists
      (`apps-script-roster-admin/RosterImport.js`, `setupRosterImportSheetV1()` /
      `importRosterFromStaging()`); this item is about running it against the
      real class lists, not building it. See `apps-script-roster-admin/README.md`.
      Deactivating a dropped student's enrollment is not yet implemented.
      Read-only audit (`ProductionDataAudit.js`) and guarded cleanup
      (`ProductionDataCleanup.js`) tooling now exists to find and remove
      seeded/test data from the production spreadsheet before real rosters
      are trusted to be clean.
- [ ] Verify roster printing — printing itself is complete and shares one
      canonical renderer across standalone (single or multiple sections) and
      combined lesson + roster printing, with configurable last-name/first-name
      sorting; this item is about confirming it against real class lists once
      loaded, not building it. See `docs/Architecture/ROSTER_INFORMATION_MODEL.md`.
- [ ] Verify section assignments

---

# B. Performance

Goal:

The software should always acknowledge user actions immediately.

Teacher should never wonder:

> "Did my click work?"

## High Priority

- [ ] Add Lesson responds immediately
- [ ] Save responds immediately
- [ ] Log Lesson responds immediately
- [ ] Planning loads quickly
- [ ] Forecast updates quickly
- [ ] Print starts quickly

## UI Feedback

- [ ] Disable buttons while processing
- [ ] Progress indicators where appropriate
- [ ] Prevent accidental double-click operations

---

# C. Workflow Polish

These are not missing features.

They remove friction from daily planning.

## Lesson Editing

- [ ] Insert lesson above
- [ ] Insert lesson below
- [ ] Faster lesson reordering
- [ ] Collapse inactive lesson editors
- [ ] Keyboard shortcuts where appropriate

## Lesson Session

- [ ] Continue refining teaching workflow
- [ ] Improve episode management where classroom use suggests

---

# D. Print System

## Verify

- [ ] Lesson print
- [ ] Print Day
- [ ] Duplex lesson/roster pairing
- [ ] Episode formatting
- [ ] Notes page formatting
- [ ] Print performance

---

# E. Classroom Validation

Use Year Planner as if school has already started.

Complete at least one full planning cycle.

- [ ] Forecast
- [ ] Weekly Planning
- [ ] Lesson Session
- [ ] Print packets
- [ ] Teach from printed plans
- [ ] Reflect afterwards

Capture every point where the software slows down thinking or creates
uncertainty.

---

# F. Weekly Communication

Purpose:

Planning should let teachers generate a plain-language draft of the week's instructional communication — for students and families — directly from Lesson Sessions already authored in Planning, without retyping lesson information.

Ownership:

Weekly Communication is not a new workspace. It is a thin output utility owned by the Planning workspace, derived entirely from the instructional week Planning already displays. It does not become a publishing platform: it produces a draft; the teacher publishes it elsewhere. Full specification: `docs/Architecture/PLANNING_WORKSPACE.md`, Section 15.

Sprint 5.8 MVP Goals:

- [x] Eliminate duplicate data entry.
- [x] Reuse planning information already contained in Year Planner.
- [x] Generate a concise, parent-friendly draft using deterministic, template-based text generation only.
- [x] Support existing teacher workflows (Monday Manager via copy/paste).
- [x] Teacher reviews the generated draft before manually copying it into Monday Manager or another communication system.
- [ ] Entire workflow should take less than one minute. *(Not yet timed with a real week of authored lessons — confirm during Section E classroom validation.)*

Non-Goals (Sprint 5.8):

- [x] Not a new suite workspace or navigation destination beyond Planning.
- [x] Not a publishing or sending mechanism — nothing is transmitted automatically.
- [x] Not AI-assisted drafting — deferred as a possible future enhancement (see `docs/History/PROJECT_MILESTONES.md`).

Known Limitation:

Lesson Session content (episode titles, deliverables) is currently read from the same-browser localStorage implementation Planning already uses. The MVP may read this data as-is. This is a same-device limitation, not durable cross-device persistence, and is documented here as a known gap rather than solved by this sprint.

---

# Future Enhancements

Items intentionally deferred until after Version 1.

Examples include:

- Shared teaching episodes
- Reusable warmups
- Advanced episode library
- Mobile reflection capture
- AI-assisted planning
- Analytics
- Additional print options

These should be driven by actual classroom experience rather than prediction.

---

# Definition of Ready

Year Planner Version 1 is considered classroom ready when:

- Real calendar is loaded.
- Real curriculum is loaded.
- Real student rosters are loaded.
- Daily workflow is fast and dependable.
- Printing is reliable.
- Forecasting is trustworthy.
- The software disappears into the background, allowing teaching to become the focus.