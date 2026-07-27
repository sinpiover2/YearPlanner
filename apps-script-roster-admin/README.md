# Authenticated Roster Print App

This directory is the isolated source for Year Planner's roster-only Apps
Script HTML Service application. It is not part of the anonymous planning API.

## Security boundary

- Student-identifying data is read and rendered only inside this Apps Script
  application.
- The planned production deployment executes as the deploying teacher and is
  accessible only to that deploying teacher.
- The Vercel frontend will eventually open this application as a separate page;
  it will not fetch or persist roster JSON.
- The deployment URL and SectionID are routing information, not credentials.
  Access control comes from the Apps Script `MYSELF` deployment restriction.

## Local project state

This project is mapped (`.clasp.json`) and deployed — `CombinedPrint.html` is
the live target of the frontend's "Print lesson"/"Print Day" actions. Its
manifest (`appsscript.json`) requests the full `spreadsheets` OAuth scope
(read and write), not read-only, so `RosterImport.js` (below) needed no
manifest change to add write capability. An earlier version of this note
described a read-only, not-yet-deployed Phase 1; that has since progressed.

The guarded `setupRosterSheetsV1()` fictional-data seeder still lives only in
`apps-script-planning/Code.js` and has not been copied here — it seeds four hardcoded
approved sections with made-up names for local development and was never
meant for real rosters. `RosterImport.js` in this project is the real-roster
equivalent for actual classroom use; it does not reuse or depend on the
seeder, only its validate-then-lock-then-write safety pattern.

## Roster Import

`RosterImport.js` adds a guarded, teacher-invoked way to load real students
into `Students` and `SectionEnrollments` from a plain staging sheet, without
any file upload or new web UI.

**One-time setup:**

1. Open the spreadsheet's Apps Script editor (Extensions → Apps Script, or
   the standalone project directly).
2. Run `setupRosterImportSheetV1` once. It creates a `RosterImport` sheet
   with the header row `SectionID | LegalFirstName | LegalLastName |
   PreferredName | Status` if the sheet doesn't exist yet, or validates it in
   place if it already does. Safe to run again later — it will not overwrite
   a sheet that already has the correct headers, and refuses (with a clear
   error) to touch an incompatible non-empty sheet.
3. Optionally run `installRosterMenuTrigger_` once so a **Year Planner
   Roster Admin** menu (Set Up Roster Import Sheet / Import Roster from Staging)
   appears automatically when the spreadsheet is opened. This project is
   standalone, not bound to the spreadsheet, so the menu only appears after
   this one-time installable-trigger setup — every function remains directly
   runnable from the Apps Script editor either way, exactly like
   `setupRosterSheetsV1()` already is.

**Each import:**

1. Paste or type roster rows into `RosterImport`. However the official class
   list arrives (district CSV/Excel export, a Google Classroom export, a
   portal table) — normalize it into this sheet first; whatever produced it
   doesn't matter to the importer.
2. Run `importRosterFromStaging` (Apps Script editor, or the spreadsheet
   menu if installed).
3. Read the `Status` cell written back on every row you entered:
   - `Imported: student and enrollment created` / `Imported: enrollment
     created` — this row is now live.
   - `Skipped: active enrollment already exists` / `Skipped: duplicate row
     within this import` — already accounted for; nothing was written twice.
   - `Rejected: unknown SectionID` / `Rejected: missing legal first name` /
     `Rejected: missing legal last name` / `Rejected: ambiguous student
     match (...)` — this row, and the whole run, was not applied.
   - `Not imported: batch rejected — fix flagged rows above and re-run` — an
     otherwise-fine row that didn't run only because another row in the same
     batch was rejected.
   - `Not imported: write failed — see import summary` — validation passed
     but the spreadsheet write itself failed; the import result reports
     whether rollback of any newly written rows succeeded.
4. If the menu was installed, the alert dialog also shows a per-section
   count (imported / skipped / rejected) so a miscount is visible
   immediately rather than discovered mid-class.

**Validation and matching, in brief** (full policy is documented inline in
`RosterImport.js`): every row is validated — and the whole batch's matching
plan resolved — before anything is written; one bad or ambiguous row blocks
the entire run rather than partially importing. There is no district student
ID in this data model, so a student already on the roster is only ever
reused when their normalized legal name matches exactly one existing active
student; two or more existing students sharing a name is treated as
unresolvable and rejected rather than guessed at. Re-running the same
staging content is always safe — already-imported rows are recognized and
skipped, never duplicated.

**Current limitation:** this covers imports and additions only. Deactivating
an enrollment (a drop) is not implemented in this slice — see
`docs/Development/CLASSROOM_READINESS.md`.

**Privacy:** `RosterImport` and the sheets it writes to live only in the
spreadsheet. Never paste real student data into this repository — commit
messages, test fixtures, screenshots, or any other source-controlled file.
The test suite for `RosterImport.js` uses fictional names only, run locally
outside the repository.

## Requests

`doGet` (roster only, `RosterPrint.html`) accepts:

- `sectionId`: required to resolve a roster; validated server-side.
- `sessionDate`: optional ISO date (`YYYY-MM-DD`) used only in the print heading.

`doPost` (combined lesson + roster print, `CombinedPrint.html`) is what the
frontend's "Print lesson" action submits as a hidden form POST. It accepts
the same `sectionId` and `sessionDate`, plus `lessonPayload`: a JSON string of
the lesson plan (section/course/unit labels, connected curriculum lesson
labels, printable episodes and blocks). It never carries roster or student
data — that's loaded here, from the spreadsheet, same as `doGet`. A POST form
is used instead of a query string because the lesson payload can exceed URL
length limits and must not appear in request logs as a query string.

Missing sheets, invalid section references, sections without active
enrollments, and unparseable lesson payloads all produce a calm, explicit
state (empty roster or an error banner) rather than exposing another section
or printing a misleading blank page.

`RosterSection.html` and `RosterStyles.html` hold the roster table's markup
and styles once, included by both `RosterPrint.html` and `CombinedPrint.html`
via the standard Apps Script HTML Service `include_()` pattern.

## Deployment gate

Before any future deployment, verify in the district teacher account that the
web app settings are exactly:

- Execute as: deploying user
- Who has access: only the deploying user

Do not widen access to the domain, signed-in users generally, or anonymous
users without a new security review.
