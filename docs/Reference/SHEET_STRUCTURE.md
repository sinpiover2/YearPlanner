# Sheet Structure

Year Planner uses Google Sheets as its persistent data store.

The workbook is organized into six primary tables:

```text
Settings
Courses
Sections
Units
Lessons
DailyProgress
```

The model is hierarchical:

```text
Course
 ?
Section
 ?
Unit
 ?
Lesson
 ?
DailyProgress
```

Forecasting occurs at the section level.

---

# Settings

Purpose:

Global application settings.

Typical values:

| Setting | Example |
|----------|---------|
| SchoolYear | 2026�2027 |
| TimeZone | America/Los_Angeles |
| CurrentPlan | Original |

---

# Courses

Purpose:

Course definitions.

Examples:

Canonical fields, in executable schema order:

`CourseID, CourseName, ShortName, Active, SortOrder`

Examples:

| CourseID | CourseName |
|----------|------------|
| M8 | Math 8 |
| IM1 | Integrated Math 1 |

The Math 8 importer identifies its destination course only by requiring
exactly one row whose `CourseID` is exactly `M8`. It does not gate on
`CourseName`, `ShortName`, or the artifact display label `Math 8`, and this
identity correction does not introduce a schema migration.

---

# Sections

Purpose:

Course sections.

Examples:

| SectionID | CourseID | Period |
|------------|---------|--------|
| M8-P1 | M8 | 1 |
| M8-P2 | M8 | 2 |
| M8-P3 | M8 | 3 |
| IM1-P5 | IM1 | 5 |
| IM1-P6 | IM1 | 6 |

Fields:

- SectionID
- CourseID
- SectionName
- Period
- BlockGroup
- SortOrder
- Active

Only active sections participate in forecasting.

---

# Units

Purpose:

Unit definitions.

**`IsArchived` field (added by `apps-script-planning/UnitsArchiveMigration.js`,
Sprint 6.5 — approved, not yet executed against production):** a distinct
convention from Sections' `Active` field (see below) — deliberately not
reused, since Sections' `Active` represents operational availability while
a Unit's archival status represents curriculum lifecycle, a different
domain concept. Opposite polarity from `Active`: blank/missing/false means
NOT archived (visible); only an explicit `true` means archived. Used to
mark the legacy (pre-Amplify) Integrated Math 1 units (`IM1-U0` through
`IM1-U8`) as archived historical curriculum, distinct from the imported
`AMP-IM1-*` units, which are never archived. Archiving hides a unit from
the Units workspace by default; it never deletes, migrates, or otherwise
modifies the unit's own data. An earlier design (never executed against
production) used a field named `Active` for this same purpose; this
migration explicitly detects and refuses to run against a stray `Active`
column on Units rather than silently reinterpreting it as `IsArchived`.

Fields:

- UnitID
- CourseID
- UnitNumber
- UnitTitle
- RequiredDays
- OptionalDays
- SortOrder
- UnitPurpose
- **IsArchived** *(new — see above; appended as the last column; blank/missing on every row until the migration runs)*

Examples:

## Math 8

- U1 Rigid Transformations & Congruence
- U2 Dilations, Similarity & Slope
- U3 Proportional and Linear Relationships
- U4 Linear Equations and Systems
- U5 Functions and Volume
- U6 Associations in Data
- U7 Exponents and Scientific Notation
- U8 Pythagorean Theorem and Irrational Numbers

## Integrated Math 1

- U1 Patterns and Sequences
- U2 Linear Equations and Inequalities
- U3 Describing Data
- U4 Describing Functions
- U5 Systems
- U6 Exponential Functions
- U7 Quadratic Functions
- U8 Quadratic Equations

---

# Lessons

Purpose:

Lesson definitions.

**Current production fields (as of the Sprint 5 read-only audit; no
migration has run):**

- LessonID
- UnitID
- CourseID
- LessonNumber
- LessonTitle
- PlannedDays
- SortOrder
- KeyOutcome
- Description
- PrimaryLink
- TeacherNotes
- IsOptional

**Intended fields after the approved, not-yet-executed `Type`/`PlacementRule`
migration** (`apps-script-planning/LessonsSchemaMigration.js` — see
`AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md`'s Sprint 6.2A/6.2B sections and
`apps-script-planning/LESSONS_SCHEMA_MIGRATION_README.md`; **this migration
has been implemented and locally simulated only — it has not been run
against production**):

- LessonID
- UnitID
- CourseID
- LessonNumber
- LessonTitle
- PlannedDays
- SortOrder
- **Type** *(new)*
- **PlacementRule** *(new)*
- KeyOutcome
- Description
- PrimaryLink
- TeacherNotes
- IsOptional

`Type` and `PlacementRule` are inserted immediately after `SortOrder` —
with the other structural/sequencing fields, ahead of the content fields
(`KeyOutcome` onward). Every existing Apps Script reader/writer resolves
Lessons columns by header name at call time (`headers.indexOf(...)`), never
by a fixed numeric position, so this insertion point does not require any
other code change.

Lessons represent the planned curriculum.

No instructional history is stored here.

---

# DailyProgress

Purpose:

Instructional logging.

Fields:

- DailyProgressID
- Date
- CourseSectionID
- CourseID
- UnitID
- LessonID
- DayFraction
- Finished
- Notes

Examples of DayFraction:

- 0.5
- 1.0
- 1.5

DailyProgress represents reality.

Forecasts are derived from this table.

---

# Architectural Principle

Planned information lives in:

```text
Courses
Sections
Units
Lessons
```

Actual instructional history lives in:

```text
DailyProgress
```

Forecasts emerge from the interaction between the two.

Reality always comes before consequence.

Consequence always comes before recommendation.

---

# Forecasting

Forecasts are section-aware.

DailyProgress rows are grouped by:

```text
CourseSectionID
```

Only active sections are forecasted.

Only sections with logged progress produce forecast cards.

Sections remain independent even when synchronized.

---

# Design Principle

The spreadsheet is not the application.

The spreadsheet stores facts.

The application provides interpretation.

Google Sheets supplies the reality.

Year Planner supplies the consequence and recommendation.

The data model should remain simple, stable, and understandable.
