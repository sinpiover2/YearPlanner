# Sprint 6.8 Handoff

**Year Planner — Math 8 planning and pacing complete; IM1 goal spreadsheet next (August 2026)**

---

# Layer 1 — 60-Second Startup

## Status

Sprint 6.8 completed Math 8 planning-time entry, source-grounded learning
goals, official calendar alignment, and section-specific pacing. Production
now contains 303 verified goals across all 163 active Math 8 items and 417
required-item pacing rows across `M8-P1`, `M8-P2`, and `M8-P3`. Apps Script
version 31 and the matching Netlify frontend expose that pacing read-only in
Planning; protected-production visual verification passed. The next sprint
uses a spreadsheet-first process to add the missing goals for all 164 active
Integrated Math 1 items efficiently.

## Repository State

- Branch: `main`
- Ahead/behind `origin/main`: 0/0 at handoff preparation
- Latest pushed commit: `ba97cc0` (`Record SectionPacing application deployment`)
- Tracked working tree: unrelated user edits in
  `docs/Development/VERSION_1_TASK_BOARD.md` and
  `docs/History/BUILD_LOG.md`; preserve both
- Untracked user/source work: `.obsidian/`, `docs/Assets/`, all listed M1
  screenshot folders, and `Curriculm/M8/Unit 1` through `Unit 8`; do not stage,
  modify, move, or discard

## Recent Commits

```text
ba97cc0 Record SectionPacing application deployment
49114f6 Project section pacing into planning
7651448 Record verified pacing import
24ab35a Normalize pacing verification types
43c5b3f Require pacing import backup
```

## Current Stopping Point

- Math 8 active curriculum: 8 Units, 163 items, 303 goals; every item has at
  least one goal, 120 have multiple goals, and the maximum is three.
- Math 8 production pacing: 417 rows, 139 per section; required items only.
  Twenty-four optional items, eight additional assessment days, and 15 buffer
  meetings remain intentionally outside the initial sequence.
- Apps Script production: immutable version 31 on the existing deployment;
  direct API read-back returned all 417 rows.
- Netlify production: deploy `6a81001fc66dcdddab0d9338`; protected live UI
  showed scheduled Math 8 lessons.
- Integrated Math 1 active curriculum: 7 Units, 164 items, zero active goals.
  Titles and publisher summaries exist. Three older goals belong only to two
  archived legacy lessons and must not be treated as active import data.
- Latest verification for the pacing slice: frontend 79/79 tests, scoped lint
  passed, production build passed, and browser console showed no errors.

## First-Hour Plan

1. Preserve the dirty/untracked user work above and verify `main` remains in
   sync with `origin/main`.
2. Read `docs/WORKFLOW/START_SPRINT.md` and confirm the spreadsheet-first IM1
   goal objective and stopping point.
3. Reconfirm the active IM1 inventory from canonical data and the live
   read-only API: 7 Units, 164 items, zero active goals.
4. Generate one spreadsheet inventory row for every active IM1 item, then use
   one linked row per source-grounded goal with provenance and review status.
5. Extract Units 1–7 into that table, validate identity/evidence/completeness,
   and save a durable repository snapshot.
6. Generate an exact local before/after preview affecting only `KeyOutcome`.
7. Stop for review and explicit production-write authorization; do not invoke
   a migration or live update during the initial work.

## Permanent References

- `docs/Development/PROJECT_CONTEXT.md`
- `docs/Development/CURRICULUM_IMPORT_WORKFLOW.md`
- `docs/Architecture/CURRICULUM_INFORMATION_MODEL.md`
- `docs/Architecture/SECTION_PACING.md`
- `docs/WORKFLOW/DEVELOPMENT_WORKFLOW.md`
- `docs/Reference/AMPLIFY_M8_GOAL_REVIEW.md`

---

# Layer 2 — Reference

## Sprint Accomplishments

Sprint 6.8 completed the teacher-owned Math 8 planning estimates and replaced
the original starter outcomes with 303 source-grounded, editable learning
goals. The permanent review record preserves the source evidence and exact
goal counts for all eight units.

The official 2026–27 calendar and bell-schedule meeting pattern were reconciled
with three Math 8 sections. A durable additive `SectionPacing` schema was
designed so forecast placement remains separate from browser-authored Lesson
Sessions and actual `DailyProgress`. A guarded importer created 417 exact
section/date/item rows with backup, lock, full validation, rollback, and
standalone read-back verification.

The application then exposed `SectionPacing` read-only and projected scheduled
curriculum into Planning without creating or overwriting teacher-authored
content. The backend and frontend were deployed and verified in the protected
production application.

## Remaining Priorities

1. **Build the complete IM1 goal spreadsheet:** one inventory entry per active
   item, one linked row per goal, and source references/review status.
2. **Validate and review the full course before production:** retain unit-sized
   review sections, but avoid repeated production ceremonies.
3. **Prepare one guarded `KeyOutcome` batch update:** exact identity, backup,
   lock, revalidation, read-back, rollback, standalone verify, and no mutation
   of any other lesson field.
4. **Place optional Math 8 and supplemental days later:** keep the 24 optional
   items, eight assessment days, and 15 buffers unscheduled until the teacher
   makes deliberate placement choices.
5. **Make scheduled curriculum actionable later:** a safe “Start from scheduled
   lesson” action should seed goals only into an empty Lesson Session and never
   overwrite authored work.

## Known Issues, Limitations, and Non-Goals

- The active Amplify IM1 import contains summaries, not learning goals. Do not
  mistake `Description` for `KeyOutcome`, and do not promote the archived
  legacy goals into active records without explicit source proof.
- Curriculum source folders and screenshots are user-owned reference material.
  Read them as needed but never edit, rename, move, delete, or stage them.
- The spreadsheet-first process accelerates review and execution; it does not
  relax source fidelity. Missing or ambiguous evidence must remain flagged.
- No production goal write is authorized by this handoff. Initial work is
  extraction, spreadsheet construction, validation, and read-only preview.
- Existing Math 8 pacing is a forecast layer, not authored lesson content or
  actual progress. Do not merge those domains.
