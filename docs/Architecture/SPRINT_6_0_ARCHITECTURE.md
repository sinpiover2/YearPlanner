# Sprint 6.0 — Architecture Before Implementation

**Status:** Design document. No code was changed to produce this document,
and none is proposed in it.

**Purpose:** Answer the seven questions Sprint 6.0 must resolve before any
implementation begins, using `WRITE_PATH_INVENTORY.md` and the ratified
architecture documents (`INFORMATION_MODEL.md`, `SUITE_ARCHITECTURE.md`,
`ENACTMENT_MODEL.md`, `TEACHING_EPISODE_MODEL.md`,
`ROSTER_INFORMATION_MODEL.md`) as evidence, then translate the answers into a
prioritized roadmap and a recommended Sprint 6.0 order.

---

## 1. What is Sprint 6.0 actually trying to protect?

Not "the system" in general. Two specific, non-interchangeable things:

**Teacher-authored intent** — the Planned Curriculum (`Lessons`/`Units`) and,
above all, Teaching Episode content: the hours a teacher spends building
episodes, blocks, and deliverables for a specific lesson. This work has no
second copy anywhere. It cannot be reconstructed from a textbook, a
colleague, or last year's plan — once it's gone, it's gone.

**Teacher-authored history** — the record of what actually happened in
class. `ENACTMENT_MODEL.md`'s "Historical Immutability" invariant treats
this as a distinct kind of thing from intent: once recorded, it must not be
silently rewritten, because it is the only record of classroom reality and
every future planning decision (carry-forward, pacing, next year's
estimates) depends on it being true. Protecting this means protecting its
truthfulness, not just its bytes.

There is a third thing Sprint 6.0 protects that is easy to miss: **the
teacher's confidence that a save means saved.** `WRITE_PATH_INVENTORY.md` §1
finding #2 shows the system currently *can* show success while a write
silently fails. Per the suite's own foundational belief
(`SUITE_ARCHITECTURE.md`: "software should reduce bookkeeping, not replace
expertise") the entire value proposition depends on the teacher trusting the
tool enough to stop double-checking it. An instructional-awareness tool a
teacher doesn't trust is worse than no tool, because it adds a step (enter
data) without removing the step it was supposed to replace (remember it
yourself). Sprint 6.0 protects that trust as directly as it protects data.

What Sprint 6.0 is **not** trying to protect: convenience features, AI
capabilities, multi-teacher collaboration, or anything in
`ENACTMENT_MODEL.md`'s own "Deferred" list. Those are addressed in §7 of the
roadmap below, explicitly out of scope here.

---

## 2. What kinds of teacher-authored work exist?

Five distinct kinds, with different owners, different current storage, and
different risk profiles. Conflating them is the root cause of several
findings in `WRITE_PATH_INVENTORY.md` (e.g. the legacy `DailyProgress` "Log"
path standing in for enacted history it was never designed to represent).

| Kind | Examples | Current owner (per docs) | Current storage | Frequency / stakes |
|---|---|---|---|---|
| **Curriculum structure** | Course, Unit, Lesson (title, planned days, key outcome, notes, order) | Units | `Lessons` sheet (canonical) | Low frequency, deliberate, not time-pressured |
| **Teaching Episode content** | Episodes, Blocks, deliverables, estimated durations, curriculum links | *Should be Lesson Planner (`TEACHING_EPISODE_MODEL.md`)* | **localStorage only** | Highest frequency (daily), highest volume, most time-pressured (often authored the night before or minutes before class) |
| **Enacted history** | What was reached / partial / skipped; session notes; episode notes | Lesson Planner, via Post-Class Debrief | **Not implemented** — `DailyProgress` "Log" button is a pre-Enactment-Model stand-in | Not yet real, but architecturally the most safety-critical once it exists (immutability invariant) |
| **Roster / student identity** | Students, SectionEnrollments, RosterSettings | Roster (separate domain, not one of the three Information Model domains) | Sheets, authenticated project (canonical) | Low frequency (start of year, enrollment changes) |
| **Derived / ephemeral** | Forecast, Weekly Communication draft, undo stack, collapsed-outline state, roster sort preference, episode clipboard | N/A — computed or UI-only | Memory / localStorage / sessionStorage | Regenerable or low-stakes by design |

The middle two rows are the ones Sprint 6.0 exists for. Curriculum structure
and roster data are already reasonably well protected (§4 and §7 of
`WRITE_PATH_INVENTORY.md`). Teaching Episode content is the largest
unprotected surface in the system, and enacted history doesn't exist yet in
the form the architecture already specifies for it.

---

## 3. Which data should be canonical in Google Sheets?

"Canonical" means: the one place that is authoritative, survives the loss of
any single device, and everything else must eventually agree with.

