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
        ↓
Enacted Curriculum
        ↓
Interpretation
        ↓
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
