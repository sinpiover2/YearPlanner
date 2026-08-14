# SVUSD 2026-2027 Calendar Staging

This folder contains an inert, generated staging artifact for Year Planner's
`SchoolCalendar` sheet. It does not write to Google Sheets and is not loaded by
the application.

Source reviewed in full:

- Scotts Valley Unified School District, `2026-2027 Student Calendar`
- Board approved February 10, 2026
- Local source: `Shared Resources/2026-27 Student Calendar_Board Approved on February 10, 2026.pdf`

The generated CSV contains every weekday from the first student day (August 6,
2026) through the last student day (May 27, 2027), including district closures.
It resolves to 211 weekday rows, 180 sequential instructional days, and 31
non-instructional weekdays.

SVMS trimester dates are included as notes. Site events listed as TBD—Back to
School Night, CAASPP minimum-day dates, and Open House—are intentionally not
invented.

The recurring schedule is sourced from Scotts Valley Middle School's
`2026-27 Bell Schedule`, preserved locally as
`Shared Resources/Extended - SVMS Bell Schedule 26.27.jpg`. The staged bell
table preserves every published time. The meeting-pattern table expresses the
verified period pattern: odd periods Monday, even periods Tuesday, and all six
periods Wednesday through Friday. Calendar `DayType` values use the same names.

The meeting-pattern columns are intentionally period-based. Before a live
`SchedulePatterns` update, compare them with the production `Sections.BlockGroup`
values and map the five active course sections explicitly; do not assume the
current block-group names.

Generate and verify:

```bash
node scripts/calendar-staging/generate-svusd-2026-27.mjs
node scripts/calendar-staging/generate-svms-2026-27-bell-schedule.mjs
node --test scripts/calendar-staging/*.test.mjs
```

Before any production import, perform a read-only snapshot and comparison of
the existing `SchoolCalendar` sheet, confirm its exact headers, preview every
replacement row, and obtain explicit authorization for the live write.
