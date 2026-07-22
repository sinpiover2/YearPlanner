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
