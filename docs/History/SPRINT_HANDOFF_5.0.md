Sprint 5.0 — Version 1 Gap Closure

?

READ FIRST

Sprint 5.0 begins the final execution phase before August 1.

Do not begin by inventing features.

Do not reopen broad architecture.

Do not continue the philosophy interview unless real implementation work exposes a contradiction.

Read these documents in this order:

1. docs/Development/AUGUST_1_FLIGHT_PLAN.md
2. docs/Development/AUGUST_1_GAP_ANALYSIS.md
3. docs/Development/VERSION_1_SCOPE.md
4. docs/Development/SPRINT_EXECUTION.md
5. docs/Development/VERSION_1_TASK_BOARD.md
6. docs/Architecture/PRODUCT_PHILOSOPHY.md
7. docs/Philosophy/COGNITIVE_JIGS.md
8. docs/Philosophy/DECISION_FILTER.md
9. docs/Philosophy/TEACHING_WORKFLOW.md
10. docs/Architecture/WORKSPACE_PRINCIPLES.md
11. docs/Architecture/LESSON_PLANNER_INTERACTION.md
12. docs/Architecture/LESSON_PLANNER_INFORMATION_MODEL.md

The first five documents govern execution through August 1.

The remaining documents provide constraints and context. They should not distract from closing Version 1 gaps.

?

Repository State at Handoff

Branch:

main

Latest completed commit:

51755e1  Add episode clipboard and product philosophy

That commit included:

* Episode clipboard work in LessonSessionView.jsx
* docs/Architecture/PRODUCT_PHILOSOPHY.md
* docs/Philosophy/COGNITIVE_JIGS.md
* docs/Philosophy/DECISION_FILTER.md
* docs/Philosophy/TEACHING_WORKFLOW.md
* docs/History/SPRINT_HANDOFF_4.9.md

The obsolete untracked copy of SPRINT_HANDOFF_4.8.md was removed.

At the end of the last verified Git session:

On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean

After that verification, the following Sprint 5.0 governance documents were created locally:

docs/Development/AUGUST_1_FLIGHT_PLAN.md
docs/Development/AUGUST_1_GAP_ANALYSIS.md
docs/Development/VERSION_1_SCOPE.md
docs/Development/SPRINT_EXECUTION.md
docs/Development/VERSION_1_TASK_BOARD.md

They may still be untracked when Sprint 5.0 begins.

Do not assume repository state. Verify it first.

?

Current Product State

The application currently has:

* React + Vite frontend
* Google Sheets Apps Script backend
* Application Shell
* Today workspace
* Planning workspace
* Units workspace
* Forecast workspace
* Lesson Session workspace
* Planning ? Lesson Session navigation
* Lesson Sessions persisted independently
* Curriculum lessons attachable to Teaching Episodes
* Lesson-plan copying between sections
* Individual Teaching Episode copy/paste between Lesson Sessions
* Local lesson-session persistence
* Undo/redo
* Expand/collapse behavior
* Teaching Episode durations
* Episode clipboard functionality
* Passing production builds

The current Lesson Session implementation lives primarily in:

frontend/src/components/LessonSessionView.jsx

The application is no longer missing its basic structure.

Sprint 5.0 is about identifying and closing the practical gaps that would still send Jeff back to FileMaker.

?

August 1 Mission

Can Year Planner replace FileMaker as Jeff’s trusted daily teaching workspace?

Version 1 succeeds when Jeff can:

* Plan an instructional week.
* Prepare tomorrow’s lessons.
* Author and revise lesson sessions.
* Print the lesson plans.
* Teach from the printed lesson and clipboard.
* Return the next day prepared.
* Keep FileMaker closed.

Success is not measured by feature count.

Success is not measured by architectural sophistication.

Success is measured by whether the daily teaching workflow is dependable enough to use when school begins.

?

Product Priority Order

Version 1 must address these layers in order:

Manage Teaching
      ?
Support Teaching
      ?
Develop Teachers

Before August 1, Manage Teaching comes first.

The pragmatic workflow must work or the product will not be used.

AI reflection, insight capture, pattern detection, and teacher-development features remain important, but they are not Version 1 requirements.

?

