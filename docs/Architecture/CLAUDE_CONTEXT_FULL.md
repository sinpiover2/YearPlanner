# Suite Architecture

## Purpose

Year Planner is an instructional awareness suite for teachers.

It helps teachers see the instructional system clearly from different professional perspectives while preserving teacher judgment.

The suite should feel less like separate applications and more like different views of the same instructional reality.

---

# Core Principle

Applications own professional perspectives.

Those perspectives define the questions they answer.

Features follow from responsibility.

The same information may appear in multiple applications.

The same responsibility should not.

---

# Shared Foundation

Every application shares the same beliefs.

- Teaching is the stewardship of limited instructional resources.
- Instructional time is finite.
- Awareness belongs to the software.
- Professional judgment belongs to the teacher.
- Software should reduce bookkeeping, not replace expertise.
- Teacher attention is the scarcest resource in the system.

---

# Professional Perspectives

The suite currently consists of five perspectives.

| Application      | Primary Question                    | Primary Responsibility                                          |
| ---------------- | ----------------------------------- | --------------------------------------------------------------- |
| Forecast         | Where are we?                       | Interpret pacing and the consequences of instructional time.    |
| Units            | What are we learning?               | Explain the planned curriculum.                                 |
| Today            | What happened today?                | Record the enacted curriculum.                                  |
| Lesson Planner   | How will I teach this lesson?       | Prepare and support lesson delivery.                            |
| Student Learning | What am I responsible for learning? | Help students understand goals, success criteria, and progress. |

Year Planner is the name of the suite.

Forecast, Units, Today, Lesson Planner, and Student Learning are applications within the suite.

---

# Application Responsibilities

## Forecast

Primary Question:

> Where are we?

Responsibilities:

- reveal pacing
- show projected consequences
- surface emerging constraints
- communicate remaining instructional runway
- help teachers understand implications of current instructional time use

Does Not Do:

- choose what to cut
- record daily instruction
- redesign curriculum
- prepare lessons

Forecast communicates consequences.

Teachers make decisions.

---

## Units

Primary Question:

> What are we learning?

Responsibilities:

- explain the planned curriculum
- communicate unit purpose
- clarify learning destination
- describe learning progression
- organize the lesson sequence
- support intentional curriculum revision

Does Not Do:

- interpret pacing
- record daily instruction
- manage lesson delivery
- become a progress dashboard

Units communicates intent.

---

## Today

Primary Question:

> What happened today?

Responsibilities:

- record instructional events
- record lesson completion
- record partial completion
- capture instructional notes
- support section-specific instructional adjustments

Does Not Do:

- rewrite the planned curriculum for all sections
- interpret long-term pacing consequences
- prepare future lessons
- become a curriculum map

Today records classroom reality.

---

## Lesson Planner

Primary Question:

> How will I teach this lesson?

Responsibilities:

- connect a planned lesson to a specific instructional day
- support lesson preparation
- organize resources
- surface instructional strategies
- support teacher reflection

Does Not Do:

- own yearly pacing
- own the curriculum sequence
- own official instructional records
- make instructional decisions for teachers

Lesson Planner prepares instruction.

Teachers teach.

---

## Student Learning

Primary Question:

> What am I responsible for learning?

Responsibilities:

- show current learning goals
- clarify success criteria
- support student awareness of progress
- encourage ownership of learning

Does Not Do:

- replace teacher feedback
- grade students
- manage curriculum pacing
- determine instructional decisions

Student Learning supports learner awareness.

Teachers remain responsible for instruction.

---

# Information Domains

Year Planner uses the shared Information Model defined in:

`docs/Architecture/INFORMATION_MODEL.md`

The suite distinguishes three information domains:

1. Planned Curriculum
2. Enacted Curriculum
3. Interpretation

These domains are authoritative in the Information Model.

This document describes how applications use those domains.

---

# Information Flow

Information flows through the suite as follows:

```text
Planned Curriculum
        â†“
Enacted Curriculum
        â†“
Interpretation
        â†“
Teacher Judgment
```

