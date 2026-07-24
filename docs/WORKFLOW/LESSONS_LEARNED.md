# Lessons Learned

## Purpose

This document records process lessons that came out of specific sprints and were significant enough to change how future sprints work.

It is not a changelog of features. Each entry should describe a lesson that generalizes beyond the sprint it came from — if a lesson only mattered once, it belongs in that sprint's handoff, not here.

---

## Sprint 5.6

- **Separate architectural analysis from implementation.** Reconciling an architecture document and editing it are different activities. Producing the analysis first — before any text changes — made the proposed changes reviewable on their own and easier to approve or reject individually. This became the Architecture Reconciliation Workflow in DEVELOPMENT_WORKFLOW.md.
- **Perform a QA review before committing architecture changes.** After applying approved changes, re-reading the document for internal consistency and terminology drift caught issues that reviewing the proposal alone would have missed.
- **Regenerate AI prompts completely rather than issuing incremental edits.** Treating a generated prompt as disposable — and regenerating it whole on revision — kept prompts self-contained and copy-paste ready, instead of accumulating patch instructions that were easy to apply inconsistently.
- **Small, focused commits simplify review and rollback.** Committing one logical change at a time made it straightforward to review each change on its own and to roll back a single step without affecting unrelated work.

---

## Sprint 5.7

- **Validate architecture by using the software as a teacher.** Planning the first week of school with Year Planner, including the U0 – Class Orientation unit, surfaced real workflow gaps that theoretical review had not.
- **Classroom workflows expose better design improvements than speculative feature planning.** Working through an actual planning cycle end to end was more productive than reasoning about hypothetical teacher needs in the abstract.
- **Optimistic UI dramatically improves planning responsiveness.** Making lesson creation, editing, progress logging, deletion, and reordering optimistic removed the moments where the teacher had to wonder whether a click had worked.
- **Complete entire teacher workflows before declaring features finished.** A feature is not done when the code is correct in isolation — it is done when it has been exercised as part of the full Forecast → Units → Planning → Lesson Session → Print → Teach workflow.
- **Keep project documentation naming conventions consistent.** Consistent naming across workflow and readiness documents reduces the time it takes to find the right document at the start of a sprint.
- **Defer reusable abstractions until classroom experience demonstrates the need.** Features like Copy Unit and a richer Teaching Episode content model were deliberately deferred rather than built speculatively, keeping the sprint focused on what classroom use had actually shown was needed.
