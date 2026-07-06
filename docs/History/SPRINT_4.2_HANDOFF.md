# Sprint 4.2 — Lesson Planner Foundation
## Start Here
We are beginning **Sprint 4.2 — Lesson Planner Foundation**.
Sprint 4.1a is complete.
Do not restart the architecture debate unless something clearly conflicts with the work ahead.
The goal now is to begin building the teacher’s daily instructional workflow.
The architecture is ready enough.
Now we need to build the part of Year Planner that will matter most when school starts.
---
# Current Status
Repository:
`Year Planner`
Branch:
`main`
Repository state:
**Clean**
Latest commit:
> **Add architectural principles**
All recent changes have been committed and pushed.
---
# Sprint 4.1a Completed Work
Sprint 4.1a was an application architecture refactor sprint.
It is complete.
The purpose was not to add features.
The purpose was to align the implementation with the architecture before building Lesson Planner.
## Commits Completed
```text
9df7624  Establish application shell foundation
cd08a8b  Route workspaces through application shell
dc7a674  Move workspace routing into workspace host
6138fa3  Pass workspace models through workspace host
e30ed14  Move application identity into shell
e217850  Extract today model builder
05c2091  Extract forecast model builder
718516c  Add architectural principles

Architectural Outcome

The application now follows this structure:

App
?
??? Sidebar
?   ??? Time Lens
?   ??? Course
?   ??? Section
?   ??? Timeline / Unit Chips
?
??? ApplicationShell
    ??? Application Identity
    ??? Workspace Navigation
    ??? WorkspaceHost
        ??? Today
        ??? Forecast
        ??? Units
        ??? Teacher Desk

App.jsx is now closer to an application composition root.

It still owns data loading, core state, and some derived planning data.

It no longer owns every workspace rendering decision or every domain model.

?

Key Files After Sprint 4.1a

Application Shell

frontend/src/components/ApplicationShell.jsx

Owns:

* application identity
* application status
* workspace navigation
* workspace host frame

It does not own instructional thinking.

?

Workspace Host

frontend/src/components/WorkspaceHost.jsx

Owns:

* routing between Today, Forecast, Units, and Teacher Desk
* passing workspace models to workspace views

?

Today Model Builder

frontend/src/utils/todayModel.js

Owns:

* Today model construction
* today flow items
* current class item
* today date labels
* today status text

?

Forecast Model Builder

frontend/src/utils/forecastModel.js

Owns:

* section forecasts
* forecast sorting
* timeline sync summaries
* overall forecast message/detail/state
* section timeline helper

YearTimeline.jsx now imports getSectionTimeline from this file instead of from App.jsx.

?

Architectural Principles

docs/Architecture/PRINCIPLES.md

This is now the guiding document for future work.

Use it when judging whether a design or implementation decision belongs.

?

Development Workflow

We have an established workflow. Use it.

Terminal Windows

?? PROJECT

Primary development window.

Use for:

* VS Code
* React development
* architecture inspection
* implementation work
* Copilot Chat

Copilot is used inside VS Code, not from the terminal.

?

?? BUILD

Build verification only.

Usually this window should already be inside:

frontend

If so, run:

npm run build

Do not run cd frontend if the prompt already says frontend.

Keep this window clean.

?

?? GIT

Version control only.

Typical workflow:

git status
git diff --stat
git diff
git add ...
git diff --cached --stat
git commit -m "..."
git push
git status

Do not do development work in this window.

?

Working Method

The workflow that has been working well is:

Design with ChatGPT
?
Give precise implementation prompt to Copilot
?
Review diff with ChatGPT
?
Run build
?
Commit one coherent checkpoint
?
Stop or move deliberately

Do not let Copilot invent architecture.

Copilot is the implementation engineer.

ChatGPT is technical lead, architecture reviewer, and design reviewer.

The user makes final product decisions.

?

Product Direction

Year Planner is an instructional operating system.

It helps a teacher move from long-range planning to confident daily teaching.

The application is not a dashboard.

It is not a generic planner.

It is a teacher decision-support and preparation system.

The major workflow is:

Forecast
?
Units
?
Today
?
Teacher Desk / Lesson Planner
?
Printed Agenda
?
Teach
?
Brief Reflection

The interface should become quieter as the teacher gets closer to teaching.

Teaching itself should happen away from the screen.

The final feeling before teaching should be:

I’ve got this.

?

Workspace Ownership

Application Shell

Answers:

Where am I?

Owns:

* identity
* status
* global navigation
* workspace hosting

Does not own instructional thinking.

?

Forecast

Answers:

Am I OK?

Owns:

* pacing awareness
* projections
* time risk
* recoverability
* forecast interpretation

?

Units

Answers:

Where is this instruction going?

Owns:

* course context
* section context
* unit progression
* instructional timeline
* lesson sequence inside units

?

Today

Answers:

What am I teaching today?

Owns:

* daily operational awareness
* current class sequence
* what is next today
* immediate preparation

?

Teacher Desk / Lesson Planner

Answers:

Am I ready?

Owns:

* lesson preparation
* instructional sequence
* resources
* teacher notes
* agenda
* final rehearsal before teaching

Teacher Desk is not a presentation tool.

It is the teacher’s final thinking space.

?

Important Sprint 4.2 Direction

Sprint 4.2 should not begin with more refactoring.

The next sprint should begin by studying the existing FileMaker lesson planner.

This matters.

The FileMaker database contains years of accumulated instructional workflow knowledge.

Before building the new Lesson Planner, we should identify:

* what the FileMaker solution did well
* what was actually used
* what was ignored
* what workflows became indispensable
* what should be modernized
* what should not be carried forward

Do not accidentally rebuild from scratch when the user already has years of tested practice embedded in FileMaker.

?

Sprint 4.2 Goal

Build the foundation for the Lesson Planner / Teacher Desk workflow.

This sprint should produce the first usable version of the workspace that supports daily teaching preparation.

The goal is not polish.

The goal is a working instructional preparation flow.

?

First Sprint 4.2 Task

Start with a design session:

Review the existing FileMaker Lesson Planner and identify what deserves to survive.

Questions to ask:

1. What screens or views does the FileMaker system have?
2. What information did the user actually rely on while planning?
3. What information was present but rarely used?
4. What did the system help the user remember?
5. What did the system help the user decide?
6. What was frustrating or too slow?
7. What should be improved in Year Planner?
8. What should be intentionally left behind?

Do not code before this review unless the user explicitly decides to skip it.

?

Lesson Planner Architecture Already Settled

The Lesson Planner architecture from previous documents is:

One LessonSession
Two workflows
Planning Mode
?
Teaching Mode

Focus changes.

Layout does not need to become a separate system.

The data model does not need to split.

Planning Mode and Teaching Mode are different emphases of the same lesson session.

?

Teacher Desk Design Stance

Teacher Desk should help the teacher internalize the lesson.

It should support:

* lesson purpose
* activity sequence
* materials
* timing
* teacher moves
* likely misconceptions
* notes
* readiness
* printable agenda

It should not become:

* a student-facing slideshow
* a presentation tool
* a generic notes app
* a cluttered planning dashboard

?

August 1 Readiness Filter

Time is getting more precious.

From now on, judge work by this question:

Does this increase the likelihood that the user will be confidently using Lesson Planner by August 1?

High priority:

* Lesson Planner foundation
* Today ? Teacher Desk integration
* daily teaching workflow
* real curriculum validation
* logging/reflection loop

Lower priority:

* visual polish
* extra shell cleanup
* additional refactors that do not unlock Lesson Planner
* nice-to-have UI improvements

Build in slack.

Do not chase optional cleanup before the daily teaching workflow exists.

?

Current Technical Notes

App.jsx

App.jsx still owns:

* planner data loading
* status
* active view
* selected course/section/unit state
* lesson editing state
* progress input state
* lesson mutation handlers
* selected unit derivation
* units workspace model assembly
* sidebar prop wiring

This is acceptable for now.

Do not continue extracting just because the file is still large.

Extract only when it unlocks Lesson Planner or clarifies ownership.

?

Sidebar

Sidebar currently still owns:

* Time Lens
* Course
* Section
* Timeline / Unit Chips

This is intentional for now.

Do not migrate more Sidebar pieces unless there is a clear architectural reason.

?

Units

Units extraction has not been done yet.

Do not start Units extraction at the beginning of Sprint 4.2 unless it directly supports Lesson Planner.

?

Documentation Notes

There are now many docs.

Do not perform a full documentation cleanup yet.

A full doc review/refactor should happen after the first usable Lesson Planner / Teacher Desk flow exists.

Later doc cleanup should sort documents into:

* Current Architecture
* History / Decisions
* Reference
* Roadmap
* Deprecated / Archive

For now, the docs are still useful thinking artifacts.

?

Relevant Architecture Docs

Review as needed:

docs/Architecture/PRINCIPLES.md
docs/Architecture/APPLICATION_SHELL.md
docs/Architecture/LESSON_PLANNER_WORK_MODES.md
docs/Architecture/LESSON_SESSION.md
docs/Architecture/LESSON_SESSION_IMPLEMENTATION_DECISIONS.md
docs/Architecture/NAMES.md

PRINCIPLES.md should be treated as the high-level guide.

?

Coding Rules Going Forward

Prefer:

* small coherent commits
* preserving behavior
* explicit ownership
* model builders before complex views
* architecture-guided implementation
* user workflow over abstract cleanliness

Avoid:

* mixing redesign and refactor
* adding features during cleanup
* moving code just to reduce file size
* letting Copilot invent product decisions
* polishing UI before Lesson Planner works
* starting multiple architectural changes in one commit

?

Recommended Opening Move In The New Chat

Do not ask “what should we build?”

Start with:

We are beginning Sprint 4.2 — Lesson Planner Foundation.
Sprint 4.1a is complete and the repository is clean.
Before writing code, help me review my existing FileMaker Lesson Planner so we can identify what workflows and structures should carry forward into Year Planner.

Then ask the user to describe or show the FileMaker system.

Suggested first prompt to the user:

Show me the main FileMaker Lesson Planner screen or describe its sections. I want to identify what was actually useful before we design the new Teacher Desk.

?

Sprint 4.2 Success Criteria

By the end of Sprint 4.2, we should have:

* reviewed the FileMaker lesson planner
* identified the core lesson planning workflow
* defined the first LessonSession model
* created the first usable Teacher Desk / Lesson Planner view
* connected it conceptually to Today
* preserved the principle that teaching happens away from the screen

The sprint does not need to produce a polished final UI.

It needs to produce a usable foundation for daily teaching preparation.

?

Final Guiding Principle

The hard work of figuring out what Year Planner is has largely been done.

Now the work is to build the daily teaching workflow without losing the clarity we gained.

Keep the architecture calm.

Keep the workflow teacher-centered.

Build only what helps the user become ready to teach.