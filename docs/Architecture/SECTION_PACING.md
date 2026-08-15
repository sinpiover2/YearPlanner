# Section Pacing

Status: initial Math 8 section pacing imported and independently verified in
production on 2026-08-15.

## Decision

Add a `SectionPacing` sheet rather than extending `YearPlan`.

`YearPlan` describes a course unit's planned start and end dates. It cannot
identify an individual curriculum item, and one course-level range cannot
preserve the different meeting dates of odd- and even-block sections. Existing
browser-authored lesson-session content and `DailyProgress` are also different
records: the former is a teacher's editable plan for a meeting, while the latter
records what actually happened.

`SectionPacing` is an additive forecast layer. Each row places one curriculum
item into one section meeting. It does not create lesson-session content and it
does not record progress.

## Smallest durable schema

| Field | Meaning | Rule |
|---|---|---|
| `PacingID` | Stable import identity | Initially `SectionID|YYYY-MM-DD|Sequence`; unique and nonblank |
| `SectionID` | Teaching section | Must match an active `Sections.SectionID` |
| `PlannedDate` | Intended meeting date | ISO `YYYY-MM-DD`; must be an instructional meeting for the section |
| `Sequence` | Order within a meeting | Positive integer; permits later combining of curriculum items |
| `LessonID` | Scheduled curriculum item | Must match `Lessons.LessonID`, and its course must match the section's course |
| `Locked` | Teacher-controlled protection | Boolean; initially `FALSE` |
| `Notes` | Optional planning context | Blank in the initial import |

The schema deliberately omits `CourseID`, `UnitID`, school-day number, lesson
title, and block group. Those values are already authoritative in `Sections`,
`Lessons`, and `SchoolCalendar`; duplicating them would permit contradictions.
`Sequence` is retained even though the initial import uses only `1`, because it
allows more than one item on a later meeting without changing the schema.

## Initial Math 8 payload

`data/pacing-staging/m8-section-pacing-import-preview.csv` contains 417 rows:
139 required imported items for each of `M8-P1`, `M8-P2`, and `M8-P3`. One item
is placed per actual section meeting in source curriculum order.

The payload intentionally excludes all 24 optional imported items, all eight
additional assessment days, and all 15 remaining buffer meetings. Those remain
visible in the companion staging files and can be placed later by the teacher.

## Required production safeguards

Before any write, a migration/import must:

1. Require the exact seven headers above, in order, or create a new empty sheet.
2. Refuse a nonempty or unexpected `SectionPacing` sheet during the initial import.
3. Validate all 417 rows before making the first mutation.
4. Verify unique `PacingID` values and unique `(SectionID, PlannedDate, Sequence)` tuples.
5. Validate every section, lesson, course relationship, date, and section meeting.
6. Acquire a script lock and re-read the target immediately before writing.
7. Create a named full-spreadsheet backup before the revalidation pass and any
   mutation; refuse the import if backup creation fails.
8. Write the complete payload in one rectangular operation, then read it back and
   require exact equality.
9. Roll back a newly created sheet, or clear only rows written into a previously
   validated empty sheet, if the write or verification fails.

The initial production operation created the sheet and wrote only this reviewed
payload. Exposing it through `doGet` and projecting it into the planning
interface remains a later, separately reviewed change.

The local production candidate is split between the generated immutable payload
in `apps-script-planning/SectionPacingPayload.js` and the disarmed migration in
`apps-script-planning/SectionPacingMigration.js`. Its Node tests use only
in-memory spreadsheet fakes and never contact Google.

## Production completion

The guarded import completed successfully on 2026-08-15. Its execution report
recorded `writesOccurred: true`, `success: true`, and exact post-write
verification of 417 rows. A separate standalone verification returned
`valid: true`, `rowCount: 417`. Independent range inspection confirmed the
seven approved headers, 139 rows for each of `M8-P1`, `M8-P2`, and `M8-P3`,
417 unique pacing IDs, and 417 unique section/date/sequence slots.

The successful pre-write backup is `19xDWMMD8o_NMVAHWUh4Gt3PLhorQcV21qYGCtf66TU4`.
The Apps Script editor wrapper was restored to its placeholder after execution,
and remote source parity with the committed disarmed module was verified.
