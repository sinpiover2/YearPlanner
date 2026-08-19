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

### RosterImport

Columns, in exact order:

```text
SectionID
LegalFirstName
LegalLastName
PreferredName
Status
```

A teacher-facing staging sheet, not a canonical roster sheet. `Status` is
written by the importer as output; it is never read as input. See "Roster
Import," below.

## Access boundary

The deployed Year Planner web app permits anonymous reads of non-student
planning data. Student names must never pass through that anonymous endpoint.
There is therefore no public roster GET route, and the production frontend does
not request or render roster data.

`getSectionRoster(sectionId)` remains an internal assembly helper in the
anonymous project during Phase 1. It is not called by `doGet` or `doPost`, so it
is inaccessible through the deployed anonymous web app. An isolated local copy
now lives in `apps-script-roster-admin/` for the approved authenticated HTML Service
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

A second standalone route, `doPost` with a `sectionIds` field (`RosterPrintMulti.html`,
used by Planning's "Print Rosters"), prints one or more blank rosters with no
lesson content, in the order the sections were posted. It shares the same
`getSectionRoster_` and roster partials, so standalone, multi-section, and
combined printing all render roster pages from the one canonical renderer.

Sort order (last name vs. first name) is a `sortBy` field on the print
request, not a spreadsheet setting: `normalizeRosterSortBy_` resolves it per
request, and any caller that omits it keeps the existing last-name-first
behavior. The frontend remembers the teacher's last choice for the browser
session only (`sessionStorage`, via `rosterSortPreference.js`) so it carries
across print actions without becoming a persistent server-side setting.

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

## Roster Import

`RosterImport.js`, in the same authenticated `apps-script-roster-admin/` project,
adds the real-roster counterpart to `setupRosterSheetsV1()`'s fictional
seeding: `setupRosterImportSheetV1()` creates or validates the `RosterImport`
staging sheet, and `importRosterFromStaging()` turns its rows into `Students`
and `SectionEnrollments` records. Both are guarded the same way
(script-locked, fully validated before the first write, rollback scoped to
exactly the rows the attempt appended). Full behavior — validation order,
duplicate handling, and the name-matching policy below — is documented inline
in `RosterImport.js` and operationally in `apps-script-roster-admin/README.md`.

No district student identifier is assumed to exist, so student identity is
matched only by normalized `LegalFirstName`/`LegalLastName`: an exact match
against exactly one existing active student reuses that `StudentID`; no match
mints a new one; two or more existing active students sharing a name is
unresolvable and rejects the row rather than guessing. A row's `(StudentID,
SectionID)` pair that already has an active enrollment — in canonical data or
earlier in the same staging batch — is skipped, never duplicated. Any
rejected or ambiguous row blocks the entire import batch before any roster
mutation; nothing is partially imported.

The authenticated Roster Manager (`?view=manage`, implemented by
`RosterUpdate.js` and `RosterManager.html`) extends this with a guarded full
CSV round trip. Exported rows retain `StudentID` and `EnrollmentID`; explicit
`KEEP`, `ADD`, and `REMOVE` actions support student-information changes,
section moves, additions, and enrollment deactivation. Missing rows never
mean removal. Upload is preview-only until the exact confirmation phrase is
entered. Apply is lock-protected, fingerprinted against the preview, backed up
before mutation, and fingerprinted again after backup immediately before the
write. Student CSV data remains inside the `MYSELF`-restricted app.

Custom hand-ordering remains out of scope because the canonical roster model
does not yet contain a persistent student/enrollment order field.