Primary Product Objective

Year Planner should help Jeff become:

1. Calmer
2. More organized
3. More effective

The scarce resource is teacher energy.

The intended chain is:

Preserved Energy
      ?
Available Attention
      ?
Better Thinking
      ?
Better Teaching Decisions
      ?
Better Student Learning

Saving time is useful only when it preserves energy for teaching, students, or worthwhile professional learning.

?

Central Version 1 Workflow

Before Teaching

The software is active.

The teacher should be able to:

* Understand pacing.
* Plan the week.
* Compose lesson sessions.
* Prepare materials.
* Print.
* Internalize the lesson.

The goal is to get the lesson into the teacher’s head.

?

During Teaching

The lesson is live.

The software should be absent.

The teacher:

* Observes.
* Listens.
* Responds.
* Adapts.
* Makes professional judgments.

The printed lesson and clipboard become the live system.

The clipboard holds quick marks and retrieval cues.

There is no time for digital interaction.

?

After Teaching

The software may return.

For Version 1, the required after-teaching job is pragmatic:

* Know what happened enough to remain oriented.
* Close necessary loops.
* Prepare for tomorrow.
* Leave school without carrying avoidable anxiety.

The richer reflection and AI workflow is protected future work.

?

Whitewater Model

The whitewater metaphor accurately describes teaching and should constrain product decisions.

Above the Rapid

Scout.

Study.

Choose a line.

Prepare.

This is forecasting, planning, authoring, and printing.

In the Rapid

Read the water.

Respond to what is happening.

Make live decisions.

This is teaching.

The software does not belong here.

In the Safe Eddy

Recover.

Reconstruct.

Consider what happened.

Prepare for what comes next.

This is where future reflection support may belong.

The software prepares the teacher for the live moment, gets out of the way, and returns afterward.

?

Forecast’s Practical Purpose

Forecast is not merely a pacing tracker.

Forecast should help answer:

Can I afford to spend more time here?

Strong pacing clarity creates instructional freedom.

It helps the teacher judge whether to:

* Spend more time on an idea.
* Move on.
* Pursue a teachable moment.
* Save an idea for later.
* Recover time elsewhere.

Forecast provides context for professional judgment.

It must never replace professional judgment.

?

Sprint 5.0 Objective

Turn the August documents into an evidence-based implementation sequence, then close the highest-risk Version 1 gap.

Sprint 5.0 is not another broad design sprint.

It has two connected jobs:

1. Audit the current application against the August 1 Flight Plan.
2. Implement and verify the highest-priority gap that could still force Jeff back to FileMaker.

The Gap Analysis and Task Board currently contain placeholders and hypotheses.

They must now be filled using the actual application.

Do not rank gaps from memory alone.

Use the running product.

?

Sprint 5.0 Success Test

At the end of the sprint:

* The current application has been walked through as a real teaching workspace.
* AUGUST_1_GAP_ANALYSIS.md reflects observed reality.
* VERSION_1_TASK_BOARD.md contains a ranked, actionable backlog.
* The top gap has been closed or materially reduced.
* The build passes.
* The working tree is clean.
* There is one fewer reason to open FileMaker.

?

Scope Discipline

Before doing any task, ask:

1. Does this reduce the likelihood that Jeff opens FileMaker?
2. Does this improve a specific moment in the daily teaching workflow?
3. Does this preserve teacher energy?
4. Is it required before August 1?

If the answer is no, record it and defer it.

Do not let interesting ideas interrupt the active gap.

?

Explicitly Deferred Until After Version 1

Do not begin implementation of:

* AI reflection
* Voice narration pipeline
* Mobile narration capture
* Insight Inbox
* AI lesson reconstruction
* Cross-lesson pattern detection
* Teaching-principle detection
* Teacher coaching
* Cross-year analytics
* Teacher-development dashboards
* Automated curriculum revision
* Wearable capture workflows

These ideas are protected, not abandoned.

Architecture should avoid blocking them, but Sprint 5.0 should not build them.

?

Terminal Workflow

Always use the established four-terminal workflow.

?? PROJECT

Use for:

* Reading files
* Searching the repository
* Editing files
* Applying patches
* Inspecting project structure
* Running focused development commands that are not the dev server, build, or Git

