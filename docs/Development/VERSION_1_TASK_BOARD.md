# Version 1 Task Board

## New Notes — Unreviewed

Add new observations here under the date. Write the workspace and what
happened; priority and solutions can wait for review.

Example:

```markdown
### YYYY-MM-DD

- Planning: The copy picker should remember the last destination class.
- Lesson Planner: Printing cut off part of the materials section.
```

### 2026-08-18

- **Planning / preparation design reference — Connected Math Investigation
  overview.** The scanned `Subtracting Integers` investigation overview is a
  strong model of clarity: prominent investigation identity, a short narrative
  explaining the instructional arc, a separate scannable list of mathematical
  goals, and a problem-by-problem materials table that distinguishes student
  needs from teacher preparation. Apply this pattern when designing the weekly
  preparation table and `The Bullet`: instructional meaning first, logistics
  second, both on one calm printable page. A Year Planner materials table could
  map Problem to Lesson or Teaching Episode, `For students` to materials needed
  in class, and `For the teacher` to items to prepare or photocopy, while adding
  explicit quantities, direct PDF links, printed QR codes, and curriculum page
  references. The source scan remains local in Downloads and is not committed.

### 2026-08-21

- **Deliverables overview.** Add a teacher-facing list of deliverables grouped
  first by class and then chronologically by date. This should make it easy to
  see what each class has coming up without opening individual Lesson Sessions.
- **Lesson Session durability / recovery.** After Netlify project visibility
  was changed from private to public, the Planning view appeared empty in both
  Chrome profiles even though the visibility change itself does not delete app
  data. The Lesson Sessions were still recoverable from the SVUSD Chrome
  profile's local-storage database. A read-only storage snapshot and validated
  JSON recovery file were created; 50 production sessions were recovered (10
  each for M8-P1, M8-P2, M8-P3, IM1-P5, and IM1-P6, dated August 6–21). A
  temporary same-origin recovery page first backs up anything the browser
  currently exposes and then restores the validated sessions. Teacher
  verification confirmed that all lessons returned.
- **New need — durable Lesson Session storage.** Browser-only local storage is
  too fragile for primary teacher-authored plans. Review a durable persistence
  and recovery design that survives browser-profile changes, cleared site data,
  and device failure. It should include automatic server-side synchronization
  or backup, a visible last-saved state, safe conflict handling, and an easy
  teacher-controlled export/restore path. This is recorded for review and has
  not yet been prioritized or implemented.

## ?? Critical

- [ ] Improve lesson printing
- [ ] Finish Planning ? Lesson Session workflow
- [ ] Morning "Am I OK?" polish
- [ ] Weekly planning polish

## ?? Important

- [ ] Materials improvements
- [ ] Episode editing polish
- [ ] Lesson print layout
- [ ] Navigation polish

## ?? Nice Before August

- [ ] Keyboard shortcuts
- [ ] Minor UI cleanup
- [ ] Small performance improvements

## ? After August

- Reflection
- AI narration
- Insight Inbox
- Pattern detection
- Voice pipeline
- Teacher coaching

---

## Current Sprint

Goal:

Close the highest-priority task.

Success:

One fewer reason to open FileMaker.

---

## Recently Completed

- [x] ...
- [x] ...
- [x] ...

---

## Blockers

- ...

---

## Notes

Anything discovered while implementing.
At the moment, my workflow is to use the Units tab to plan the day in Monday Manager, then go back and enter it into Year Planner. It is just much faster to have two screens up, Units and Monday Manager, and type or copy into Monday Manager.

Lesson Planner
	I need to be able to easily move up and down the bullets in a lesson episode. First pass: probably arrows; next, drag and drop.
	The sort-by-students interface needs UI polish.
	Copy Plans To needs to have checkboxes. Look to Google Classroom for ideas of UI for this.
	We need to address the "open time" on block days. This might mean the grid is filtered by "available classes," where only the classes that meet it show up. "Open Time" is reserved only when I don't have a class. Right now the grid is listing by class, rather than by what the periods for the day.
	The entire drop-down for "Curriculum Lesson" needs to be rethought. It is clunky to have to scroll down. The actions I use most are delete and make deliverable. I am not sure that all of them are still applicable
	We want to work out the delivery due dates: easy to enter, easy to change. Eventually, changes here will propagate to both the student view and the gradebook.
