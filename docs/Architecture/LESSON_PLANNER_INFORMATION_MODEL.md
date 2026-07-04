# Lesson Planner Information Model

**Document Status:** Foundational Architecture  
**Purpose:** Define the information model for Lesson Planner before interface implementation.

---

# Purpose

Lesson Planner is the live teaching workspace.

It is the interface between Year Planner and the realities of the classroom.

It answers one question:

> **How do I teach this class well?**

Lesson Planner is where instructional planning becomes instructional execution.

It is not a lesson document.

It is not a gradebook.

It is not an attendance system.

It is not a replacement for district software.

It is the operational workspace used before, during, and immediately after teaching.

---

# Core Philosophy

Lesson Planner is not organized around documents.

It is organized around teaching.

Teaching unfolds as an ordered sequence of instructional events.

Lesson Planner exists to organize, support, and remember that sequence.

---

# Relationship to the Suite

Each workspace owns a different horizon of teaching.

| Workspace | Teacher Question |
|-----------|------------------|
| Forecast | Am I OK? |
| Units | Where am I in the curriculum? |
| Today | What am I teaching today? |
| Lesson Planner | How do I teach this class well? |

Year Planner determines **what** is being taught.

Lesson Planner determines **how** that lesson unfolds.

---

# Relationship to Today

Today determines the instructional context before Lesson Planner opens.

It provides:

- course
- section
- period
- instructional date
- unit
- lesson
- meeting start time
- meeting end time

Meeting times are determined by the active school calendar and schedule pattern.

They may vary because of:

- block schedules
- minimum days
- late-start schedules
- assemblies
- testing schedules
- special events

Selecting **Start Lesson** creates or opens the correct **Lesson Session** automatically.

Lesson Planner should never ask the teacher to reselect information that Today already knows.

Today ends when the teacher chooses what to teach.

Lesson Planner begins when teaching begins.

---

# Core Object

The center of Lesson Planner is the **Lesson Session**.

A Lesson Session represents one specific class meeting.

Examples:

```text
Math 8
Period 2
September 14, 2026
9:40Ð10:35

Unit 2
Lesson 3.2
```

Everything that happens during class belongs to the Lesson Session.

Instructional segments.

Deliverables.

Teacher notes.

Reflections.

Student observations.

Print views.

The Lesson Session becomes the operational record of what actually occurred during that class meeting.

---

# Primary Object Within a Lesson Session

Each Lesson Session contains an ordered collection of **Instructional Segments**.

Teaching is experienced as a sequence.

Example:

```text
0. Welcome

1. Warm Up

2. Homework Review

3. Launch

4. Investigation

5. Discussion

6. Exit Ticket

7. Homework
```

The numbering is presentation only.

The underlying model is an ordered collection.

Teachers naturally think in instructional sequence.

Lesson Planner should preserve that way of thinking.

---

# Instructional Segments

Instructional segments are intentionally lightweight.

Each segment represents one discrete teaching event.

Possible information includes:

- title
- order
- estimated duration
- teacher notes
- student directions
- materials
- links
- deliverables
- grouping needs
- reminders
- reflection
- carry-forward status

Not every segment requires every field.

Creating a new segment should remain nearly frictionless.

---

# Segment Operations

Instructional momentum is more important than document editing.

Segments should eventually support:

- add
- delete
- reorder
- duplicate
- collapse
- expand
- bump to tomorrow
- move to another lesson
- save as reusable
- mark complete
- mark skipped

These operations mirror how experienced teachers actually adapt lessons.

---

# Before Class

Before class, Lesson Planner should answer:

> **What do I need in order to teach this class well?**

Typical information includes:

- instructional sequence
- lesson goals
- materials
- links
- handouts
- warm-up
- homework review
- teacher reminders
- groups
- roster reference
- publishable student work

Preparation should remain lightweight.

Lesson Planner is not intended to become a lesson-writing application.

---

# During Class

During instruction the software should stay out of the teacher's way.

The teacher may need to:

- glance at the instructional sequence
- see what comes next
- adjust timing
- skip an activity
- extend an activity
- bump work to tomorrow
- make a quick note
- assign homework
- record what actually happened

The interface should minimize attention away from students.

---

# End of Class

At the conclusion of class, Lesson Planner should help close the instructional loop.

Typical actions include:

- mark lesson complete
- record deliverables
- note what changed
- identify carry-forward work
- capture lesson improvements
- preserve useful reflections
- publish student-facing work
- return to Today

Completing a Lesson Session should naturally update the rest of the Year Planner ecosystem.

---

# Temporary vs Permanent Information

Not every instructional thought deserves permanent storage.

Lesson Planner should distinguish between working memory and instructional memory.

## Temporary Working Information

Examples:

- handwritten notes
- quick reminders
- timing changes
- whiteboard sketches
- today's observations
- paper annotations

