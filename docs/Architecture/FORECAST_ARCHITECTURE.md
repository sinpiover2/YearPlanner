Forecast Architecture

Purpose

The Forecast subsystem is the long-range decision-support engine of Year Planner.

Its purpose is not to display pacing data.

Its purpose is to help teachers understand the future consequences of today’s instructional pacing before those consequences become problems.

The underlying question remains:

Am I OK?

Most of the time, the answer should be:

Yes.

The Forecast subsystem should communicate that reassurance clearly while drawing attention only when meaningful action is warranted.

?

Mental Model

The Forecast subsystem is organized around progressive disclosure.

Information is revealed in layers rather than all at once.

Each layer answers a different question.

Reassurance
?
Orientation
?
Explanation
?
Action

The interface should move teachers naturally from understanding to decision making.

?

Information Order

Within every layer, information follows the same progression.

Reality
?
Consequence
?
Recommendation

The system should interpret information rather than merely display it.

?

Forecast Page Structure

The Forecast page currently consists of three major layers.

Forecast Banner
?
Year Timeline
?
Forecast Cards

Each layer has a distinct responsibility.

?

Layer Responsibilities

Forecast Banner

Purpose:

Provide reassurance and establish emotional tone.

Answers:

Should I care?

Responsibilities:

* summarize overall pacing
* communicate overall instructional health
* reassure when no action is needed
* direct attention when necessary

The Banner is the emotional entry point to the Forecast page.

?

Year Timeline

Purpose:

Provide orientation.

Answers:

Where am I?

Responsibilities:

* display curriculum progression
* provide calendar context
* compare expected and actual progress
* show projected movement through the year
* communicate relationships through geometry

The Timeline behaves like a map.

It explains position.

It does not make recommendations.

?

Forecast Cards

Purpose:

Provide explanation and support action.

Answers:

* Why?
* What happens if nothing changes?
* What should I do?

Responsibilities:

* explain pacing conditions
* interpret projected outcomes
* communicate recoverability
* recommend instructional actions

Cards transform orientation into understanding.

?

Mental Model of the Timeline

The Timeline behaves like a map.

The school year is the terrain.

Courses define the roads through that terrain.

Sections move along those roads.

Teachers understand position before they understand numbers.

The Timeline therefore communicates primarily through geometry rather than text.

?

Forecast Pipeline

Forecast information moves through several stages.

Instructional Data
?
Forecast Calculations
?
Projection Engine
?
forecastCardUtils.js
?
Forecast Summaries
?
Forecast Components
?
Teacher Decisions

Each stage adds interpretation.

The system intentionally moves from facts toward understanding.

?

Forecast States

Every section is classified into one of four instructional states.

Buffer Exhausted
?
Needs Attention
?
Monitoring
?
On Track

Severity governs default visibility.

It does not determine whether information exists.

?

Projection Model

The Forecast subsystem projects future instructional outcomes based on current pacing.

Projection answers:

If nothing changes, what happens?

Current outputs include:

* projected finish
* projected instructional variance
* recoverability
* remaining instructional flexibility

The projection model is intended to support teacher planning rather than prediction for its own sake.

?

Buffer Model

Variance alone does not determine instructional health.

The Forecast subsystem evaluates pacing relative to the remaining instructional flexibility available within the curriculum.

Buffer therefore represents the practical capacity to absorb instructional variance.

This produces recommendations that are more meaningful than variance alone.

?

Visibility Philosophy

Not every section deserves equal attention.

Visibility is determined by instructional importance.

Buffer Exhausted
Always visible
?
Needs Attention
Visible
?
Monitoring
Visible
?
On Track
Collapsed into reassurance

Low-severity information is folded rather than removed.

Teachers should spend their attention where it is most valuable.

?

Design Principles

Several principles guide every Forecast feature.

* Calm by default.
* Geometry before color.
* Position before numbers.
* Interpretation before reporting.
* Progressive disclosure.
* Stable layouts.
* Minimal reading.
* Color reserved for instructional severity.
* The common case should remain the easiest to understand.
* Prediction is communicated primarily through spatial position. Text exists to confirm and explain what the geometry already communicates.

?

Relationship to Other Documents

This document describes how the Forecast subsystem is organized.

Supporting documents include:

* DESIGN_PHILOSOPHY.md — why the application exists.
* GUIDING_PRINCIPLES.md — recurring design principles.
* FORECAST_TIMELINE_DECISIONS.md — why major architectural decisions were made.
* FORECAST_TIMELINE_VISION.md — the long-term direction of the Forecast experience.

Together, these documents describe the philosophy, architecture, evolution, and future of the Forecast subsystem.

?

Guiding Principle

The Forecast subsystem succeeds when teachers can open the page, glance at it for only a few seconds, and confidently understand:

* Where they are.
* Whether they should be concerned.
* What will happen if nothing changes.
* Whether any action is worth taking.

The interface should quietly disappear behind that understanding.