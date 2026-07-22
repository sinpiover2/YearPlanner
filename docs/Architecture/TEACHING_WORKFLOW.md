# TEACHING_WORKFLOW.md

# Teaching Workflow

**Status:** Draft Architecture

**Purpose:** Define the complete lifecycle of teaching supported by Year Planner.

**Related Documents**

- DESIGN_PHILOSOPHY.md
- WORKSPACE_PRINCIPLES.md
- LESSON_PLANNER.md
- LESSON_SESSION.md
- LESSON_PLANNER_INFORMATION_MODEL.md
- TEACHING_EPISODE_MODEL.md
- POST_CLASS_DEBRIEF.md
- FORECAST.md
- UNITS.md

---

# Purpose

Year Planner is not simply a lesson planner.

It is a system that supports the complete instructional cycle.

Understanding this cycle is essential because every workspace, every data model, and every interaction exists to support one phase of teaching.

This document defines those phases and the information that flows between them.

---

# Fundamental Philosophy

Teaching unfolds over time.

The software should support each phase appropriately without allowing one phase to interfere with another.

Planning is different from teaching.

Teaching is different from reflection.

Reflection is different from planning the next lesson.

Each phase deserves its own tools.

---

# The Teaching Lifecycle

```
Long-Term Planning
        ?
        ?
Forecast
        ?
        ?
Units
        ?
        ?
Planning
        ?
        ?
Lesson Planner
        ?
        ?
Print
        ?
?????????????????
 Teach from Paper
?????????????????
        ?
        ?
Post-Class Debrief
        ?
        ?
Updated Reality
        ?
 ??????????????????
 ?                ?
Forecast      Units
        ?
        ?
Tomorrow's Planning
```

The lifecycle is continuous.

Every class period updates the teacher's understanding of reality.

Future planning begins from that updated reality.

---

# Phase 1 — Expedition

Timeframe:

Weeks to months before instruction.

Purpose:

Prepare the journey.

Activities:

- organize curriculum
- estimate pacing
- identify milestones
- balance instructional time
- anticipate disruptions
- allocate instructional days

Primary Workspaces:

- Forecast
- Units

Primary Output:

A realistic instructional roadmap.

---

# Phase 2 — Planning

Timeframe:

Days before instruction.

Purpose:

Transform curriculum into teachable experiences.

Activities:

- build lesson sessions
- sequence teaching episodes
- estimate durations
- prepare examples
- prepare materials
- identify transitions
- create assessments

Primary Workspace:

Lesson Planner

Primary Output:

A complete lesson plan.

---

# Phase 3 — Put-In

Timeframe:

Minutes before class.

Purpose:

Prepare to teach.

Activities:

- review today's lesson
- gather materials
- print lesson
- mentally rehearse
- make last-minute adjustments

Primary Workspace:

Lesson Planner

Primary Output:

Printed lesson plan.

---

# Phase 4 — Rapids

Timeframe:

The class period.

Purpose:

Teach.

The software intentionally steps aside.

The printed lesson becomes the primary teaching interface.

The teacher should not feel compelled to interact with software during instruction.

Expected paper annotations include:

- stopping point
- arrows
- circles
- check marks
- reminders
- brief observations

These marks serve as temporary memory.

They are not permanent records.

---

# Phase 5 — Campfire

Timeframe:

Immediately after class.

Purpose:

Reflect while memory is fresh.

Activities:

- record where instruction stopped
- record important observations
- distinguish durable learning from temporary events
- preserve teaching knowledge
- update instructional history

Primary Workspace:

Lesson Planner

Supporting Architecture:

POST_CLASS_DEBRIEF.md

Primary Output:

Accurate historical record.

---

# Phase 6 — Assimilation

Timeframe:

Between class periods.

Purpose:

Allow the software to transform recorded experience into planning information.

Teacher responsibilities:

None.

Software responsibilities:

- calculate instructional progress
- update pacing
- update forecasts
- identify carried work
- maintain instructional history

The software derives information.

The teacher does not manually calculate it.

---

# Phase 7 — Next Expedition

Timeframe:

The next planning cycle.

Purpose:

Begin planning from truth rather than memory.

Planning now incorporates:

- actual instructional progress
- durable teaching notes
- session history
- updated pacing
- revised forecasts

The cycle repeats.

---

# Information Flow

Different kinds of information are created during different phases.

## Curriculum Information

Created during Expedition.

Examples:

- units
- lessons
- standards
- objectives

Stable.

Changes infrequently.

---

## Planning Information

Created during Planning.

Examples:

- lesson sessions
- teaching episodes
- durations
- instructional sequence

Expected to evolve.

---

## Teaching Information

Created during Rapids.

Initially exists only on paper.

Examples:

- stopping point
- annotations
- quick reminders

Temporary.

---

## Reflection Information

Created during Campfire.

Examples:

- session notes
- episode notes
- enacted progress

Becomes permanent.

---

## Derived Information

Created during Assimilation.

Examples:

- pacing
- instructional days
- completion statistics
- forecasting updates

Never entered manually.

---

# Design Principles

## Planning should not feel like reporting.

Planning is creative work.

---

## Teaching should not feel like software.

The teacher should focus entirely on students.

---

## Reflection should not feel like paperwork.

Recording should be brief.

Most sessions require only seconds.

---

## Analysis should happen automatically.

The software performs calculations.

The teacher records experience.

---

## Every phase has one job.

Each workspace should optimize for its phase.

Avoid mixing planning, teaching, and reporting into one interface.

---

# The Role of Paper

Paper is not a fallback.

Paper is an intentional part of the workflow.

Advantages include:

- immediate
- reliable
- annotation-friendly
- always visible
- distraction-free
- naturally supports teaching

Year Planner embraces this rather than competing with it.

The printed lesson serves as temporary working memory during instruction.

The digital system serves as durable organizational memory afterward.

---

# Source of Truth

Each phase produces one kind of truth.

Planning Truth

"What I intended to teach."

Teaching Truth

"What actually happened."

Reflection Truth

"What I learned."

Analytical Truth

"What the software derived."

These truths should never be confused.

---

# Guiding Principle

Year Planner does not replace the teacher.

It extends the teacher's memory across time.

Planning captures intention.

Paper supports action.

Reflection preserves experience.

The software transforms experience into knowledge.

Knowledge improves the next plan.

That cycle—not any individual workspace—is the true product.