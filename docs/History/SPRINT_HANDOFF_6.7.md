# Sprint 6.7 Handoff

**Year Planner — Amplify Math 8 imported; planning-time deployment next (August 2026)**

---

# Layer 1 — 60-Second Startup

## Status

Sprint 6.7 completed the guarded production import of the supplied Amplify
Math 8 curriculum: 8 canonical Units and 163 Lesson/items now exist in
production, and 9 legacy Math 8 Units are archived while their 50 Lessons and
historical records remain intact. Production verification passed, and the
running Units UI displayed the new curriculum correctly. The publisher source
contained summaries but no unit or item durations; those values correctly
remain `Not planned`. The next sprint deploys the already-committed summary
display and teacher-owned Unit-time editor, then begins real planning-time
entry.

## Repository State

- Branch: `main`
- Latest code commit: `f1c5199` (`Harden Unit planning updates`)
- Ahead of `origin/main`: 2 commits after the handoff documentation commit
- Tracked working tree: unrelated user edit in
  `docs/Development/VERSION_1_TASK_BOARD.md`; preserve it
- Untracked user/source work: `.obsidian/`, `docs/Assets/`, M1 screenshots,
  and `Curriculm/M8/Unit 1` through `Unit 8`; do not stage or modify

## Recent Commits

```text
f1c5199 Harden Unit planning updates
6ee8830 Add Unit planning time editor
d269ba7 Show Math 8 publisher lesson summaries
04f56c1 Fix Math 8 Courses execution validation
456db8b Add disarmed Math 8 archive live adapters
```

## Current Stopping Point

- Production spreadsheet: Math 8 import verified (8 Units, 163 items, zero
  stale); legacy archive verified (9 Units archived, 50 Lessons preserved).
- Import backup:
  `1gboywAh2huAq3Nb7SBTqrguKcurnlnBJufnf23jpN6I`.
- Apps Script HEAD: restored to committed source after production execution;
  all Math 8 importer and legacy-archive entry points are `DISARMED`.
- GitHub: `d269ba7` and `6ee8830` are pushed; `f1c5199` is local only.
- Production deployments do **not** yet include the publisher-summary fallback
  or Unit-time editor/backend. Do not describe those features as live.
- Latest verification: frontend 74/74, staging/import/migration 246/246,
  scoped ESLint passed, production build passed.

## First-Hour Plan

1. Preserve the unrelated dirty/untracked files listed above and fetch origin.
2. Review the three-commit presentation/time slice
   (`d269ba7..f1c5199`), especially authenticated request construction,
   CourseID + UnitID identity, rollback, and decimal policy.
3. Push the reviewed local work and handoff documentation.
4. Deploy the additive Apps Script `updateUnitPlanning` action through the
   existing production deployment; do not arm or invoke any importer or
   migration.
5. Deploy the matching frontend to the existing Netlify site and perform
   read-only UI verification.
6. Separately authorize one real Unit-time save, reload, and confirm it
   persisted before entering additional planning estimates.

## Permanent References

- `docs/Development/PROJECT_CONTEXT.md`
- `docs/Development/CURRICULUM_IMPORT_WORKFLOW.md`
- `docs/Architecture/CURRICULUM_INFORMATION_MODEL.md`
- `docs/WORKFLOW/DEVELOPMENT_WORKFLOW.md`
- `docs/Development/CLASSROOM_READINESS.md`

---

# Layer 2 — Reference

## Sprint Accomplishments

The complete supplied Math 8 source (Units 1–8) was extracted and validated
without inventing missing values. A deterministic schema-2.0 artifact and
guarded preview/execute/verify pipeline preserved literal publisher types,
nullable evidence status, fixed/flexible placement, and teacher-owned fields.
The production import created exactly 8 Units and 163 items with no updates or
deletions. Its standalone verification reported valid with zero stale rows.

Before import, a dedicated guarded migration archived exactly `M8-U0` through
`M8-U8`. It preserved all 50 linked Lessons and every historical record. The
frontend was also hardened so archived curriculum is excluded from active
navigation and forecasting while saved historical references remain
resolvable.

Live UI review exposed two honest post-import states: publisher summaries were
stored in `Description` but the old UI did not display them, and durations
were unknown because the publisher never supplied them. The summary fallback
and teacher-owned Unit-time editor are implemented and committed. Review then
strengthened the time editor's authenticated request tests, decimal policy,
and optimistic CourseID + UnitID identity/rollback behavior.

## Remaining Priorities

1. **Review, push, and deploy the summary/time slice** (`d269ba7`, `6ee8830`,
   `f1c5199`), including Apps Script version/deployment update and the existing
   Netlify site.
2. **Verify one real Unit-time save end to end**, including reload, before
   entering the remaining teacher estimates.
3. **Enter Math 8 planning time deliberately:** Unit required/optional days in
   Units; individual `PlannedDays` through each Lesson's Edit control (half-day
   increments). These are teacher estimates, not publisher facts.
4. **Review publisher summaries and add teacher learning goals where useful.**
   Imported `Description` supports reference; it does not replace teacher-
   authored `KeyOutcome`.
5. **Finish deferred Amplify IM1 production work** when Math 8 planning is
   stable; its guarded tooling remains separate and must not be inferred
   complete from Math 8's success.

## Known Issues, Limitations, and Non-Goals

- Authoritative Math 8 course completeness remains unconfirmed because no
  publisher course overview/index was supplied. The user explicitly accepted
  that limitation for the Units 1–8 production import.
- RequiredDays, OptionalDays, and PlannedDays were confirmed absent from the
  supplied Math 8 source. Do not backfill them by pattern or call teacher
  estimates publisher data.
- The Unit-time UI/backend is committed but not deployed. Production still
  runs the prior frontend and Apps Script web-app version.
- Publisher summaries are imported in `Description`; teacher learning goals
  remain `KeyOutcome` and may still be blank.
- No permanent deletion of legacy Math 8 data occurred or is planned.
- The unrelated task-board, Obsidian, assets, screenshots, PDFs, and extraction
  sources are user-owned work outside this handoff's commit scope.
