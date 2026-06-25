# API Reference

Year Planner uses a Google Apps Script backend with a React frontend.

Communication occurs through a JSON endpoint.

The API is intentionally small.

Its purpose is to provide curriculum data and persist instructional history.

---

# Architecture

```text
React Frontend
        ?
Apps Script Endpoint
        ?
Google Sheets
```

Google Sheets is the source of truth.

The frontend is responsible for interpretation.

---

# GET

Purpose:

Load the current state of the planner.

Returns:

```json
{
  "settings": [],
  "courses": [],
  "sections": [],
  "units": [],
  "lessons": [],
  "dailyProgress": []
}
```

These collections are loaded during application startup.

---

# POST Actions

All mutations occur through POST requests.

---

## saveDailyProgress()

Purpose:

Log instructional progress.

Responsibilities:

- Record instructional days.
- Support fractional days.
- Mark lessons complete.
- Store notes.

Example payload:

```json
{
  "action": "saveDailyProgress",
  "Date": "2026-09-14",
  "CourseSectionID": "M8-P2",
  "CourseID": "M8",
  "UnitID": "M8-U3",
  "LessonID": "M8-U3-L5",
  "DayFraction": 1,
  "Finished": true,
  "Notes": ""
}
```

Effect:

Appends a row to the DailyProgress sheet.

Returns:

```json
{
  "success": true
}
```

---

## addLesson()

Purpose:

Create a new lesson.

Responsibilities:

- Append lesson to the Lessons sheet.
- Maintain unit structure.

Example payload:

```json
{
  "action": "addLesson",
  "CourseID": "M8",
  "UnitID": "M8-U3",
  "LessonTitle": "Solving Proportions",
  "PlannedDays": 1,
  "KeyOutcome": "Solve proportions using multiple representations."
}
```

Returns:

```json
{
  "success": true
}
```

---

## updateLesson()

Purpose:

Modify an existing lesson.

Responsibilities:

- Update lesson metadata.
- Preserve lesson identity.

Returns:

```json
{
  "success": true
}
```

---

## deleteLesson()

Purpose:

Remove a lesson.

Responsibilities:

- Delete a lesson from the Lessons sheet.

Returns:

```json
{
  "success": true
}
```

Current limitations:

- No confirmation dialog.
- No undo.

---

## moveLesson()

Purpose:

Reorder lessons.

Responsibilities:

- Move lessons up.
- Move lessons down.
- Maintain SortOrder.

Returns:

```json
{
  "success": true
}
```

---

# Source Tables

The API interacts with:

```text
Settings
Courses
Sections
Units
Lessons
DailyProgress
```

---

# Responsibilities

## Backend

Responsible for:

- Persistence
- Data integrity
- Sheet access

Not responsible for:

- Forecast calculations
- Visualizations
- Recommendations
- User experience

---

## Frontend

Responsible for:

- Forecast calculations
- Timeline construction
- State classification
- Recommendations
- User experience

---

# Design Principle

The backend stores facts.

The frontend provides meaning.

Reality comes from the spreadsheet.

Consequence and recommendation come from the application.

The API should remain small, stable, and boring.

Complexity belongs in the application, not the transport layer.