Start from the repository root unless a command explicitly says otherwise.

?

?? DEV

Use only for the local Vite development server.

From:

cd frontend
npm run dev

Leave it running.

Do not repeatedly stop and restart it unless required.

?

?? BUILD

Use only for production build verification.

From:

cd frontend
npm run build

Every meaningful implementation slice ends with a passing build.

Do not continue past a failed build.

?

?? GIT

Use only for source control.

Typical commands:

git status
git diff
git add ...
git commit -m "..."
git push
git status

Keep Git work isolated from development work.

Do not combine unrelated files into a commit.

Do not commit until the build passes and the user-visible workflow has been checked.

?

Workflow for Giving Jeff Commands

Minimize manual tedium.

When Jeff needs to run commands:

* Name the correct colored terminal.
* Give one complete copy-and-paste command block.
* Avoid unnecessary cd commands when the terminal is already in the correct location.
* Group related commands safely.
* Do not make Jeff manually reconstruct filenames or command sequences.
* Use targeted file lists for git add.
* Never mix speculative commands with required commands.
* Wait for output before assuming success.

When using heredocs, be especially careful that the opening command, content, and closing delimiter are complete and easy to paste.

?

First Hour Plan

1. Verify Repository State

In ?? GIT:

git status

Expected possibility:

The five new docs/Development/ files may appear as untracked.

Do not delete them.

Confirm their exact paths.

?

2. Read the Execution Documents

In ?? PROJECT, read:

docs/Development/AUGUST_1_FLIGHT_PLAN.md
docs/Development/AUGUST_1_GAP_ANALYSIS.md
docs/Development/VERSION_1_SCOPE.md
docs/Development/SPRINT_EXECUTION.md
docs/Development/VERSION_1_TASK_BOARD.md

Then review the relevant product and workflow documents.

Do not rewrite them unless an actual contradiction or missing operational requirement is found.

?

3. Start the Application

In ?? DEV:

cd frontend
npm run dev

Open the current application.

?

4. Establish a Clean Build Baseline

In ?? BUILD:

cd frontend
npm run build

Record whether the baseline passes before making changes.

?

5. Conduct the Version 1 Workflow Audit

Use the running product to simulate these moments:

Weekly Planning

Can Jeff:

* See the week clearly?
* Understand pacing?
* See upcoming units and lessons?
* Open the correct Lesson Session?
* Move between arranging and composing without confusion?
* Prepare a full week without FileMaker?

Lesson Authoring

Can Jeff:

* Build a realistic lesson?
* Add and revise Teaching Episodes?
* Attach curriculum context?
* Add durations?
* Add materials and deliverables where needed?
* Reuse or copy content without tedious rebuilding?
* Leave and return without losing work?

Morning Preparation

Can Jeff:

* Open the app and know whether he is OK?
* Find today’s sessions immediately?
* Print today’s lessons in under one minute?
* See only concerns that truly deserve attention?

Printed Teaching Workflow

Does the printed output:

* Read clearly?
* Show the episode sequence?
* Show durations?
* Show needed details?
* Leave room for handwritten retrieval cues?
* Work naturally on a clipboard?
* Avoid unnecessary screen-oriented controls and clutter?

End-of-Day Readiness

Can Jeff:

* Understand what remains unfinished?
* Know what must happen before leaving?
* Know whether tomorrow is ready?

The Version 1 requirement is pragmatic closure, not a full reflection system.

?

6. Update the Gap Analysis

For every section in:

docs/Development/AUGUST_1_GAP_ANALYSIS.md

mark the actual state:

* Complete
* Nearly Complete
* Missing

Add short evidence-based notes.

Do not fill the file with broad speculation.

Record observable gaps.

?

7. Audit FileMaker

Ask Jeff about the FileMaker database when the comparison becomes necessary.

Do not guess what FileMaker provided.

The purpose of the audit is to identify:

* Functions still used
* Information still stored there
* Workflows that remain faster there
* Habits Year Planner must replace
* Capabilities that are obsolete and need not be reproduced

Use simple multiple-choice or yes/no questions when possible.

Ask one concrete question at a time.

?

