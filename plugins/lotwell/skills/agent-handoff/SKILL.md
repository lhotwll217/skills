---
name: lotwell-agent-handoff
description: Handoff drafting and linting. Use before sending work to another agent or session, to draft the brief or to lint one for wording that changes the assignment or steers the receiver.
---

# Agent handoff

A **handoff** carries work from a **sender** to a **receiver** on behalf of a **requester**, usually the sender's own user. Handoffs fail in two ways: the sender's words replace the requester's intent, or the sender's conclusions replace the receiver's judgment.

## Drafting

1. Recover the requester's words: the original request, later corrections, and the governing agreement. Search the session archive when they span sessions. Done when you hold the wording itself, not a summary of it.
2. Fill the fields below. Supply the concrete inputs only you hold: the actual queries, cases, or items the receiver will work on. A category in their place leaves that part of the task undone, because the receiver lacks the context to invent the items.
3. Check the draft against every trigger and fix each finding.
4. Show the requester the exact text before sending. Seeing the exact child task before launch is the only checkpoint that has caught these failures.

The receiver's side of a handoff belongs to the `align` skill.

## Linting

To lint an existing handoff, run Drafting step 1 first, then check the handoff's meaning, whatever its format, against every trigger below. A **finding** has three parts: the wording (quoted, or the omission named), the trigger that fired, and a correction, and it says how that wording changes the work or the receiver's judgment. When a source you need is unavailable, mark the point unverified rather than deciding without it. A sound handoff passes as written; the verdict is then "no findings."

## Fields and triggers

**Goal** and **Completion Conditions** are the minimum. Add the other fields only when their rule says so. Each entry states the field's rule, then the triggers that fire on wording breaking it. Two triggers watch the whole handoff:

- `missing-field`: the work or its completion condition cannot be recovered from the handoff.
- `omitted-requirement`: a requested outcome, a concrete input the receiver needs from the sender, or a still-applicable correction is missing or narrowed. Example: asked to set two research agents real tasks, a brief gave them categories of task; the receivers held none of the sender's context, so the work could not start.

### Goal

The work, standing on its own: from this field alone the receiver can say what they own. Write the assignment itself; its purpose can come from Context, and evidence and history go there.

- `dependent-goal`: reading Goal alone, the receiver cannot say what they own.

### Completion Conditions

What will be true when the work is done, observable to the requester. The what, not the method.

- `prescribed-how`: method fixed, here or in Constraints, where the request fixed only the outcome. Test: does the requester's wording name this method? A method the requester named is theirs to require. Example: "evals must use the existing runner, reporter, and comparison path" pinned the plumbing; the requester's rule was "use the framework's supported patterns, and no bespoke harness code unless you prove and cite that the framework cannot do it," which fixes the outcome and leaves the pattern choice to the receiver.

### Completion Proof

The check that will show the conditions hold: what to run or compare, and against which evidence. Include it whenever such a check exists.

### Constraints

Only rules from the request or a governing agreement, each with its source named beside it. A hard rule states the default. When the requester allows a departure, name the condition that permits it and the evidence that establishes the condition; the burden of proof sits on whoever invokes the exception.

- `invented-rule`: a rule, gate, number, or requirement without such a source. Example: a brief added "run each case three times"; the requester set no repeat count, and the padded run total backed a recommendation the evidence could not support.
- `soft-constraint`: hedged wording ("check X before," "prefer," "consider") where the requester made a hard rule, or an exception that drops its evidence requirement. Example: "check the framework docs before adding a new pattern" permits a glance and a wrapper anyway; the correction restates the rule in the shape above.

### Context

Pointers the receiver can resolve: the original request, the governing agreement, the artifacts. The receiver reads the sources, forms their own reading, and pulls more context across when they find a gap that matters. Include a detail only when leaving it out would change what the receiver owns, what they may decide, or how the result will be used.

- `dead-pointer`: a pointer the receiver cannot resolve: a localhost URL, a scratchpad path on another machine. Correction: the durable identifier, such as the session ID the link was built from.
- `duplicated-source`: the handoff restates content a pointer already covers, so the two copies can drift and agree with each other against the requester. Example: a "settled decisions" section repeating the plan of the issue the handoff had already named as the agreement; the copy had already dropped one of the requester's rules.
- `sender-narration`: background that fails the include-a-detail rule: it tells the receiver how the sender sees the problem, and the handoff reads as a report. Example: "the user is frustrated because the previous agent kept discussing work without running it," and an unrelated, unverified dev-server note carried into an implementation handoff.

### Local authority

The decisions this work needs that nobody has made yet, each named so the receiver raises it: "Back-navigation is still open," never "back-navigation is your call." Everything else inherits the original request's authority, and method choices inside the delegated work stay with the receiver.

- `invented-authority`: a grant ("your call," "you decide," "in scope") or a closed decision that does not trace to the requester's words.

### The receiver's judgment

- `steered-judgment`: the sender's conclusions ride along anywhere in the handoff: hypotheses, expected findings, an outline of the answer, a verdict to confirm. Test: could the receiver return the opposite conclusion, or a different reading of the sources, and still satisfy the handoff? Example: a brief for preserving a session's research listed the full contents of the document to write; filling the sender's outline replaced reading the transcript, and citing the transcript beside each bullet did not save it. Two boundaries: concrete inputs the sender supplies are assignment, not steering, and they leave the finding open; when the sender's own findings matter, hand them over after the independent result, for comparison, rather than before it.