Planning
	I want the "print" button right next to the day, at the top.
	The information that is displayed needs to be changed-- not helpful
	I want to be able to hover over a Learning Session, and it shows a compact (titles only) view of the lesson
	**Big issue**: when typing, it jumps out every few seconds; I have to click back to where I was typing and continue.
	**I need to be able to copy lessons across days.** At the moment, I can only copy lessons inside a day. One main issue with that is that, for Monday, for example, I can't copy over a lesson for Math 8 p.1 to Math 8 p.2 since Monday/Tuesday are block days, and I do not see Math 8 p.2 on Mondays. Same issue for Math 1 p.5
	I want a list of what I need to prep for the week that I can at least screenshot and print. I'm thinking a simple table with headers: Lesson, Key Ideas (what we want to make sure we get to), when this is an online lesson I want to know how to pace the screens, and key is what materials I have to have on hand and what I need to print out. For eaxmple, activity cards-- how many (1 per students?) and a link I can click on to get those PDF's to print.
	8/21 I want a way to delete a whole lesson in the week view-- right in the top right of each lesson pill
	8/21 Bullets or something to delineate between each deliverable. Hover over to see due date (once we put due dates on deliverables)
Rosters
	Darker on the grid lines
	Every 5th line, make that extra dark
	I want class day and school day printed in the top header under the date.
	8/19 I need to update the rosters. Probably a good time to think about a system for this.
Units
	I want the lessons numbered: Unit 1, lesson 1 becomes 1.1.
	I want to get **practice** into the units somehow. Design question. They do need to be deliverables that eventually can be passed to a gradebook.
	Snapshots: I want to extract those somehow and get them available in the unit planner.
	We have to have a faster way to get curriculum into the planner. Spreadsheet template and import? It should be fast. This took DAYS!
	I want to get materials needed into each lesson. The goal here is to have a fast way to see what I need to make sure I have on Sunday.
	8/18 I want an icon on the lessons that require paper components. I want to be able to hover over this icon and see what they need. A link to PDF's would be great. Careful of our boundaries-- YP is not a curriculum, it is a thinking and organizing tool to support delivery of the curriculum. Smallest slice is probably a check box next to the title.
	8/20 Lesson Takeaways-- I need a place to put these. They should be different than goals, should have prominent display
Forecast
	I need to review the Forecast workflow now that it is live and see how it fits with my workflow. Right now it says I need to log. The log shows up in the Units, but I think it needs to show up in the Lesson so that logging captures the day it is done and notes for the specific class.
Future Work
	Something I am struggling with is being able to see easily, across all my classes, what is assigned in Amplify, when the assignments are due, if they are paused or not, and if paused on what screen. The Amplify dashboard does not help much with this. Ideas?
Monday Manager
	I really need a better tool for students! Maybe a small step is a webpage which list assignments by classes? What is the smallest slice we can make to get students the critical information about what is due and when it is due? 
The Bullet
	I am not sure where this lives but I need:
	Tomorrow you are teaching …
	The key ideas are …
	This is a computer/paper/hybrid
	Materials you need to prepare are …
	Materials you need available are (like tracing paper, scissors, dice, …)
Plan and Prep (8/18)
	I want something like "Let's Prep Unit 1" that helps me get ready with very structured guidance, PDF's available, directions for what needs to be printed.

---

## Reviewed Backlog — Sprint 7.0

The original Notes above are the preserved teacher observations. This section
records their reviewed disposition and implementation status.

Status key:

- **Completed** — reviewed, implemented, teacher-verified, and deployed.
- **Diagnosed** — cause and current response are understood; no Year Planner
  implementation is pending unless new evidence changes the disposition.
- **Prioritized** — reviewed and ranked; implementation has not begun.
- **Deferred** — intentionally held behind higher-impact work.

### Completed — Deployed August 18, 2026

- **Copy a Lesson Session across days.** A teacher can copy one complete plan
  to a same-course class meeting on another day in the visible week. The copy
  is independent: later source edits do not change the destination.
- **Compact copy destination picker.** `Copy plan to…` now uses a destination
  day (defaulting to the next teaching day), destination class, and explicit
  Copy button instead of a long flat session list.
- **Reorder lesson-episode outline bullets.** Up/down controls are persistently
  visible and preserve the outline structure when a bullet moves.

### Diagnosed — External Browser Limitation

- **Typing focus interruption in Chrome Split View.** Testing showed that
  Chrome moves the active-view border away from Year Planner even when the
  other Split View pane is blank. Year Planner remains stable in a normal tab
  and in two ordinary Chrome windows arranged side by side. The classroom
  workaround is to use two side-by-side windows rather than Chrome Split View.
  Plain arrow keys in Year Planner also retain native cursor behavior instead
  of moving focus to another outline line.

#### Roster spreadsheet round trip — completed and deployed 8/19

1. Export the current Year Planner rosters into a spreadsheet template.
2. Support additions, removals, class-period moves, and student-information
   changes in that spreadsheet.
3. Upload the revised spreadsheet and preview every proposed change before
   applying it.
4. Require explicit confirmation before changing roster data.

