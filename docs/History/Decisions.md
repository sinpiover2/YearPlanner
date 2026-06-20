# Major Decisions

This document records architectural and design decisions that shaped the project.

The purpose is to preserve *why* decisions were made, not merely what was implemented.

---

# June 2026

## Technology Stack

Decision:

Use:

- React
- Vite
- Google Sheets
- Google Apps Script
- Vercel

Reason:

This architecture matches the Classroom Timer project, reducing complexity and allowing reuse of existing knowledge and deployment processes.

---

## Year Planner Is a Decision-Support Tool

Decision:

Year Planner is not a reporting dashboard.

Reason:

Dashboards display information and ask teachers to interpret it.

Decision-support tools interpret information and help teachers actÑor confirm that no action is needed.

---

## The Organizing Question

Decision:

Everything revolves around:

> Am I OK?

Reason:

Teachers are usually asking this question, even when they do not say it explicitly.

---

## Primary Planning Level

Decision:

The primary planning object is the Unit.

Hierarchy:

```text
Course
 ?
Unit
 ?
Lesson
```

Reason:

Teachers naturally think in units rather than individual lessons.

The file structure and planner database should reflect the teacher's mental model.

---

## Primary View

Decision:

The default application view is a Timeline Dashboard.

Secondary view:

- Calendar Grid

Reason:

The purpose of the application is pacing and year planning.

Timelines reveal pacing drift more effectively than calendars.

---

## Initial Courses

Decision:

Begin with:

- Math 8
- Integrated Math 1

Reason:

These courses are currently being taught and are sufficient to validate the design.

---

## Information Order

Decision:

Information always appears in this order:

1. Reality
2. Consequence
3. Recommendation

Reason:

Warnings without context create anxiety.

Facts create trust.

---

## Timeline = Orientation

Decision:

The timeline provides orientation.

Cards provide interpretation.

Reason:

Combining both responsibilities makes visualizations noisy and difficult to understand.

---

## Drift Is Geometric

Decision:

Represent drift through position rather than emphasizing numerical variance.

Reason:

Teachers understand:

> Where am I?

more naturally than:

> How many days off am I?

Position is more important than numbers.

---

## One Dot and One Line

Decision:

Use:

- Black dot = current position
- Vertical line = expected position

Reason:

Two dots imply two objects.

One object and one reference are easier to understand.

---

## Rows Stay

Decision:

Period rows remain visible.

Reason:

Periods are landmarks.

Stable geometry reduces cognitive load.

---

## No Section Compression

Decision:

Remove row compression from the roadmap.

Rejected:

- Shared rows
- Dynamic collapsing
- Hidden sections

Reason:

Changing geometry creates confusion.

Synchronization should change interpretation, not structure.

---

## Breaks Are Terrain

Decision:

Remove the separate break row.

Integrate breaks directly into tracks.

Reason:

Breaks are part of the year itself.

Teachers think:

> Nothing happens here.

not:

> Here is a separate layer of vacation information.

---

## Stability Is Kindness

Decision:

Prefer stable structures over clever structures.

Reason:

Teachers should not need to relearn the interface.

---

## Semantic Colors Are Separate From Course Colors

Decision:

Status colors and course colors are independent.

Reason:

Identity and meaning are different.

A green course should not imply everything is fine.

---

## Red Is Reserved

Decision:

Red is used only for Buffer Exhausted.

Reason:

Most educational software overuses red.

Warnings should retain their meaning.

---

## Progress Uses Area

Decision:

Progress should be represented by area whenever possible.

Pattern:

- Light background = planned.
- Dark fill = completed.

Reason:

Area communicates progress more naturally than icons.

---

## The Timeline Behaves Like a Map

Decision:

Treat the year as a landscape.

Reason:

Maps are understood quickly.

Rows stay.

The year stays.

The teacher moves.

---

## Version 1 Scope

Included:

- School calendar
- Unit pacing
- Instructional day calculations
- Timeline visualization
- Forecasting
- Buffer calculations

Excluded:

- Standards tracking
- Assessments
- Collaboration
- Gradebook features
- LMS functionality

Reason:

Focus on proving the planning workflow before adding complexity.

---

## The Best Designs Disappear

Decision:

Favor simplification over feature accumulation.

Reason:

Every major improvement so far has come from removing something rather than adding something.

Examples:

- Two dots ? one dot and one line.
- Course grouping.
- Elimination of section compression.
- Elimination of the break row.

Invisible design is successful design.