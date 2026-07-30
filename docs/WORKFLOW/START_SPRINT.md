# Start Sprint

## Sprint 6.7 Objective

**Primary objective:** Deploy and execute `UnitsArchiveMigration.js` against
production — the guarded migration is now hardened (Sprint 6.6: an execute
report carries an explicit `success` boolean, and the editor wrapper throws
on any non-success outcome instead of returning quietly) but has never
actually been pushed to Apps Script or successfully run. Production's
`Units` sheet still has no `IsArchived` column and the 9 legacy `IM1-U0`…
`IM1-U8` units are still unarchived. Follow the Guarded Production Migration
Execution Procedure in `DEVELOPMENT_WORKFLOW.md` exactly (preview → execute →
verify → restore placeholder → `clasp pull` → verify repository cleanliness).
See `docs/History/SPRINT_HANDOFF_6.6.md` for full context and the first-hour
plan.

---

## 1. Read the Handoff (under 60 seconds)

- [ ] Read the latest sprint handoff — Layer 1 (60-Second Startup) only
- [ ] Confirm today's sprint goal

---

## 2. Orient

- [ ] Review DEVELOPMENT_WORKFLOW.md for any process changes since last sprint
- [ ] Review CLASSROOM_READINESS.md — the current execution document — for the active priority
- [ ] Review PROJECT_MILESTONES.md for the current long-term target
- [ ] Review the workflow improvements recorded in the previous sprint's retrospective

---

## 2a. If This Sprint Includes Architecture Work

- [ ] Identify the canonical architecture documents that govern the area being changed (start from `ARCHITECTURE_INDEX.md`)
- [ ] Perform reconciliation before editing — see the Architecture Reconciliation Workflow in DEVELOPMENT_WORKFLOW.md
- [ ] Do not make architecture changes before that review is complete

---

## 3. Verify Repository

- [ ] git status clean
- [ ] Determine current branch
- [ ] If not on main, determine whether the sprint branch should be merged before starting new work
- [ ] main up to date
- [ ] Review recent commits if needed

---

## 4. Open Development Environment

- [ ] 🟩 DEV server running
- [ ] 🟨 BUILD terminal ready
- [ ] 🔵 PROJECT terminal ready
- [ ] 🔴 GIT terminal ready

---

## 5. Validate Build

- [ ] npm run build passes
- [ ] Launch local application
- [ ] Confirm current stopping point

---

## 6. Begin Work

- [ ] Execute the First-Hour Plan from the handoff

---

## Implementation Status Tracking

Track every unit of work with one of the following statuses:

- **PLANNED** — scoped, not yet started
- **IMPLEMENTED** — working tree only; not yet verified
- **BUILT** — production build passes
- **BROWSER TESTED** — verified in a running browser
- **DEPLOYED** — deployed to the relevant environment (e.g. Apps Script)
- **COMMITTED** — committed to git
- **PUSHED** — pushed to GitHub

IMPLEMENTED means working tree only. It is not considered complete until the appropriate verification steps (BUILT, BROWSER TESTED, DEPLOYED, as applicable) are finished.

---

## Principle

These workflow documents are living documents.

Every sprint should be easier to start than the last one. If anything in this checklist caused friction today, improve the document before ending the sprint — not "next time."