Units explains the Planned Curriculum.

Today records the Enacted Curriculum.

Forecast interprets the relationship between the plan and reality.

Lesson Planner prepares instruction using the plan and relevant context.

Student Learning presents learning goals and progress in student-facing form.

---

# Ownership Rules

Applications own responsibilities, not duplicate data.

Information has one canonical owner.

Information may have many consumers.

When deciding where a feature belongs, ask:

1. What professional question does this answer?
2. What information does it modify?
3. Which application owns that responsibility?

Clear ownership is more valuable than convenient placement.

---

# Progressive Disclosure

The suite should reveal information only when it becomes useful.

Teachers need to widen and narrow their view continuously.

They should be able to move between:

- the year
- the course
- the unit
- the lesson
- the day
- the student

without mentally reconstructing context.

Teachers should always understand both:

- the forest
- the trees

---

# Design Boundary

Before adding a feature, ask:

> Which professional question does this answer?

If the answer is unclear, the feature probably does not belong.

If a feature answers two questions equally well, the architecture should be reconsidered before implementation.

The goal is not to place features where they are convenient.

The goal is to preserve clear professional thinking.

---

# The Goal

Year Planner should quietly accompany teachers from the first day of school to the last.

It should help them understand:

- what they planned
- what happened
- what that means
- what choices remain

The suite creates awareness.

Teachers make decisions.
# Information Model

## Purpose

The Information Model defines the enduring information architecture of Year Planner.

It answers:

- What information exists?
- What does each piece of information represent?
- Who owns it?
- Who authors it?
- When does it change?
- Which subsystems use it?

This document describes the instructional model of the application.

It intentionally does **not** describe implementation details such as databases, APIs, React components, or storage.

---

# Design Philosophy

Teaching consists of three distinct kinds of information.

1. The teacher's instructional intentions.
2. What actually happened during instruction.
3. The meaning derived from comparing the two.

Year Planner therefore organizes information into three domains:

- Planned Curriculum
- Enacted Curriculum
- Interpretation

Every piece of information belongs to exactly one domain.

Subsystems may consume information across domains.

They do not share ownership.

---

# Domain 1 Ñ Planned Curriculum

The Planned Curriculum represents instructional intent.

It exists before instruction begins.

It changes only when the teacher intentionally revises the curriculum.

The Units subsystem is the canonical owner of the Planned Curriculum.

---

## Course

Represents a complete course of study.

Examples:

- Math 8
- Integrated Math 1

Canonical Owner:

- Units

Authored By:

- Teacher
- Curriculum provider

Changes When:

- Curriculum is revised

Consumed By:

- Forecast
- Units
- Today
- Lesson Planner

---

## Unit

Represents a coherent body of learning within a course.

Canonical Owner:

- Units

Authored By:

- Teacher
- Curriculum provider

Changes When:

- Curriculum is reorganized

Consumed By:

- Forecast
- Units
- Today
- Lesson Planner

---

## Unit Purpose

Explains why the unit exists.

Teacher-facing.

Represents the educational rationale.

Canonical Owner:

- Units

Authored By:

- Teacher
- Curriculum provider

Changes When:

- Teacher intentionally revises the curriculum

Consumed By:

- Units

---

## Learning Destination

Describes the enduring understanding students should possess by the conclusion of the unit.

Canonical Owner:

- Units

Authored By:

- Teacher
- Curriculum provider

Changes When:

- Curriculum is revised

Consumed By:

- Units

---

## Learning Progression

Describes the conceptual development throughout the unit.

Represents the learning journey rather than the lesson sequence.

It is an authored curriculum artifact.

It is not derived from lesson order.

Canonical Owner:

- Units

Authored By:

- Teacher
- Curriculum provider

Changes When:

- Teacher intentionally revises the curriculum

Consumed By:

- Units

---

## Lesson

Represents a planned instructional experience.

Lessons exist independently of calendar dates.

Canonical Owner:

- Units

Authored By:

- Teacher
- Curriculum provider

Changes When:

