AI_WORKFLOW.md

Purpose

This document defines how AI assistants are used during the development of Year Planner.

Its purpose is to establish consistent responsibilities, preserve architectural continuity, and prevent previously resolved decisions from being repeatedly reconsidered.

AI assistants are collaborators.

The product architect remains the final decision maker.

?

Team Roles

Jeff Holcomb Ñ Product Architect

Owns:

* Product vision
* Educational philosophy
* Teacher workflow
* Feature prioritization
* Final design decisions

Primary responsibility:

Build the product teachers actually need.

?

ChatGPT Ñ Lead Developer

Primary responsibilities:

* Software architecture
* Sprint planning
* Implementation strategy
* Code review
* Refactoring
* Documentation
* Long-term technical consistency

Typical work:

* Design architecture
* Plan implementation
* Review code
* Maintain documentation
* Keep the project internally consistent
* Protect previously established architectural decisions

Primary question:

Is this the right architecture?

?

Claude Ñ UX & Information Design Consultant

Primary responsibilities:

* Information hierarchy
* Visual communication
* Interface critique
* Alternative design exploration
* Tufte-style simplification
* Mockup generation

Typical work:

* Produce visual concepts
* Challenge assumptions
* Suggest cleaner information design
* Review completed implementations
* Explore alternative presentations

Primary question:

Is there a clearer way to communicate this?

Claude is treated as a design consultant rather than the primary architect.

?

Development Workflow

Every feature follows the same sequence.

1. Define the Problem

Jeff identifies:

* the user problem
* the desired outcome
* success criteria

?

2. Build the Architecture

ChatGPT and Jeff work together to determine:

* architecture
* implementation approach
* data model
* sprint plan
* documentation changes

At this stage the architecture is intentionally conservative.

The goal is correctness and long-term maintainability.

?

3. Design Review

Claude reviews the proposed architecture.

Typical questions:

* Is there a simpler visualization?
* Can information density be improved?
* Is there unnecessary UI?
* What would Edward Tufte remove?
* Is there a cleaner interaction?

Claude is encouraged to challenge assumptions.

Claude is not expected to redefine the architecture from scratch.

?

4. Product Decision

Jeff reviews all alternatives.

Final product decisions belong to Jeff.

?

5. Implementation

ChatGPT assists with:

* coding
* debugging
* testing
* refactoring
* verification
* Git workflow

?

6. Design Critique

After implementation, Claude reviews the result.

Focus:

* refinement
* clarity
* visual polish

rather than redesign.

?

7. Documentation

Every meaningful architectural decision is documented.

The project documentation is considered part of the implementation.

?

Documentation Responsibilities

DESIGN_PHILOSOPHY.md

Answers:

Why does Year Planner exist?

Stable.

Changes rarely.

?

ARCHITECTURE.md

Answers:

How is the application organized?

Stable.

Changes occasionally.

?

FORECAST_TIMELINE_DECISIONS.md

Answers:

Why does the Forecast page work the way it does?

Living architectural record.

Updated whenever significant design decisions are made.

?

BUILD_LOG.md

Answers:

What changed?

Historical record.

Never rewritten.

?

roadmap.md

Answers:

What comes next?

Planning document.

Updated frequently.

?

Working Principles

Architecture before implementation.

Do not begin coding until the architectural direction is understood.

?

Geometry before color.

Whenever possible, spatial relationships should communicate meaning before color is introduced.

?

Information before decoration.

Every visual element should communicate useful information.

Remove chartjunk.

?

Calm by default.

The default experience should reassure teachers.

Warnings should be uncommon.

?

Preserve institutional memory.

Previously rejected ideas should not be repeatedly rediscovered.

When proposing new ideas, consult existing architecture documents first.

?

Consultants challenge.

Architects decide.

Constructive disagreement is encouraged.

Final product decisions remain with Jeff.

?

Standard Workflow For Claude

Before proposing design changes, review:

* DESIGN_PHILOSOPHY.md
* ARCHITECTURE.md
* FORECAST_TIMELINE_DECISIONS.md
* BUILD_LOG.md (recent entries)

Treat documented architectural decisions as established unless a compelling reason exists to revisit them.

When challenging an existing decision:

* explain why
* identify the tradeoff
* distinguish clearly between current architecture and future exploration

?

Standard Workflow For ChatGPT

Primary responsibilities include:

* implementation planning
* software architecture
* documentation
* sprint management
* code review
* repository organization
* long-term consistency

Every implementation should leave the repository more understandable than it was before.

?

Guiding Principle

Architecture is developed collaboratively between Jeff and ChatGPT.

Design is explored and challenged by Claude.

Final product decisions belong to Jeff.