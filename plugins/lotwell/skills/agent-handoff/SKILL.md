---
name: agent-handoff
description: Draft work for another agent or lint a proposed handoff against the original request.
---

# Handoff

A **handoff** carries work from a **sender** to a **receiver** on behalf of a **requester**, usually the sender's own user.

## Drafting

1. Recover the requester's words: the original request, later corrections, and the governing agreement. Search the session archive when they span sessions. Keep the speaker and the order of decisions. Trace an agreement to the words that settled it. An answer to one question settles only that question.
2. Draft the handoff with headings and bullets. When a plan already lives in an issue or spec, give the receiver its purpose and a pointer to the plan. When the requester asks the sender to choose inputs, supply actual items the receiver can use. A category alone leaves that work undone.
3. Check the draft against every trigger and fix each finding.
4. Show the requester the exact text before sending.

When receiving a handoff, use [align](../align/SKILL.md) to check your understanding with the sender.

## Linting

Compare the recipient's actual assignment with the original request and the decisions in force when the handoff was written. Flag a defect when the source shows how it changes the work or the receiver’s judgment. Apply the triggers to meaning across the whole handoff, regardless of headings. A finding names the trigger, quotes the offending line (or the omitted requirement), and gives the smallest correction. If the source needed to decide is unavailable, mark the point unverified. Return **no findings** when no trigger fires.

## Fields and triggers

Intent and Completion Conditions are the minimum. Add Constraints and Context where relevant.

- `missing-field`: the work or its completion condition cannot be recovered from the handoff.
- `omitted-requirement`: a requested outcome, required input, or still-applicable correction is missing or narrowed. If the sender was asked to supply a concrete use case, can the receiver actually perform it?

### Intent

State the work and why it matters.

- `dependent-intent`: reading Intent alone, the receiver cannot say what they own or why it matters.

### Completion Conditions

Describe the result the requester can use or the decision the evidence can support.

- `prescribed-how`: the handoff makes one method mandatory where the requester or governing agreement left the choice to the receiver. Honor an explicitly required tool or method. When the requester chose a framework but left the pattern open, carry that boundary through.

### Completion Proof

The check that will show the conditions hold: what to run or compare, and against which evidence. Include it whenever such a check exists.

### Constraints

Carry forward rules established by the request or governing agreement. Keep the source recoverable. A hard rule states the default. When the requester allows a departure, name the condition that permits it and the evidence that establishes the condition; the burden of proof sits on whoever invokes the exception.

- `invented-rule`: the sender turns an ungrounded suggestion, number, or preference into a requirement. A concrete input the requester asked the sender to choose belongs in the assignment.
- `soft-constraint`: a binding rule or its exception becomes discretionary. If an exception requires evidence, a suggestion to consult the docs loses that requirement.

### Context

Pointers the receiver can resolve: the original request, the governing agreement, the artifacts. The receiver reads the sources, forms their own reading, and pulls more context across when they find a gap that matters. Include a detail only when leaving it out would change what the receiver owns, what they may decide, or how the result will be used.

- `dead-pointer`: a required source is unusable by the receiver. Replace it with a resolvable identifier, such as a session ID, path, commit, or issue key.
- `duplicated-source`: the handoff creates a second, potentially conflicting version of a governing source. Keep the purpose inline and link the agreement.
- `sender-narration`: background adds the sender's interpretation or unrelated history without changing the assignment.

### Authority

The handoff inherits the original request's authority. State a decision boundary only when plausible readings of the request would give the receiver different decision rights. When a consequential decision has no established owner, leave it open. Routine choices within the delegated responsibility belong to the receiver.

- `invented-authority`: a grant ("your call," "you decide," "in scope") or a closed decision that does not trace to the requester's words.

### The receiver's judgment

- `steered-judgment`: a question, proposed diagnosis, expected finding, or outline predetermines a conclusion the requester delegated. Could the receiver reach a different supported conclusion and still fulfill the request? Apply this test to judgments left open. Fixed facts, assigned inputs, and requester decisions may constrain the answer legitimately.
