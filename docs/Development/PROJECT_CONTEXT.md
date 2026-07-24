# PROJECT_CONTEXT.md
**Year Planner � Permanent Project Context**

> This document contains the long-lived context for the Year Planner project.
>
> Sprint handoffs should describe **what changed**.
>
> This document explains **what does not change**.

---

# Mission

Build software that allows an ordinary classroom teacher to prepare excellent lessons with less stress, less cognitive load, and better instructional decisions.

The software should reduce planning friction�not create more software to manage.

The product exists to help teachers think.

---

# Primary User

The primary user is me.

I teach:

- Math 8
- Integrated Math 1

The application is built around real classroom practice, not hypothetical workflows.

Generalization comes later.

Reality comes first.

---

# Product Vision

The product eventually becomes a complete teacher operating system.

Major workspaces include:

- Today
- Planning
- Lesson Session
- Units
- Forecast

Each workspace answers a different question.

| Workspace | Question |
|------------|----------|
| Today | What matters today? |
| Planning | What am I teaching this week? |
| Lesson Session | How will I teach this lesson? |
| Units | What curriculum is available? |
| Forecast | Am I on pace? |

---

# Core Philosophy

Everything must support one idea:

**Reduce teacher cognitive load.**

Not:

- more controls
- more dashboards
- more options

Instead:

- fewer decisions
- better defaults
- calmer interfaces

---

# Design Principles

## Silence is a feature.

Remove unnecessary information.

Do not fill space simply because it exists.

---

## Geometry before decoration.

Hierarchy comes from:

- spacing
- alignment
- grouping
- proportion

Color is reserved primarily for meaning.

---

## Reassure first.

Every workspace should answer:

> Am I OK?

before presenting detail.

---

## Information emerges.

Do not overwhelm users immediately.

Progressive disclosure is preferred.

---

## Teacher thinking comes first.

The software should match the teacher's mental process.

Never force teachers to think like software.

---

# Teacher Workflow

The intended weekly workflow is:

Forecast

?

Units

?

Planning

?

Lesson Session

?

Print

?

Teach

?

Reflect

Every feature should strengthen this workflow.

---

# Lesson Planning Philosophy

Curriculum is not the lesson.

Teaching Episodes are the lesson.

Curriculum provides source material.

Teachers author instruction.

Therefore:

Curriculum should support.

Teacher thinking should dominate.

---

# Teaching Episode Model

Teaching Episodes are the primary authoring unit.

An episode represents one instructional idea.

Episodes may contain:

- text
- learning targets
- deliverables
- materials

Episodes can later become reusable objects.

---

# Authoring Philosophy

Lesson authoring should feel like writing.

Not filling out forms.

Teachers should stay inside their train of thought.

Editing should be nearly frictionless.

---

# Print Philosophy

The printed lesson is the primary classroom interface.

During teaching:

The software is largely finished.

The teacher works from paper.

The computer helped prepare the lesson.

It should not compete for attention during instruction.

---

# Curriculum Philosophy

Curriculum exists to provide reference material.

Imported curriculum should:

- never overwrite teacher work
- always be additive
- remain traceable
- be easy to ignore

Teacher-authored thinking is always primary.

---

# Forecast Philosophy

Forecast exists to answer:

> Are we on pace?

It should never become another planning tool.

Forecast guides decisions.

Lesson Session creates lessons.

---

# Information Architecture

The hierarchy is:

School Year

?

Course

?

Section

?

Unit

?

Lesson

?

Lesson Session

?

Teaching Episode

?

Episode Block

Each level has a distinct responsibility.

Avoid duplicating responsibilities across levels.

---

# Decision Filter

Before implementing a feature, ask:

> Does this help prepare tomorrow's lesson faster?

If the answer is no, it probably belongs after Version 1.

---

# Version 1 Goal

By August 1 the application should comfortably support:

- weekly planning
- lesson authoring
- curriculum reference
- lesson printing
- classroom preparation

Version 1 does **not** need to solve every future workflow.

---

# Development Philosophy

Build vertically.

Complete one teacher workflow before starting another.

Avoid half-finished systems.

Prefer:

working

?

simple

?

elegant

rather than:

ambitious

?

complex

?

unfinished

---

# Coding Philosophy

Favor:

- readable code
- small components
- predictable state
- explicit data flow

Optimize for maintainability.

Not cleverness.

---

# Workflow

Development uses four terminal windows.

?? DEV

Runs:

```bash
cd frontend
npm run dev
```

---

?? BUILD

Runs:

```bash
cd frontend
npm run build
```

---

?? PROJECT

Development.

Documentation.

Claude Code.

VS Code.

---

?? GIT

Git only.

Typical workflow:

```bash
git status

git add ...

git commit -m "..."

git push
```

---

# AI Workflow

Claude Code is the primary implementation tool.

ChatGPT is used for:

- architecture
- product thinking
- sprint planning
- design critique
- long-form reasoning

Copilot assists with localized implementation when useful.

---

# Documentation Strategy

Permanent ideas belong in Architecture or this document.

Sprint handoffs should contain only:

- current state
- recent decisions
- immediate next work

Avoid duplicating permanent context.

---

# Long-Term Direction

Eventually the application should support:

Planning

?

Teaching

?

Reflection

?

Continuous improvement

without requiring teachers to maintain duplicate information.

Everything should become progressively easier to use as more authentic teaching work is captured.

---

# Plan Once, Reuse Everywhere

Year Planner is becoming the single source of truth for instructional planning.

Information entered once during planning should be reusable for:

- classroom instruction
- printed lesson plans
- forecasting
- weekly communication
- parent updates
- future LMS integrations

Teachers should not have to rewrite information that already exists in the planner.

This is a guiding product philosophy, not an implementation detail.

---

# Non-Negotiables

Never sacrifice clarity for cleverness.

Never optimize software over teacher thinking.

Never make curriculum more important than instruction.

Never introduce complexity without removing more complexity somewhere else.

Always protect the teacher's attention.

Always reduce cognitive load.

Always ask:

> Does this help a teacher prepare a better lesson tomorrow?