Major Decisions

This document records the major architectural and design decisions that shaped the Year Planner Suite.

The purpose is to preserve why decisions were made, not merely what was implemented.

Every significant decision should answer three questions:

* What decision was made?
* Why was it made?
* What implications does it create for future development?

?

June 2026

Technology Stack

Decision

Use:

* React
* Vite
* Google Sheets
* Google Apps Script
* Vercel

Reason

This architecture matches the Classroom Timer project, reducing complexity while allowing reuse of existing knowledge and deployment processes.

?

Year Planner Is a Decision-Support Tool

Decision

Year Planner is not a reporting dashboard.

Reason

Dashboards display information and ask teachers to interpret it.

Decision-support tools interpret information and help teachers decide—or confirm that no action is needed.

?

The Organizing Question

Decision

Everything revolves around one question:

Am I OK?

Reason

Teachers are usually asking this question, even when they do not say it explicitly.

Every feature should contribute to answering it.

?

Primary Planning Level

Decision

The primary planning object is the Unit.

Course
   ?
Unit
   ?
Lesson

Reason

Teachers naturally organize instruction around units rather than individual lessons.

The data model and interface should reflect that mental model.

?

Primary View

Decision

The default application view is a timeline.

Secondary view:

* Calendar Grid

Reason

Year Planner exists to understand pacing across a school year.

Timelines reveal instructional movement more naturally than calendars.

?

Initial Courses

Decision

Begin with:

* Math 8
* Integrated Math 1

Reason

These courses provide enough instructional complexity to validate the architecture while remaining manageable during development.

?

Information Order

Decision

Information always appears in this order:

1. Reality
2. Consequence
3. Recommendation

Reason

Warnings without context create anxiety.

Facts create trust.

?

Timeline = Orientation

Decision

The Timeline provides orientation.

Cards provide interpretation.

Reason

Separating responsibilities keeps the interface visually calm and cognitively simple.

?

Drift Is Geometric

Decision

Represent pacing primarily through position rather than emphasizing numerical variance.

Reason

Teachers naturally understand:

Where am I?

before they understand:

How many days off am I?

Geometry communicates more quickly than numbers.

?

One Dot and One Line

Decision

Use:

* Current position = dot
* Expected position = vertical line

Reason

Two dots imply two moving objects.

One object and one reference are easier to understand.

?

Rows Stay

Decision

Period rows remain visible.

Reason

Periods are landmarks.

Stable geometry reduces cognitive load.

?

No Section Compression

Decision

Remove row compression from the roadmap.

Rejected:

* Shared rows
* Dynamic collapsing
* Hidden sections

Reason

Changing geometry creates confusion.

Synchronization should change interpretation—not structure.

?

Breaks Are Terrain

Decision

Integrate school breaks directly into each timeline.

Reason

Breaks are part of the instructional landscape.

Teachers think:

Nothing happens here.

not:

Here is another layer of information.

?

Stability Is Kindness

Decision

Prefer stable structures over clever structures.

Reason

Teachers should not need to relearn the interface.

?

Semantic Colors Are Separate From Course Colors

Decision

Course identity colors and instructional status colors are independent.

Reason

Identity and meaning communicate different information.

?

Red Is Reserved

Decision

Reserve red exclusively for Buffer Exhausted.

Reason

Warnings retain meaning only when they are rare.

?

Progress Uses Area

Decision

Represent progress through filled area whenever possible.

Pattern:

* Light background = planned
* Dark fill = completed

Reason

Area communicates progress more naturally than icons or labels.

?

The Timeline Behaves Like a Map

Decision

Treat the school year as a landscape.

Reason

Maps communicate position almost instantly.

The year stays.

Rows stay.

The teacher moves.

?

Version 1 Scope

Included

* School calendar
* Unit pacing
* Instructional day calculations
* Timeline visualization
* Forecasting
* Buffer calculations

Excluded

* Standards tracking
* Assessments
* Collaboration
* Gradebook features
* LMS functionality

Reason

Prove the planning workflow before expanding scope.

?

The Best Designs Disappear

Decision

Favor simplification over feature accumulation.

Reason

Nearly every significant improvement has resulted from removing complexity rather than adding it.

Examples:

* Two dots ? one dot and one line
* Course grouping
* Elimination of section compression
* Elimination of the break row

Invisible design is successful design.

?

Late June 2026

Teaching Is Resource Stewardship

Decision

Treat teaching as the stewardship of limited instructional resources rather than the execution of a curriculum.

Reason

Teachers continuously invest instructional time, student attention, and learning opportunities.

Planning is fundamentally an investment problem.

Implications

The software should help teachers understand instructional tradeoffs rather than simply display schedules.

?

Instructional Time Is a Budget

Decision

Treat instructional time as a finite budget throughout the suite.

Reason

Variance is not the real problem.

The real question is:

How much instructional freedom remains?

Thinking in budgets better reflects how experienced teachers make instructional decisions.

Implications

Forecast emphasizes remaining flexibility rather than simply reporting days ahead or behind.

?

Awareness Before Advice

Decision

The software creates awareness.

Teachers make decisions.

Reason

Professional judgment belongs to teachers.

Software should reveal reality and consequences without prescribing instructional choices.

Implications

Forecast identifies instructional pressure.

It does not decide how teachers should respond.

?

Applications Own Questions

Decision

Applications own professional questions rather than collections of features.

Reason

Clear ownership prevents feature creep while producing a coherent suite.

Implications

Year Planner, Lesson Planner, Unit Planner, and the Student App each answer different instructional questions.

Information may be shared.

Responsibilities should not.

?

One Instructional Model

Decision

The entire suite shares one instructional model.

Reason

Instructional truth should have one source.

Forecast, Units, Lessons, and Student views should never disagree about the same instructional reality.

Implications

Applications interpret shared information rather than recomputing it independently.

?

Software Amplifies Teacher Expertise

Decision

Software exists to amplify professional expertise rather than replace it.

Reason

Teachers are the experts.

Software removes bookkeeping so teachers can invest more attention in students.

Implications

Every feature should strengthen teacher judgment.

A useful metaphor:

Software is a cape on the superhero.

The cape is not the hero.

?

Applications Follow Instructional Horizons

Decision

Organize the suite around instructional time horizons.

Reason

Teachers simultaneously think across multiple planning horizons.

Implications

* Year Planner — school year awareness
* Unit Planner — instructional investment
* Lesson Planner — today’s teaching
* Student App — student ownership

Each application answers a distinct professional question while sharing the same instructional model.

?

Philosophy Evolves

Decision

Treat the philosophy as a living theory rather than a fixed manifesto.

Reason

The software is discovering better ways to express enduring principles of teaching.

Implications

Architecture documents should evolve thoughtfully as understanding deepens, not simply grow larger over time.