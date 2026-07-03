# Today Workspace Specification

**Document Status:** Approved for Implementation  
**Phase:** Phase 4 Ñ Today + Lesson Planner Architecture  
**Current Sprint:** Sprint 4.1 Ñ Today Layout Refactor

---

# Purpose

The Today workspace is the operational command center for the teacher's day.

Its purpose is to reduce the mental effort required to transition from planning into teaching.

It answers one question:

> **What am I teaching today?**

Unlike Forecast and Units, Today is not primarily about understanding the curriculum or the school year.

It exists to prepare the teacher for the next instructional moment.

---

# Product Philosophy

The Today workspace is part of a larger product architecture.

Each workspace owns one primary teacher question.

| Workspace | Teacher Question |
|------------|------------------|
| Forecast | Am I OK? |
| Units | Where am I in the curriculum? |
| Today | What am I teaching today? |
| Lesson Planner | How do I teach this lesson well? |

Features belong on the workspace whose question they answer.

Maintaining these boundaries is more important than adding features.

---

# Design Goals

The Today workspace should optimize one thing:

> **Time to teaching.**

Within approximately ten seconds of opening the application, a teacher should know:

- What class is next.
- What lesson they are teaching.
- Whether anything important changed.
- Whether they are ready to begin teaching.
- How to enter Lesson Planner.

Everything on the page should support that objective.

---

# Responsibilities

The Today workspace is responsible for:

- Orienting the teacher to today's schedule.
- Identifying the next lesson.
- Launching Lesson Planner.
- Displaying today's instructional flow.
- Surfacing unfinished work that should not be forgotten.

The Today workspace is **not** responsible for:

- Curriculum navigation.
- Long-term pacing.
- Unit organization.
- Teaching materials.
- Lesson activities.
- Standards.
- Teacher notes.
- Assessment planning.

Those belong elsewhere.

---

# Information Hierarchy

Information should always appear in the following order.

## 1. Status

A short sentence establishing the teacher's current state.

Examples:

- You're ready for today.
- One item remains from yesterday.
- Today's schedule has changed.
- Your first class begins at 9:40.

The status sentence should:

- reduce uncertainty
- remain truthful
- avoid creating anxiety
- never become a task list

It answers:

> **"What should I know before I begin?"**

---

## 2. Next Up

The visual focal point of the page.

This is the primary action.

The teacher should immediately know:

- course
- section
- lesson
- time remaining
- how to begin

The Hero card should dominate the page.

Primary action:

**Start Lesson**

---

## 3. Today's Flow

Chronological view of today's instructional sequence.

Examples:

? Completed

? Next

? Prep

? Later

Today's Flow is about the rhythm of the day.

It is intentionally different from the curriculum sequence shown on Units.

---

## 4. Before Tomorrow

Items that should be completed before leaving for the day.

Examples:

- Reflection not logged.
- Schedule note.
- Reminder.

These items should remain visually quiet.

They should never compete with the Hero card.

---

# Visual Hierarchy

Priority order:

1. Hero card
2. Today's Flow
3. Before Tomorrow

The teacher's eye should naturally move through the page without uncertainty.

Avoid competing focal points.

Whitespace should create hierarchy more often than borders or color.

---

# Visual Language

The Today workspace continues the existing Year Planner design language.

Use:

- restrained typography
- generous whitespace
- rounded panels
- subtle borders
- calm spacing
- minimal visual noise

Avoid:

- dashboard appearance
- dense statistics
- decorative colors
- unnecessary emphasis

The interface should feel calm.

---

# Color Philosophy

Color communicates importance.

Not decoration.

Whenever possible:

- geometry communicates state
- typography communicates hierarchy
- spacing communicates organization

Reserve strong semantic colors for meaningful conditions.

Avoid using color simply to distinguish normal workflow states.

---

# State Philosophy

The software should remember state.

Teachers should not have to remember:

- which lesson is next
- what still needs logging
- where they stopped
- what changed since yesterday
- what requires attention

Today's responsibility is to surface these things automatically.

---

# Interaction Model

The primary workflow is:

Forecast

?

Today

?

Start Lesson

?

Lesson Planner

?

Log Lesson

?

Today

?

Forecast

The application should naturally support this rhythm throughout the day.

---

# Start Lesson

Start Lesson is the primary action of the Today workspace.

Selecting Start Lesson should:

- open Lesson Planner
- automatically select the correct
  - course
  - section
  - unit
  - lesson
  - instructional date
- require no additional navigation

Lesson Planner should never ask the teacher to reselect information already determined by Today.

---

# Lesson Planner Boundary

Today answers:

> What am I teaching?

Lesson Planner answers:

> How do I teach it?

Today should never become a simplified Lesson Planner.

Lesson Planner should never become another navigation screen.

---

# Data Requirements

Today will eventually consume data from:

- Courses
- Sections
- Units
- Lessons
- Daily Progress
- School Calendar
- Schedule Patterns

The first implementation sprint does not require all data connections.

Placeholder values are acceptable while establishing the architecture.

---

# Initial Component Tree

```
TodayWorkspace

??? TodaySidebar
?   ??? Current Date
?   ??? Status Sentence
?   ??? Today's Schedule
?   ??? Quick Navigation
?
??? NextUpCard
?   ??? Countdown
?   ??? Course / Section
?   ??? Lesson
?   ??? Start Lesson
?
??? TodayFlow
?   ??? Completed
?   ??? Current
?   ??? Prep
?   ??? Upcoming
?
??? BeforeTomorrow
    ??? Outstanding Items
```

This structure should remain simple.

Avoid unnecessary nesting.

---

# Implementation Strategy

The Today workspace should be implemented incrementally.

## Sprint 4.1

Layout refactor.

No new business logic.

Placeholder content is acceptable.

---

## Sprint 4.2

Hero card.

---

## Sprint 4.3

Today's Flow.

---

## Sprint 4.4

Status sentence.

---

## Sprint 4.5

Before Tomorrow.

---

## Sprint 4.6

Start Lesson interaction.

Lesson Planner may initially be a placeholder.

---

# Definition of Done

The Today workspace is complete when:

- it answers its design question
- the hierarchy is immediately obvious
- the teacher knows what to teach next
- the path into Lesson Planner is effortless
- Forecast responsibilities remain in Forecast
- Units responsibilities remain in Units
- Lesson Planner responsibilities remain in Lesson Planner

The page should leave the teacher with one feeling:

> **"I know exactly what I'm teaching next, and I'm ready to begin."**