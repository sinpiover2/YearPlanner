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
invented. The official student calendar also does not define the recurring
SVMS bell schedule, so `SchedulePatterns` requires a separate authoritative
source and review.

Generate and verify:

```bash
node scripts/calendar-staging/generate-svusd-2026-27.mjs
node --test scripts/calendar-staging/svusd-2026-27.test.mjs
```

Before any production import, perform a read-only snapshot and comparison of
the existing `SchoolCalendar` sheet, confirm its exact headers, preview every
replacement row, and obtain explicit authorization for the live write.
