# Math 8 Required-Item Pacing Staging

This inert local preview schedules each of the 139 imported required Math 8
items for one actual section meeting in curriculum order. It does not write to
Google Sheets and is not loaded by the application.

The schedule uses the verified 2026–27 SVUSD calendar and SVMS meeting pattern:

- `M8-P1` and `M8-P3`: odd track (Monday and Wednesday–Friday), 142 meetings
- `M8-P2`: even track (Tuesday–Friday), 148 meetings

Per the explicit planning decision, the 24 imported optional items and the
eight additional unit-assessment days represented by `Units.RequiredDays` are
listed but not placed in the initial sequence. This leaves 3 buffer meetings
in each odd section and 9 in the even section.

Artifacts:

- `m8-required-item-pacing-2026-27.csv`: 417 section/item assignments
- `m8-unit-boundaries-2026-27.csv`: start and end dates for each unit/section
- `m8-buffer-days-2026-27.csv`: remaining unassigned section meetings
- `m8-unscheduled-items-2026-27.csv`: 24 optional items plus 8 assessment days
- `m8-section-pacing-import-preview.csv`: the same 417 assignments reduced to
  the proposed production `SectionPacing` schema

Generate and verify:

```bash
node scripts/pacing-staging/generate-m8-required-pacing.mjs
node --test scripts/pacing-staging/*.test.mjs
```

Production note: the current `YearPlan` schema is course-level and cannot
represent section-specific dates. Do not import these previews into `YearPlan`
without a reviewed schema or an explicit policy for collapsing odd/even dates.
The proposed additive schema and write safeguards are documented in
`docs/Architecture/SECTION_PACING.md`. No production sheet has been created or
written by this staging workflow.
