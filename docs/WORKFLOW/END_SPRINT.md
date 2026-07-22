# End Sprint

## Verify

- [ ] App behaves correctly
- [ ] npm run build passes

## Design Review

- [ ] Does this reduce cognitive load?
- [ ] Does it answer "Am I OK?" better?
- [ ] Did we accidentally add complexity?

## Architecture Review

- [ ] Can anything be simplified?
- [ ] Did we duplicate logic?
- [ ] Should documentation change?

## Workflow Retrospective

Before writing the handoff, answer:

- [ ] What slowed us down?
- [ ] What repeated work happened?
- [ ] What caused confusion?
- [ ] What documentation was missing?
- [ ] What should become permanent workflow?
- [ ] Did any workflow improvements emerge this sprint (e.g. a better way to sequence architecture review, a reusable prompt pattern)?

For anything that should become permanent, decide where it belongs and make the change now:

- [ ] START_SPRINT.md
- [ ] DEVELOPMENT_WORKFLOW.md
- [ ] END_SPRINT.md
- [ ] LESSONS_LEARNED.md
- [ ] HANDOFF_PROTOCOL.md
- [ ] CLASSROOM_READINESS.md
- [ ] Another permanent document

If a permanent improvement was discovered, update DEVELOPMENT_WORKFLOW.md before completing the sprint — do not leave it recorded only in the handoff.

## Sprint Handoff

- [ ] Write the handoff per HANDOFF_PROTOCOL.md
- [ ] Read it as tomorrow morning would, and ask:
  - Could work begin in under five minutes?
  - Is anything important missing?
  - Would unnecessary questions still arise?
  - Is it clear what NOT to work on?
- [ ] Revise until every answer above is satisfactory

## Implementation Status Review

- [ ] Confirm no work is left at IMPLEMENTED (working tree only) without required verification
- [ ] Confirm BUILT status where a build was required
- [ ] Confirm BROWSER TESTED status where UI was touched
- [ ] Confirm DEPLOYED status where deployment was required
- [ ] Do not mark work COMMITTED or PUSHED until the statuses above are satisfied

## Git

- [ ] git status
- [ ] git add
- [ ] git commit (status: COMMITTED)
- [ ] git push (status: PUSHED)
