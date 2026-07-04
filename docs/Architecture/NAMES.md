# NAMES.md

# Project Vocabulary

## Purpose

This document establishes the official vocabulary used throughout Year Planner.

Its purpose is to reduce ambiguity.

Whenever possible, one concept should have one name.

One name should refer to one concept.

This document is append-only.

---

# Project

## Year Planner

The complete application.

Year Planner is a teacher decision-support system.

It consists of multiple workspaces that answer different teacher questions.

---

# Workspaces

## Forecast

Teacher question:

> Am I OK?

Purpose:

Interpret pacing.

Forecast owns:

- pacing awareness
- consequences
- recommendations
- year outlook

Forecast does **not** own instructional planning.

---

## Units

Teacher question:

> Where am I in the curriculum?

Purpose:

Provide curriculum orientation.

Units owns:

- curriculum structure
- unit purpose
- lesson sequence
- enacted progress

Units does **not** plan instruction.

Units records instructional reality.

---

## Today

Teacher question:

> What am I teaching today?

Purpose:

Operational command center.

Today owns:

- today's schedule
- next lesson
- readiness
- Start Lesson

Today does **not** author instructional work.

---

## Lesson Planner

Teacher question:

> How do I teach this class well?

Purpose:

Author instructional work.

Lesson Planner owns:

- LessonSessions
- Instructional Segments
- Deliverables
- Teacher Notes
- Reflection
- Materials

Lesson Planner is the instructional authoring workspace.

---

## Monday Manager

Teacher question:

> What do students need to know this week?

Purpose:

Publication.

Monday Manager consumes instructional information.

It does not author instructional work.

---

# Core Objects

## Curriculum Lesson

A lesson supplied by a curriculum.

Examples:

- Amplify Lesson
- Open Up Lesson
- Teacher-created curriculum lesson

Curriculum Lessons belong to curriculum resources.

They are not LessonSessions.

---

## LessonSession

One real class meeting.

Example:

```text
Math 8

Period 2

September 14

9:40Ð10:35
```

A LessonSession may reference one or more Curriculum Lessons.

LessonSession is the central instructional object.

---

## Instructional Segment

One step in the teaching sequence.

Examples:

- Welcome
- Warm-Up
- Launch
- Investigation
- Discussion
- Exit Ticket

Instructional Segments belong to LessonSessions.

---

## Deliverable

A durable instructional object.

Examples:

- Homework
- Exit Ticket
- Quiz
- Project Milestone
- Assessment

Deliverables may be published through multiple output channels.

---

## Material

Something required to teach.

Examples:

- Handout
- Slides
- Manipulatives
- Amplify activity
- Demonstration supplies

Materials are authored at the Instructional Segment level.

Lesson-level material lists are derived.

---

## Reflection

Instructional memory created after teaching.

Reflection belongs to the LessonSession.

Reflection is indexed by Curriculum Lesson.

---

# Supporting Concepts

## Schedule Service

Shared domain service.

Provides:

- instructional calendar
- meeting schedules
- instructional week
- next meeting
- special schedules

Every workspace consumes schedule information.

No workspace computes schedule independently.

---

## Instructional Week

A derived view.

Not an authored object.

Represents the LessonSessions within a school week.

Supports:

- Weekly Planning
- Monday Manager
- Weekly Print Views

---

## Enacted Ledger

Owned by Units.

Records instructional reality.

Consumes enacted truth from LessonSessions.

Forecast reads the Enacted Ledger.

---

## Output Channel

A publication surface.

Examples:

- Monday Manager
- Print Views
- Parent communication
- LMS
- Student summaries

Output Channels consume authored information.

They do not author instructional information.

---

# Teaching Vocabulary

Use these terms consistently.

Preferred:

- Curriculum Lesson
- LessonSession
- Instructional Segment
- Deliverable
- Reflection
- Material
- Output Channel

Avoid ambiguous phrases such as:

- lesson
- today's lesson
- planning lesson

Instead write:

- Curriculum Lesson
- LessonSession
- Today's LessonSession

---

# Workspace Relationships

```text
Forecast

?

Units

?

Today

?

Lesson Planner

?

Output Channels
```

Lesson Planner authors.

Output Channels publish.

Units records enacted instructional truth.

Forecast interprets consequences.

---

# Naming Rules

When discussing curriculum:

Say:

> Curriculum Lesson

When discussing one class meeting:

Say:

> LessonSession

When discussing the sequence inside a class:

Say:

> Instructional Segment

When discussing work students complete:

Say:

> Deliverable

When discussing publication:

Say:

> Output Channel

---

# Reserved Names

The following names are reserved for future capabilities.

## Segment Library

Future reusable instructional segment repository.

Deferred.

---

## Teacher Desk

Working design metaphor.

At present, Lesson Planner remains the official workspace name.

Teacher Desk may later become the public-facing name for Lesson Planner if the distinction proves valuable during implementation.

No rename decision has been made.

---

# Guiding Principle

Names shape architecture.

Choose names that describe enduring concepts rather than temporary implementations.

Whenever possible:

One concept.

One name.

One owner.