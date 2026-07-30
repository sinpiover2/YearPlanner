# SPRINT 6.6 HANDOFF
**Year Planner — Amplify IM1 Curriculum Import: Archival Lifecycle and Guarded-Migration Safety (July 2026)**

---

# Layer 1 — 60-Second Startup

## Executive Summary

Sprints 6.1–6.6 built the complete Amplify Math 1 curriculum-import pipeline on top of Sprint 6.0's secure write path: a staged import artifact, a guarded IM1 importer, a guarded `Lessons` schema migration (`Type`/`PlacementRule`), and a guarded archival migration that hides superseded pre-Amplify IM1 units by default instead of migrating or deleting them (`Units.IsArchived`, corrected in Sprint 6.5 from an earlier `Active`-reuse design). Sprint 6.6 closed out a real production near-miss: a live run of the archival migration's editor wrapper "completed with no exception" and was reasonably read as success, when it had actually refused and written nothing. Every guarded migration's execute report now carries an explicit `success` boolean, and the editor wrapper throws on any non-success outcome so Apps Script visibly reports "Execution failed" instead of "Execution completed."

**None of this pipeline has been deployed or executed against production.** No `clasp push` has been run for any of these four Apps Script modules this sprint span. Production's `Units` sheet still has no `IsArchived` column, and the 9 legacy `IM1-U0`…`IM1-U8` units are still unarchived — confirmed directly by the incident's own `verifyUnitsArchiveMigration()` call. The project is otherwise healthy: `npm run build` passes, all 180 tests across `scripts/import-staging/*.test.mjs` pass, and the working tree is clean.

**This document also closes a bookkeeping gap**, the same kind Sprint 6.0's handoff called out for the sprint before it: no handoff had been written since Sprint 6.0 (Jul 28). Sprints 6.1–6.6 (Jul 29–30) shipped without individual handoffs; their outcomes are recorded in `docs/Development/AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md`'s "Sprint Progress" log and `docs/WORKFLOW/LESSONS_LEARNED.md`. This handoff covers all of them together, focused on the actual current stopping point.

## Current Repository State

