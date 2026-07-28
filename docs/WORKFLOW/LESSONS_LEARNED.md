# Lessons Learned

## Purpose

This document records process lessons that came out of specific sprints and were significant enough to change how future sprints work.

It is not a changelog of features. Each entry should describe a lesson that generalizes beyond the sprint it came from — if a lesson only mattered once, it belongs in that sprint's handoff, not here.

---

## Sprint 6.0

- **An Apps Script web app's "who has access" deployment setting is all-or-nothing across `doGet` and `doPost` — per-operation authorization has to live in application code.** Sprint 6.0 needed anonymous reads to keep working while writes required authorization. The deployment's access level (`ANYONE_ANONYMOUS` in `appsscript.json`) is one setting for the whole web app; there is no deployment-level way to make GET anonymous and POST authenticated. The fix was a shared token checked inside `doPost` itself (`isAuthorizedWrite_`, failing closed when unconfigured), leaving the deployment's access level untouched. Any future Apps Script endpoint in this codebase that needs mixed read/write trust levels should reach for this pattern first, not a deployment-setting change.
- **`mode: "no-cors"` was never required against this Apps Script deployment, and it silently defeats failure detection.** Three of `apps-script-planning`'s five write actions used `fetch(..., { mode: "no-cors" })`, which makes the response opaque — the caller cannot read `ok`/`error`, and `fetch()` only rejects on a network-level failure, never on an application-level one. The other two write actions in the same file already proved a real, readable cross-origin `fetch()` works fine here, because `Content-Type: text/plain;charset=utf-8` keeps the request a CORS "simple request" that never triggers a preflight (which Apps Script can't answer — it implements no `doOptions`). `no-cors` was solving a problem that didn't exist and hiding every server-side failure in the process. Prefer a real fetch with an explicit, preflight-safe `Content-Type` over `no-cors` for any future Apps Script write.
- **Validate write-reliability changes against a local mock of the real contract, not just the live endpoint, when the live endpoint is shared production data with no delete path for some of what it stores.** `DailyProgress` rows have no delete/undo path anywhere in the codebase, so a live test write would have left permanent test residue in the production spreadsheet, and the updated Apps Script couldn't be deployed and tested live without `clasp` installed. A small local HTTP server mirroring `doPost`'s exact contract (including the new token check) let the actual `fetch`/error-handling logic be exercised end-to-end — success, wrong-token rejection, application-level failure, and network failure — without touching production data or requiring a deployment first.

## Sprint 5.9

- **Reserve new architecture documents for substantial subsystems with their own responsibilities and boundaries; document cross-cutting infrastructure through a suite-level cross-reference instead.** Resolving D5 (calendar/schedule resolution ownership) initially proposed a standalone architecture document modeled on the suite's per-perspective documents. On reconciliation, a short cross-reference in `SUITE_ARCHITECTURE.md` — the same treatment already used for Weekly Communication — was sufficient: the concern was shared infrastructure beneath the existing workspaces, not a new perspective or information domain. A new document is warranted only when a concept carries enough independent responsibility, boundaries, and design decisions to need one; otherwise a cross-reference keeps architecture documentation from growing faster than the system it describes.
- **When Apps Script code changes are intended for production, verify that the production deployment serving the frontend has been updated — not merely that a new Apps Script version exists.** Apps Script versions and deployments are distinct: creating a new version does not move a `USER_DEPLOYING`/`MYSELF` web app deployment's execution to that version by itself. Confirming the frontend's deployment URL is actually running the intended version belongs in the same verification step as the build check, not assumed from `clasp push`/`clasp version` succeeding.

## Sprint 5.8

- **A written design principle should win over a literal mockup when the two conflict.** Several choices this sprint (a short blue tick instead of the mockup's full border, uppercase eyebrow casing matching the app's existing convention instead of the mockup's lowercase) came from following the brief's stated intent rather than copying pixels. Treat visual references as direction, not specification, whenever the brief says so explicitly.
- **Sequential, narrowly-scoped polish passes catch different problems than the implementation pass.** The first visual pass fixed palette and card language; a second pass (prompted by an explicit information-hierarchy spec) found tier mismatches invisible during implementation; a third, time-boxed "designer's pass" found consistency and spacing issues neither prior pass surfaced. One "make it good" pass is not equivalent to several short, differently-focused review passes.
- **If a referenced visual attachment doesn't actually arrive, say so before comparing against it.** When asked to compare an implementation against "the attached screenshot" and no image was present in that turn, the right move was to state that plainly and fall back to the last screenshot actually provided — not to silently proceed as though nothing were missing.

### Identify the Owning Surface

When correcting visual appearance, identify the single component or surface that actually owns the visible color before modifying multiple child components. Prefer one authoritative change over compensating adjustments across many selectors.

### Verify the Live UI

Always compare against the live running application rather than relying solely on screenshots. Screenshots can become stale and lead to unnecessary implementation work.

### Commit Complete Vertical Slices

Commits should represent complete, working features. Avoid committing isolated CSS or JSX changes that temporarily leave the application in an inconsistent state.

### Classroom Readiness Changes the Acceptance Test

As the project approaches deployment, the primary acceptance criterion is no longer "the feature works."

It is:

"The feature enables successful preparation and teaching of a real instructional week."

Future design decisions should prioritize classroom workflow over adding new functionality.

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
