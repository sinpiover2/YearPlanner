# Architect's Notes --- Sprint 6.0

**Purpose:** This document complements the engineering handoff. It
captures the architectural decisions, product direction, and design
philosophy that guided Sprint 6.0 so future development remains
consistent.

------------------------------------------------------------------------

# The Meaning of Sprint 6.0

Sprint 6.0 marks the point where Year Planner becomes ready to
transition from primarily infrastructure work toward classroom value.

The secure production write pipeline was the last major prerequisite
before using the application with real instructional planning. The
remaining infrastructure work is still important, but it should
increasingly be driven by classroom needs rather than engineering
completeness.

------------------------------------------------------------------------

# Product Direction

The next phase of development is not about building more framework.

It is about helping a teacher plan an actual school year.

Every feature should now be evaluated against one question:

> **Does this help a teacher plan, teach, or adjust instruction?**

If not, it should receive lower priority.

------------------------------------------------------------------------

# Stable Architectural Principles

## Year Planner is a planning system.

It is **not** a curriculum repository.

Curriculum providers remain the canonical owners of curriculum content.

Year Planner stores only the information necessary to support planning,
forecasting, scheduling, printing, and teaching.

------------------------------------------------------------------------

## Teacher-created work is the highest-value data.

Imported curriculum can always be recreated.

Teacher planning cannot.

Design decisions should continue to prioritize protecting
teacher-authored work above imported or derived information.

------------------------------------------------------------------------

## One canonical owner.

Avoid duplicating information simply because it is available.

-   Amplify owns curriculum details.
-   Year Planner owns instructional planning.
-   Generated information should remain reproducible whenever practical.

------------------------------------------------------------------------

## Keep the model lean.

Additional fields, tables, and abstractions should not be introduced
until a classroom workflow clearly requires them.

Complexity should always be justified by real teaching practice.

------------------------------------------------------------------------

# Next Sprint Philosophy

The objective is **not** to import Amplify.

The objective is to enable planning using Amplify.

The Unit 1 pilot should determine the minimum curriculum information
required to:

-   build a yearly plan,
-   forecast pacing,
-   schedule lessons,
-   print instructional materials,
-   support day-to-day teaching.

Any curriculum information that does not improve one of those activities
should remain in Amplify.

------------------------------------------------------------------------

# Decision Filter

Before expanding the data model, ask:

1.  Does this change a planning decision?
2.  Will it be referenced repeatedly during teaching?
3.  Is Year Planner the appropriate canonical owner?

If the answer to any of these is "no," the information probably should
not be stored.

------------------------------------------------------------------------

# Looking Ahead

The Unit 1 pilot is intentionally an experiment.

Success is not measured by how much curriculum is imported.

Success is measured by whether the imported information allows a
complete planning workflow while preserving the simplicity of the
system.

If the existing Units and Lessons model proves sufficient, resist
expanding it prematurely.

Future classroom experience should drive future architecture.

------------------------------------------------------------------------

# Relationship to the Engineering Handoff

Read the engineering handoff first for:

-   repository status
-   implementation details
-   deployment verification
-   build verification
-   remaining technical work

Then read these notes to understand **why** the next sprint follows the
direction it does.

Together, the two documents provide both the technical state of the
repository and the architectural intent behind it.