Implemented in the authenticated Roster Admin Apps Script and deployed as
version 29. The workflow uses stable student/enrollment IDs, explicit actions,
complete-batch validation, stale-preview detection, locking, and a full
spreadsheet backup before applying changes. Missing rows are never removals.
Teacher production run completed successfully on 8/21: 34 reviewed roster
changes were applied (15 additions and 19 enrollment removals), and the
workflow produced its pre-change safety backup.

### Completed — Teacher Verified

#### Deliverables list for Synergy grade entry — deployed 8/21

Build a secondary teacher utility for transferring Year Planner deliverables
into Synergy. It is urgent and important because grade-entry catch-up is a
current classroom need.

1. Add a small `Deliverables` utility button in Planning. It opens a separate
   window so Deliverables and Synergy can remain side by side; it does not have
   the navigation weight of Planning, Lesson Planner, Units, or Forecast.
2. Include only Lesson Planner items marked `Deliverable`. Organize the window
   as stacked class sections and hide classes with no matching deliverables.
3. Default to the 10 most recent past deliverables per class, with controls for
   5, 10, 20, or all historical deliverables.
4. Show title, effective date, source Lesson Session, and whether the effective
   date is the lesson date or an entered due date. Clicking a row opens its
   Lesson Planner session.
5. Add a class-specific due date to deliverables. Make it editable in both
   Lesson Planner and inline in this utility. New deliverables default to the
   next school day; until a due date exists, the list falls back to lesson
   date.
6. Add separate one-click controls to copy the title and copy the due date for
   pasting into Synergy.
7. Add a persistent `Entered in Synergy` checkbox. Checked deliverables remain
   visible in chronological order rather than disappearing.

This is a teacher workflow, not a student assignment page. Future propagation
to the student view or gradebook remains separate work.

Implemented in the frontend and deployed to the existing Netlify production
site as deploy `6a888180b6389ca5e71e28f1`. Automated tests, production build,
local empty-state rendering, separate-window launch, and browser console checks
passed. Teacher verification completed 8/21 in the normal Chrome workflow: the
separate Deliverables window opened successfully, and both an edited due date
and the `Entered in Synergy` checkbox persisted after closing and reopening it.

### Prioritized — Not Started

#### Add persistent custom roster ordering

The CSV workflow retains alphabetical first-name/last-name print sorting.
Custom hand-ordering requires a new canonical order field and remains a
separate, lower-priority enhancement.

#### 1. Reuse and edit lesson plans efficiently

1. Rework the Curriculum Lesson action menu.
2. Add multi-destination selection to `Copy Plans To`.

#### 2. Manage assignments and deliverables

1. Create a student assignment webpage showing title, due date, link, and
   availability or paused status.
2. Create a teacher overview of Amplify assignments across all classes.
3. Build teacher-side due-date entry, editing, application, and visibility.
4. Decide whether curriculum practice needs its own model beyond the current
   lesson-episode and deliverable workflow.

#### 3. Prepare curriculum and materials

1. Add Amplify lesson snapshots to Units.
2. Add a curriculum-lesson checkbox meaning `This lesson includes a paper
   component`. Show a paper icon plus `Paper required` in Units, Planning,
   Lesson Planner, and the printed lesson plan. Missing this preparation can
   prevent the lesson from proceeding as planned.
3. Build a guided `Let's Prep Unit 1` readiness workflow used before the unit
   and during weekly preparation. Combine unit purpose, lesson sequence, key
   ideas, paper/PDF needs, quantities, and materials to gather. Use imported
   curriculum information where available and teacher entry for what is
   missing.
4. Make unit prep, the printable weekly photocopy list, and `The Bullet` three
   views of the same preparation data. The first printable slice shows lesson,
   required quantity, clickable PDF links on screen, and QR codes in print.
5. Number lessons as `1.1`, `1.2`, and so on.
6. Build a spreadsheet template and import workflow for new curricula.

#### 4. Record what happened

1. Attach logging to the class-and-date-specific Lesson Session.
2. Enter next-class changes through Lesson Planner.
3. Make relevant results visible with the curriculum lesson.
4. Reconcile Forecast prompts with this workflow.

#### 5. Capture rough plans quickly

1. Provide a low-structure first-pass planning mode.
2. Reduce unnecessary fields, clicks, and premature lesson structure.
3. Reduce duplicate entry between Units, Monday Manager, and Year Planner.

#### 6. Make printed Rosters classroom-ready

1. Darken printed grid lines and make every fifth line extra dark.
2. Print class day and school day beneath the date.

#### 7. Plan today without fighting the tool

1. Show only classes that meet on block days.
2. Replace unhelpful Planning-item information with lesson/session title,
   deliverables, and materials.
3. Add compact lesson/session hover previews.
4. Put Print beside the selected day.

### Deferred

- Polish the sort-by-students interface after higher-impact classroom
  workflows are stable.
