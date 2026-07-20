# Lessons Learned

> This document captures durable project knowledge — the kind that should never need re-learning.
>
> It is not sprint history (that's `docs/History/`).
> It is not architecture (that's `docs/Architecture/`).
>
> It is the accumulated judgment behind both: things that surprised us, cost us time, or changed how we think, written down so the next sprint doesn't pay for them twice.

Add an entry whenever something is learned the hard way. Correct or remove an entry the moment it stops being true — stale advice is worse than no advice.

---

## Product Lessons

- Curriculum is not the lesson — Teaching Episodes are the lesson. Curriculum provides source material; imported content must always be additive and must never overwrite teacher-authored work.
- The software should disappear during teaching. Planning happens before class, teaching happens from paper, reflection happens after. The printed lesson — not the screen — is the classroom interface.
- Build for the actual primary user's real classroom practice first (Math 8, Integrated Math 1). Reality comes before generalization.

---

## Workflow Lessons

- A sprint handoff must separate permanent knowledge (PROJECT_CONTEXT.md, Architecture docs) from sprint-specific state. Mixing them causes handoffs to bloat and go stale — link to permanent docs, never restate them.
- Every handoff should be a measurable improvement on the one before it: shorter, clearer, better targeted. A copy-forward is a failed handoff.
- A workflow discovery earns a place in a permanent document only after it's proven; until then it stays sprint-specific so permanent docs don't accumulate one-off notes.

---

## Architecture Lessons

- Applications own perspectives and responsibilities, not features. Units (planned curriculum), Today (enacted curriculum), Forecast (interpretation), and Lesson Planner (delivery) must never duplicate each other's responsibility, even where they share data.
- Supports (learning targets, deliverables, materials) belong at the episode level, not the placement level, so they travel automatically when an episode is bumped, split, merged, or reused.
- Deliverables are first-class shared domain objects with their own lifecycle, not text embedded in a lesson — they get referenced from multiple places and eventually feed a gradebook.

---

## UX Lessons

- Supports render as quiet child lines with a leading glyph inside the same outline the teacher writes in — never as a separate section, header, or bordered box. Authored content always outranks interface furniture.
- Status is communicated through geometry (hollow, filled, half-filled, ghosted), never through color. This keeps the interface calm and avoids relying on color perception.
- Hidden affordances (like a `/` command menu) need a one-time, dismissible hint the first time they're relevant — not a permanent legend or toolbar.

---

## Performance Lessons

- Teachers should never wonder "did my click work?" Add, save, and log actions need an immediate visible response, independent of how long the underlying work takes.
- Disable buttons and show progress during processing — a slow action that looks identical to a broken one erodes trust fast.
- Before chasing a rendering or layout bug in code, verify the surrounding environment first. The "huge whitespace" print bug was Chrome print preview silently scaled to 46%, not CSS — an hour of code review would have found nothing, because nothing in the code was wrong.

---

## Development Process Lessons

- Documentation is part of the product, not an afterthought. Architectural decisions that live only in conversation get relearned, and re-argued, every sprint.
- Small, meaningful commits with descriptive messages ("Add forecast runway visualization") beat large or vague ones ("More fixes"). They're what make review and rollback possible.
- One completed improvement beats five half-finished ones. Protect sprint momentum by choosing a single gap to close and finishing it.

---

## AI Collaboration Lessons

- Ask the AI to improve an existing document rather than append to it. A blind append duplicates ideas the document already contains and drifts from its structure and voice.
- Root-cause analysis is worth more than a speculative fix. AI collaborators are strong at implementation and weak at root-cause analysis — when something seems mysterious, inspect actual code and state before proposing a fix, rather than trusting the first plausible theory.
- Verify architecture before implementation. Confirming the current design early avoids building correctly on top of an assumption that's already wrong.
- One verified change is worth more than several speculative ones. A batch of unverified changes makes it hard to tell which change actually fixed — or broke — anything.
- End every implementation with a clean build and a clean repository state. An unfinished build or a dirty tree is unfinished work, regardless of how much code was written.
- Review the diff before committing. Reading the actual change catches scope creep and unintended edits that a summary of intentions won't.
- When workflow friction repeats, fix the workflow document instead of relying on memory to avoid it next sprint.

---

## Future Improvements

Technical debt intentionally deferred, not forgotten:

- Consolidate workflow documentation into a single authoritative location.
- Remove or archive duplicate workflow/reference documents once confirmed obsolete.
- Clean up legacy encoding (UTF-8) issues in older documentation.
