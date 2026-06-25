Year Planner Documentation Guide

Welcome to the Year Planner documentation.

This guide explains how the documentation is organized, why each document exists, and the recommended order in which it should be read.

The documentation is intentionally organized from the most stable ideas (philosophy) to the most implementation-specific details (reference material and history).

Whether you are a human contributor or an AI assistant, begin here.

?

Documentation Philosophy

Documentation is considered part of the product.

Its purpose is not merely to describe the software as it exists today, but to preserve the reasoning behind the software so future development remains consistent with the project’s vision.

Whenever possible, documentation should explain why decisions were made rather than simply what was built.

The implementation will evolve.

The principles should remain remarkably stable.

?

Recommended Reading Order

1. Design Philosophy

File

Architecture/DESIGN_PHILOSOPHY.md

Purpose

Explains why Year Planner exists.

Questions answered

* Why are we building this?
* What problem are we solving?
* What should teachers experience?
* What makes Year Planner different?

This is the foundation of the entire project.

?

2. Guiding Principles

File

Architecture/GUIDING_PRINCIPLES.md

Purpose

Defines the design language used throughout the application.

Questions answered

* How should the interface feel?
* How should information be presented?
* How are design tradeoffs resolved?

This document translates philosophy into practical design rules.

?

3. System Architecture

File

Architecture/ARCHITECTURE.md

Purpose

Describes the overall architecture of the application.

Questions answered

* How is the system organized?
* How do major components interact?
* How does information flow?

?

4. Forecast Architecture

File

Architecture/FORECAST_ARCHITECTURE.md

Purpose

Explains the Forecast page as a decision-support system.

Questions answered

* What are the responsibilities of each Forecast layer?
* How does information progress from raw data to recommendations?
* How should Forecast continue to evolve?

?

5. Forecast Timeline Decisions

File

Architecture/FORECAST_TIMELINE_DECISIONS.md

Purpose

Records the major architectural decisions made while designing the Forecast Timeline.

Questions answered

* Why were certain approaches chosen?
* Which ideas were intentionally rejected?
* What constraints should future contributors respect?

Read this before proposing changes to the Forecast Timeline.

?

6. Forecast Timeline Vision

File

Vision/FORECAST_TIMELINE_VISION.md

Purpose

Describes the long-term vision for the Forecast Timeline.

Questions answered

* Where is the design headed?
* What experience are we trying to create?
* Which architectural ideas remain future work?

This document intentionally looks beyond the current implementation.

?

7. AI Workflow

File

Development/AI_WORKFLOW.md

Purpose

Defines how AI assistants contribute to the project.

Questions answered

* How should proposals be developed?
* What documentation should be consulted first?
* When should implementation begin?
* What should be documented after implementation?

This workflow helps ensure that development remains thoughtful, collaborative, and well documented.

?

Reference Documentation

The Reference folder contains stable technical information used during implementation.

Examples include:

* API Reference
* Sheet Structure
* Component Inventory
* Requirements
* Color Scheme Reference

These documents describe how the system currently works rather than why it works that way.

?

Historical Documentation

The History folder records the evolution of the project.

Examples include:

* Build Log
* Decisions
* Forecast milestones

These documents preserve important context so architectural decisions do not need to be rediscovered.

?

Roadmap

The Roadmap folder tracks planned development.

It answers:

* Where are we now?
* What is currently being developed?
* What comes next?

Roadmaps are planning documents rather than architectural documents.

?

Releases

The Releases folder summarizes completed milestones and significant improvements.

Release notes provide historical snapshots of the project at important points in its evolution.

?

Guiding Rule for Contributors

Before proposing a significant design or architectural change:

1. Read the relevant documentation.
2. Understand why the current design exists.
3. Identify the problem you are trying to solve.
4. Explain the tradeoffs of your proposal.
5. Prefer extending existing principles over introducing new ones.

Every proposal should strengthen the project’s philosophy rather than compete with it.

?

Documentation Hierarchy

The documentation is intentionally organized as a progression from purpose to implementation.

Design Philosophy
        ?
Guiding Principles
        ?
Architecture
        ?
Feature Architecture
        ?
Vision
        ?
Implementation
        ?
Reference
        ?
History

When multiple documents appear relevant, consult the highest document in the hierarchy first.

?

The Goal

Year Planner is a teacher decision-support system.

Every document in this repository exists to preserve that vision while allowing the implementation to continue evolving.

The software will change.

The principles that guide it should not.