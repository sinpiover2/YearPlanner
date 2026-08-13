# Start Sprint

## Sprint 6.8 Objective

**Primary objective:** Finish the Math 8 planning-time lifecycle without
inventing publisher data: review, deploy, and verify the committed publisher-
summary and Unit-time UI; then begin entering teacher-owned required,
optional, and lesson planning-day estimates through the application.

Math 8's production curriculum import is complete. Sprint 6.8 is not an
importer redesign and must not rewrite the 8 imported Units, 163 imported
items, 9 archived legacy Units, or 50 preserved legacy Lessons.

## Current Sprint Checkpoint

The deployment and end-to-end write proof are complete. The composite Unit
editor identity correction is live, and Unit planning values persist across
reload. Teacher-owned estimates have been entered and verified for all 8 Math
8 Units (147 required days plus 21 optional days) and all 163 imported items
(currently one day each).

All 163 Math 8 items now have source-grounded, editable learning goals: 303
goals in total, with multiple goals per lesson supported. The complete review
and verification record is in `docs/Reference/AMPLIFY_M8_GOAL_REVIEW.md`.

The current safe stopping point is after verified production data entry and a
read-only local application spot-check. No importer, archive migration,
curriculum source, or preserved historical data was changed.

## Working Context

- **Terminal:** PROJECT for inspection; BUILD for verification; GIT only for
  reviewed commits and pushes; DEV for browser validation.
- **Deployment:** required for the already-committed Unit-time backend and
  frontend presentation changes, but only after independent review.
- **Apps Script project:** `apps-script-planning`; all Math 8 importer and
  archive entry points remain `DISARMED` and are out of scope.
- **Browser testing:** required against the existing production Netlify site.
- **GitHub push:** required after review; preserve unrelated local files.
- **Stopping point:** pause after deployment and one explicitly authorized,
  real Unit-time save has survived reload. Do not bulk-enter planning time
  until that end-to-end write is proven.

## Completed First-Hour Plan

1. Read Layer 1 of `docs/History/SPRINT_HANDOFF_6.7.md`.
2. Verify Git state and preserve the unrelated task-board, Obsidian, assets,
   and curriculum-source files listed in the handoff.
3. Independently review commit `f1c5199` together with `d269ba7` and
   `6ee8830`; rerun frontend tests, import/migration regressions, scoped lint,
   and the production build.
4. Push the reviewed local commits and handoff documentation.
5. Deploy the additive `updateUnitPlanning` Apps Script backend through a new
   immutable version of the existing production deployment, then deploy the
   matching frontend to the existing Netlify site.
6. Verify publisher summaries, Math 8/IM1 course labels, archived curriculum,
   `Not planned` states, and the Unit-time editor in the live UI.
7. With separate write authorization, save one real Unit estimate, reload,
   and confirm persistence before planning the remaining Units and Lessons.

All seven steps are complete. Subsequent authorized work also entered and
verified the remaining Unit and item estimates, reviewed all supplied Math 8
source pages, and entered and verified 303 learning goals across all 163 items.

## Next Work

1. Verify and load the official school calendar.
2. Load real rosters when district data is available.
3. Continue classroom validation through actual planning and teaching.

## Success Criteria

- Publisher summaries render when teacher outcomes are absent.
- Unit required/optional time can be saved with authenticated writes and
  survives reload.
- Optimistic updates and rollback affect only the exact CourseID + UnitID.
- Missing publisher durations remain unknown until the teacher enters them.
- No importer, archive migration, curriculum source, or historical data is
  changed.

## Permanent References

- `docs/Development/PROJECT_CONTEXT.md`
- `docs/Development/CURRICULUM_IMPORT_WORKFLOW.md`
- `docs/Architecture/CURRICULUM_INFORMATION_MODEL.md`
- `docs/WORKFLOW/DEVELOPMENT_WORKFLOW.md`
- `docs/Development/CLASSROOM_READINESS.md`
