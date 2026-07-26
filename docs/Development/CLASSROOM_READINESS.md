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

**Overall Readiness:** 🟢 Weekly Communication Complete — Real Data Next

The Planning milestone has been successfully completed. The core classroom
workflow has now been exercised successfully, end to end:

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

The remaining work is primarily real-data migration, performance, workflow
polish, and further classroom validation.

**Next Classroom-Readiness Priority:** Real Data (see Section A) — the school
calendar, curriculum, and rosters currently powering Planning and Weekly
Communication are working data, not yet the verified official import. This
is the largest remaining gap between "the workflow works" and "the workflow
is trustworthy for daily use."

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

- [ ] Import official 2026�2027 school calendar
- [ ] Verify holidays
- [ ] Verify breaks
- [ ] Verify minimum days
- [ ] Verify bell schedule patterns
- [ ] Verify session numbering
- [ ] Verify forecasting against the real calendar

---

## Curriculum

### Math 8

- [ ] Import complete curriculum
- [ ] Verify units
- [ ] Verify lessons
- [ ] Verify required instructional days
- [ ] Verify learning goals

### Integrated Math 1

- [ ] Import complete curriculum
- [ ] Verify units
- [ ] Verify lessons
- [ ] Verify required instructional days
- [ ] Verify learning goals

---

## Student Rosters

(When district data becomes available.)

- [ ] Import sections
- [ ] Import students
- [ ] Verify roster printing
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