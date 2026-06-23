# Build Log

This document records major milestones and discoveries.

Its purpose is to preserve how the project evolved.

---
# 2026-06-20

## Repository Consolidation

Moved Git repository root from:

```text
frontend/.git
--
# 2026-06-07

## Project Creation

Established architecture:

- React + Vite frontend
- Google Sheets data store
- Google Apps Script API layer
- Vercel hosting

Reason:

Reuse the successful architecture from Classroom Timer.

Initial goal:

Build a planning system capable of:

- Tracking instructional days
- Forecasting pacing
- Visualizing curriculum timelines
- Showing future consequences

---

# 2026-06-08

## Curriculum Foundations

Created:

- Math 8 course structure
- Integrated Math 1 course structure

Established:

- Courses table
- Units table
- Initial Google Sheets backend

Successfully connected:

```text
Google Sheets
    ?
Apps Script
    ?
React
```

Verified:

- Live course loading
- Live unit loading
- Dynamic instructional day calculations

---

# 2026-06-10

## Lesson-Level Planning

Added:

- KeyOutcome
- Description
- PrimaryLink
- TeacherNotes

Implemented:

- DailyProgress table
- Progress logging
- Lesson completion tracking

Added:

- Current Status cards
- Forecast Preview cards
- Unit Detail view
- Lesson-level variance calculations

---

## Major Insight

Year Planner should help teachers see around corners, not tell them how to drive.

---

## Design Discovery

Year Planner is not primarily a pacing tool.

It is a teacher cognitive-support tool.

Guiding question:

> Does this reduce teacher cognitive load?

---

# 2026-06-12

## Navigation Redesign

Replaced dashboard-oriented design with navigation-oriented design.

Implemented:

- Persistent sidebar
- Course navigation cards
- Unit navigation chips
- Today / Units / Forecast views

---

## Curriculum Authoring

Implemented:

- Add Lesson
- Edit Lesson
- Delete Lesson

Created:

- addLesson() endpoint
- Update endpoint
- Delete endpoint

---

## Major Bug Fixed

Problem:

Lesson creation depended on spreadsheet column order.

Solution:

Header-based column mapping.

Result:

Spreadsheet column order no longer matters.

---

## Major Insight

Teachers experience curriculum planning as a navigation problem, not a reporting problem.

The application should feel like:

- GPS
- Trail map
- Navigation system

Not:

- Spreadsheet
- Reporting dashboard

---

# 2026-06-14

## Forecast Foundations (v0.8)

Implemented:

- Section-aware pacing
- Buffer calculations
- Recoverability states

Deferred:

- Gantt chart
- Week grid

Reason:

Validate usefulness before increasing visual complexity.

---

# 2026-06-16

## Forecast Refinement (v0.9)

Implemented:

- Threshold calibration
- Empty states
- Banner messaging
- Card ordering
- Calm defaults

---

## Major Discovery

Most teachers are fine most of the time.

Warnings should be rare.

---

# 2026-06-18

## Timeline Foundations

Implemented:

- Year Outlook
- Unit timeline bars
- Month axis
- Optional buffer regions
- Course grouping
- Synchronization summaries

---

## Major Discovery

The timeline behaves like a map.

Rows stay.

The year stays.

The teacher moves.

---

## Major Discovery

Drift is geometric.

Teachers understand position better than numbers.

---

# 2026-06-19

## Drift Geometry

Implemented:

- Black current-position marker
- Expected pace line

Removed:

- Second position marker

---

## Major Discovery

One dot and one line are easier to understand than two dots.

---

# 2026-06-20

## Timeline Compression Reconsidered

Explored:

- Section compression
- Shared rows
- Dynamic collapsing

Decision:

Remove compression from the roadmap.

Reason:

Changing geometry increases cognitive load.

Synchronization should affect interpretation, not structure.

---

## Major Discovery

Stability is kindness.

---

## Timeline Integration Begins

Goals:

- Integrate breaks into tracks
- Remove separate break row
- Add dark progress fills
- Move toward squared track geometry

---

## Major Discovery

Breaks are terrain, not decorations.

---

## Ongoing Theme

The most important improvements have come from removing things rather than adding them.

Invisible design is successful design.

## Sprint 2.2c Ñ Timeline Refinement and Refactoring

Completed:

- Refactored planner calculations into utility functions.
- Eliminated duplicated inline calculations.
- Built and verified with Vite.
- Added section divergence summaries.
- Added year axis (AugÐMay).
- Added winter and spring break overlays.
- Added expected pace marker.
- Added current position marker.
- Added buffer segment styling.
- Improved visual contrast of completed portions of units.
- Reduced visual clutter and simplified spacing.
- Moved current-position marker below the bars for readability.
- Verified production builds after each change.
- Adopted GitHub Copilot workflow.

Result:

Timeline now provides context rather than serving as the primary decision layer. Cards below the timeline remain the place where teachers make decisions.

---

# 2026-06-23

## Sprint 2.3c Ñ Recommendation Engine Completed

Implemented:

- Unit-aware recommendation engine.
- Recommendation metadata in forecasts.
- Projection-aware forecast messaging.
- Improved recommendation specificity using remaining optional days.
- Removed redundant Forecast subtitle.
- Removed redundant Pacing Summary heading.
- Simplified Forecast information hierarchy.

Result:

Forecast cards now explain consequences and recommended actions rather than simply reporting pacing variance.

---

## Sprint 2.4 Ñ Forecast Projection

### 2.4a Ñ Projection State

Implemented:

- projectionState field in section forecasts.
- Initial projection categories:
  - Fits
  - Recoverable
  - At Risk
  - Unlikely To Fit

Result:

Forecasts can now distinguish current status from future outlook.

---

### 2.4b Ñ Projection Visibility

Implemented:

- Projection state displayed directly on Forecast Cards.

Result:

Teachers can see both present conditions and projected outcomes.

---

### 2.4c Ñ Projection-Aware Recoverability

Implemented:

- Recoverability messaging driven by projection state.
- Monitoring cards remain calm.
- Needs Attention cards communicate risk appropriately.
- Removed contradictory language between projection and recoverability.
- Removed misleading "Course complete" fallback.
- Hidden Current Lesson line when no active lesson exists.

Result:

Forecast cards now follow the intended information sequence:

Reality ? Consequence ? Recoverability ? Recommendation

and present a coherent answer to:

> Am I OK?

---

## Major Discovery

Current status and future projection are different concepts.

Teachers need both.

Current pacing answers:

> Where am I?

Projection answers:

> What happens if nothing changes?

Both are required for effective decision support.