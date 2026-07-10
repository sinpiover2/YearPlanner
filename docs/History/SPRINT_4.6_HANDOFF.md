Sprint 4.6 — Lesson Planner Authoring Flow

This sprint begins after completing Sprint 4.5, which marked the transition from designing Lesson Planner to using it to plan real lessons. That transition fundamentally changed how we should develop this workspace.

Lesson Planner is no longer being evaluated as software.

It is now being evaluated as a teacherÕs daily instructional tool.

The objective of Sprint 4.6 is not to add instructional features.

The objective is to make Lesson Planner feel like an instructional outliner that a teacher could comfortably use for an hour of uninterrupted lesson planning.

?

Current Repository Status

Everything completed during Sprint 4.5 has been committed and pushed to main.

Recent commits:

* e8ccd03 — Strengthen lesson planner authoring workflow
* 34a12eb — Document lesson planner authoring workflow

The repository should begin this sprint with a clean working tree.

Always verify first.

?? GIT

git status

Expected:

On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean

Do not continue until the repository state is understood.

?

Development Philosophy

Sprint 4.5 changed how Lesson Planner should evolve.

Previous workflow:

Design ? Build

New workflow:

Teach ? Observe ? Build

Every implementation should now earn its place by removing friction encountered while planning authentic lessons.

Avoid speculative features.

Use real lesson planning to drive architecture.

?

Current Architecture

Review these documents before implementation:

* docs/Architecture/LESSON_PLANNER.md
* docs/Architecture/LESSON_PLANNER_INTERACTION.md
* docs/History/LESSON_PLANNER_DECISIONS.md

The most important architectural principle established during Sprint 4.5:

Lesson Sessions own enactment. Curriculum Lessons own intent.

A Planned Curriculum Lesson belongs to Units.

A Lesson Session begins from curriculum when appropriate but immediately becomes an independent instructional outline.

Teachers must be free to:

* revise
* reorder
* split
* merge
* replace
* omit
* add

instructional actions without changing the curriculum.

Curriculum improvements should always require an explicit, intentional action.

Never silently modify curriculum while planning a Lesson Session.

?

Confirmed Interaction Philosophy

Lesson Planner is:

* a thinking environment
* an instructional notebook
* an instructional outliner

It is not:

* a form
* a database editor
* a lesson-plan template

Important principles now established:

* Instructional actions are the primary object.
* The collapsed outline is the home state.
* Expansion is focused thinking.
* Editing should feel like writing.
* Revision is part of thinking.
* Revision should feel safe.
* Authored content outranks interface furniture.
* Interface chrome appears only when it improves a decision.
* Empty collections remain silent.
* The software should disappear.

A useful test:

Does this feel like writing?

or

Does this feel like operating software?

Always choose writing.

?

Sprint 4.5 Research

Sprint 4.5 introduced an observation-first workflow.

Review:

* docs/History/SPRINT_4.5_NOTES.md
* docs/History/LESSON_PLANNER_AUTHORING_OBSERVATIONS.md

These documents contain observed teacher behavior.

They are research.

They are not automatically architecture.

Important observations already confirmed:

* Teachers first build the lesson.
* Teachers then enrich the lesson.
* Writing precedes categorization.
* Session Items are usually created in order.
* Session Items are frequently inserted later.
* Titles are often revised after notes are written.
* Reordering is common.
* Collapse usually occurs before authoring the next item.
* Deliverables often become apparent while authoring.
* Learning Targets are usually added after instructional actions when writing manually.
* Learning Targets should arrive automatically when importing from Units.
* Imported curriculum becomes a Lesson Session working copy.
* Nesting will eventually be needed.
* Minimal formatting will eventually be useful.
* Trust precedes advanced capability.

Continue using the workflow established during Sprint 4.5:

Observe ? Capture ? Categorize ? Automate ? Review ? Commit

?

Current Lesson Planner Implementation

Primary files:

* frontend/src/components/LessonSessionView.jsx
* frontend/src/App.css

Current capabilities:

