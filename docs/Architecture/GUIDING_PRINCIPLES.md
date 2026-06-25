GUIDING_PRINCIPLES.md

Guiding Principles

Purpose

This document defines the visual, cognitive, and interaction principles that guide the design of Year Planner.

Unlike the architecture documents, which describe how the application is organized, these principles describe how the application should feel.

When two designs are technically correct, these principles should determine which one is chosen.

?

The Teacher’s Question

Every feature should help answer one question:

Am I OK?

Teachers rarely open Year Planner to study data.

They open it seeking reassurance, orientation, or guidance.

Every design decision should reduce the effort required to answer that question.

?

Calm by Default

Most teachers are on pace.

Most days require no action.

The interface should communicate that reality.

Warnings should be uncommon.

Urgency should be earned.

A calm interface builds trust.

?

Navigation Before Reporting

Year Planner is not a dashboard.

It is a navigation system.

Dashboards display information.

Navigation systems interpret information.

The goal is not to show everything.

The goal is to help teachers understand where they are and what matters next.

?

Geometry Before Color

Whenever possible, communicate using:

* position
* alignment
* spacing
* length
* proximity
* motion

before introducing color.

Geometry is easier to compare.

Geometry remains understandable for every user.

Color reinforces meaning.

It should rarely create meaning.

?

Position Is Truth

Whenever two designs communicate the same information, prefer the one that communicates through position.

Teachers understand distance faster than numbers.

Examples include:

* current position
* expected position
* projected finish
* remaining runway
* timeline overflow

?

Text Is Expensive

Reading requires effort.

Whenever geometry communicates the same idea:

Remove the sentence.

Instead of:

14 days behind

show a later projected finish.

Instead of:

Sections diverging

show the markers naturally separating.

Words should confirm what the eye already understands.

?

Progressive Disclosure

Reveal information only when it becomes useful.

The application should move naturally through four levels.

1. Reassurance

Am I OK?

2. Orientation

Where am I?

3. Explanation

Why?

4. Recommendation

What should I do?

Do not present every level at once.

?

Interpretation Before Data

Raw numbers rarely answer a teacher’s question.

Interpretation should come first.

Instead of presenting:

* variance
* percentages
* calculations

present:

* meaning
* consequence
* recommendation

The application exists to reduce interpretation, not require it.

?

Stability Builds Confidence

Layouts should remain stable.

The interface should not rearrange itself unnecessarily.

Teachers build spatial memory.

Stable geometry reduces cognitive load.

Changing layouts should represent changing reality, not changing presentation.

?

Every Pixel Earns Its Place

Every visible element should communicate information.

Avoid:

* decorative borders
* unnecessary shadows
* ornamental graphics
* duplicated labels
* redundant indicators

Visual simplicity is not minimalism for its own sake.

It is respect for the teacher’s attention.

?

Direct Labeling

Whenever practical:

label the thing itself.

Avoid forcing users to reference legends.

Examples:

Prefer:

“P6”

next to the marker.

Rather than:

looking up “orange” in a legend.

?

Color Has One Job

Color communicates severity.

It should not simultaneously communicate:

* decoration
* branding
* grouping
* hierarchy

When color appears, it should immediately attract attention because it means something important.

?

Reduce Cognitive Load

Whenever choosing between two designs:

Choose the one requiring fewer mental steps.

Teachers should not need to:

* decode
* translate
* remember
* compare unnecessarily

Recognition is preferable to recall.

?

Information Hierarchy

Information should always appear in this order.

1. Reality

What is happening?

2. Consequence

What does it mean?

3. Recommendation

What should I do?

Never reverse this order.

?

Common Things Should Feel Common

Most sections will be healthy.

Healthy sections should require almost no attention.

Visual emphasis belongs to unusual situations.

The interface should spend most of its visual energy explaining exceptions.

?

Precision Should Match Confidence

Do not imply certainty that does not exist.

As projections become less reliable, communicate them more qualitatively.

Forecasts should remain honest.

Confidence should never be overstated.

?

Build for Scanning

Teachers scan before they read.

The interface should reward scanning.

Reading should deepen understanding, not create it.

A teacher should understand the state of the page within seconds.

?

Design Influences

Year Planner draws inspiration from several complementary design traditions.

Edward Tufte

Maximize the ratio of information to decoration.

Every visual element should earn its place.

?

Stephen Few

Design interfaces that support decisions rather than reporting.

Emphasize interpretation over presentation.

?

Alberto Cairo

Visualizations should explain.

They should never exist merely to impress.

Truthfulness is more valuable than novelty.

?

Navigation Systems

Perhaps the strongest influence on Year Planner is navigation.

Teachers are navigating a school year.

The application should behave like a trusted guide.

It should quietly answer:

* Where am I?
* What should I notice?
* What happens next?

without overwhelming the user.

?

Design Test

Before implementing any feature, ask:

* Does this reduce cognitive load?
* Does this communicate through geometry before words?
* Does this preserve calm?
* Does this make navigation easier?
* Does every visible element earn its place?
* Would removing this make the page easier to understand?

If the answer to the last question is “yes,”

the element probably should not exist.

?

Final Principle

Year Planner succeeds when teachers spend less time interpreting information and more time making good instructional decisions.

The best interface is the one that quietly disappears, leaving only understanding.