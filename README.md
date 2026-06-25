Year Planner

A decision-support system for curriculum planning and instructional pacing.

Year Planner helps teachers understand the future consequences of today’s instructional decisions before they become tomorrow’s pacing problems.

The application is built around one question:

Am I OK?

Year Planner is not a reporting dashboard.

It is not a gradebook.

It is not a learning management system.

It is a decision-support tool that interprets information and helps teachers understand where they are, whether they should care, and what happens if nothing changes.

?

Design Philosophy

Most teachers are fine most of the time.

The interface should communicate that reality.

Year Planner is designed to reduce teacher cognitive load through calm, truthful, and highly visual communication.

Information always appears in this order:

1. Reality
2. Consequence
3. Recommendation

The application favors:

* Geometry before color.
* Interpretation before reporting.
* Navigation before dashboards.
* Progressive disclosure.
* Stability over novelty.

The goal is simple:

Help teachers spend less time interpreting information and more time making good instructional decisions.

?

Current Capabilities

Today

Supports daily instructional navigation.

Answers:

Am I OK today?

?

Units

Supports medium-term instructional planning.

Answers:

Am I OK in this unit?

?

Forecast

Supports long-range pacing awareness.

Answers:

Am I OK this year?

Forecast combines:

* Year Timeline
* Forecast Cards
* Section-aware pacing
* Buffer calculations
* Projection modeling

to help teachers understand future consequences before they become problems.

?

Technology Stack

Frontend

* React
* Vite

Backend

* Google Apps Script

Data Store

* Google Sheets

Hosting

* Vercel

?

Architecture

React Frontend
        ?
        ?
Google Apps Script API
        ?
        ?
Google Sheets

Google Sheets stores facts.

Year Planner provides interpretation.

?

Documentation

Project documentation lives in the docs/ directory.

Start with:

docs/DOCUMENTATION_GUIDE.md

Recommended reading order:

1. Architecture/DESIGN_PHILOSOPHY.md
2. Architecture/GUIDING_PRINCIPLES.md
3. Architecture/ARCHITECTURE.md
4. Architecture/FORECAST_ARCHITECTURE.md
5. Architecture/FORECAST_TIMELINE_DECISIONS.md
6. Vision/FORECAST_TIMELINE_VISION.md
7. Development/AI_WORKFLOW.md

Additional documentation includes:

* Reference material
* Build history
* Release notes
* Project roadmap

?

Repository Structure

apps-script/
archive/
data/
docs/
frontend/

?

Vision

Year Planner is being developed as a teacher decision-support system rather than a traditional planning application.

Its long-term goal is to compress an entire school year into an interface that can be understood within seconds.

Teachers should be able to open the application, glance at the Forecast page, and immediately understand:

* Where they are.
* Whether they should be concerned.
* What will happen if nothing changes.
* What action, if any, is worth taking.

The interface should quietly disappear, leaving only understanding.

“The best designs disappear.”