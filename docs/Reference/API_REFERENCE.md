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

## Write authorization

Every POST action requires an authorization `token` field, checked against
the `WRITE_TOKEN` Script Property configured on the `apps-script-planning`
project. GET reads are unaffected and remain anonymous — only writes are
gated. See `docs/WORKFLOW/DEVELOPMENT_WORKFLOW.md`, "Apps Script Deployment:
Planning Write Authorization," for how the token is configured and deployed.

If `token` is missing, incorrect, or the `WRITE_TOKEN` Script Property is
unset, the request is rejected before any action runs, and no sheet is
touched:

```json
{
  "ok": false,
  "error": "Unauthorized"
}
```

An unset `WRITE_TOKEN` Script Property fails closed — it rejects every
write rather than falling back to open access.

## Transport contract (all write actions)

Every write action shares the same request/response contract:

- The frontend sends a real `fetch()` — never `mode: "no-cors"` — with
  `Content-Type: text/plain;charset=utf-8`. That content type is
  CORS-safelisted, so the browser never issues a preflight `OPTIONS`
  request, which this Apps Script deployment does not implement.
- The Apps Script response is returned through the
  `script.googleusercontent.com` redirect every `/exec` request follows,
  with `Access-Control-Allow-Origin: *`, so the JSON response body —
  success or `{ "ok": false, "error": "..." }` — is always readable
  cross-origin by `fetch()` in normal `cors` mode.
- Every response uses the `{ "ok": true | false, ... }` shape, never
  `{ "success": true }`.

Every write payload therefore has the shape `{ "action": "...", "token":
"...", ...action-specific fields }`; the examples below omit `action` and
`token` from the field list for brevity but include them in the full payload
sample.

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
  "token": "<WRITE_TOKEN value>",
  "date": "2026-09-14",
  "courseSectionId": "M8-P2",
  "courseId": "M8",
  "unitId": "M8-U3",
  "lessonId": "M8-U3-L5",
  "dayFraction": 1,
  "finished": true,
  "notes": ""
}
```

Effect:

Appends a row to the DailyProgress sheet.

Returns:

```json
{
  "ok": true
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
  "token": "<WRITE_TOKEN value>",
  "courseId": "M8",
  "unitId": "M8-U3",
  "lessonTitle": "Solving Proportions",
  "plannedDays": 1,
  "keyOutcome": "Solve proportions using multiple representations."
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

---

## updateLesson()

Purpose:

Modify an existing lesson.

Responsibilities:

- Update lesson metadata.
- Preserve lesson identity.

Example payload:

```json
{
  "action": "updateLesson",
  "token": "<WRITE_TOKEN value>",
  "lessonId": "M8-U3-L5",
  "lessonTitle": "Solving Proportions",
  "plannedDays": 1,
  "keyOutcome": "Solve proportions using multiple representations.",
  "primaryLink": "",
  "teacherNotes": ""
}
```

Returns:

```json
{
  "ok": true
}
```

On failure (e.g. the lesson no longer exists):

```json
{
  "ok": false,
  "error": "Lesson not found"
}
```

---

## updateUnitPlanning()

Purpose:

Save teacher-owned Unit pacing totals used by Units, Sidebar, Forecast, and
projected dates.

Responsibilities:

- Require an exact UnitID and CourseID match.
- Update only `RequiredDays` and `OptionalDays` on that Unit row.
- Accept blank values, positive required days, and zero-or-positive optional
  days.
- Reject missing/duplicate schema headers or ambiguous Unit identity before
  writing.

Example payload:

```json
{
  "action": "updateUnitPlanning",
  "token": "<WRITE_TOKEN value>",
  "unitId": "AMP-M8-U2",
  "courseId": "M8",
  "requiredDays": 16,
  "optionalDays": 1
}
```

Returns:

```json
{
  "ok": true,
  "unitId": "AMP-M8-U2",
  "requiredDays": 16,
  "optionalDays": 1
}
```

---

## deleteLesson()

Purpose:

Remove a lesson.

Responsibilities:

- Delete a lesson from the Lessons sheet.
- Renumber the remaining lessons in that unit so `SortOrder` and
  `LessonNumber` stay contiguous.

Example payload:

```json
{
  "action": "deleteLesson",
  "token": "<WRITE_TOKEN value>",
  "lessonId": "M8-U3-L5"
}
```

Returns:

```json
{
  "ok": true
}
```

On failure (e.g. the lesson no longer exists):

```json
{
  "ok": false,
  "error": "Lesson not found"
}
```

Current limitations:

- No undo.

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
  "token": "<WRITE_TOKEN value>",
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

See "Transport contract (all write actions)," above, for the shared
request/response behavior every write action — including this one — follows.

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
