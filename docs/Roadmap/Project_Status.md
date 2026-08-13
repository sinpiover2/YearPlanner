# Project Status

## Current Status

**August 2026 — Sprint 6.8 in progress**

Year Planner's core classroom workflow is operational in production. Math 8's imported curriculum, teacher-owned planning time, and source-grounded learning goals are verified; the current focus is loading the remaining real-school data.

## Production Health

- Frontend and Apps Script production deployments are current through the Sprint 6.8 composite-editor identity correction.
- Unit planning writes use the exact CourseID + UnitID identity and have been verified through a real save and reload.
- The canonical Math 8 curriculum contains 8 Units and 163 imported items.
- The 9 legacy Math 8 Units remain archived; their 50 Lessons and historical records remain preserved.
- Importer and archive entry points remain disarmed and out of scope.

## Math 8 Planning Data

| Unit | Required | Optional |
| --- | ---: | ---: |
| U1 | 18 days | 3 days |
| U2 | 16 days | 2 days |
| U3 | 18 days | 3 days |
| U4 | 19 days | 3 days |
| U5 | 19 days | 4 days |
| U6 | 18 days | 1 day |
| U7 | 19 days | 3 days |
| U8 | 20 days | 2 days |
| **Total** | **147 days** | **21 days** |

All 163 imported Math 8 items currently have a one-day planning estimate. These are editable teacher estimates, not publisher-supplied durations.

All 163 Math 8 items have source-grounded, editable learning goals: 303 goals in total, with multiple goals per lesson supported. The complete review and verification record is in `docs/Reference/AMPLIFY_M8_GOAL_REVIEW.md`.

## Current Focus

1. Verify and load the official 2026–2027 school calendar.
2. Load and verify real student rosters when district data is available.
3. Continue classroom validation through actual planning and teaching.

## Deferred but Open

- Amplify Integrated Math 1 production import.
- Remaining Protect Teacher Work phases: concurrency safeguards, visible local-save failure signals, backup/recovery, and canonical enactment data.
- Workflow polish that does not block classroom use.

## Permanent References

- `docs/Development/CLASSROOM_READINESS.md`
- `docs/Development/PROJECT_CONTEXT.md`
- `docs/Development/CURRICULUM_IMPORT_WORKFLOW.md`
- `docs/Architecture/CURRICULUM_INFORMATION_MODEL.md`
- `docs/WORKFLOW/DEVELOPMENT_WORKFLOW.md`
