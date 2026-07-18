# Roster Information Model

## Scope

Roster information is student-identifying information intended only for
read-only classroom logistics, such as a printed working roster. It is not
Lesson Session content, attendance persistence, grading, behavior tracking, or
SIS functionality.

## Durable student identity

`StudentID` is Year Planner's durable local student identity. It remains stable
across name changes, section changes, school years, and future synchronization.
It is never derived from a name or section and is never reused. Future
student-related features reference `StudentID`, not student names.

## Sheets

### Students

Columns, in exact order:

```text
StudentID
LegalFirstName
LegalLastName
PreferredName
Active
```

PreferredName is used for display when nonblank; otherwise LegalFirstName is
used.

### SectionEnrollments

Columns, in exact order:

```text
EnrollmentID
SectionID
StudentID
Active
StartDate
EndDate
```

Students and Sections relate only through SectionEnrollments. Students do not
store `SectionID`.

### RosterSettings

Columns, in exact order:

```text
SectionID
SortMode
Column1Label
Column2Label
Column3Label
Column4Label
Column5Label
```

SortMode supports `LastName` and `FirstName`, defaulting to `LastName`. All five
paper-marking labels may remain blank.

## Access boundary

The deployed Year Planner web app permits anonymous reads of non-student
planning data. Student names must never pass through that anonymous endpoint.
There is therefore no public roster GET route, and the production frontend does
not request or render roster data.

`getSectionRoster(sectionId)` remains an internal assembly helper only. It is not
called by `doGet` or `doPost`, so it is inaccessible through the deployed web
app. A future authenticated transport may reuse it; that transport must enforce
teacher access before returning any student-identifying data. The backend will
continue to own filtering, display-name fallback, sorting, and column labels.

Deployment of roster access and roster printing is blocked pending an
authenticated access design. The existing anonymous bulk planner GET remains
unchanged and contains only the existing non-student planning datasets.

## Future print boundary

Once authenticated access exists, roster data should be held only in temporary
in-memory print state. It must not be stored in localStorage or in the Lesson
Session data model. Until then, `Print lesson` remains lesson-only.

## Setup limitation

`setupRosterSheetsV1()` is a manually invoked development helper. It validates
all three target sheets and the intended SectionIDs before writing and uses a
script lock to prevent overlapping runs. Apps Script does not provide a true
transaction across sheets, so a failed setup attempts to delete sheets it
created and restore pre-existing target sheets to their validated empty or
header-only state. An incomplete rollback is reported as an error and requires
manual workbook review.
