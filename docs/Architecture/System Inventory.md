# System Inventory

## Project

**Year Planner**

Purpose:

A teacher decision-support tool for year planning, pacing, and forecast awareness.

Core question:

> Am I OK?

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
- Sprint 2.2c Ð Timeline Integration

---

# Technology Stack

## Frontend

Framework:

- React
- Vite

Main folder:

- `frontend`

Main files:

- `src/App.jsx`
- `src/App.css`
- `src/api.js`

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

- Layout
- Typography
- Timeline appearance
- Forecast cards
- Sidebar

---

## api.js

API layer.

Responsibilities:

- Data retrieval
- Progress logging
- Lesson editing
- CRUD operations

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

Forecasting occurs at the section level.

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

- Unit names
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

---

### addLesson

Creates a lesson.

---

### updateLesson

Updates a lesson.

---

### deleteLesson

Deletes a lesson.

---

### moveLesson

Moves lessons up or down.

---

# Major UI Components

## Forecast Banner

Purpose:

Provide context.

---

## Year Outlook

Purpose:

Provide summary.

---

## Year Timeline

Purpose:

Provide orientation.

Shows:

- Unit lengths
- Month positions
- Current position
- Expected position
- Optional buffers
- Synchronization summaries

---

## Forecast Cards

Purpose:

Provide interpretation.

Cards answer:

- Should I care?
- What happens if nothing changes?
- Can I fix this?

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

Timeline = orientation.

Cards = interpretation.

---

# Development Routine

Terminal 1

```bash
npm run dev
```

Terminal 2

```bash
git status
git add ...
git commit -m "..."
git push
```

Terminal 3

```bash
npm run build
```

---

# Current Status

Forecast logic is considered trustworthy.

Visual design is converging.

The project is transitioning from experimentation toward the timeline's final form.

Current focus:

- Remove separate break row.
- Integrate breaks directly into tracks.
- Tighten vertical spacing.
- Add dark progress fill inside units.
- Move toward squared track geometry.
- Preserve stable period rows.