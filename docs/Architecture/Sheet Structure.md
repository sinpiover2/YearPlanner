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
| SchoolYear | 2026Ð2027 |
| TimeZone | America/Los_Angeles |
| CurrentPlan | Original |

---

# Courses

Purpose:

Course definitions.

Examples:

| CourseID | Course Name |
|-----------|-------------|
| M8 | Math 8 |
| IM1 | Integrated Math 1 |

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

Fields:

- UnitID
- CourseID
- UnitName
- RequiredDays
- OptionalDays
- SortOrder

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

Fields:

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
- Optional

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