- **Courses, Units, Lessons** — already canonical. No change needed.
- **Students, SectionEnrollments, RosterSettings, RosterImport** — already
  canonical, correctly isolated in the authenticated roster project. No
  change needed.
- **Teaching Episode content** — **should become canonical.** This is not
  merely a risk-reduction preference; it is a direct requirement of the
  already-ratified `TEACHING_EPISODE_MODEL.md`. That document defines a
  Teaching Episode as content that "may be reused across sections, dates,
  units, and school years" and is explicitly "portable." Neither claim can
  be true of data that lives in one browser's localStorage: reuse across
  sections requires one canonical object that multiple placements can
  reference, and portability across school years requires surviving beyond
  any single device's storage lifetime. The current implementation cannot
  satisfy its own specification while it remains local-only.
- **Episode Placement, Session Enactment, Placement Enactment** —
  canonical by explicit ratified decision. `ENACTMENT_MODEL.md` asks and
  answers this directly: *"Is Session Enactment a Stored Object? Yes."* and
  calls Placement Enactment "the canonical home of episode-level enacted
  truth." These do not yet exist in code; when built, they must be
  Sheets-backed (or an equivalent durable store), not local-only.
- **`DailyProgress`** — canonical only as a *compatibility projection*
  during migration, never as an independent second source of truth. This is
  already an explicit invariant in `ENACTMENT_MODEL.md`'s "Daily Progress"
  and "Migration Principle" sections, not a new Sprint 6.0 decision — Sprint
  6.0 only needs to implement what those sections already specify.

---

## 4. Which data may remain local?

Two categories, and the distinction between them matters more than the list
itself:

**(a) Genuinely ephemeral or personal-preference state**, with no
instructional truth value and nothing lost if it disappears: the undo/redo
stack, collapsed-outline UI state, roster sort preference (already correctly
`sessionStorage`, per `ROSTER_INFORMATION_MODEL.md`), the episode clipboard,
an unsent Weekly Communication draft. Losing these is an annoyance, not a
loss of work — they should stay local exactly as they are today.

**(b) A local draft/cache layer in front of canonical storage** — not
instead of it. This matters architecturally, not just practically: the
suite's own teaching model (`POST_CLASS_DEBRIEF.md`'s "Whitewater Model") is
explicit that the Rapids phase — the class period itself — must not require
software interaction, and that teachers should be able to compose lessons
without a live network dependency at 9pm at home or on unreliable school
wifi. Local-first *editing* is therefore the right architecture, not a
compromise. The problem `WRITE_PATH_INVENTORY.md` §3 identifies is not that
Lesson Session content is local — it's that local is the *only* copy, with
no reconciliation partner at all.

So the boundary is about **custody, not location**: it is architecturally
correct for the editing surface to be local-first; it is not acceptable for
the local copy to be the sole and permanent custodian of Teaching Episode
content once that content is real. Every write path currently in
`WRITE_PATH_INVENTORY.md` §3 needs to move from *sole-custody-local* to
*cache-in-front-of-canonical* — same editing experience, different
durability guarantee underneath it.

---

## 5. What recovery guarantees should Year Planner provide?

