# Start Sprint

## Sprint 6.9 Objective

**Primary objective:** Build a spreadsheet-first, source-grounded learning-goal
pipeline for the 164 active Amplify Integrated Math 1 items, review the full
course efficiently, and prepare one guarded batch update that changes only
`Lessons.KeyOutcome`.

Math 8 is complete for this stage: 8 active Units, 163 items, 303 verified
goals, and 417 section-specific required-item pacing rows are live. Sprint 6.9
must reuse that proven provenance and guarded-write discipline without
repeating its slow item-by-item production ceremony.

## Current Sprint Checkpoint

Production currently has 7 active Amplify IM1 Units and 164 active items. All
164 have publisher titles and summaries, but none has a stored learning goal.
The only three IM1 goals in the database belong to two archived legacy lessons
and are not part of the active Amplify curriculum.

The approved direction is one spreadsheet row per source-grounded goal, with
stable UnitID/LessonID identity, source references, and review status. Unit-sized
review remains useful, but production should receive one exact, guarded batch
after the full spreadsheet is approved.

## Working Context

- **Terminal:** PROJECT for inspection/extraction; BUILD for deterministic
  validation; GIT only for reviewed commits and pushes.
- **Deployment:** not required for spreadsheet construction or local preview;
  required later only if a new guarded Apps Script adapter is approved.
- **Apps Script project:** `apps-script-planning`; existing importer and
  migration entry points remain `DISARMED` and out of scope.
- **Browser testing:** not required until a production update is separately
  authorized and deployed.
- **GitHub push:** required for reviewed spreadsheet snapshots, validation
  tooling, and handoff documentation.
- **Stopping point:** pause after the complete spreadsheet and exact local
  import preview are reviewed. Do not write production goals without separate
  explicit authorization.

## First-Hour Plan

1. Read Layer 1 of `docs/History/SPRINT_HANDOFF_6.8.md`; preserve every dirty
   or untracked user file listed there.
2. Verify branch, origin parity, production build, focused tests, and the live
   read-only count of 7 active IM1 Units, 164 items, and zero active goals.
3. Inventory the saved IM1 source material and the canonical
   `data/import-staging/amplify-im1.json` identities without editing curriculum
   source files.
4. Generate a spreadsheet scaffold containing all 164 active items and the
   approved one-row-per-goal columns; do not invent goals for absent evidence.
5. Extract and validate goals across Units 1–7, flagging missing evidence,
   duplicate goals, lesson-title mismatches, and unreviewed rows.
6. Save a durable repository snapshot of the reviewed table and generate an
   exact before/after preview that changes only `KeyOutcome`.
7. Present the complete validation report and request separate production-write
   authorization before building or invoking the guarded batch execution.

## Success Criteria

- Every one of the 164 active Amplify IM1 items appears exactly once in the
  spreadsheet inventory, with any number of linked goal rows.
- Every goal is traceable to supplied Amplify evidence; absence and uncertainty
  are explicit rather than inferred away.
- Multiple goals per item are preserved and deterministically serialize to the
  existing pipe-separated `KeyOutcome` representation.
- Validation blocks missing/duplicate identities, title mismatches, duplicate
  goals, unreviewed rows, and changes to any field other than `KeyOutcome`.
- The approved spreadsheet or exported CSV is retained as the permanent review
  record.
- No production write occurs without a read-only preview, full-spreadsheet
  backup, lock, revalidation, exact read-back, rollback, standalone verify, and
  separate explicit authorization.

## Permanent References

- `docs/Development/PROJECT_CONTEXT.md`
- `docs/Development/CURRICULUM_IMPORT_WORKFLOW.md`
- `docs/Architecture/CURRICULUM_INFORMATION_MODEL.md`
- `docs/WORKFLOW/DEVELOPMENT_WORKFLOW.md`
- `docs/Reference/AMPLIFY_M8_GOAL_REVIEW.md`
