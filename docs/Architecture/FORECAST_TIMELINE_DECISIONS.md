Forecast Timeline Decisions

Purpose

This document records the architectural decisions that shaped the Forecast Timeline.

It exists for one reason:

Preserve why decisions were made.

The Forecast Timeline has evolved through many iterations. Most changes were not driven by implementation constraints, but by improving how teachers understand their year with the least possible cognitive effort.

This document prevents previously rejected ideas from being unintentionally reintroduced and serves as institutional memory for future development.

⸻

Design Principles

The timeline follows several principles inherited from the overall design philosophy.

- Calm by default.
- Geometry communicates before color.
- Interpretation is more valuable than raw data.
- Stable layouts reduce cognitive load.
- Information should answer “Am I OK?” with minimal mental effort.

The timeline is primarily an orientation tool, not a decision tool.

⸻

Decision 1 — The Timeline Is an Orientation Layer

Decision

The timeline answers:

Where am I?

It does not answer:

- What should I do?
- How serious is this?
- How can I recover?

Those questions belong in Forecast Cards.

Why

Teachers naturally orient themselves spatially.

A timeline behaves like a map.

Cards behave like a coach.

Those responsibilities remain separate.

Alternatives Considered

- Recommendation-heavy timeline
- Text-first timeline
- Self-contained dashboard timeline

Rejected because they blur the responsibilities between Orientation and Action.

Status

Accepted

⸻

Decision 2 — Geometry Before Color

Decision

Position communicates state before color.

Examples include:

- current position
- expected position
- projected finish
- overflow beyond the school year

Color reinforces meaning but never carries information by itself.

Why

Distance is easier to compare than colors.

Teachers understand “farther behind” immediately when they can see it.

Alternatives Considered

- Color-first status indicators
- Multiple visual encodings carrying the same information

Rejected because geometry is faster and more universally understood.

Status

Accepted

⸻

Decision 3 — Stable Geometry

Decision

Timeline geometry should remain stable.

Rows should not appear, disappear, compress, or rearrange based on data.

Why

Teachers build spatial memory.

Changing geometry increases cognitive load.

Stability is kindness.

Alternatives Considered

- Automatic row collapsing
- Dynamic row compression
- Synchronization-based hiding

Rejected because changing the map forces teachers to continually relearn the interface.

Status

Accepted

⸻

Decision 4 — One Calendar

Decision

All sections share one school-year calendar.

The expected pace line represents today’s planned position.

Every section is interpreted relative to that line.

Why

Sections should always be compared against the plan first.

Agreement between sections is secondary.

Five sections can all be perfectly synchronized and still all be behind.

Alternatives Considered

- Independent timelines
- Marker-only comparisons

Rejected because they weaken comparison against the instructional plan.

Status

Accepted

⸻

Decision 5 — Expected Pace Line Remains

Decision

The expected pace marker is always visible.

It is never hidden because sections appear synchronized.

Why

The expected pace line answers:

Where should we be today?

Without it, synchronization could be mistaken for health.

Alternatives Considered

- Hide the expected pace line when sections agree
- Show it only for struggling sections

Rejected because it removes the primary reference for instructional health.

Status

Accepted

⸻

Decision 6 — Forecast Belongs in Geometry

Decision

Forecasts should become visible directly within the timeline.

Preferred progression:

Current Position

↓

Projected Path

↓

Projected Finish

rather than explaining those relationships entirely in text.

Why

Showing future consequences visually reduces reading.

Geometry communicates more quickly than paragraphs.

Alternatives Considered

- Text-only forecasts
- Cards as the exclusive location for forecasting

Rejected because the future should be visible, not merely described.

Status

Architectural Direction

⸻

Decision 7 — Overflow Represents Reality

Decision

When projected completion extends beyond the school year, the timeline should show it.

Overflow should never distort the primary calendar.

Overflow is capped to preserve readability.

Beyond the cap, the visualization transitions from proportional geometry to symbolic representation.

Why

The common case should never become harder to read because of rare extreme cases.

Alternatives Considered

- Stretch the calendar
- Resize all timelines proportionally
- Hide overflow completely

Rejected because each harms the readability of normal situations.

Status

Architectural Direction

⸻

Decision 8 — Course Structure Is Shared

Decision

Curriculum structure belongs to the course.

Section status belongs to each section.

Future versions may render:

- one shared curriculum timeline per course
- multiple section markers on that shared timeline

rather than duplicating identical curriculum bars.

Why

The curriculum exists once.

