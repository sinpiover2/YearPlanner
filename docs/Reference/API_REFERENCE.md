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

The complete created lesson record, so the frontend can reconcile an optimistic temporary lesson with its real identity without a full planner refresh.

```json
{
  "ok": true,
  "lessonId": "M8-U3-L5",
  "lesson": {
    "LessonID": "M8-U3-L5",
    "CourseID": "M8",
    "UnitID": "M8-U3",
    "LessonNumber": 5,
    "SortOrder": 5,
    "LessonTitle": "Solving Proportions",
    "PlannedDays": 1,
    "KeyOutcome": "Solve proportions using multiple representations.",
    "PrimaryLink": "",
    "Description": "",
    "TeacherNotes": ""
  }
}
```

Request/response notes:

- The frontend sends this POST without `mode: "no-cors"`, using the default `Content-Type: text/plain;charset=utf-8` (a CORS-safelisted content type) so the browser does not issue a preflight `OPTIONS` request, which this Apps Script deployment does not implement.
- The Apps Script web app response (via the `script.googleusercontent.com` echo redirect that all `/exec` requests go through) includes `Access-Control-Allow-Origin: *`, so the JSON response body is readable cross-origin by `fetch()` in normal `cors` mode.

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

Reorder lessons by one adjacent position.

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

Status:

Retained on the backend for compatibility. The frontend no longer calls this
action — it uses `reorderLessons()` instead.

---

## reorderLessons()

Purpose:

Move a lesson directly to any position within its unit in one action,
replacing the repeated adjacent Move up / Move down workflow.

Responsibilities:

- Persist the complete final lesson ordering for a unit in a single request.
- Renumber every lesson in the unit so `SortOrder` and `LessonNumber` stay in
  sync with the new order.
- Validate the supplied ordering before writing anything.

Example payload:

```json
{
  "action": "reorderLessons",
  "unitId": "M8-U3",
  "orderedLessonIds": [
    "M8-U3-L1",
    "M8-U3-L4",
    "M8-U3-L2",
    "M8-U3-L3"
  ]
}
```

Returns:

```json
{
  "ok": true
}
```

On validation or persistence failure:

```json
{
  "ok": false,
  "error": "orderedLessonIds does not match the current lessons in this unit."
}
```

Validation performed:

- `unitId` must be present.
- `orderedLessonIds` must be an array with no duplicate IDs.
- The supplied IDs must exactly match the current set of lessons in that
  unit — no missing IDs, no IDs from another unit.

Renumbering behavior:

For every lesson in the unit, `SortOrder` and `LessonNumber` are both set to
`(array index + 1)` of that lesson's ID within `orderedLessonIds`. All other
lesson fields are preserved. The rewrite happens in one Sheets write.

Request/response notes:

- The frontend sends this POST without `mode: "no-cors"`, using
  `Content-Type: text/plain;charset=utf-8` (a CORS-safelisted content type)
  so the browser does not issue a preflight `OPTIONS` request, which this
  Apps Script deployment does not implement.
- The Apps Script response is readable JSON (`ok: true` or `ok: false` with
  a readable `error` message), returned with
  `Access-Control-Allow-Origin: *` so `fetch()` in normal `cors` mode can
  read the body.

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