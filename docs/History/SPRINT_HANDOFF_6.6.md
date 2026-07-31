# SPRINT 6.6 HANDOFF
**Year Planner — Amplify IM1 Pipeline Proven → Sprint 6.7: Amplify Math 8 (July 2026)**

---

# Layer 1 — 60-Second Startup

## Status

Sprint 6.6 fixed a real production near-miss (a refused guarded migration read as "Execution completed") and then proved the fix for real: `UnitsArchiveMigration.js` deployed and executed successfully against production. That pipeline shape has since been generalized into permanent, curriculum-agnostic process documentation. **Sprint 6.7 pivots to applying it to Amplify Math 8.** Amplify IM1's own import is not finished — the `Lessons` schema migration and the importer itself remain undeployed — but that work is deferred, not this sprint's focus. The project is otherwise healthy: `npm run build` passes, 180/180 tests pass, working tree clean.

## Repository State

- Branch: `main`, in sync with `origin/main`
- Working tree: clean (only pre-existing, unrelated untracked `Curriculm/M1/Unit */Screenshots/` and `Curriculm/M8/` folders)
- Recent commits:
  ```
  e2c2012 Generalize curriculum import methodology; pivot Sprint 6.7 to Math 8
  d1a812b Correct Sprint 6.6 docs: UnitsArchiveMigration did execute in production
  0c4fce3 Complete Sprint 6.6 end-of-sprint documentation and handoff
  4d7a5af Make guarded-migration refusals impossible to mistake for success
  1a93643 Use explicit IsArchived lifecycle field for Units
  ```

## Current Stopping Point

`UnitsArchiveMigration.js` is complete and verified in production — the `IsArchived` column exists on the live `Units` sheet, all 9 legacy `IM1-U0`…`IM1-U8` units are archived, confirmed by `verifyUnitsArchiveMigration()`. Nothing further is needed on it beyond the housekeeping check in Remaining Priorities. Amplify IM1's `Lessons` schema migration and the importer itself remain structurally complete and locally tested only — never deployed. **Sprint 6.7's actual work has not started yet** — no Amplify Math 8 source material has been obtained or extracted.

## Sprint 6.7 Objective

Extract and import the Amplify Math 8 curriculum using
`docs/Development/CURRICULUM_IMPORT_WORKFLOW.md` — the canonical process
generalized from the Amplify IM1 pipeline. Full detail:
`docs/WORKFLOW/START_SPRINT.md`.

## First-Hour Plan

1. Read this handoff (Layer 1 only).
2. Read `docs/Development/CURRICULUM_IMPORT_WORKFLOW.md` — the canonical process this sprint follows.
3. Verify the current application state (`git status` clean, `npm run build` passes, `origin/main` in sync).
4. Begin Amplify Math 8 curriculum extraction — `CURRICULUM_IMPORT_WORKFLOW.md` steps 1–3 (obtain source, extract, validate against source) before writing any staging or import code.

## Permanent Reference

- `docs/Development/CURRICULUM_IMPORT_WORKFLOW.md` — the canonical curriculum import process; read before beginning Math 8 extraction
- `docs/Development/PROJECT_CONTEXT.md` — mission, philosophy, current priority order
- `docs/Development/CLASSROOM_READINESS.md`, Section A — Real Data / Curriculum, current status
- `docs/WORKFLOW/DEVELOPMENT_WORKFLOW.md` — Guarded Production Migration Execution Procedure
- `docs/WORKFLOW/LESSONS_LEARNED.md` — Sprint 6.4–6.6 entries
- `docs/Development/AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md` — full IM1 sprint-by-sprint log (IM1-specific; Math 8 follows the generalized workflow document above, not this log)

---

# Layer 2 — Reference

## Sprint Accomplishments

