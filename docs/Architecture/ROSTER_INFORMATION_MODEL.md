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

`getSectionRoster(sectionId)` remains an internal assembly helper in the
anonymous project during Phase 1. It is not called by `doGet` or `doPost`, so it
is inaccessible through the deployed anonymous web app. An isolated local copy
now lives in `apps-script-roster/` for the approved authenticated HTML Service
application. The backend continues to own filtering, display-name fallback,
sorting, and column labels.

The roster application is planned for a separate Apps Script project deployed
as `USER_DEPLOYING` with access restricted to `MYSELF`. Phase 1 is local source
only: it has not been pushed, deployed, authorized, or connected to modified
spreadsheet data. The existing anonymous bulk planner GET remains unchanged and
contains only the existing non-student planning datasets.

## Combined print

`Print lesson` submits a hidden form POST (not a fetch call, and not a query
string) to the authenticated roster Apps Script, carrying `sectionId`,
`sessionDate`, and a small serialized lesson-plan payload (section/course/unit
labels, connected curriculum lesson labels, and printable episodes/blocks —
never roster or student data). The Apps Script's `doPost` authenticates the
user, loads the roster itself via `getSectionRoster_`, and renders one HTML
Service page: the lesson plan (page 1), a forced page break, then the roster
(page 2). That page owns the single print action; the frontend never receives
roster JSON, and the lesson payload is never persisted anywhere. If the
section/date is missing, the lesson payload can't be parsed, or the roster
fails to load, the combined page renders a single explicit error state instead
of a partial or misleadingly blank roster.

The standalone `doGet` roster-only route (`RosterPrint.html`) remains available
for internal use; its roster table markup and styles are shared with the
combined page via Apps Script HTML Service template includes
(`RosterSection.html`, `RosterStyles.html`) rather than duplicated.

Roster data must not be stored in localStorage or in the Lesson Session data
model.

## Setup limitation

`setupRosterSheetsV1()` is a manually invoked development helper. It validates
all three target sheets and the intended SectionIDs before writing and uses a
script lock to prevent overlapping runs. Apps Script does not provide a true
transaction across sheets, so a failed setup attempts to delete sheets it
created and restore pre-existing target sheets to their validated empty or
header-only state. An incomplete rollback is reported as an error and requires
manual workbook review.
