# System Inventory

## Project

**Year Planner**

Purpose:

A teacher decision-support tool for year planning, pacing, and forecast awareness.

Core question:

> Am I OK?

The system is designed to provide calm, actionable information rather than act as a reporting dashboard.

---

## Ownership

Primary maintainer:

**Jeff Holcomb**

---

## Repository

GitHub:

https://github.com/sinpiover2/YearPlanner.git

Primary branch:

- `main`

Current development stage:

- Phase 2 Ð Forecast Visualizations
- Sprint 2.2c complete
- Sprint 2.3 Ð Forecast Interpretation (next)

---

# Technology Stack

## Frontend

Framework:

- React
- Vite

Main folder:

- `frontend`

Primary files:

- `src/App.jsx`
- `src/App.css`
- `src/api.js`

Utility files:

- `src/utils/plannerUtils.js`
- `src/utils/forecastUtils.js`

Local development:

```bash
npm run dev
```

Build verification:

```bash
npm run build
```

---

## Backend

Backend:

- Google Apps Script

Data store:

- Google Sheets

Communication:

- JSON API endpoint

---

# Major Source Files

## App.jsx

Main application.

Responsibilities:

- View switching
- State management
- Forecast rendering
- Today view
- Units view

---

## App.css

Primary styling.

Responsibilities:

- Overall layout
- Typography
- Sidebar
- Forecast page
- Timeline appearance
- Card styling

---

## api.js

API layer.

Responsibilities:

- Data retrieval
- Progress logging
- Lesson editing
- CRUD operations

---

## plannerUtils.js

Responsibilities:

- Shared calculations
- Timeline positioning
- Progress percentages
- Forecast helper functions

Purpose:

Reduce duplication and isolate calculation logic from UI.

---

# Data Model

The model is hierarchical.

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

Forecasting occurs primarily at the section level.

---

# Google Sheets Tabs

## Settings

Purpose:

Global application settings.

---

## Courses

Purpose:

Course definitions.

Examples:

- Math 8
- Integrated Math 1

---

## Sections

Purpose:

Course sections.

Examples:

- M8-P1
- M8-P2
- M8-P3
- IM1-P5
- IM1-P6

Contains:

- SectionID
- CourseID
- SectionName
- Period
- BlockGroup
- SortOrder
- Active

---

## Units

Purpose:

Unit definitions.

Contains:

- Unit titles
- Required days
- Optional days
- Course associations

---

## Lessons

Purpose:

Lesson definitions.

Contains:

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
- Optional flag

---

## DailyProgress

Purpose:

Instructional logging.

Contains:

- DailyProgressID
- Date
- CourseSectionID
- CourseID
- UnitID
- LessonID
- DayFraction
- Finished
- Notes

Forecast calculations derive from this table.

---

# Current Active Sections

- M8-P1 Ñ Math 8 Period 1
- M8-P2 Ñ Math 8 Period 2
- M8-P3 Ñ Math 8 Period 3
- IM1-P5 Ñ Math 1 Period 5
- IM1-P6 Ñ Math 1 Period 6

---

# API Operations

## GET

Returns:

- settings
- courses
- sections
- units
- lessons
- dailyProgress

---

## POST Actions

### saveDailyProgress

Logs instructional progress.

### addLesson

Creates a lesson.

### updateLesson

Updates a lesson.

### deleteLesson

Deletes a lesson.

### moveLesson

Moves lessons up or down.

---

# Major UI Components

## Forecast Banner

Purpose:

Provide overall context.

Answers:

> Is anything demanding attention?

---

## Year Outlook

Purpose:

Provide quick section-level summary.

---

## Year Timeline

Purpose:

Provide orientation.

Shows:

- Month positions
- Unit lengths
- Current position
- Expected position
- Buffer days
- Winter break
- Spring break
- Section synchronization summaries

### Design Principle

Timeline supplies context.

It is **not** the decision layer.

---

## Forecast Cards

Purpose:

Provide interpretation.

Cards answer:

- Should I care?
- What happens if nothing changes?
- Can I fix this?

The cards are the primary decision layer.

---

## Today View

Question:

> Am I OK today?

---

## Units View

Question:

> Am I OK in this unit?

---

# Forecast States

- On Track
- Monitoring
- Needs Attention
- Buffer Exhausted

These represent increasing urgency.

---

# Current Architecture

Forecast page structure:

```text
Banner
?
Year Outlook
?
Year Timeline
?
Forecast Cards
```

### Philosophy

Timeline = orientation.

Cards = interpretation.

Most teachers should be reassured that things are fine.

---

# Development Routine

### Terminal 1

```bash
npm run dev
```

### Terminal 2

```bash
git status
git add .
git commit -m "..."
git push
```

### Terminal 3

```bash
npm run build
```

---

# Current Status

Forecast calculations are considered trustworthy.

Timeline architecture is considered largely complete.

The interface has shifted from experimentation toward refinement and interpretation.

---

# Current Focus

## Sprint 2.3 Ñ Forecast Interpretation

Improve the cards so they clearly answer:

- Should I care?
- What happens if nothing changes?
- What should I do?

The project is beginning the transition from visualization toward true decision support.

## Forecast Architecture

Forecast page is organized into:

Banner

?

Year Outlook Strip

?

Year Timeline

?

Forecast Summary Cards

The timeline provides orientation.

The cards provide interpretation.

---

### Forecast Card Pipeline

Raw forecast data

?

forecastCardUtils.js

?

Forecast summaries

?

ForecastSummaryCard component

?

Rendered cards

Cards are ordered by severity:

1. Buffer Exhausted
2. Needs Attention
3. Monitoring
4. On Track

Goal:

Translate technical forecast information into teacher language.