These support today's teaching.

Many never need to become permanent records.

The software should respect that reality.

---

## Permanent Instructional Knowledge

Examples:

- lesson improvements
- reusable teaching ideas
- recurring misconceptions
- curriculum revisions
- reflection
- publishable student work

These improve future teaching.

The software should make preserving them effortless.

---

# Teacher Information

Teacher-facing information remains private unless explicitly published.

Examples:

- agenda notes
- instructional reminders
- anticipated misconceptions
- materials
- reflection
- grouping notes
- planning notes

Teacher information exists to support instruction.

---

# Deliverables

A Deliverable represents student-facing work assigned during a Lesson Session.

Examples:

- Lesson 1.2
- Practice Set A
- Exit Ticket
- Homework
- Project Milestone
- Quiz
- Reading Assignment

Deliverables are not simply text.

They are durable instructional objects.

A deliverable should be capable of flowing to multiple destinations without being recreated.

Possible destinations include:

- Monday Manager
- Student weekly summaries
- LMS
- Gradebook
- Parent communication
- Future analytics

Early implementation does not need to support every destination.

The information model should preserve those future possibilities.

A Deliverable should eventually include:

- title
- description
- originating Lesson Session
- originating Instructional Segment
- assigned date
- due date
- publishable status
- completion status
- optional grading status
- optional resource link

Working principle:

> **Student work should not be modeled as disposable text.**

> **It should be modeled as an instructional object capable of traveling throughout the system.**

---

# Student Observations

Lesson Planner may support lightweight observations about individual students.

Examples:

- learning observations
- follow-up reminders
- grouping considerations
- AI-transcribed notes

These observations support teaching.

They are not official student records.

Sensitive or permanent student information belongs in district systems.

---

# Roster Boundary

Lesson Planner may use roster information for classroom workflow.

Appropriate uses include:

- printable rosters
- planning sheets
- group reference
- material distribution
- seating reference

Lesson Planner should not become:

- attendance software
- gradebook
- discipline system
- library system
- SIS replacement

Working rule:

> **Roster information supports teaching logistics. It does not become a student information system.**

---

# Seating and Groups

Future classroom-management features may include:

- seating reference
- table assignments
- partner assignments
- groups
- printable seating charts

These should be modeled as classroom organization rather than graphics.

A visual seating chart is one presentation of that model.

This work remains outside the initial implementation.

---

# Print Views

Printing is a first-class output.

Many teachersÑincluding the primary user of this projectÑteach from printed lesson sheets.

A print view may include:

- course
- section
- meeting time
- instructional sequence
- roster
- agenda
- deliverables
- materials
- generous note space

The printout is an output.

It is not the source of truth.

Handwritten notes may remain temporary unless intentionally preserved.

---

# Output Channels

Lesson Planner authors instructional work.

Output channels publish it.

Examples include:

- Monday Manager
- daily class sheets
- student weekly summaries
- substitute plans
- parent communication
- LMS exports
- AI summaries

Output channels should never require duplicate planning.

---

# Monday Manager

Monday Manager is not a planning application.

It is a beautifully formatted publication.

Its question is:

> **What do students need to do this week?**

It consumes publishable instructional information from Lesson Planner.

It should never become another planning workspace.

---

# Artificial Intelligence

Artificial intelligence assists the teacher.

It does not replace the teacher as author.

AI may help:

- transcribe
- summarize
- organize
- categorize
- suggest
- publish

Instructional judgment always remains with the teacher.

---

# Explicitly Out of Scope

Lesson Planner will not replace district systems.

It will not include:

- official attendance
- gradebook
- discipline management
- library management
- official student records

These boundaries intentionally prevent the accumulation of unrelated responsibilities that developed within the legacy FileMaker system.

---

# FileMaker Legacy

The previous FileMaker system represents decades of instructional experience.

It is not a model to recreate.

It is evidence to study.

The goal is not to preserve the FileMaker application.

The goal is to preserve the teaching intelligence that evolved inside it.

Working principle:

> **Respect evolved workflows. Refactor their implementation.**

For every legacy workflow ask:

1. What teaching problem did this solve?
2. Why did it survive?
3. Does that teaching problem still exist?
4. What is the cleanest modern solution?

---

# Initial Data Objects

```text
LessonSession
    ??? InstructionalSegments
    ??? Deliverables
    ??? TeacherNotes
    ??? Reflections
    ??? StudentObservations
    ??? PrintViews
```

Everything inside Lesson Planner hangs from a Lesson Session.

This provides a single operational record for every class meeting.

---

# Working Definition

Lesson Planner is the live teaching workspace.

A Lesson Session represents one real class meeting.

Within that Lesson Session, Lesson Planner organizes the sequence of instructional events, preserves what matters, supports what happens live, and creates the instructional record from which the rest of the Year Planner ecosystem publishes.