8. Rank the Gaps

Rank by:

Likelihood that this gap would cause Jeff to open FileMaker.

Do not rank primarily by:

* Ease
* Novelty
* Architectural interest
* Amount of code
* Visual attractiveness

Update:

docs/Development/VERSION_1_TASK_BOARD.md

The top of the board should show the actual next implementation target.

?

9. Close Gap #1

Once the top gap is supported by evidence:

* Define the narrow acceptance test.
* Inspect only the relevant code.
* Implement the smallest complete solution.
* Test it in the running product.
* Run the production build.
* Update the Gap Analysis and Task Board.
* Commit only the verified slice.

?

Likely High-Risk Areas

These are hypotheses to investigate, not predetermined sprint commitments.

Printing

Printing is likely one of the highest-risk Version 1 gaps because the printed lesson is the live teaching document.

Check:

* Whether a print action exists
* Whether print output is intentionally designed
* Whether navigation and editing controls disappear
* Whether page breaks are sensible
* Whether the type is readable
* Whether durations and episode hierarchy remain clear
* Whether materials and deliverables are shown appropriately
* Whether there is space for handwritten notes
* Whether different sections print correctly

Do not assume “the browser can print” is sufficient.

?

Real Lesson Authoring

The current Lesson Session has promising episode interactions, but it must be tested against a full authentic lesson.

Check whether the current structure supports actual teacher thinking rather than only UI demonstration.

Avoid adding broad categories just because they are conventional.

?

Weekly Planning

Planning currently supports a week board, navigation, session tiles, Unit Shelf, and opening Lesson Sessions.

Test whether the full weekly workflow is trustworthy enough to replace FileMaker.

The distinction remains:

Planning = Arrange
Lesson Session = Compose

Do not move composition into Planning.

Do not add scheduling mechanics to Lesson Session unless required.

?

Morning Confidence

Today should answer:

1. Am I OK?
2. What must happen before students arrive?

Test whether the current Today workspace does this quickly and calmly.

Do not turn Today into a dashboard full of information.

Silence remains a feature.

?

Data Trust

Confirm that:

* Schedule data is correct
* Course/section context is correct
* Lesson Sessions persist
* Curriculum attachments persist
* Copied content behaves predictably
* Forecast information is reliable
* The UI does not imply data is saved when it is not

Trust failures are more dangerous than missing polish.

?

Interaction and Question Style

Jeff prefers:

* One concrete question at a time
* Multiple-choice or yes/no answers when possible
* Minimal abstract question lists
* Clear translation from teaching reality to software
* Small, verifiable implementation slices
* Little manual terminal tedium

Do not ask broad batches of architecture questions.

Do not make him choose between technical approaches he should not have to evaluate.

Ask about teaching behavior and desired outcomes.

Translate those answers into implementation decisions.

?

Response Discipline

Do not repeatedly summarize the philosophy.

Use it.

Keep the conversation moving toward the active Version 1 gap.

When Jeff has a concrete action to perform, end with:

Next Action (Jeff)

Provide one clear action.

When no action is needed:

Next Action (Jeff)

None.

Do not manufacture a user action when the assistant can complete the work.

?

Implementation Discipline

One Major Goal

Each implementation session should have one primary outcome.

Examples:

* Produce a clipboard-ready print layout.
* Complete Planning ? Lesson Session ? Planning navigation.
* Make Today answer “Am I OK?” in five seconds.
* Remove one remaining FileMaker dependency.

Do not combine multiple major goals into one slice.

?

Minimal Refactoring

Avoid unrelated cleanup.

Refactor only when needed to close the active gap safely.

Protect the August timeline.

?

Preserve Existing Work

Before replacing behavior:

* Inspect the current implementation.
* Understand persistence and migration behavior.
* Preserve working interactions.
* Avoid broad rewrites of LessonSessionView.jsx unless clearly justified.

?

Verify User Experience

A passing build is necessary but not sufficient.

The actual workflow must be tested in the browser.

Ask:

Would this make Jeff glad Year Planner is there on a real school morning?

?

Definition of Done for Each Gap

A gap is closed only when:

