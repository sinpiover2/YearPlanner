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

Phase 1 contains only local source. It has no `.clasp.json` because no roster
Apps Script project has been created or mapped. It has not been pushed,
deployed, authorized, or connected to a modified spreadsheet.

The guarded `setupRosterSheetsV1()` helper remains in the existing
`apps-script/Code.js` during Phase 1. It has not been copied here or executed.
That migration requires a separate review because this project's production
manifest intentionally requests read-only spreadsheet access.

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
