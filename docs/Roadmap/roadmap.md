# Year Planner Suite Roadmap

This roadmap tracks both the evolution of the software and the evolution of its underlying philosophy.

The Year Planner Suite is a **teacher decision-support system**.

Its purpose is to reduce unnecessary cognitive work while helping teachers make better instructional decisions.

As the suite evolves, every new feature should strengthen that purpose rather than expand beyond it.

---

# Product Philosophy

The suite is organized around instructional horizons.

Each workspace answers one teacher question.

| Workspace | Teacher Question |
|-----------|------------------|
| Forecast | Am I OK? |
| Units | Where am I in the curriculum? |
| Today | What am I teaching today? |
| Lesson Planner | How do I teach this lesson well? |

Together these workspaces move the teacher naturally from long-term awareness into classroom instruction.

---

# Phase 0 Ñ Foundations ?

Established the philosophy that guides the entire product.

Completed:

- Teacher decision support
- Instructional awareness vision
- Awareness before Advice
- Instructional time as a finite budget
- The Two Clocks mental model
- Calm interface philosophy
- Architecture before features

---

# Phase 1 Ñ Forecast Foundations ?

Built the instructional awareness engine.

Completed:

- Forecast engine
- Buffer calculations
- Section-aware forecasting
- Forecast pipeline
- Recoverability model
- Forecast states
- Forecast interpretation layer

---

# Phase 2 Ñ Forecast Workspace ?

Transformed Forecast into a complete decision-support workspace.

## Sprint 2.0 Ñ Forecast Foundations ?

- Forecast architecture
- Forecast banner
- Core forecasting calculations

---

## Sprint 2.1 Ñ Year Outlook ?

- High-level pacing summary
- Buffer awareness
- Section overview

---

## Sprint 2.2 Ñ Timeline Orientation ?

- Calendar timeline
- Unit visualization
- Expected pace markers
- School break visualization
- Timeline refinement

---

## Sprint 2.3 Ñ Forecast Cards ?

- Card architecture
- Calm instructional language
- Interpretive recommendations
- Projection language

---

## Sprint 2.4 Ñ Forecast Projection ?

- Projection state
- Projection visibility
- Recoverability refinement
- Finish forecasting

---

## Sprint 2.5 Ñ Forecast Polish ?

- Visual refinement
- Summary improvements
- Readability
- Language refinement

---

## Sprint 2.6 Ñ Instructional Context ?

- Interactive Year Timeline
- Selected Unit panel
- Unit purpose
- Main learning outcomes
- Improved instructional hierarchy

Forecast is now considered the first production-quality workspace.

---

# Phase 3 Ñ Units Workspace ?

Established curriculum navigation as the second major workspace.

## Sprint 3.0 Ñ Units Foundations ?

- Curriculum navigation
- Course switching
- Unit selection
- Lesson organization
- Progress tracking

---

## Sprint 3.1 Ñ Units Experience ?

- Unit purpose
- Main learning outcomes
- Lesson editing
- Progress summaries
- Projected dates
- Curriculum state indicators
- Workspace refinement
- Visual polish

Units now answers:

> **Where am I in the curriculum?**

---

# Phase 4 Ñ Today + Lesson Planner Architecture ?

Current architectural focus has been completed.

Purpose:

Create the operational workflow that bridges planning and classroom instruction.

## Sprint 4.0 Ñ Today Architecture ?

Completed:

- Today workspace architecture
- Workspace principles
- Information hierarchy
- Operational workflow
- Status philosophy
- Start Lesson workflow
- Lesson Planner boundary
- Today architecture documentation

This establishes the workflow:

Forecast

?

Today

?

Lesson Planner

?

Today

?

Forecast

---

# Phase 5 Ñ Today Workspace Implementation

**Current Phase**

## Sprint 4.1 Ñ Today Layout Refactor

Objectives:

- Replace the current Units-derived Today page
- Implement new information hierarchy
- Build Hero area
- Build Today's Flow
- Build Before Tomorrow
- Establish Start Lesson entry point

---

## Sprint 4.2 Ñ Hero Card

Objectives:

- Dynamic next lesson
- Countdown
- Course / section awareness
- Primary Start Lesson action

---

## Sprint 4.3 Ñ Today's Flow

Objectives:

- Chronological daily flow
- Completed / Current / Upcoming states
- Daily schedule awareness

---

## Sprint 4.4 Ñ Status Layer

Objectives:

- Dynamic status sentence
- Morning readiness
- Schedule awareness
- Gentle instructional guidance

---

## Sprint 4.5 Ñ Before Tomorrow

Objectives:

- Outstanding reflections
- Logging reminders
- Quiet attention model

---

## Sprint 4.6 Ñ Start Lesson Workflow

Objectives:

- Transition into Lesson Planner
- Automatic lesson selection
- Preserve instructional context

---

# Phase 6 Ñ Lesson Planner

Purpose:

Create the primary instructional workspace.

Teacher question:

> **How do I teach this lesson well?**

Initial objectives:

- Lesson architecture
- Teaching workflow
- Materials
- Teacher notes
- Reflection
- Lesson completion workflow

Lesson Planner will become the primary workspace used during instruction.

---

# Phase 7 Ñ Data Model Expansion

Objectives:

- Richer lesson metadata
- Resource management
- Assessment support
- Historical reflections
- Multi-year instructional memory

---

# Phase 8 Ñ Scenario Intelligence

Objectives:

- What-If planning
- Alternative pacing scenarios
- Instructional tradeoff analysis
- AI-assisted planning

The emphasis remains decision support rather than decision replacement.

---

# Future Applications

## Student App

Purpose:

Help students understand and take ownership of their learning.

Primary question:

> **What am I responsible for learning?**

---

# Documentation Roadmap

Documentation evolves alongside implementation.

## Architecture

Completed:

- FIRST_PRINCIPLES.md
- DESIGN_PHILOSOPHY.md
- WORKSPACE_PRINCIPLES.md
- SUITE_ARCHITECTURE.md
- FORECAST_ARCHITECTURE.md
- TODAY_ARCHITECTURE.md

Planned:

- LESSON_PLANNER_ARCHITECTURE.md
- STUDENT_APP_ARCHITECTURE.md

---

## Reference

Maintain:

- SYSTEM_INVENTORY.md
- API_REFERENCE.md
- SHEET_STRUCTURE.md
- REQUIREMENTS.md

Reference documents describe reality.

Architecture documents describe intent.

Both should remain synchronized.

---

## Decision History

Maintain an ongoing architectural decision log.

Every major architectural decision should record:

- the decision
- the reasoning
- the implications

This preserves institutional knowledge as the project grows.

---

# Long-Term Vision

The Year Planner Suite is a unified instructional awareness system.

It progressively narrows a teacher's focus.

Forecast

?

Units

?

Today

?

Lesson Planner

Each workspace prepares the teacher for the next.

The software should remember state so teachers don't have to.

It should reduce uncertainty before asking the teacher to act.

It should always leave the teacher feeling more prepared than when they opened it.

---

# Success

Success will not be measured by the number of features.

It will be measured by whether teachers:

- think less about managing instruction
- think more about students
- feel prepared before they teach
- trust the software to remember what matters

Every feature should strengthen that outcome.

If it does not, it should not be built.