Year Planner Architecture

Purpose

Year Planner is a teacher decision-support system for instructional planning.

Its purpose is to help teachers understand the consequences of instructional pacing before those consequences become problems.

Unlike traditional educational software, Year Planner is designed to interpret information rather than simply display it.

?

System Overview

At a high level, Year Planner consists of three layers:

React Frontend
        ?
        ?
Google Apps Script API
        ?
        ?
Google Sheets

Each layer has a distinct responsibility.

?

System Responsibilities

Google Sheets

Google Sheets is the system of record.

It stores:

* school calendars
* courses
* sections
* curriculum units
* lessons
* daily instructional progress
* schedule patterns
* application settings

Google Sheets stores facts.

It does not interpret those facts.

?

Google Apps Script

Apps Script provides the application’s backend API.

Responsibilities include:

* reading spreadsheet data
* validating requests
* writing instructional progress
* exposing planner data as JSON
* insulating the frontend from spreadsheet structure

The API acts as a stable boundary between the user interface and the data model.

?

React Frontend

The frontend is responsible for interpretation.

Responsibilities include:

* application state
* user interaction
* visualization
* forecasting
* instructional recommendations
* decision support

The frontend transforms stored facts into information teachers can act upon.

?

Information Flow

Information always flows in one direction.

Google Sheets
        ?
        ?
Apps Script API
        ?
        ?
React State
        ?
        ?
Interpretation
        ?
        ?
Teacher Decisions

Each layer builds upon the one before it.

?

Application Structure

Year Planner is organized into several major functional areas.

Today

Supports daily instructional navigation.

Primary question:

Am I OK today?

?

Units

Supports medium-term instructional planning.

Primary question:

Am I OK in this unit?

?

Forecast

Supports long-range instructional pacing.

Primary question:

Am I OK this year?

Forecast is a major subsystem with its own architecture, documented separately in:

FORECAST_ARCHITECTURE.md

?

Shared Data Model

The application is built around a common instructional model.

Course
    ?
    ?
Section
    ?
    ?
Unit
    ?
    ?
Lesson
    ?
    ?
Daily Progress

Every feature operates on this same structure.

Forecasts, daily navigation, and unit planning all derive from the same underlying data.

?

Architectural Principles

Several principles guide the entire application.

Separation of Responsibilities

Each layer has one primary responsibility.

Examples include:

* Sheets store facts.
* Apps Script exposes data.
* React interprets data.

Responsibilities should not overlap unnecessarily.

?

Progressive Interpretation

The application should reduce teacher interpretation rather than increase it.

Raw information should become progressively more meaningful as it moves through the system.

Facts become information.

Information becomes understanding.

Understanding supports decisions.

?

Stable Architecture

Core architectural layers should remain stable even as features evolve.

New functionality should be added by extending existing components rather than replacing foundational structures.

Stability improves maintainability and reduces complexity.

?

Shared Components

Whenever possible, reusable logic should be centralized.

Examples include:

* forecasting utilities
* formatting utilities
* date calculations
* instructional progress calculations
* shared UI components

Avoid duplicating business logic across pages.

?

Major Subsystems

Year Planner currently consists of several major subsystems.

* Instructional Navigation
* Unit Planning
* Forecasting
* Projection Engine
* Recommendation Engine
* Calendar Interpretation

Each subsystem has its own documentation where appropriate.

?

Documentation Structure

This document describes the architecture of the entire application.

Subsystem-specific architecture is documented separately.

Examples include:

FORECAST_ARCHITECTURE.md

Architectural decisions are documented separately from architecture itself.

See:

FORECAST_TIMELINE_DECISIONS.md

for the reasoning behind major Forecast design decisions.

?

Future Architecture

The architecture is intended to support future capabilities including:

* scenario planning
* multiple instructional plans
* multi-year planning
* richer forecasting
* additional instructional analytics

These capabilities should extend the existing architecture rather than replace it.

?

Guiding Principle

The architecture exists to support teacher decision making.

Every layer should reduce complexity rather than introduce it.

The best architecture quietly disappears behind the decisions it enables.