* editable instructional actions
* inline editing
* editable ÒWhat happensÓ notes
* editable Learning Targets
* collapsed note preview
* expanding and collapsing Session Items
* adding Session Items
* deleting Session Items
* moving Session Items
* stable Session Item IDs
* local persistence through localStorage
* persistence across navigation
* persistence across browser refresh

The current persistence mechanism is intentionally temporary.

Do not replace it with backend persistence during this sprint.

?

Primary Objective

Make Lesson Planner feel like an outliner.

Every UI improvement should remove friction observed during authentic lesson planning rather than satisfy a speculative feature request.

Not better software.

Better writing.

The current prototype still feels somewhat like a collection of editable cards.

Reduce interface friction.

Increase instructional flow.

?

First Development Slice

Focus on uninterrupted authoring.

Investigate:

Title ? Notes flow

Creating an instructional action should naturally lead into writing what happens.

Possible interactions to explore:

* Enter finishes the title and begins notes.
* Tab advances naturally.
* Escape exits or collapses the current action.
* Command+Enter creates the next instructional action.

Prototype lightly.

Test through authentic lesson planning.

Do not document keyboard shortcuts as architecture.

?

One Active Thought

Teachers usually think deeply about one instructional action at a time.

As attention moves:

* the previous action should quietly recede
* authored content should remain readable
* unrelated controls should disappear into the background

Do not create separate editing modes.

The transition between reading and writing should remain almost invisible.

?

Rapid Action Creation

Adding another instructional action should feel like continuing an outline.

The teacher should be able to:

* create an action
* write its title
* write notes
* continue immediately to the next thought

The existing Ò+ Next Teaching StepÓ proves the concept.

It is probably not the final interaction.

?

Revision

Reordering is now confirmed to be normal planning behavior.

Current buttons are acceptable prototypes.

Long-term possibilities include:

* drag and drop
* keyboard movement
* reorder handles
* insertion affordances

Do not prematurely optimize.

The principle matters more than the mechanism.

?

Visual Flattening

Explore making the Lesson Planner feel less like stacked cards.

Questions to investigate:

* Are borders too heavy?
* Are containers too dominant?
* Are controls visible before they are useful?
* Does expansion feel like the same thought becoming richer?
* Does the outline read continuously?

Remember:

Remove software before removing instructional information.

?

Explicitly Out of Scope

Do not begin Sprint 4.6 by implementing:

* curriculum import
* Deliverable editing
* due dates
* Teacher Moves editing
* Evidence editing
* Materials
* Reflection
* curriculum publishing
* nested actions
* automatic curriculum synchronization
* backend persistence
* broad rich-text editing

These are important.

They should follow after writing itself feels natural.

?

Architecture To Protect

Curriculum Import

Future workflow:

Planned Curriculum Lesson
        ?
Copy into Lesson Session
        ?
Independent instructional outline

Imported curriculum should include things like:

* lesson title
* Learning Targets
* suggested instructional outline
* materials where appropriate

After import:

The teacher owns the Lesson Session.

Curriculum remains unchanged.

Curriculum improvement will eventually occur through a separate publish workflow.

?

Enrichment Follows Structure

Confirmed authoring sequence:

1. Create instructional actions.
2. Write what happens.
3. Build lesson flow.
4. Review and reorder.
5. Revise titles.
6. Add or import Learning Targets.
7. Mark Deliverables.
8. Add Teacher Moves.
9. Add Evidence.
10. Teach.
11. Reflect.
12. Optionally publish improvements back to curriculum.

The planner should support this sequence.

Never require metadata before instructional flow exists.

?

Deliverables

Deliverables are first-class instructional objects.

Observed behavior:

* often identified while authoring
* sometimes identified later
* occasionally removed

Eventually they should become an easy property of an instructional action.

Possible future due-date choices:

* blank
* Next class
* explicit date

The correct default remains unresolved.

Test through use rather than deciding prematurely.

?

Hierarchy

The teacher expects to indent instructional actions.

This is more than formatting.

It likely implies a future hierarchical information model.

