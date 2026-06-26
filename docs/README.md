Documentation Guide

Welcome to the Year Planner documentation.

This documentation is organized to explain why the system exists, how it works, and how it continues to evolve.

If you are new to the project—human or AI—start here.

?

Reading Order

Read the documentation in this order.

1. Vision

Read first to understand where the project is ultimately heading.

Vision/
    FORECAST_TIMELINE_VISION.md

This document explains the long-term vision rather than the current implementation.

?

2. Design Philosophy

Architecture/
    DESIGN_PHILOSOPHY.md

Explains the principles that drive every design decision.

Questions answered include:

* What problem does Year Planner solve?
* Why is it a decision-support tool instead of a dashboard?
* What emotional experience should teachers have?

?

3. Guiding Principles

Architecture/
    GUIDING_PRINCIPLES.md

Documents the recurring design rules used throughout the application.

Examples include:

* Geometry before color
* Progressive disclosure
* Calm by default
* Interpretation before reporting

?

4. System Architecture

Architecture/
    ARCHITECTURE.md

Describes how the entire application is organized.

Topics include:

* System structure
* Data flow
* Application layers
* Shared responsibilities

This document is intentionally general.

?

5. Forecast Architecture

Architecture/
    FORECAST_ARCHITECTURE.md

Documents the Forecast subsystem.

Topics include:

* Forecast page structure
* Forecast engine
* Buffer calculations
* Projection model
* Timeline responsibilities
* Forecast card responsibilities

?

6. Architectural Decisions

Architecture/
    FORECAST_TIMELINE_DECISIONS.md

Records the major architectural decisions made while designing the Forecast Timeline.

Each decision explains:

* what was decided,
* why,
* alternatives that were considered,
* current status.

This is the project’s institutional memory.

?

7. Development Workflow

Development/
    AI_WORKFLOW.md

Explains how development is performed.

Defines the responsibilities of:

* Project Owner
* Development AI
* Design Consultant AI

This document should be read before participating in design discussions.

?

8. Reference Material

Reference/

Contains factual reference information.

Examples:

* API_REFERENCE.md
* REQUIREMENTS.md
* COMPONENT_INVENTORY.md
* COLOR_SCHEME_REFERENCE.md
* SHEET_STRUCTURE.md

Reference documents describe the current system but do not explain design philosophy.

?

9. Project History

History/

Records how the project evolved.

Examples include:

* BUILD_LOG.md
* DECISIONS.md
* FORECAST_V1.md

History documents explain what happened, not what should happen.

?

10. Releases

Releases/

Contains release notes for published versions.

?

11. Roadmap

Roadmap/

Contains future development plans.

Examples:

* ROADMAP.md
* PROJECT_STATUS.md

?

Documentation Philosophy

Each document should have one primary responsibility.

Avoid duplicating information across multiple files.

Instead:

* Philosophy explains why.
* Principles explain recurring rules.
* Architecture explains how the system is organized.
* Decision documents explain why specific architectural choices were made.
* Reference documents explain what currently exists.
* History documents explain how the project evolved.

Keeping these responsibilities separate makes the documentation easier to maintain and easier to trust.

?

For AI Contributors

Before proposing architectural changes:

1. Read the Vision.
2. Read the Design Philosophy.
3. Read the Guiding Principles.
4. Read the relevant Architecture documents.
5. Read the applicable Decision documents.

Do not unknowingly reintroduce previously rejected ideas.

If proposing a change to an established architectural decision, explain why the existing decision is no longer the best solution rather than simply replacing it.

?

Repository Overview

docs/
??? README.md
??? Vision/
??? Architecture/
??? Development/
??? History/
??? Reference/
??? Releases/
??? Roadmap/

This structure reflects the flow of knowledge through the project:

Vision ? Philosophy ? Principles ? Architecture ? Decisions ? Reference ? History ? Roadmap

Following this order helps both humans and AI understand not only what Year Planner is, but why it became that way.