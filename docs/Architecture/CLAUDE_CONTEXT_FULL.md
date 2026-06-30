Suite Architecture

?

Purpose

The Year Planner Suite is a collection of instructional awareness tools.

Each application exists to answer one professional question exceptionally well.

Applications may share information.

They should never duplicate responsibility.

The suite succeeds when each application has a clear purpose and a teacher instinctively knows where to go for a particular kind of thinking.

?

Shared Foundation

Every application shares the same beliefs.

* Teaching is the stewardship of limited instructional resources.
* Instructional time is a budget.
* Awareness belongs to the software.
* Professional judgment belongs to the teacher.
* Software should remove bookkeeping, not replace expertise.
* Teacher attention is the scarcest resource in the system.

Every application expresses these beliefs from a different instructional horizon.

?

The Instructional Horizons

Teaching happens simultaneously across multiple time scales.

The suite mirrors those horizons.

School Year
     ?
     ?
 Year Planner
     ?
     ?
Unit Planner
     ?
     ?
Lesson Planner
     ?
     ?
Student Learning

Moving downward does not mean moving to a different system.

It means moving closer to todayÕs instruction.

Each application inherits context from the one above it.

?

Application Responsibilities

Year Planner

Primary Question

How is my instructional time budget changing across the year?

Responsibilities

* Reveal long-term pacing.
* Monitor instructional flexibility.
* Show remaining buffer.
* Surface emerging constraints.
* Help teachers understand future implications.
* Connect pacing to instructional purpose.

Does Not Do

* Build lessons.
* Recommend instructional strategies.
* Choose what to cut.
* Manage daily instruction.

Year Planner creates awareness.

Teachers make decisions.

?

Unit Planner

Primary Question

Why is this instructional investment worth making?

Responsibilities

* Explain the purpose of the unit.
* Organize lessons.
* Clarify major learning outcomes.
* Show instructional progress through the unit.
* Reveal how todayÕs work fits the larger unit.

Does Not Do

* Manage yearly pacing.
* Plan daily instruction.
* Predict future schedule changes.

The Unit Planner answers:

ÒWhat is this investment intended to accomplish?Ó

?

Lesson Planner

Primary Question

How should I prepare for todayÕs instructional investment?

Responsibilities

* Organize todayÕs lesson.
* Surface learning targets.
* Collect instructional resources.
* Support lesson preparation.
* Reduce uncertainty before class.

Does Not Do

* Evaluate yearly pacing.
* Redesign curriculum.
* Make instructional decisions for teachers.

Lesson Planner prepares teachers.

Teachers teach.

?

Student App

Primary Question

What am I responsible for learning?

Responsibilities

* Show current learning goals.
* Clarify success criteria.
* Track learning progress.
* Encourage ownership.
* Help students understand their own growth.

Does Not Do

* Replace teacher feedback.
* Grade students.
* Manage curriculum pacing.

Students steward learning.

Teachers steward instructional time.

?

Ownership Rules

Applications own questions, not features.

For example:

Forecast information belongs to Year Planner because it answers a yearly question.

Learning targets belong to Lesson Planner because they answer a daily instructional question.

The same data may appear in multiple applications.

The same responsibility should not.

?

Information Flow

Information moves from broad awareness toward daily action.

Year
"What does the year look like?"
        ?
        ?
Unit
"What is this investment for?"
        ?
        ?
Lesson
"What am I preparing today?"
        ?
        ?
Student
"What am I learning?"

Each level inherits context from the one above it.

No application should require the teacher to mentally reconstruct information already understood elsewhere.

?

Shared Pacing Engine

The suite contains one instructional model.

Not four.

Concepts such as:

* Required days
* Optional days
* Buffer
* Variance
* Forecast state
* Remaining flexibility

are computed once and shared throughout the suite.

Applications differ only in how they interpret that shared understanding.

Truth should have one source.

?

Progressive Disclosure

The suite should reveal information only when it becomes useful.

Teachers should move naturally through increasing levels of detail.

Year
?
Unit
?
Lesson
?
Student

The deeper a teacher moves, the narrower the instructional focus becomes.

The broader instructional context should never be lost.

Teachers should always understand both:

* the forest
* the trees

?

Design Boundary

Before adding a feature, ask:

Which professional question does this answer?

If the answer is unclear, the feature probably does not belong.

If the feature answers two questions equally well, the architecture should be reconsidered before implementation.

Clear ownership is more valuable than convenient placement.

?

The Goal

The applications should feel less like separate programs and more like different perspectives on the same instructional reality.

Teachers should never wonder:

ÒWhich application am I supposed to use?Ó

The answer should be obvious because each application exists to support a distinct kind of professional thinking.

The suite should quietly accompany teachers from the first day of school to the last, helping them understand their instructional investments while leaving the decisionsÑand the teachingÑwhere they belong.# Information Model

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