1. The workflow works in the running application.
2. The user experience is simpler or more trustworthy.
3. Existing behavior has not regressed.
4. The production build passes.
5. Relevant documentation is updated.
6. The task board reflects the new state.
7. The Git commit is focused.
8. The working tree is clean after push.

?

Git Protocol

Before committing:

In ?? BUILD:

cd frontend
npm run build

After the build passes, in ?? GIT:

git status
git diff

Stage only the intended files.

Use a concise commit message describing the completed workflow improvement.

Then:

git push
git status

The final expected state is:

On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean

?

Documentation Protocol

Do not create more governance documents during Sprint 5.0 unless genuinely necessary.

The current management stack is sufficient:

PRODUCT_PHILOSOPHY.md         Why
AUGUST_1_FLIGHT_PLAN.md       Destination
AUGUST_1_GAP_ANALYSIS.md      Remaining gaps
VERSION_1_SCOPE.md            Boundaries
SPRINT_EXECUTION.md           Working method
VERSION_1_TASK_BOARD.md       Active backlog

Implementation should update these documents rather than produce parallel versions.

At the end of the sprint, write one improved handoff document for the next sprint.

Review this handoff first and improve the next one based on what reduced or increased startup friction.

?

Important Discoveries from Sprint 4.9

Technology Follows Cognition

We are solving a teaching problem with technology.

We are not applying technology to teaching because the technology exists.

The interface should emerge from the cognitive process.

?

Manage Before Develop

Year Planner may eventually help teachers grow more quickly.

Before it earns that role, it must reliably manage daily teaching.

A workspace that is not used cannot improve teaching.

?

Remove the Wrong Friction

Remove friction from:

* Remembering
* Finding
* Organizing
* Re-entering
* Tracking
* Routine coordination

Preserve useful friction in:

* Observing
* Reflecting
* Deciding
* Revising
* Learning

The goal is not zero friction.

The goal is the right friction.

?

AI Should Cultivate Teacher Thinking

AI may:

* Summarize
* Organize
* Remember
* Detect patterns
* Offer suggestions

The teacher should:

* Interpret
* Judge
* Decide
* Learn

Automatically accepting pedagogical changes would reduce teacher learning.

This matters later, but it is not a Version 1 implementation target.

?

The Clipboard Has Already Won

During teaching:

* The clipboard is immediate.
* Paper carries almost no attention cost.
* Quick marks act as retrieval cues.
* Digital interaction would compete with students.

Do not try to replace the clipboard before August.

Design the printed lesson to work with it.

?

Teaching Is Live

The purpose of planning is not to produce a document.

The purpose is to internalize the lesson enough that the teacher can forget the plan and live in the moment with students.

Version 1 should prepare the teacher well enough that the software becomes unnecessary during instruction.

?

Not Yet List

Protect these ideas for later:

* Reflection Jig: Tell ? Confirm ? Learn ? Improve ? Preserve
* Insight capture: Notice ? Capture ? Incubate ? Integrate
* Professional learning: Collect ? Detect ? Synthesize ? Decide
* Insight Inbox
* First Safe Eddy narration
* AI triage of teaching insights
* Pending lesson improvements
* Draft/publish lesson revision
* Cross-lesson teaching principles
* Voice and wearable capture

Do not let them enter Sprint 5.0 unless required to prevent an architectural dead end.

?

First Concrete Question for Sprint 5.0

After the initial repository and product review, ask:

If school started Monday, what is the first task you would still open FileMaker to complete?

Use the answer to verify the highest-priority gap.

Do not assume the answer is printing, even though printing is a strong candidate.

?

Sprint 5.0 Finish Line

Sprint 5.0 is complete when:

* The new August governance documents are committed.
* The application has been audited against a real teaching workflow.
* The Gap Analysis is evidence-based rather than blank.
* The Task Board is ranked.
* At least one critical Version 1 gap is closed.
* The build passes.
* The repository is clean.
* The next sprint can begin immediately from a clear top-priority gap.

?

Start Here

1. Run git status.
2. Read the five Development documents.
3. Run the baseline build.
4. Open the application.
5. Simulate the real weekly and daily workflow.
6. Fill the Gap Analysis with evidence.
7. Identify the first remaining FileMaker dependency.
8. Close that gap.