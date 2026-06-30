# Units Architecture

## Purpose

The Units subsystem presents the **planned curriculum** at the scale of a single instructional unit.

Its purpose is to help teachers understand the learning journey they intend to take with students before focusing on the delivery of individual lessons.

Units is the teacher's map of the curriculum.

It explains the plan.

It does not record instruction.

It does not interpret pacing.

---

# Owned Question

Units answers:

> **What are we learning?**

More specifically:

> **What learning journey have I planned for this unit?**

---

# Relationship to the Suite

Units is one perspective within the Year Planner Suite.

It inherits the instructional philosophy and information model defined by:

- `SUITE_ARCHITECTURE.md`
- `INFORMATION_MODEL.md`

Units does not redefine those concepts.

Its responsibility is to present the Planned Curriculum in a way that helps teachers understand the structure and purpose of a unit.

---

# Core Responsibility

Units helps teachers build a mental map of the planned curriculum.

It should help teachers understand:

- why the unit exists
- where students are headed
- how understanding develops
- how the curriculum is organized
- how instructional time was planned to support that learning

The page should communicate the **map before the trail**.

Teachers should understand the unit before examining its individual lessons.

---

# Design Philosophy

A unit is more than a collection of lessons.

It is a coherent body of learning organized around a central instructional purpose.

Lessons exist to implement the unit.

They are not the unit itself.

Therefore the Units page should emphasize understanding the curriculum before presenting lesson details.

---

# Stable but Editable

The planned curriculum should remain stable throughout the school year.

Teaching, however, often reveals opportunities to improve that plan.

Units therefore supports intentional revision of the curriculum.

Examples include:

- adding a new lesson
- inserting an additional practice lesson
- adding a development activity
- splitting one lesson into multiple lessons
- reordering lessons
- revising lesson descriptions
- adjusting planned instructional time

These actions modify the curriculum itself.

They are not records of classroom instruction.

> Units changes because the teacher intentionally revises the curriculumÑnot because instruction happened.

Curriculum revisions may be initiated from multiple parts of the suite, but every revision ultimately modifies the Planned Curriculum owned by Units.

---

# Information Consumed

Units primarily presents information from the **Planned Curriculum** domain defined in `INFORMATION_MODEL.md`.

These include:

- Unit
- Unit Purpose
- Learning Destination
- Learning Progression
- Lesson Sequence
- Planned Time

Units may also consume limited information from the **Enacted Curriculum** solely for orientation.

Examples include:

- current lesson location

Units never owns instructional records.

---

# Information Hierarchy

The page should progressively move from understanding toward detail.

```text
Unit Navigation
        ?
Unit Overview
        ?
Lesson Sequence
```

The teacher should understand the learning journey before examining the individual lessons.

---

# Unit Navigation

## Purpose

Help teachers choose a unit.

Navigation exists for orientation.

It should remain lightweight.

---

## Responsibilities

Communicate:

- unit order
- unit title
- selected state

Optionally:

- planned instructional length

---

## Navigation Should Not Communicate

- pacing
- warnings
- recommendations
- lesson completion
- instructional notes
- classroom events
- daily bookkeeping

Those belong elsewhere in the suite.

---

# Unit Overview

The Unit Overview is the primary architectural element of the page.

It exists to answer:

> **Now that I've selected this unit, help me understand it.**

The overview should communicate the instructional story of the unit before presenting lesson details.

---

## Unit Purpose

Answers:

> **Why does this unit exist?**

Purpose explains the educational rationale for the unit.

Purpose is not:

- standards
- lesson objectives
- curriculum marketing language

Purpose explains why the learning matters.

---

## Learning Destination

Answers:

> **Where are students headed?**

Learning Destination describes the enduring understanding students should possess at the conclusion of the unit.

---

## Learning Progression

Answers:

> **How does understanding develop?**

Learning Progression describes the conceptual arc of the unit.

It explains how ideas build over time.

It is an authored curriculum artifact.

It is intentionally independent of lesson order.

Lessons implement the progression.

They do not define it.

---

## Planned Time

Answers:

> **How was instructional time planned?**

This section communicates the instructional design of the unit.

Examples include:

- Required Days
- Built-in Instructional Flexibility

These values describe the curriculum.

They do not describe classroom reality.

Units communicates what was planned.

Forecast communicates what those plans mean.

---

# Lesson Sequence

The Lesson Sequence represents the trail through the learning journey.

Lessons organize instruction.

They are not the instructional purpose.

The Lesson Sequence should therefore support the Unit Overview rather than dominate the page.

Each lesson should communicate only the information necessary to understand its place within the planned curriculum.

---

# Orientation

Units may provide minimal orientation within the curriculum.

Examples include:

- "You are here" within the lesson sequence

This information is derived from the Enacted Curriculum.

Its purpose is simply to help teachers locate themselves within the planned learning journey.

Orientation should never become a progress dashboard.

---

# Boundaries

## Forecast

Forecast answers:

> **Where are we?**

Forecast compares the enacted curriculum against the planned curriculum.

It interprets:

- pacing
- projections
- remaining instructional runway
- recoverability
- instructional consequences

Forecast communicates meaning.

Units communicates intent.

---

## Today

Today answers:

> **What happened today?**

Today represents the Enacted Curriculum.

It owns:

- instructional events
- lesson completion
- partial completion
- instructional notes
- section-specific instructional adjustments

Today records classroom reality.

Units represents the instructional plan.

---

## Lesson Planner

Lesson Planner answers:

> **How will I teach this lesson?**

Lesson Planner supports the delivery of an individual lesson.

It owns:

- preparation
- instructional strategies
- lesson resources
- assessments
- teacher reflection

Lesson Planner prepares instruction.

Units explains the curriculum.

---

# Exclusions

Units intentionally does not become:

- a pacing dashboard
- an instructional log
- a lesson planner
- a recommendation engine
- a classroom journal
- a resource manager
- an assessment manager

Its responsibility is to explain the planned curriculum.

---

# Guiding Principle

The Units page should help teachers build a mental map of the planned curriculum.

Every major element should strengthen the teacher's understanding of the learning journey.

Every omitted element should belong more naturally somewhere else in the suite.

The page should communicate the map before the trail.