Scoped to what a single-teacher tool built on Sheets/Apps Script (no
database, no server, no accounts beyond Google's own) can actually deliver —
not an aspirational list that overpromises:

1. **No confident data loss.** If a write fails, the teacher must be told.
   This is the cheapest guarantee to provide and the highest-leverage one:
   it converts the worst failure mode (the system lies about success) into
   the most survivable one (the teacher knows to retry or re-enter).
   Directly answers `WRITE_PATH_INVENTORY.md` §1 finding #2.
2. **No silent rewriting of recorded history.** Once a Session Enactment or
   Placement Enactment exists, corrections must be explicit edits, never
   automatic overwrites — this is `ENACTMENT_MODEL.md`'s "Historical
   Immutability" invariant, and any recovery mechanism Sprint 6.0 builds
   (including restoring from a backup) must not violate it by clobbering
   enacted history recorded after the backup's timestamp.
3. **Point-in-time recoverability of canonical data**, via the same
   backup-before-mutate pattern already proven in
   `ProductionDataCleanup.js` (`Spreadsheet.copy()` before any destructive
   operation), generalized beyond that one maintenance script.
4. **Device-independence for anything canonical.** Losing a laptop must
   never lose curriculum, roster, or (once built) enacted history data.
   This guarantee already holds for curriculum and roster; it explicitly
   does not hold for Teaching Episode content today, which is the gap §3–4
   above identify.
5. **Bounded, honest guarantees for local-cache data.** The system should
   sync a local draft to canonical storage automatically and promptly when
   connectivity allows, and should visibly flag when it hasn't — rather than
   silently pretending offline-forever is durable. This is an honest
   guarantee given the platform's constraints, not a promise of real-time
   multi-device sync the architecture can't yet deliver.
6. **No teacher-facing recovery path should require Jeff manually editing
   the spreadsheet.** The current curriculum and `DailyProgress` write paths
   fail this bar today (the only recovery is re-entering data or manual
   Sheets revision-history spelunking); the roster-admin project already
   shows this bar is achievable with modest engineering effort.

---

## 6. What failure scenarios must the architecture survive?

Concrete, not hypothetical — each maps to a real environment constraint
(school wifi, shared Chromebook carts, a teacher switching between a
classroom device and a personal laptop) or a finding already documented in
`WRITE_PATH_INVENTORY.md`.

1. **Network drops mid-write** — closed laptop lid or wifi hiccup between
   passing periods.
2. **A non-network server-side failure** — Apps Script quota exceeded,
   script exception, or a stale row lookup because another request already
   changed the sheet (real today: no `LockService` guards planning writes).
3. **Device or browser storage loss** — dead laptop, Safari ITP eviction,
   private/incognito session, cleared browser data, replacement device. The
   single largest current exposure (`WRITE_PATH_INVENTORY.md` §3, risk #3).
4. **Concurrent edits to the same thing** — two tabs open to the same Lesson
   Session (easy to trigger via the Planning grid), or a teacher moving
   between a classroom Chromebook and a personal laptop mid-day.
5. **A hostile or accidental unauthenticated write** — the planning API is
   currently anonymous and its URL ships in the public bundle
   (`WRITE_PATH_INVENTORY.md` §1, risk #1). The architecture must survive
   this without curriculum loss, independent of any teacher behavior.
6. **A destructive bulk operation gone wrong** — a bug in a future
   reorder/delete-style feature, or a maintenance script run against the
   wrong assumptions. Must be recoverable via backup, to the standard
   `ProductionDataCleanup.js` already sets.
7. **A partially-completed multi-step write** — Apps Script has no true
   cross-sheet transaction. Renumbering `SortOrder` across a unit after a
   delete, or a future write that must touch a Session Enactment and several
   Placement Enactments together, can be interrupted mid-sequence. It must
   fail toward a state that is either harmless or detectably repairable —
   the same deliberate choice `ProductionDataCleanup.js`'s deletion ordering
   already makes.
8. **A correction made after later planning has already consumed the
   original record** — this is `ENACTMENT_MODEL.md`'s own open question
   Q-EN-9. Sprint 6.0 must have *some* defined, conservative answer before
   Session/Placement Enactment ships, or corrections become a data-loss
   vector in their own right.

---

## 7. What implementation phases minimize risk?

The governing rule: **fix what's already live and dangerous before building
new canonical stores, and build canonical stores before building sync or
versioning on top of them.** No phase should depend on a later phase to
provide any protection — each one must reduce risk on its own, even if the
next phase is delayed or never happens.

This section states the categories; the recommended sequencing and its
rationale follow in the final section.

### Security

- Close anonymous write access to `apps-script-planning`. The
  `apps-script-roster-admin` project already proves the pattern (deployed,
  authenticated, restricted to the teacher's own identity) — this is
  applying an existing, working pattern, not inventing a new one.
- Retire or gate the orphaned `moveLesson` action (`Code.js:614`) — unused
  by the shipped frontend, but a live mutation surface until the above is
  in place.

### Write reliability

- Remove `mode: "no-cors"` from `updateLesson`, `deleteLesson`, and
  `saveDailyProgress` so failures are visible and the rollback logic already
  written in `App.jsx` actually fires — bringing three functions in line
  with the pattern `addLesson`/`reorderLessons` already use in the same
  file.
- Add `LockService` around the `Lessons`/`DailyProgress` mutation functions
  in `apps-script-planning`, matching the concurrency guard already standard
  in `apps-script-roster-admin`.
- Replace Lesson Session's `console.warn`-only localStorage failure handling
  with a visible signal.
- Add a lightweight multi-tab conflict guard (a `storage`-event listener) to
  stop silent last-write-wins clobbering of Lesson Session drafts.

### Backup / versioning

- Generalize the backup-before-mutate + revalidate-immediately-before-write
  pattern already proven in `ProductionDataCleanup.js` into a reusable
  safety net for any future bulk or destructive planning operation, rather
  than a one-off maintenance script technique.
- Build the canonical Session Enactment / Placement Enactment store, scoped
  exactly to `ENACTMENT_MODEL.md`'s own "Version 1 Boundary": create/update
  a Session Enactment, record placement outcomes, record a partial stopping
  point, support carried-forward work, support optional Session Notes,
  preserve section independence, and update existing progress consumers
  through the compatibility `DailyProgress` dual-write the same document
  already specifies. This list is already deliberately minimized by the
  architecture doc — Sprint 6.0 does not need to invent scope reduction,
  only implement the reduction that's already been ratified.
- Enforce historical immutability (corrections as explicit edits, never
  silent overwrites) as part of that same build, closing failure scenario 8
  above.

### Cross-device synchronization

- Promote Teaching Episode / Lesson Session content from sole-custody-local
  to cache-in-front-of-canonical, syncing against the store built in the
  Backup/versioning phase.
- Define the conflict story for the same session open on two devices. A
  last-write-wins policy with a visible warning is an acceptable Sprint 6.0
  answer; true structural merge is not required.
- This phase explicitly depends on Write Reliability and Backup/Versioning
  already being solid — synchronizing data to and from an unreliable,
  unguarded backend would just spread the existing silent-failure problem
  across more devices instead of fixing it.

### Future enhancements (explicitly out of scope for Sprint 6.0)

Listed so they are not implicitly promised by this document:

- AI-assisted debrief, photo capture of paper annotations, voice debrief,
  handwriting recognition — already `ENACTMENT_MODEL.md`'s own "Deferred"
  list.
- Full edit/audit history beyond what correction-safety (§6, item 8)
  requires.
- Multi-teacher collaboration or real-time concurrent editing.
- Cross-school-year analytics.
- Roster drop/deactivation — a real, already-tracked gap
  (`CLASSROOM_READINESS.md`), but not a data-loss risk, so it does not
  compete with this sprint's purpose.

---

## Recommended Sprint 6.0 Implementation Order

1. **Security** — close the anonymous write hole; retire the orphaned
   `moveLesson` action.
2. **Write reliability** — fix the three fire-and-forget writes; add
   `LockService` to planning mutations; make local-save failures visible;
   add the multi-tab guard.
3. **Backup / versioning** — generalize the backup-before-mutate pattern;
   build the Version-1-scoped Session Enactment / Placement Enactment store
   with `DailyProgress` compatibility dual-write and immutability
   enforcement.
4. **Cross-device synchronization** — turn Lesson Session localStorage into
   a synced cache against the store built in phase 3.
5. Future enhancements — deferred past Sprint 6.0 entirely.

### Why this order minimizes the risk of losing teacher-created work

**Security has to be first because it is the only scenario on this entire
list that requires no mistake and no bad luck from the teacher at all.** An
outside actor can empty the `Lessons` sheet today, through a hole that
already exists, regardless of anything else Sprint 6.0 ships. Every
subsequent phase is protecting data that phase 1 leaves exposed to being
destroyed by someone who was never a teacher in the first place — fixing
write reliability or adding backups first would be reinforcing a house
whose front door doesn't lock.

**Write reliability comes second because it is the cheapest fix with the
worst current failure mode, and it must be solid before anything is built
on top of it.** "Confident data loss" — the system reporting success on a
write that never happened — is worse than an obvious failure because
nothing prompts the teacher to notice or redo the work. The fix is small
(three functions adopting a pattern two sibling functions already use in
the same file) and self-contained, but its absence would poison every later
phase: there is no point building a canonical Enactment store or a sync
layer on top of write paths that still can't reliably tell the difference
between success and failure.

**Backup/versioning comes third, before cross-device sync, because you
cannot safely synchronize data into a store that doesn't yet protect what's
already there.** Building sync against an unguarded, ungeneralized backend
would replicate phase 2's problem across more devices rather than fixing
it. This phase is also where the architecture's actual missing piece gets
built: `ENACTMENT_MODEL.md` already specifies the Session Enactment /
Placement Enactment model in full, with a deliberately minimized Version 1
scope — building it now serves both Sprint 6.0's risk-reduction goal and
the suite's standing architectural debt at the same time, rather than
trading one against the other.

**Cross-device synchronization comes fourth because it is the
highest-complexity, highest-uncertainty phase, and the risk it addresses
(§3's "total loss of a Lesson Session plan") is better and more cheaply
reduced first by simply giving Teaching Episode content a reliable
server-side copy at all.** Even a deliberate "save to Sheets" action without
seamless background sync would eliminate most of the current exposure.
Full multi-device sync with conflict handling is valuable, but it is not
required to stop the bleeding — so it is sequenced after the phases that
remove the underlying unreliability it would otherwise inherit.

**Future enhancements are excluded from Sprint 6.0 entirely because none of
them reduce data-loss risk.** Building AI debrief assistance or
cross-year analytics before phases 1–4 would spend this sprint's budget on
capability instead of on the trust and durability problems it exists to
fix — the same "favor simplification before adding features" discipline
the project already holds itself to.

This order is not a new judgment call invented for this document — it is
the direct, mechanical consequence of the risk ranking already established
in `WRITE_PATH_INVENTORY.md`'s "Highest-Risk Data-Loss Scenarios," restated
here as a build sequence instead of a severity list.