Do not implement hierarchy casually.

It deserves architectural design.

?

Minimal Formatting

Eventually support:

* bold
* italic
* underline

Formatting exists to support instructional emphasis.

Lesson Planner should never become a general-purpose word processor.

?

Documentation Workflow

The project now has three documentation layers.

Architecture

Defines enduring truths.

Examples:

* LESSON_PLANNER.md
* LESSON_PLANNER_INTERACTION.md

?

Decisions

Defines resolved implementation or architectural decisions.

Example:

* LESSON_PLANNER_DECISIONS.md

?

Research

Defines observed behavior.

Examples:

* SPRINT_4.5_NOTES.md
* LESSON_PLANNER_AUTHORING_OBSERVATIONS.md

Not every observation becomes architecture.

Harvest discoveries.

Categorize them.

Promote only what has been earned.

?

Automation First

Continue minimizing manual work.

Preferred workflow:

Inspect

?

Generate one idempotent Python script

?

Run in ?? PROJECT

?

Review

?

Commit

Use Python whenever practical for:

* documentation updates
* repetitive JSX
* CSS cleanup
* repeated edits
* file generation
* section replacement

?

Terminal Workflow

Continue using the established workflow.

?? PROJECT

Purpose:

* inspect
* edit
* Python scripts
* grep
* sed
* cat
* find
* documentation

No git.

No npm.

?

?? DEV SERVER

Purpose:

npm run dev

Leave running.

Restart only when necessary.

Do not touch it unnecessarily.

?

?? BUILD

Purpose:

npm run build

Run after implementation changes.

Run before committing.

?

?? GIT

Purpose only:

git status
git add
git commit
git push

No editing.

No npm.

?

Development Discipline

Before editing:

* inspect related files
* inspect CSS
* inspect architecture
* understand existing behavior

Implementation serves architecture.

Architecture does not emerge accidentally from implementation.

Keep implementation slices focused.

Each slice should answer one question.

Examples:

* Does title-to-notes flow feel natural?
* Can a teacher create multiple actions without reaching for the mouse?
* Does collapse support attention?
* Do controls disappear appropriately?

After every slice:

1. Plan a real lesson.
2. Observe.
3. Record discoveries.
4. Categorize them.
5. Build only what has been earned.

?

Initial Authoring Exercise

Continue using:

Amplify Math 8 — 1.3 Creating Multistep Transformations

or another real lesson.

Author:

Welcome
Launch
Explore
Partner Work
Discussion
Synthesis
Exit Ticket

Write.

Collapse.

Continue.

Return.

Revise.

Reorder.

Observe:

* clicks
* keyboard flow
* interruption
* collapse behavior
* revision
* reading rhythm
* software awareness

The software should disappear.

?

Success Criteria

Sprint 4.6 succeeds when:

* writing feels continuous
* revision feels effortless
* collapse matches attention
* controls stay quiet
* persistence remains trustworthy
* Lesson Planner reads like an outline
* the teacher forgets about the interface
* curriculum remains protected
* architecture remains clean

The strongest success test:

A teacher plans an entire lesson and spends almost all of their attention on teaching rather than on Lesson Planner.

?

End-of-Sprint Workflow

1. Verify repository state.
2. Run production build.
3. Test persistence.
4. Harvest observations.
5. Update research.
6. Promote only earned architecture.
7. Update decisions.
8. Generate the next sprint handoff directly into docs/History/SPRINT_4.7_HANDOFF.md.
9. Review the handoff from the perspective of the next sprint.
10. Commit.
11. Push.

The handoff should continue to be generated as a project document rather than copied through chat.

?

Guiding Sentences

Protect these throughout Sprint 4.6.

Lesson Sessions own enactment. Curriculum Lessons own intent.

Teachers first build the lesson. Then they enrich the lesson.

Structure precedes metadata.

Lesson Planner is a trusted instructional notebook.

Revision is part of thinking.

The collapsed outline is the home state.

Editing should feel like writing.

Remove software before removing information.

The teacher should think about the lesson, not the interface.
