# LESSON_PLANNER_WORK_MODES.md

# Lesson Planner Work Modes

## Purpose

Lesson Planner is the instructional authoring workspace of Year Planner.

Its purpose is to help teachers design, prepare, teach, and reflect upon real classroom instruction.

Unlike the other workspaces, Lesson Planner is used in two distinct contexts:

1. Weekly Planning
2. Daily Teaching

These are not separate systems.

They are two different ways of interacting with the same instructional record.

---

# Core Principle

Lesson Planner authors instructional work.

Forecast informs.

Units provides curriculum context.

Today provides operational context.

Monday Manager publishes.

Working rule:

> **Lesson Planner authors. Output channels publish.**

---

# The Core Object

Everything in Lesson Planner revolves around a single domain object:

**LessonSession**

A LessonSession represents one actual class meeting.

Example:

```text
Math 8
Period 2

September 14, 2026

9:40Ð10:35

Unit 2

Lesson 3.2
```

Everything else belongs to that LessonSession.

```text
LessonSession
    ??? Instructional Segments
    ??? Deliverables
    ??? Materials
    ??? Teacher Notes
    ??? Reflections
    ??? Student Observations
    ??? Publishable Information
    ??? Print Views
```

There should never be separate "planning lessons" and "teaching lessons."

There is only one LessonSession.

The teacher simply interacts with it differently depending on context.

---

# Two Work Modes

Lesson Planner supports two modes of work.

These are workflow modesÑnot different data models.

```text
Lesson Planner

        ?

        ?

+---------------------------+
|     LessonSession         |
+---------------------------+

        ?
        ?

 ???????????????????????????????
 ?              ?              ?
 ? Weekly       ? Daily        ?
 ? Planning     ? Teaching     ?
 ?              ?              ?
 ???????????????????????????????
```

---

# Weekly Planning Mode

## When

Usually on weekends or during planning periods.

## Teacher Question

> What should happen this week?

## Typical Workflow

```text
Forecast

?

Units

?

Lesson Planner

?

Curriculum Resources

¥ Amplify

¥ OpenUp

¥ Teacher materials

?

Lesson Planner

?

Monday Manager

?

Copies and Materials
```

The teacher moves freely among these resources.

Planning is iterative.

---

## Teacher Activities

Weekly Planning includes:

- reviewing pacing
- reflecting on the previous week
- adjusting unit progress
- studying curriculum materials
- arranging lessons across the week
- adapting for assemblies, testing, holidays, shortened periods, and other realities
- identifying assessments
- identifying deliverables
- determining materials
- preparing copies
- preparing Monday Manager

This is reflective work.

The pace is deliberate.

---

## Design Goals

Weekly Planning should support:

- seeing the instructional week
- sequencing lessons
- revising lessons
- moving lessons
- checking pacing consequences
- identifying prep work
- identifying deliverables
- preparing instructional materials

It should encourage thoughtful planning rather than rapid interaction.

---

# Daily Teaching Mode

## When

Before school.

Between classes.

During instruction.

Immediately after instruction.

---

## Teacher Question

> What am I teaching right now?

---

## Typical Workflow

```text
Today

?

Start Lesson

?

Lesson Planner

?

Teach

?

Reflect

?

Tomorrow
```

The teacher may also open Lesson Planner directly.

---

## Teacher Activities

Daily work includes:

- reviewing today's lesson
- confirming lesson flow
- checking materials
- printing lesson sheets
- writing the board agenda
- teaching
- recording notes
- reflecting
- adjusting tomorrow

This is operational work.

The pace is fast.

---

## Design Goals

Daily Teaching Mode should:

- open immediately
- require almost no navigation
- present the teaching sequence clearly
- support quick reference during instruction
- support rapid note-taking
- preserve changes made during teaching

Everything unnecessary should disappear.

---

# Start Lesson

Start Lesson is not simply a button.

It represents the transition from planning into teaching.

```text
Planning

?

Today

?

Start Lesson

?

Teaching
```

---

## Expected Behavior

When the teacher clicks Start Lesson:

```text
Resolve today's instructional context

?

Locate LessonSession

?

Exists?

YES

?

Open LessonSession

NO

?

Create LessonSession

?

Open Lesson Planner

?

Focus first Instructional Segment
```

The teacher should never need to reselect:

- course
- section
- period
- instructional date
- meeting time
- unit
- lesson

Today already knows those.

Lesson Planner inherits them automatically.

---

# Relationship Between Today and Lesson Planner

Today answers:

> What am I teaching today?

Lesson Planner answers:

> How am I teaching it?

Today determines context.

Lesson Planner manages instruction.

Today launches the appropriate LessonSession.

Lesson Planner edits that LessonSession.

---

# Deliverables

Deliverables are durable instructional objects.

Examples:

- Homework
- Practice Set
- Exit Ticket
- Quiz
- Project Milestone
- Assessment

Deliverables should be authored once.

They may later appear in:

- Monday Manager
- LMS
- Print Views
- Student summaries
- Parent communication
- Analytics

The same instructional object should never be entered twice.

---

# Monday Manager

Monday Manager is not a planning workspace.

It is a publication.

Teacher question:

> What should students know about this week?

Student question:

> What do I need to do this week?

Monday Manager consumes information authored by Lesson Planner.

It should never become another planning interface.

---

# Before Tomorrow

The Today workspace should eventually surface readiness issues produced by Lesson Planner.

Examples:

- Copies not printed
- Amplify not assigned
- Lesson sheet not printed
- Board agenda incomplete
- Materials missing
- Reflection missing
- Deliverable not published

Before Tomorrow is a readiness checklist.

It is not a planning workspace.

---

# Design Boundaries

Forecast answers:

> Am I OK?

Units answers:

> Where am I in the curriculum?

Today answers:

> What am I teaching today?

Lesson Planner answers:

> How am I teaching it well?

Monday Manager answers:

> What do students need to know this week?

Every feature should have exactly one owner.

Protect those boundaries.

---

# Technical Direction

Maintain one instructional model.

Avoid creating separate records for:

- planned lessons
- daily lessons
- teaching lessons
- printed lessons

Instead:

```text
LessonSession

    Planning

        ?

    Teaching

        ?

    Reflection

        ?

    Publication
```

These are states of the same instructional object.

Not different objects.

---

# First Milestone

The first implementation target is not the complete Lesson Planner.

It is one excellent LessonSession.

That LessonSession should support both:

- thoughtful planning during the weekend
- confident teaching during the school day

If one LessonSession works beautifully, the remainder of Lesson Planner can grow naturally from that foundation.