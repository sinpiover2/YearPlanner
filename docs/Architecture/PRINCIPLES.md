# Principles

These principles define the long-term philosophy of Year Planner.

Architecture, implementation, interaction design, and future features should reinforce these principles.

When implementation decisions become difficult, these principles take precedence over convenience.

---

# Product Vision

Year Planner exists to help teachers teach a coherent year with calm confidence.

The application integrates:

- curriculum
- pacing
- lesson planning
- daily teaching
- reflection

into one continuous instructional workflow.

Its purpose is not to help teachers manage more information.

Its purpose is to reduce uncertainty.

---

# Purpose

Year Planner is an instructional operating system.

It helps teachers move confidently from long-range planning to daily instruction while maintaining awareness of the entire school year.

The application exists to reduce cognitive load, improve instructional awareness, and support thoughtful decision making.

When class begins, the teacher should feel preparedÑnot dependent on the software.

---

# Teacher-Centered Design

Teachers do not think in database tables.

They do not think in software modules.

They think in instructional questions.

Every workspace should answer one clear question.

Those questions should appear in the same order teachers naturally think.

---

# The Instructional Lifecycle

Teaching is a continuous cycle.

Year Planner exists to support every stage without breaking the teacher's mental model.

```
Forecast

?

Planning

?

Today

?

Lesson Session

?

Teach

?

Reflection

?

Next Year
```

Each stage should naturally lead to the next.

Nothing should feel disconnected.

---

# Progressive Focus

The interface should become quieter as the teacher approaches the classroom.

Each workspace intentionally narrows attention.

```
Forecast

?

Planning

?

Today

?

Lesson Session

?

Teach
```

Forecast provides awareness.

Planning creates clarity.

Today creates focus.

Lesson Session supports great teaching.

Teaching happens away from the software.

---

# The Software Should Disappear

The goal is not to have the application open during instruction.

The goal is to prepare the teacher so thoroughly that the software becomes unnecessary during class.

The application succeeds when it builds confidence rather than dependency.

The final feeling before teaching should be:

> **I've got this.**

---

# Calm Is a Feature

Teachers make hundreds of decisions every day.

Year Planner should reduce that burden.

Every screen should reduce uncertainty.

Every interaction should reduce cognitive load.

The interface should feel:

- calm
- predictable
- trustworthy
- supportive

Avoid:

- unnecessary visual noise
- unnecessary alerts
- unnecessary choices
- unnecessary interruptions
- information that does not improve decisions

If a feature increases anxiety without improving decisions, it should not be built.

---

# Information Exists to Support Decisions

Information should always become more actionable.

The application should move teachers through a consistent progression:

```
Reality

?

Interpretation

?

Recommendation

?

Action
```

Raw information is rarely the goal.

The application should help teachers understand what matters.

---

# Clear Ownership

Every responsibility belongs to one owner.

Ownership should be obvious.

Responsibilities should never be duplicated.

When ownership is clear:

- implementation becomes simpler
- maintenance becomes easier
- future development becomes more predictable

---

# Application Shell

The Application Shell answers:

> **Where am I?**

It owns:

- application identity
- navigation
- application status
- workspace hosting

It never owns instructional thinking.

---

# Workspace Responsibilities

Each workspace exists to answer one instructional question.

## Forecast

Answers:

> **Am I okay?**

Owns:

- pacing
- projections
- instructional risk
- long-range awareness

Forecast interprets.

It does not plan.

---

## Planning

Answers:

> **What should I prepare?**

Owns:

- weekly planning
- Lesson Session arrangement
- curriculum placement
- instructional organization

Planning is the operational center of the application.

It connects curriculum, pacing, and lesson preparation.

---

## Units

Answers:

> **Where is this instruction going?**

Owns:

- curriculum
- unit progression
- lesson sequence
- instructional intent

Units defines what should be taught.

It does not decide when or how.

---

## Today

Answers:

> **What am I teaching today?**

Owns:

- today's teaching
- operational readiness
- today's changes
- launching Lesson Session

Today should be calm, focused, and immediately actionable.

---

## Lesson Session

Answers:

> **How do I teach this lesson well?**

Owns:

- instructional composition
- activity sequence
- materials
- timing
- teacher preparation

Lesson Session is not a workspace.

It is an editor opened from Planning and Today.

---

# Information Flows Forward

Information should naturally flow through the instructional lifecycle.

```
Curriculum

?

Lesson Sessions

?

Today's Teaching

?

Reflection

?

Curriculum Improvement
```

Nothing should exist in isolation.

Planning is where these systems come together.

---

# Views Render

Views present information.

They should not assemble it.

They should not interpret it.

Model builders prepare information before it reaches the interface.

Views render.

Models think.

---

# Refactoring Preserves Behavior

Refactoring changes ownership.

It should not change behavior.

Successful refactoring:

- simplifies architecture
- improves clarity
- reduces coupling
- preserves user experience

Behavioral changes belong in feature work.

---

# Redesign and Refactoring Are Different

Redesign changes the product.

Refactoring changes the implementation.

These activities should remain separate.

Separating them reduces risk and makes architectural progress easier to evaluate.

---

# Architecture Enables Growth

Architecture should make future work easier.

New workspaces should fit naturally into existing ownership.

New capabilities should strengthen the instructional lifecycle rather than bypass it.

Good architecture reduces the cost of future ideas.

---

# Build for Years

Every implementation decision should support the long-term evolution of the application.

Prefer solutions that improve clarity over those that merely solve today's problem.

Architecture is a long-term investment.

Every sprint should strengthen it.