Sprint 6.6 began with a real production near-miss: a live run of the archival migration's editor wrapper "completed with no exception" and was reasonably read as success, when it had actually refused and written nothing — an Apps Script function that returns normally is always reported as "Execution completed," regardless of what the returned value says. The fix: every guarded execute report now carries an explicit `success` boolean, and the editor wrapper throws on any non-success outcome so a refusal is visibly reported as a failure. With that fix in place, `UnitsArchiveMigration.js` ran successfully against production — backup created, `IsArchived` column added, all 9 legacy IM1 units archived, verified by `verifyUnitsArchiveMigration()`.

Across Sprints 6.1–6.6, the same guarded preview/execute/verify/lock/backup/revalidation-pass shape proved itself repeatedly (schema migration, importer, cleanup investigation, archival migration) — reusable infrastructure that paid for itself more than any single migration's own logic. That shape, plus the surrounding process (extraction, validation, publisher/teacher field ownership, archive-not-delete), is now generalized into `docs/Development/CURRICULUM_IMPORT_WORKFLOW.md`. Full sprint-by-sprint detail: `docs/Development/AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md`. Generalized lessons: `docs/WORKFLOW/LESSONS_LEARNED.md`, Sprint 6.6 entries.

## Remaining Priorities (ranked)

1. **Extract and import Amplify Math 8** using `docs/Development/CURRICULUM_IMPORT_WORKFLOW.md` — Sprint 6.7's actual objective.
2. **Confirm this repository checkout's `UnitsArchiveMigration.js` reflects the restored-placeholder `clasp pull`** — a quick check, not a redo of the migration.
3. **Finish Amplify IM1's own production import when capacity allows** (deploy and execute the `Lessons` schema migration and the Amplify IM1 importer itself — structurally complete, locally tested only) — deferred behind Math 8, not abandoned. No IM1 curriculum data exists in production until this happens.
4. **Resolve the Sprint 6.3 legacy-cleanup blocker** — a product decision on `IM1-U1`'s real `DailyProgress`/`KeyOutcome`/`PlannedDays` data before any legacy-row deletion can proceed.
5. **Apply the Sprint 6.6 `success`-boolean-plus-throw pattern** to the three other guarded migrations' editor wrappers before their next real production run.
6. **Remaining Protect Teacher Work phases** (deferred since Sprint 6.0) — concurrency guard, local-save-failure visibility, multi-tab guard, canonical Enactment store, cross-device sync. Detail: `docs/Architecture/SPRINT_6_0_ARCHITECTURE.md`.
7. **Classroom validation and performance/workflow polish** — `docs/Development/CLASSROOM_READINESS.md`, Sections B–E.

## Known Issues, Limitations, and Non-Goals

- Only `UnitsArchiveMigration.js` has run against production. `AmplifyIm1Importer.js`, `LessonsSchemaMigration.js`, and `LegacyIm1CleanupMigration.js` have not — do not assume any of them changed live data.
- This repository checkout's copy of `UnitsArchiveMigration.js` has not changed since commit `4d7a5af` — no new commit, no working-tree diff, unchanged file mtime. Confirm it matches Apps Script HEAD before trusting it as proof of the live source (see Remaining Priorities #2).
- `LegacyIm1CleanupMigration.js` is blocked on a real product decision about teacher-populated legacy data, not a tooling gap.
- The `success`-boolean-plus-throw safety pattern is applied only to `UnitsArchiveMigration.js` so far.
- Sprint 6.0's still-open items (concurrency guard, local-save-failure visibility, multi-tab conflict guard, Enactment store, cross-device sync) remain deferred, unchanged from `SPRINT_HANDOFF_6.0.md`.

## Lessons

See `docs/WORKFLOW/LESSONS_LEARNED.md` — Sprint 6.4–6.6 entries cover the archive-vs-delete decision, the `Active`→`IsArchived` naming correction, the refusal-visibility fix, and five generalized lessons from the whole 6.1–6.6 import-pipeline effort (extraction as its own deliverable, phase separation, archive-over-migrate-or-delete, reusable guarded-migration infrastructure, and never rounding "locally tested" up to "complete" in permanent documentation). The generalized *process itself* now lives in `docs/Development/CURRICULUM_IMPORT_WORKFLOW.md`, not here.
