# Workspace Principles

This document defines the architectural principles shared by every major workspace in Year Planner.

These principles are intended to remain stable as the product evolves.

---

# Product Philosophy

Year Planner is a teacher decision-support system.

Its purpose is not to store information.

Its purpose is to reduce cognitive load by helping teachers make better decisions.

Every design decision should support that goal.

---

# One Question Per Workspace

Each workspace exists to answer one primary teacher question.

| Workspace | Primary Question |
|------------|------------------|
| Forecast | Am I OK? |
| Units | Where am I in the curriculum? |
| Today | What am I teaching today? |
| Lesson Planner | How do I teach this lesson well? |

If a feature primarily answers another workspace's question, it probably belongs somewhere else.

This boundary protects the simplicity of the application.

---

# One Primary Action

Every workspace should naturally lead the teacher toward one primary action.

Examples:

Forecast

? Understand pacing

Units

? Navigate curriculum

Today

? Start Lesson

Lesson Planner

? Teach the lesson

A workspace should never compete with itself by presenting multiple equally important actions.

---

# Information Hierarchy

Information should generally appear in this order.

## 1. Status

What should the teacher know immediately?

Establish the current state.

Reduce uncertainty.

---

## 2. Orientation

Where am I?

Provide context.

---

## 3. Focus

What matters most right now?

Draw attention to the primary responsibility of the workspace.

---

## 4. Action

What should I do next?

The primary action should feel obvious.

---

# State Belongs to the Software

Teachers should not have to remember:

- what changed
- where they stopped
- what lesson is next
- what still needs logging
- what requires attention

The software should remember these things automatically.

The interface should surface them at the appropriate time.

---

# Workspaces Own Responsibilities

Responsibilities should have a single owner.

Avoid duplication.

Examples:

Forecast owns:

- pacing
- projections
- buffers
- long-term consequences

Units owns:

- curriculum organization
- unit structure
- lesson sequence

Today owns:

- today's work
- today's flow
- lesson launch

Lesson Planner owns:

- instructional planning
- teaching workflow
- reflections
- lesson resources

When a responsibility has a clear owner, users know where to find it.

---

# Information Flows Forward

Information generally flows through the application in this direction.

Forecast

?

Units

?

Today

?

Lesson Planner

Each workspace narrows the teacher's focus.

Forecast

Strategic

?

Units

Curricular

?

Today

Operational

?

Lesson Planner

Instructional

The application should guide the teacher naturally through this progression.

---

# Calm Is the Default

The interface should assume things are going well unless there is evidence otherwise.

Avoid creating urgency where none exists.

A calm interface allows genuine problems to stand out.

---

# Color Has Meaning

Color communicates importance.

Not decoration.

Whenever possible:

- typography communicates hierarchy
- spacing communicates organization
- geometry communicates state

Reserve strong semantic colors for meaningful conditions.

---

# Reassure Before You Instruct

Every workspace should first answer the teacher's unspoken question:

> "What should I know before I begin?"

This may be:

- reassurance
- orientation
- a gentle warning
- confirmation

It should always be:

- truthful
- concise
- actionable

The goal is to reduce uncertainty before asking the teacher to act.

---

# Progressive Disclosure

Show only the information needed for the current decision.

Allow deeper information to appear naturally as the teacher moves into more detailed work.

Example:

Forecast

?

Today

?

Lesson Planner

Each step increases detail while reducing unnecessary information.

---

# Build Confidence

The software should leave teachers feeling:

- informed
- prepared
- in control

Not overwhelmed.

Not monitored.

Not evaluated.

The interface should quietly communicate:

> "You know what comes next."

---

# Architecture Before Features

New features should be added only after determining:

- Which workspace owns them.
- Which teacher question they answer.
- Whether they reduce cognitive load.
- Whether they duplicate an existing responsibility.

If these questions cannot be answered clearly, the feature is not ready.

---

# Definition of a Good Workspace

A workspace is successful when:

- it answers one primary question
- its hierarchy is immediately obvious
- its primary action is clear
- it does not duplicate another workspace
- it reduces cognitive load
- it leaves the teacher more confident than when they arrived

Every workspace should help the teacher move naturally to the next stage of their work.

That flow—not the individual screens—is the product.