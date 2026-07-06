# Principles

These principles define the long-term design philosophy of Year Planner.

Architecture, implementation, and future features should all reinforce these principles.

When uncertainty arises, these principles take precedence over convenience.

---

# Purpose

Year Planner is an instructional operating system.

Its purpose is to help teachers move confidently from long-range planning to daily instruction.

The application exists to reduce cognitive load, improve instructional awareness, and support thoughtful decision makingÑnot to become another place teachers manage information.

---

# Teacher-Centered Design

The application should reflect how teachers naturally think.

Teachers do not think in terms of database tables or software modules.

They think in questions.

The architecture should answer those questions in the order they naturally arise.

---

# Progressive Focus

The interface should become quieter as the teacher gets closer to teaching.

Each workspace intentionally narrows attention.

```
Forecast

?

Units

?

Today

?

Teacher Desk

?

Printed Agenda

?

Teach
```

Forecast provides broad awareness.

Units narrows instructional focus.

Today establishes operational readiness.

Teacher Desk becomes the final thinking space.

Teaching happens away from the software.

---

# The Software Should Disappear

The goal is not to have the application open during instruction.

The goal is to prepare the teacher so thoroughly that the software is no longer needed once class begins.

The application succeeds when it builds confidence rather than dependency.

The final feeling before teaching should be:

> **I've got this.**

---

# Ownership

Every responsibility belongs to one owner.

Ownership should be obvious.

Responsibilities should not be duplicated.

When ownership is clear:

- implementation becomes simpler
- maintenance becomes easier
- future features become more predictable

---

# The Application Shell Owns Orientation

The Application Shell answers:

> **Where am I?**

It owns:

- application identity
- global navigation
- application status
- workspace hosting

The shell never owns instructional thinking.

---

# Workspaces Own Domain Thinking

Each workspace exists to answer a distinct instructional question.

## Forecast

Answers:

> **Am I OK?**

Owns:

- pacing
- projections
- time awareness
- instructional risk

---

## Units

Answers:

> **Where is this instruction going?**

Owns:

- course context
- section context
- unit progression
- curriculum navigation

---

## Today

Answers:

> **What am I teaching today?**

Owns:

- daily operational awareness
- teaching sequence
- today's changes
- immediate preparation

---

## Teacher Desk

Answers:

> **Am I ready?**

Owns:

- lesson preparation
- instructional sequence
- teaching materials
- teacher notes
- final rehearsal before class

---

# Information Flows Toward Action

Information should always become more actionable.

The application should help teachers move from awareness to decision.

Information generally flows in this order:

```
Reality

?

Interpretation

?

Recommendation

?

Action
```

The interface should interpret information rather than merely display it.

---

# Model Builders Shape Information

Views should display information.

They should not assemble or interpret it.

Model builders prepare domain-specific information before it reaches the interface.

Benefits include:

- simpler components
- clearer ownership
- improved testability
- easier maintenance

Views should render.

Model builders should think.

---

# Refactoring Preserves Behavior

Refactoring changes ownership.

It should not change behavior.

A successful refactor:

- simplifies architecture
- improves clarity
- reduces coupling
- preserves user experience

Behavioral changes belong in feature work, not refactoring work.

---

# Redesign and Refactoring Are Different

Redesign changes the product.

Refactoring changes the implementation.

These activities should remain separate whenever possible.

Separating them reduces risk and makes architectural progress easier to evaluate.

---

# Architecture Should Enable Growth

The architecture should make future work easier.

New workspaces should be added without requiring existing workspaces to change.

New capabilities should fit naturally within the established ownership model.

When architecture is stable, features become simpler to build.

---

# Calm Over Complexity

Teachers make hundreds of decisions every day.

The software should reduce that burden.

The interface should be:

- calm
- predictable
- trustworthy
- supportive

It should avoid unnecessary visual noise, unnecessary choices, and unnecessary interruptions.

---

# Build for Years, Not Sprints

Every implementation decision should support the long-term evolution of the application.

Short-term convenience should not compromise long-term clarity.

When faced with competing solutions, prefer the one that makes future development easier to understand, extend, and maintain.

Architecture is an investment.

Each sprint should strengthen it.