Only the sections move through it.

Removing duplicated curriculum emphasizes what actually differs.

Alternatives Considered

- One row per section
- Duplicated curriculum bars

Rejected because they repeat identical information.

Status

Architectural Direction

⸻

Decision 9 — Forecast Cards Own Interpretation

Decision

Timeline:

- Orientation

Cards:

- Explanation
- Recoverability
- Recommendations
- Instructional guidance

The timeline should not become text-heavy.

Why

The timeline answers Where am I?

Cards answer What does it mean?

Keeping those responsibilities separate reduces cognitive load.

Alternatives Considered

- Self-contained timeline
- Text-heavy annotations

Rejected because they overload the orientation layer.

Status

Accepted

⸻

Decision 10 — Color Is Reserved for Severity

Decision

Color communicates instructional urgency.

Color never exists for decoration.

Course identity should be communicated primarily through labels and structure rather than color.

Why

When color has only one responsibility, teachers learn it quickly and trust it.

Alternatives Considered

- Course-colored timelines
- Decorative color usage

Rejected because multiple meanings weaken severity communication.

Status

Accepted

⸻

Decision 11 — Tufte over Dashboard

Decision

The preferred visual language follows the information-design principles of Edward Tufte and later minimalist information designers.

The timeline should maximize data-ink ratio.

Avoid:

- shadows
- decorative boxes
- unnecessary legends
- duplicated labels
- ornamental graphics

Prefer:

- direct labeling
- simple geometry
- meaningful whitespace
- restrained typography

Why

Every visual element should earn its place.

The interface should quietly disappear behind the information.

Alternatives Considered

- Traditional dashboard styling
- Card-heavy visual hierarchy

Rejected because decoration competes with understanding.

Status

Accepted

⸻

Decision 12 — Text Is Expensive

Decision

Whenever geometry can replace words, geometry should win.

Examples:

Instead of

14 days behind

prefer

a visibly later projected finish.

Instead of

Sections diverging

prefer

markers naturally separating.

Why

Teachers read slowly compared to how quickly they perceive shape and position.

Words should confirm what the geometry already communicates.

Alternatives Considered

- Text-first explanations
- Labels describing every state

Rejected because they increase cognitive load.

Status

Accepted

⸻

Decision 13 — Optimize for the Common Case

Decision

The Forecast Timeline is optimized for the experience teachers have most of the time.

Rare extreme situations should not complicate the normal experience.

Examples include:

- overflow capping
- stable geometry
- hiding unnecessary projections
- minimal visual decoration

Why

Most teachers are on pace most of the time.

The interface should feel calm by default and become more expressive only when circumstances genuinely require it.

Alternatives Considered

- Designing primarily for worst-case scenarios
- Allowing rare situations to dictate overall layout

Rejected because exceptional cases should not make everyday use more difficult.

Status

Accepted

⸻

Rejected Approaches

The following ideas have been explored and intentionally rejected.

Timeline Compression

Rejected because changing geometry increases cognitive load.

⸻

Separate Pace Spectrum

Rejected because it introduced a second pacing axis independent of the calendar.

Teachers already have one timeline.

Adding another reduced clarity.

⸻

Heavy Dashboard Styling

Rejected.

The Forecast page is not a reporting dashboard.

⸻

Decorative Severity Graphics

Rejected.

Severity should emerge from position and projection first.

Icons, badges, and decorative elements should remain minimal.

⸻

Open Questions

These architectural questions remain intentionally unresolved.

Shared Course Timelines

Should one course render once with section markers instead of one row per section?

⸻

Projected Trajectories

Should recoverable sections display projected movement from today to projected finish?

⸻

Finish Line Visualization

What is the clearest representation of the last instructional day?

⸻

Overflow Visualization

What is the best representation once projected completion extends beyond the visible school year?

⸻

Marker Design

Should current position, projected position, and projected finish be represented using:

- dots
- lines
- arrows
- another geometric language?

⸻

Finish-Date Labels

When does displaying a projected finish date improve understanding, and when does it imply false precision?

⸻

Future Changes

Architectural decisions recorded in this document should not be changed casually.

New proposals should explain why the existing decision is no longer the best solution rather than simply replacing it.

Institutional memory is part of the architecture.

⸻

Guiding Rule

When two designs communicate the same information:

Choose the one that requires less reading.

If both require equal reading:

Choose the one with simpler geometry.

The Forecast Timeline succeeds when teachers understand the state of the year almost immediately, with words serving only to confirm what the geometry has already communicated.