- Branch: `main`
- `origin/main`: in sync as of session start — `HEAD` and `origin/main` both `4d7a5af` (already pushed)
- Working tree: **clean** at session start (only pre-existing, unrelated untracked `Curriculm/M1/Unit */Screenshots/` folders, not part of this or any prior sprint's tracked work)
- `npm run build`: passes (verified this session)
- `npm run lint`: 28 pre-existing, unrelated errors (unchanged since at least Sprint 6.5; not introduced by this work)
- `node --test scripts/import-staging/*.test.mjs scripts/import-staging/test.mjs`: **180/180 pass** (verified this session)
- This documentation-closeout task adds one commit on top of `4d7a5af`: workflow/context doc updates plus this handoff.

## Recent Commits (before this session's doc commit)

```
4d7a5af Make guarded-migration refusals impossible to mistake for success
1a93643 Use explicit IsArchived lifecycle field for Units
eb7a37f Archive legacy IM1 curriculum instead of migrating or deleting it
8946886 Add guarded legacy IM1 cleanup migration (not executed — blocked by real teacher data)
8e4943f Add safe Amplify import editor wrapper
```

## Current Stopping Point

The guarded-migration safety fix (Sprint 6.6) is complete, tested, committed, and pushed — but **not deployed**. `UnitsArchiveMigration.js` as it exists in the repository is safer than what is live in the Apps Script editor right now (the live editor still has the pre-6.6 plain-return-and-log wrapper, last touched by whatever state the incident run left it in). Nothing further should be built on the curriculum-import pipeline until the hardened version is actually deployed and the archival migration successfully executed — see First-Hour Plan.

## First-Hour Plan for Next Session

1. Read this handoff's Layer 1 only.
2. Confirm `git status` clean and `origin/main` in sync.
3. Open `apps-script-planning/UnitsArchiveMigration.js` in the Apps Script editor and confirm its current live state — specifically, confirm the placeholder confirmation string is in place (not left armed with the real phrase from the incident run) before doing anything else.
4. `clasp push` the hardened `UnitsArchiveMigration.js` (this sprint's fix) to the Apps Script project. This has never been pushed.
5. Follow the Guarded Production Migration Execution Procedure in `docs/WORKFLOW/DEVELOPMENT_WORKFLOW.md` exactly: preview → execute (via the now-hardened editor wrapper) → verify → restore placeholder → `clasp pull` → verify repository cleanliness.
6. Confirm in the frontend (Units workspace) that the 9 legacy IM1 units are now hidden by default and appear correctly under "Show Archived Curriculum."
7. Resume the rest of the Amplify IM1 pipeline (the importer itself, the Lessons schema migration) only after the archival migration is confirmed live — see Remaining Priorities.

## Permanent Reference

- `docs/Development/PROJECT_CONTEXT.md` — mission, philosophy, current priority order (updated this session)
- `docs/Development/CLASSROOM_READINESS.md`, Section A — Real Data / Curriculum, current status (updated this session)
- `docs/Development/AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md` — full sprint-by-sprint implementation log for the entire import pipeline, including this sprint's fix
- `docs/WORKFLOW/DEVELOPMENT_WORKFLOW.md` — now includes the Guarded Production Migration Execution Procedure (new this session)
- `docs/WORKFLOW/LESSONS_LEARNED.md` — Sprint 6.4/6.5/6.6 entries cover the archival-vs-delete decision, the `Active`→`IsArchived` correction, and the refusal-visibility fix

---

# Layer 2 — Reference

## What Shipped Across Sprints 6.1–6.6

**Curriculum import pipeline (Sprints 6.1, 6.2A, 6.2B).** Corrections to the Amplify IM1 unit-schema mapping and importer code (6.1); a guarded `Lessons` schema migration adding `Type`/`PlacementRule` columns, following the same preview/execute/verify/lock/backup shape as the Sprint 4 importer (6.2A); an adversarial safety review of that migration (6.2B). None deployed or executed against production.

**Legacy IM1 cleanup investigation (Sprint 6.3).** A guarded preview/execute/verify cleanup for the pre-Amplify `IM1-U*` rows was built, but its own preview against live production correctly found real, teacher-populated data — `RequiredDays`/`OptionalDays` on every superseded unit, plus populated `KeyOutcome`/`PlannedDays` and four real `DailyProgress` rows on `IM1-U1`'s lessons — with no destination on the corresponding `AMP-IM1-*` rows. The guard reported `safeToExecute: false` and deleted nothing, correctly. This is evidence to resolve (a data-migration or product decision), not a defect — `LegacyIm1CleanupMigration.js` remains built, unexecuted, and disarmed.

**Archive instead of delete (Sprints 6.4, 6.5).** Given Sprint 6.3's finding that the legacy/Amplify correspondence isn't reliably 1:1, the decision was to archive the legacy curriculum in place rather than force a migration or deletion call: zero data risk, hidden-by-default in the Units workspace via a "Show Archived Curriculum" toggle. Sprint 6.4 first implemented this by reusing `Sections.Active`'s naming/polarity; Sprint 6.5 corrected that to a dedicated `Units.IsArchived` field (opposite polarity — explicit `true` means archived) once review found `Active`'s domain meaning (operational availability) didn't actually match a unit's curriculum-lifecycle archival status. `Sections.Active` itself was never touched by either sprint. `UnitsArchiveMigration.js`'s schema classifier also treats a stray pre-existing `Active` column as its own explicit `unexpected` state rather than silently reinterpreting it, since the never-deployed 6.4 design could in principle have left one behind.

**Guarded-migration refusal visibility (Sprint 6.6).** See Executive Summary and `AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md`'s new Sprint 6.6 section for full detail. In short: a real production run of the archival migration's editor wrapper refused (most likely at the confirmation check) but "completed with no exception," which the Apps Script editor always reports as success regardless of the returned value. Every execute report now carries a `success` boolean computed once in one place, and the editor wrapper logs through both `Logger.log` and `console.log` and throws on any non-success outcome. This pattern is not yet applied to the other three guarded migrations' editor wrappers (`AmplifyIm1Importer.js`, `LessonsSchemaMigration.js`, `LegacyIm1CleanupMigration.js`) — apply it to any of them before their next real production run.

## Documentation Updated This Sprint (this session, as part of end-of-sprint closeout)

- `docs/WORKFLOW/DEVELOPMENT_WORKFLOW.md` — added "Guarded Production Migration Execution Procedure," generalizing the preview/execute/verify/restore-placeholder/`clasp pull`/verify-repository-cleanliness sequence that was previously only documented per-migration inside each module's own README.
- `docs/WORKFLOW/START_SPRINT.md` — replaced the stale Sprint 6.1 objective with Sprint 6.7's: deploy and execute the hardened `UnitsArchiveMigration.js`.
- `docs/Development/PROJECT_CONTEXT.md` — "Current Project Snapshot" and "Next Major Milestone" updated to describe the Sprint 6.1–6.6 import pipeline and its actual (undeployed) status, replacing the stale Sprint-6.0-only snapshot.
- `docs/Development/CLASSROOM_READINESS.md` — Section A's Integrated Math 1 checklist annotated with the tooling that now exists for both the import and the archival migration, and their actual (not-yet-executed) status.
- `docs/Development/AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md` — added the Sprint 6.6 section (this was already current through Sprint 6.5).
- `docs/WORKFLOW/LESSONS_LEARNED.md` — **not modified this session.** Its Sprint 6.4, 6.5, and 6.6 entries were already written (matching the lessons named for this closeout) and needed no correction on review.
- `docs/History/SPRINT_HANDOFF_6.6.md` — this document, new.

## Remaining Priorities (ranked)

1. **Deploy and execute `UnitsArchiveMigration.js`** — see First-Hour Plan. Blocks everything else in the import pipeline from mattering in production.
2. **Deploy and execute the `Lessons` schema migration and the Amplify IM1 importer itself** (Sprints 4, 6.2A) — structurally complete, locally tested only, never pushed.
3. **Resolve the Sprint 6.3 legacy-cleanup blocker** — a product decision on what to do with `IM1-U1`'s real `DailyProgress`/`KeyOutcome`/`PlannedDays` data before any legacy-row deletion can proceed; archival (above) does not require resolving this.
4. **Apply the Sprint 6.6 `success`-boolean-plus-throw pattern** to the three other guarded migrations' editor wrappers before their next real production run.
5. **Remaining Protect Teacher Work phases** (deferred since Sprint 6.0, not abandoned) — concurrency guard, local-save-failure visibility, multi-tab guard, canonical Enactment store, cross-device sync. Full detail: `docs/Architecture/SPRINT_6_0_ARCHITECTURE.md`.
6. **Classroom validation** (`CLASSROOM_READINESS.md` Section E) and **performance/workflow polish** (Sections B, C, D) — unchanged from prior sprints.

## Known Issues, Limitations, and Non-Goals

- No part of the Amplify IM1 import pipeline (importer, Lessons schema migration, archival migration) has ever been pushed to Apps Script or successfully executed against production. Do not assume any of Sprints 6.1–6.6 changed live data — they did not.
- The one real production interaction that occurred (the Sprint 6.6 incident) was a refused execution with `writesOccurred: false`, confirmed by `verifyUnitsArchiveMigration()`. Production is unchanged.
- The live Apps Script editor's current state for `UnitsArchiveMigration.js` was not re-verified as part of this documentation session (this task was documentation-only; no Apps Script access, no `clasp` commands were run). Confirm the placeholder is in place before running anything — see First-Hour Plan step 3.
- `LegacyIm1CleanupMigration.js` (Sprint 6.3) remains blocked on a real product decision about teacher-populated legacy data, not a tooling gap.
- The Sprint 6.6 safety fix (`success` boolean, dual-logger throw) is applied only to `UnitsArchiveMigration.js`. The other three guarded migrations still use the older plain-return-and-log pattern.
- Sprint 6.0's still-open items (concurrency guard, local-save-failure visibility, multi-tab conflict guard, Enactment store, cross-device sync) remain open and deferred, unchanged from `SPRINT_HANDOFF_6.0.md`.

## Lessons

See `docs/WORKFLOW/LESSONS_LEARNED.md` — Sprint 6.4 (archive rather than force a migration/deletion decision when correspondence isn't proven), Sprint 6.5 (reuse a field convention only when its domain meaning genuinely matches), and Sprint 6.6 (a guarded function returning normally is not a safe enough success signal for a manually-invoked production ceremony) for the narrative lessons from this sprint span. The procedural lesson — every guarded production migration should preview, execute, verify, restore the editor placeholder, `clasp pull`, and verify repository cleanliness, in that order — is now standing practice in `docs/WORKFLOW/DEVELOPMENT_WORKFLOW.md` rather than repeated here, per `HANDOFF_PROTOCOL.md`'s permanent-vs-sprint-specific distinction.
