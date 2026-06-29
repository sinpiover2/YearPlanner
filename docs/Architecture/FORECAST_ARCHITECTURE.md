Forecast Architecture

?

Purpose

The Forecast subsystem is the long-range instructional awareness engine of Year Planner.

Its purpose is not to report pacing.

Its purpose is to help teachers understand how today’s instructional investments affect tomorrow’s instructional freedom.

Forecast does not make instructional decisions.

It reveals reality, explains implications, and leaves professional judgment to the teacher.

The underlying question is:

How is my instructional time budget changing across the year?

Most of the time, the answer should reassure rather than alarm.

?

Architectural Role

Within the Year Planner Suite, Forecast owns long-horizon awareness.

It helps teachers understand:

* where they are,
* how much instructional flexibility remains,
* and what future consequences are emerging.

Forecast creates awareness.

Other applications support planning and execution.

?

Mental Model

Forecast is organized around progressive disclosure.

Information is revealed in layers rather than all at once.

Each layer answers a different professional question.

Reassurance
        ?
Orientation
        ?
Explanation
        ?
Teacher Decision

The system intentionally stops before making instructional choices.

Awareness belongs to the software.

Judgment belongs to the teacher.

?

Information Order

Within every layer, information follows the same progression.

Reality
      ?
Implications
      ?
Teacher Decision

Forecast never begins with an alert.

It begins with what is true.

Interpretation grows from reality rather than replacing it.

?

Forecast Page Structure

The Forecast page currently consists of three primary layers.

Forecast Banner
        ?
Year Timeline
        ?
Forecast Cards

Each layer answers a distinct question.

Together they move teachers from awareness to understanding.

?

Layer Responsibilities

Forecast Banner

Purpose

Establish overall awareness and emotional tone.

Answers

Should I be paying attention?

Responsibilities

* summarize overall instructional health
* reassure when normal variation exists
* identify when meaningful constraints are emerging
* direct attention toward sections that deserve it

The Banner should be calm.

Most visits should end here.

?

Year Timeline

Purpose

Provide orientation.

Answers

Where is my instructional time being invested?

Responsibilities

* display curriculum progression
* show instructional position within the year
* compare planned and actual progress
* visualize projected movement
* communicate relationships through geometry
* connect pacing with instructional purpose

The Timeline behaves like a map.

It explains position.

It does not prescribe action.

?

Forecast Cards

Purpose

Explain implications.

Answers

* Why?
* What happens if nothing changes?
* How much flexibility remains?

Responsibilities

* interpret pacing conditions
* explain projected outcomes
* communicate remaining instructional freedom
* identify where future pressure exists

Forecast Cards intentionally stop before making instructional decisions.

They reveal pressure.

Teachers determine how to respond.

?

Timeline Mental Model

The Timeline behaves like a map.

The school year is the landscape.

Courses define instructional pathways.

Sections move through those pathways.

Teachers understand position before they understand numbers.

Geometry therefore carries the primary meaning.

Text exists to explain what the visualization already communicates.

?

Forecast Pipeline

Forecast information flows through successive layers of interpretation.

Instructional Data
        ?
Pacing Engine
        ?
Forecast Calculations
        ?
Projection Engine
        ?
Interpretation Layer
        ?
Forecast Components
        ?
Teacher Awareness
        ?
Teacher Judgment

Each stage increases understanding without replacing professional decision-making.

?

Forecast States

Each instructional section exists in one of four awareness states.

Buffer Exhausted
        ?
Needs Attention
        ?
Monitoring
        ?
On Track

Severity governs visibility.

It does not determine whether information exists.

The purpose of these states is awareness—not classification.

?

Projection Model

Forecast asks a single planning question.

If nothing changes, what happens?

Current projections include:

* projected completion
* projected variance
* remaining instructional flexibility
* recoverability

Forecast is not predicting the future.

It is helping teachers understand the likely consequences of current instructional investments.

?

Budget Awareness

Instructional time is treated as a finite budget.

Variance alone is not meaningful.

Forecast evaluates variance within the context of remaining instructional flexibility.

This shifts the conversation from:

“How far behind am I?”

to:

“How much freedom do I still have?”

That question better reflects the decisions teachers actually make.

?

Visibility Philosophy

Not every instructional situation deserves equal attention.

Visibility is determined by instructional significance.

Buffer Exhausted
Always Visible
        ?
Needs Attention
Visible
        ?
Monitoring
Visible
        ?
On Track
Collapsed into reassurance

Low-priority information is folded rather than hidden.

Teacher attention should be reserved for situations where additional awareness creates value.

?

Design Principles

Every Forecast feature should support these principles.

* Calm before urgency.
* Reality before interpretation.
* Geometry before text.
* Position before numbers.
* Awareness before advice.
* Progressive disclosure.
* Stable layouts.
* Minimal cognitive load.
* Color communicates instructional significance, not decoration.
* Every visual element should return more understanding than the attention it requires.

?

Relationship to the Suite

Forecast owns one professional question.

How is my instructional time budget changing across the year?

It intentionally does not answer:

* How should I teach this lesson?
* How should I redesign this unit?
* Which instructional strategy should I choose?

Those questions belong elsewhere within the suite.

Applications own questions—not features.

?

Relationship to Other Documents

This document describes the architecture of the Forecast subsystem.

Related documents include:

* FIRST_PRINCIPLES.md — foundational beliefs of the suite
* DESIGN_PHILOSOPHY.md — enduring design philosophy
* SUITE_ARCHITECTURE.md — responsibilities and boundaries across applications
* FORECAST_TIMELINE_DECISIONS.md — major architectural decisions
* FORECAST_TIMELINE_VISION.md — long-term direction for Forecast

Together these documents describe why Forecast exists, how it is organized, and how it fits within the larger instructional awareness system.

?

Guiding Principle

Forecast succeeds when teachers can open the page, spend only a few seconds with it, and confidently understand:

* Where is my instructional time being invested?
* How much flexibility remains?
* What happens if nothing changes?
* Do I need to think about this now?

The software should then quietly step aside.

The goal is not to make decisions for teachers.

The goal is to return more of their attention to teaching.