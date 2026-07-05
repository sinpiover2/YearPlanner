# Application Shell

## Purpose

The Application Shell provides the permanent structure of Year Planner.

Every workspace exists inside the shell.

Its purpose is to create a calm, predictable environment in which teachers always know:

- where they are
- how to move between workspaces
- the overall state of the application

The Application Shell does **not** own instructional work.

It exists to support the workspaces, not compete with them.

---

# Design Philosophy

The shell should gradually disappear from the teacher's awareness.

Teachers should notice the current workspace, not the shell itself.

As instructional focus narrows, the shell remains constant while the workspace becomes increasingly important.

Working principle:

> **The shell provides orientation.
> Workspaces provide cognition.**

---

# Responsibilities

The Application Shell owns exactly four responsibilities.

## 1. Application Identity

The shell establishes the identity of the application.

Examples:

- Year Planner
- School Year
- Branding

The shell answers:

> **What application am I using?**

---

## 2. Global Navigation

The shell owns movement between workspaces.

Current workspaces:

- Today
- Forecast
- Units
- Teacher Desk

Future workspaces may include:

- Monday Manager
- Settings

Navigation belongs to the shell because it exists independently of instructional context.

The shell answers:

> **Where am I?**

---

## 3. Global Application Status

The shell may present information that is meaningful regardless of the active workspace.

Examples:

- Connected / Offline
- Synchronization status
- Current school year
- Current instructional plan

The shell should never display instructional information.

---

## 4. Workspace Host

The shell provides the stable environment in which workspaces live.

Its responsibilities include:

- presenting the active workspace
- maintaining consistent navigation
- preserving spatial familiarity across the application

The shell should never dictate how a workspace is designed.

Each workspace owns its own thinking.

---

# Ownership Rule

A feature belongs in the Application Shell only if it is meaningful in **every** workspace.

Ask:

> Would this still belong here if Forecast disappeared?

or

> Would this still belong here if Teacher Desk were open?

If the answer is **no**, it belongs inside a workspace.

---

# What Does NOT Belong Here

The shell should never own instructional thinking.

Examples include:

- courses
- sections
- units
- lessons
- lesson sessions
- timelines
- pacing
- time lens
- instructional segments
- teacher notes
- reflections
- lesson materials
- deliverables

These belong to individual workspaces.

---

# Relationship to Workspaces

The shell establishes orientation.

Workspaces establish thought.

The shell should answer:

> **Where am I?**

The workspace should answer:

> **What am I trying to accomplish?**

Each workspace owns one teacher question.

The shell owns none.

---

# Information Hierarchy

```
Application Shell
        ↓
Workspace
        ↓
Workspace Components
        ↓
Instructional Objects
```

Information should never flow in the opposite direction.

The shell should remain unaware of instructional details.

---

# Stability

The Application Shell should evolve slowly.

Teachers develop spatial memory over years of use.

Individual workspaces will continue to evolve as instructional workflows improve.

The shell should remain familiar.

Changes to the Application Shell should be considered major architectural decisions.

---

# Architectural Test

Whenever a new feature is proposed, ask:

> Does this help teachers understand the application?

or

> Does this help teachers perform instructional work?

If it helps teachers understand the application, it belongs in the Application Shell.

If it helps teachers think, plan, prepare, teach, or reflect, it belongs in a workspace.

---

# Long-Term Vision

The Application Shell provides a permanent framework within which workspaces may evolve independently.

New workspaces should be able to appear without requiring existing workspaces to change.

The shell should make the application feel cohesive while allowing each workspace to become increasingly specialized.

---

# First Principle

> **The shell provides orientation.
> Workspaces provide cognition.**

Teachers should always know where they are.

Their thinking should happen inside the workspace, not inside the Application Shell.