- Teacher revises the curriculum

Consumed By:

- Units
- Today
- Lesson Planner

---

## Planned Time

Represents the instructional time the curriculum was designed to require.

Examples:

- Required Days
- Built-in Instructional Flexibility

This information describes the curriculum.

It does not describe classroom reality.

Canonical Owner:

- Units

Authored By:

- Teacher
- Curriculum provider

Changes When:

- Curriculum is revised

Consumed By:

- Units
- Forecast

---

# Domain 2 Ñ Enacted Curriculum

The Enacted Curriculum represents classroom reality.

It is created as instruction occurs.

The Today subsystem is the canonical owner of the Enacted Curriculum.

---

## Instructional Event

Represents a single instructional day for a specific section.

Examples:

- Math 8 Period 2
- September 14

Canonical Owner:

- Today

Authored By:

- Teacher

Changes When:

- Instruction occurs

Consumed By:

- Today
- Forecast

---

## Lesson Completion

Represents progress through the planned curriculum.

Examples:

- completed
- partially completed
- not completed

Canonical Owner:

- Today

Authored By:

- Teacher

Changes When:

- Instruction occurs

Consumed By:

- Today
- Forecast
- Units (orientation only)

---

## Instructional Notes

Teacher observations recorded during or after instruction.

Canonical Owner:

- Today

Authored By:

- Teacher

Changes When:

- Teacher edits notes

Consumed By:

- Today

---

## Section-Specific Instructional Adjustment

Represents a temporary modification made for one section.

Examples:

- additional practice day
- continuation day
- skipped activity
- modified pacing for one class

These adjustments modify instruction for a specific section.

They do not modify the planned curriculum.

Canonical Owner:

- Today

Authored By:

- Teacher

Changes When:

- Teacher modifies instruction for one section

Consumed By:

- Today
- Forecast

---

# Domain 3 Ñ Interpretation

Interpretation represents understanding derived from comparing the planned curriculum with the enacted curriculum.

Interpretation is computed.

It is not authored.

Forecast is the canonical owner of Interpretation.

---

## Pacing Status

Examples:

- On Track
- Monitoring
- Needs Attention
- Buffer Exhausted

Canonical Owner:

- Forecast

Generated From:

- Planned Curriculum
- Enacted Curriculum

Consumed By:

- Forecast

---

## Forecast

Represents projected instructional progress.

Examples:

- projected completion
- recoverability
- instructional runway

Canonical Owner:

- Forecast

Generated From:

- Planned Curriculum
- Enacted Curriculum

Consumed By:

- Forecast

---

## Recommendations

Represents suggested responses to projected pacing.

Examples:

- continue current pace
- reduce optional instruction
- recover buffer

Canonical Owner:

- Forecast

Generated From:

- Forecast rules

Consumed By:

- Forecast

---

# Curriculum Revision

Curriculum revision is distinct from instructional recording.

Instructional events describe what happened.

Curriculum revisions intentionally modify the planned curriculum.

Examples include:

- adding a lesson
- splitting a lesson
- reordering lessons
- revising planned instructional time

Curriculum revisions may be initiated from multiple subsystems.

However, every curriculum revision modifies the Planned Curriculum owned by Units.

---

# Information Dependencies

Subsystems may consume information owned by other subsystems.

Examples include:

Units

- consumes Lesson Completion solely to provide orientation within the planned curriculum.

Forecast

- consumes the Planned Curriculum.
- consumes the Enacted Curriculum.
- produces Interpretation.

Lesson Planner

- consumes the Planned Curriculum.
- consumes relevant instructional history when appropriate.
- does not own curriculum structure.

Ownership never changes because information is shared.

---

# Ownership Principles

Information has one canonical owner.

Information may have many consumers.

Interpretation is never stored when it can be computed.

Subsystems own responsibilitiesÑnot data duplication.

Whenever uncertainty exists about where a feature belongs, determine:

1. Which information does it modify?
2. Which subsystem canonically owns that information?

The answer determines where the feature belongs.# Units Architecture

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