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
Rosters
	Darker on the grid lines
	Every 5th line, make that extra dark
	I want class day and school day printed in the top header under the date.
Units
	I want the lessons numbered: Unit 1, lesson 1 becomes 1.1.
	I want to get **practice** into the units somehow. Design question. They do need to be deliverables that eventually can be passed to a gradebook.
	Snapshots: I want to extract those somehow and get them available in the unit planner.
	We have to have a faster way to get curriculum into the planner. Spreadsheet template and import? It should be fast. This took DAYS!
	I want to get materials needed into each lesson. The goal here is to have a fast way to see what I need to make sure I have on Sunday.
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

### Prioritized — Not Started

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
2. Build a printable weekly photocopy list showing lesson, required quantity,
   clickable PDF links on screen, and QR codes in print.
3. Later extend the same preparation data into a complete weekly table and a
   tomorrow-focused `The Bullet` view.
4. Number lessons as `1.1`, `1.2`, and so on.
5. Build a spreadsheet template and import workflow for new curricula.

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
