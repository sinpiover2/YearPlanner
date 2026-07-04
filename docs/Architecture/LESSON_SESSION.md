# LESSON_SESSION.md

# LessonSession

## Purpose

The LessonSession is the primary instructional object in Year Planner.

It represents one actual class meeting.

Every significant instructional activity eventually belongs to a LessonSession.

Lesson Planner is the workspace used to create, prepare, teach, and reflect upon a LessonSession.

---

# Definition

A LessonSession represents one scheduled meeting of one section on one instructional day.

Example:

```text
Math 8

Period 2

Tuesday
September 14, 2026

9:40Ð10:35

Unit 2

Lesson 3.2
```

The LessonSession is not simply a lesson.

It is the teacher's complete plan for one class period.

---

# Philosophy

A teacher does not teach "Lesson 3.2."

A teacher teaches one group of students for one class period.

Curriculum provides lessons.

Lesson Planner organizes teaching.

The LessonSession bridges those two worlds.

---

# Ownership

The LessonSession owns instructional work.

Forecast owns pacing.

Units owns curriculum structure.

Today owns operational context.

Lesson Planner owns instructional planning.

Monday Manager publishes instructional information.

Every instructional feature should belong to one owner.

---

# Identity

Every LessonSession is uniquely identified by:

- Course
- Section
- Instructional Date

Additional context includes:

- Period
- Meeting start time
- Meeting end time
- Unit
- Lesson
- Teacher
- School year

---

# Lifecycle

A LessonSession progresses through several stages.

```text
Planned

?

Prepared

?

Teaching

?

Completed

?

Reflected

?

Published
```

The LessonSession remains the same object.

Only its state changes.

---

# Creation

LessonSessions may be created in two ways.

## Weekly Planning

The teacher creates or edits LessonSessions while planning the instructional week.

Typical workflow:

```text
Forecast

?

Units

?

Lesson Planner
```

---

## Daily Teaching

The teacher opens today's LessonSession through Today.

Typical workflow:

```text
Today

?

Start Lesson

?

Lesson Planner
```

If the LessonSession already exists:

Open it.

If it does not exist:

Create it automatically.

The teacher should never create LessonSessions manually during the school day.

---

# Context

Every LessonSession automatically inherits:

- Course
- Section
- Period
- Instructional Date
- Meeting Time
- Unit
- Lesson

The teacher should never re-enter this information.

---

# Primary Components

Everything instructional belongs to one LessonSession.

```text
LessonSession

??? Context
??? Instructional Segments
??? Deliverables
??? Materials
??? Resources
??? Teacher Notes
??? Student Observations
??? Reflection
??? Publishable Information
??? Print Views
```

Additional capabilities may be added over time without changing the model.

---

# Instructional Segments

Instructional Segments are the heart of the LessonSession.

Examples:

```text
Welcome

Warm-Up

Homework Review

Launch

Investigation

Discussion

Exit Ticket

Homework
```

The numbering is presentation only.

The underlying model is an ordered list.

Segments should eventually support:

- reorder
- duplicate
- delete
- move to another day
- postpone
- mark complete
- mark skipped

Instructional Segments describe how the class unfolds.

---

# Deliverables

Deliverables are durable instructional objects.

Examples:

- Homework
- Practice Set
- Exit Ticket
- Quiz
- Assessment
- Project Milestone

Deliverables may later appear in:

- Monday Manager
- LMS
- Print Views
- Student summaries
- Parent communication
- Analytics

Deliverables are authored once.

They are published many times.

---

# Materials

Materials represent everything needed to teach.

Examples:

- Handouts
- Slides
- Amplify lesson
- Manipulatives
- Whiteboards
- Calculator activity
- Demonstration supplies

Materials should help answer:

> Am I ready to teach?

---

# Teacher Notes

Teacher Notes capture instructional thinking that is not part of the curriculum.

Examples:

- Slow down here.
- Students struggled last year.
- Great discussion prompt.
- Skip Activity 4.
- Bring graph paper.
- Better example than textbook.

These notes belong to the LessonSession.

---

# Student Observations

Student Observations capture information generated during instruction.

Examples:

- Period 2 needed more time.
- Several students absent.
- Reteach tomorrow.
- Excellent discussion.
- Exit Ticket showed confusion.

These observations inform future planning.

---

# Reflection

Reflection captures what happened after teaching.

Examples:

- Lesson took longer than expected.
- Homework was too difficult.
- Warm-Up worked well.
- Discussion was excellent.
- Rearrange tomorrow's lesson.

Reflection should influence future LessonSessions.

---

# Print Views

LessonSession should support printable teaching documents.

Examples:

- Daily lesson sheet
- Clipboard version
- Materials checklist
- Substitute version

Printing is not an afterthought.

Many experienced teachers still rely on printed lesson guides during instruction.

---

# Screen Philosophy

Lesson Planner is not a form.

It is not a database editor.

It is an instructional workspace.

The teacher should immediately understand:

- what class this is
- what happens next
- what materials are needed
- what should be remembered

The interface should feel calm.

The instructional sequence should dominate the screen.

Everything else should support teaching.

---

# Relationship to Other Workspaces

Forecast answers:

> Am I OK?

Units answers:

> Where am I in the curriculum?

Today answers:

> What am I teaching today?

Lesson Planner answers:

> How do I teach this class well?

Monday Manager answers:

> What do students need to know this week?

Each workspace has one responsibility.

Protect those boundaries.

---

# Future Growth

The LessonSession model should support future capabilities without redesign.

Potential future additions include:

- AI lesson summaries
- AI teaching suggestions
- Student grouping
- Seating reference
- Resource libraries
- Assessment analytics
- LMS publishing
- Parent summaries
- Department sharing
- Cross-year instructional history

Future features should extend the LessonSession.

They should not replace it.

---

# First Design Goal

The first implementation target is not a complete planning system.

It is one beautiful LessonSession.

When an experienced teacher opens a LessonSession, the interface should immediately answer:

> What class is this?

> How is this lesson going to unfold?

> What do I need?

> What do I need to remember?

If those questions are answered naturally, the architecture is correct.