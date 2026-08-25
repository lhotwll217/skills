# Interactive Implementation Review

<!-- This document is completed by an agent and reviewed interactively. Write for a human deciding whether the proposed implementation is sound. Treat tickets, design documents, and prior conversations as claims to verify. Cite load-bearing claims. Preserve exact owner wording where it defines behavior, scope, or a negative requirement. Mark irrelevant conditional sections “Not applicable” with a reason. Record unsettled choices in Unresolved Questions. -->

## Review Metadata

| Field | Value |
|---|---|
| Title | `<implementation review title>` |
| Status | `<draft / in review / changes requested / approved / blocked>` |
| Owner | `<name>` |
| Prepared by | `<agent/session>` |
| Created | `<date>` |
| Last reviewed | `<date>` |
| Change classification | `<greenfield / extension / correction / refactor / migration / removal>` |
| Source request | `<link or reference>` |
| Intended implementation repository | `<repository>` |

### Review-status scale
- **Draft** — evidence or design work remains.
- **In review** — ready for owner annotation.
- **Changes requested** — owner feedback remains unresolved.
- **Approved** — affected sections and final decisions are approved.
- **Blocked** — an unresolved decision or unsound foundation prevents approval.

## Evidence-status vocabulary
<!-- Global reference: Apply these statuses to every decision-bearing claim in the review. -->
- **Observed** — directly reproduced or inspected in the current system.
- **Source-backed** — supported by an opened primary source or pinned implementation.
- **Owner-decided** — explicitly chosen by the owner.
- **Inferred** — plausible but not independently established.
- **Unresolved** — evidence cannot settle the decision.

Approval requires every load-bearing design claim to be observed, source-backed, or owner-decided.
Inferred and unresolved claims remain visible in Unresolved Questions.

# 1. Summary
<!-- Reference: Preserve the owner's intended outcome, concrete example, agreed proposal, and reason for acting from the completed grilling loop. Summary statements link to decisions established in their owning sections. -->
## Intended outcome
`<What should a person be able to do, or what should feel different?>`
## Concrete example
`<One concrete journey.>`
## Proposed change
`<The implementation direction, briefly.>`
## Why now
`<Why this is needed now.>`

# 2. Goals and Non-Goals
<!-- Reference: State observable goals, explicit exclusions, and exact negative requirements agreed during grilling. Keep this section as their source of truth. -->
## Goals
- `<observable result>`
## Non-goals
- `<adjacent result deliberately excluded>`
## Negative requirements
- The implementation must not `<forbidden behavior or dependency>`.
- The implementation must retain `<existing behavior or boundary>`.
- The implementation must not modify `<frozen artifact, baseline, or contract>`.

# 3. Motivation
<!-- Reference: Establish the inadequacy from observed behavior and cited evidence. Treat the source request's proposed explanation as a claim to verify. -->
## Current inadequacy
`<Why the existing behavior or design cannot produce the intended outcome.>`
## Observed problem
| Observation | Evidence status | Source |
|---|---|---|
| `<observed behavior>` | `<status>` | `<code/test/runtime/history reference>` |

# 4. Current System Audit
<!-- Reference: Import the complete decision-bearing Current System Audit with its native depth. Preserve every observed behavior, provenance entry, design-quality finding, reinvention comparison, diagnosis trace, verdict, caveat, and open question; link the full research artifact and source bundle. -->
**Complete research artifact:** `<link>`

## Basis rating
### Rating scale
- **Sound** — the existing design is an appropriate basis.
- **Probably sound** — evidence supports building on it with bounded uncertainty.
- **Unclear** — insufficient evidence; permitted only as the pre-audit rating.
- **Probably unsound** — material design problems require an explicit disposition.
- **Unsound** — building on it would compound a fundamental problem.

| Rating | Result | Justification |
|---|---|---|
| Pre-grill | `<sound / probably sound / unclear / probably unsound / unsound>` | `<initial owner judgment verbatim>` |
| Closing | `<scale value except unclear>` | `<audit evidence>` |

**Rating delta explained by:** `<finding or “No material delta”>`

## Observed behavior and provenance
| Current behavior or responsibility | Evidence | Provenance |
|---|---|---|
| `<behavior>` | `<observed/source-backed reference>` | `<originating change>` |

## Design-quality findings
Review accumulated complexity, overall code health, consistency around good or bad patterns, and whether tests prove intended or accidental behavior.

| Part | Finding | Introduced by | Consequence |
|---|---|---|---|
| `<part>` | `<finding or sound>` | `<provenance>` | `<effect>` |

## Existing-system reinvention check
| Local mechanism | Closest pinned counterpart | Material difference | Divergence |
|---|---|---|---|
| `<mechanism>` | `<implementation>` | `<difference>` | `<justified / accidental / unresolved>` |

## First-principles diagnosis
| Observed failure or smell | Requirement violated | Cause | Defect type |
|---|---|---|---|
| `<finding>` | `<requirement>` | `<cause>` | `<design defect / implementation defect>` |

## Fix-now disposition
### Disposition scale
- **Fix first** — prerequisite refactoring is required.
- **Fix alongside** — repair the affected seam in this implementation.
- **Quarantine** — build without deepening dependency on the defect.
- **Abandon basis** — use a different seam or system.
- **Not needed** — the basis is sound.

**Disposition:** `<selection>`  
**Cost and scope:** `<requirements>`  
**Rejected dispositions:** `<alternatives and reasons>`  
**Owner approval:** `<owner-decided reference>`

A probably-unsound or unsound rating blocks approval until the owner chooses a disposition.

# 5. Prior Art
<!-- Reference: Import the complete decision-bearing prior-art report with its native depth. Preserve every implementation, standard, citation block, credibility fact, search lane, recommendation, caveat, and open question; link the full research artifact and source bundle. -->
**Complete research artifact:** `<link>`

## Research question
`<Problem and decisions this research must settle.>`

## Existing implementations
Repeat this complete block for every decision-bearing implementation.

### `<implementation>@<revision> — <file:symbol>`
**Local evidence:** `<link>`  
**Upstream evidence:** `<pinned link>`
```text
<load-bearing excerpt>
```
| Credibility dimension | Evidence |
|---|---|
| Maintained by | `<maintainer and standing>` |
| Adoption | `<dependents or users>` |
| Battle-tested | `<age or production history>` |

**What applies here:** `<transferable behavior>`  
**What does not apply:** `<context-specific behavior>`

## Applicable standards
Repeat this complete block for every decision-bearing standard.

### `<standard, version, section>`
> `<governing text>`

**Canonical source:** `<link>`  
**Local preserved source:** `<link>`
| Credibility dimension | Evidence |
|---|---|
| Issued by | `<authority and standing>` |
| Adoption | `<implementations or governed users>` |
| Battle-tested | `<age, version history, or operational use>` |

**Decision constrained:** `<decision>`  
**Rule applied here:** `<application>`

## Search coverage
| Lane | Places and queries searched | Result |
|---|---|---|
| Existing implementations | `<search log>` | `<citations / none found>` |
| Applicable standards | `<search log>` | `<citations / none found>` |

## Recommendation
**Disposition:** `<adopt / adapt / build>`  
**External owner:** `<dependency or standard that retains responsibility>`  
**Local boundary:** `<product-specific behavior retained locally>`  
**Evidence-backed rationale:** `<why the inspected evidence supports this disposition>`

## Prior-art caveats and open questions
- `<remaining inference, applicability limit, or unresolved compatibility question>`

# 6. Proposal
<!-- Reference: Synthesize the smallest justified change agreed through grilling after the research returned. Show the before/after responsibility change and its complexity delta. -->
## Proposed system behavior
`<What the system will do.>`
## Before and after
| Concern | Before | After | Evidence status |
|---|---|---|---|
| `<responsibility>` | `<current>` | `<proposed>` | `<status>` |
## Responsibility disposition
Use Retain, Refactor first, Replace, Remove, or Prototype/investigate.
| Responsibility | Disposition | Reason |
|---|---|---|
| `<responsibility>` | `<disposition>` | `<rationale>` |
## Complexity delta
**Complexity added:** `<new concepts/state/dependencies>`  
**Complexity removed:** `<deleted concepts/duplication>`  
**Why remaining complexity is necessary:** `<rationale>`

# 7. Design Details
<!-- Reference: Mark every seam before expanding affected ones. For each affected seam, make the proposed contract and owner-reviewed conclusion concrete; preserve unaffected behavior explicitly. -->
## Affected-seam index
### Applicability scale
- **Affected** — behavior or ownership changes and requires review.
- **Preserved** — explicitly unchanged and protected by validation.
- **Not applicable** — considered but irrelevant; explain why.
- **Unresolved** — applicability or behavior is unsettled.

### Section-review scale
- **Not reviewed**
- **Changes requested**
- **Approved**
- **Blocked**
- **Not applicable**

| Seam | Applicability | Review status | Review focus |
|---|---|---|---|
| Modules and ownership | `<status>` | `<status>` | `<decision>` |
| Interfaces and protocols | `<status>` | `<status>` | `<decision>` |
| Data and migrations | `<status>` | `<status>` | `<decision>` |
| Prompts and agent behavior | `<status>` | `<status>` | `<decision>` |
| User journey and interface states | `<status>` | `<status>` | `<decision>` |
| Dependencies and configuration | `<status>` | `<status>` | `<decision>` |
| Security and privacy | `<status>` | `<status>` | `<decision>` |
| Operations and observability | `<status>` | `<status>` | `<decision>` |
| Style and repository standards | `<status>` | `<status>` | `<decision>` |

## Modules and ownership
```text
<folder/module shape>
```
| Module | Owns | Does not own | Callers |
|---|---|---|---|
| `<module>` | `<responsibilities>` | `<boundary>` | `<callers>` |

**Pre-implementation review:** overall health, depth, speculative abstractions, ownership, placement.  
**Review conclusion:** `<conclusion>`

## Interfaces and protocols
| Interface | Inputs | Outputs | Errors | Compatibility |
|---|---|---|---|---|
| `<interface>` | `<contract>` | `<contract>` | `<failure>` | `<promise>` |
```text
<exact signature/event/protocol/schema>
```
**Pre-implementation review:** caller knowledge, unknown/empty/missing/failed states, explicit failure, interface depth.  
**Review conclusion:** `<conclusion>`

## Data and migrations
| Change | Invariant | Migration/backfill | Rollback | Failure recovery |
|---|---|---|---|---|
| `<change>` | `<invariant>` | `<procedure>` | `<procedure>` | `<behavior>` |
**Compatibility window:** `<duration or N/A>`  
**Review conclusion:** `<conclusion>`

## Prompts and agent behavior
**Existing behavior:** `<observed behavior>`
### Exact proposed change
```text
<exact prompt/policy/tool description>
```
**Intended behavioral delta:** `<change>`
| Concern | Owner |
|---|---|
| Permanent invocation rule | `<system prompt / other>` |
| Detailed procedure | `<skill>` |
| Deterministic enforcement | `<tool/code>` |
| Behavioral validation | `<eval>` |
**Pre-implementation review:** context size, one owner, deterministic enforcement, behavior-not-phrasing eval.  
**Review conclusion:** `<conclusion>`

## User journey and interface states
```text
<entry> → <action> → <response> → <completion>
```
| State | Trigger | Visible behavior | Recovery |
|---|---|---|---|
| Loading | `<trigger>` | `<behavior>` | `<recovery>` |
| Empty | `<trigger>` | `<behavior>` | `<recovery>` |
| Error | `<trigger>` | `<behavior>` | `<recovery>` |
| Interrupted | `<trigger>` | `<behavior>` | `<recovery>` |
| Complete | `<trigger>` | `<behavior>` | `<next>` |
**Approved prototype/reference:** `<link/state>`  
**Accessibility:** `<requirements or N/A>`  
**Review conclusion:** `<conclusion>`

## Dependencies and configuration
| Dependency/configuration | Version/source | Why needed | Failure behavior |
|---|---|---|---|
| `<dependency>` | `<pinned value>` | `<reason>` | `<behavior>` |
**Feature flag/rollout control:** `<details or N/A>`  
**Review conclusion:** `<conclusion>`

## Security and privacy
| Boundary | Risk | Control | Specialist review |
|---|---|---|---|
| `<boundary>` | `<risk>` | `<control>` | `<required/not required>` |
**Review conclusion:** `<conclusion or N/A>`

## Operations and observability
| Concern | Proposed behavior |
|---|---|
| Process lifecycle | `<behavior>` |
| Timeouts/retries | `<behavior>` |
| Logging | `<behavior>` |
| Metrics | `<behavior>` |
| Failure diagnosis | `<behavior>` |
| Rollout | `<behavior>` |
| Rollback | `<behavior>` |
**Review conclusion:** `<conclusion>`

## Style and repository standards
| Standard | Source | Enforcement |
|---|---|---|
| Formatter | `<source>` | `<command>` |
| Linter | `<source>` | `<command>` |
| Type checking | `<source>` | `<command>` |
| Testing conventions | `<source>` | `<mechanism>` |
| Language/framework style | `<source>` | `<mechanism>` |
**Established patterns:** `<patterns>`  
**Deliberate deviations:** `<deviation/rationale or none>`  
**Review conclusion:** `<conclusion>`

# 8. Rationale and Alternatives
<!-- Reference: Explain why the selected approach follows from the evidence and grilling decisions. Preserve credible rejected alternatives, drawbacks, and conscious trade-offs. -->
## Selected approach
`<Why this best satisfies evidence and goals.>`
## Alternatives considered
| Alternative | Benefits | Costs | Why rejected |
|---|---|---|---|
| `<alternative>` | `<benefits>` | `<costs>` | `<reason>` |
## Drawbacks
- `<known drawback>`

# 9. Dependencies, Risks, and Compatibility
<!-- Reference: Record assumptions that could invalidate the design, operational or product risks, compatibility promises, and reversible rollout behavior. Link each assumption to evidence. -->
## Dependencies
| Dependency | Assumption | Evidence | What happens if false |
|---|---|---|---|
| `<dependency>` | `<assumption>` | `<source>` | `<response>` |

## Risks
### Risk scale
Likelihood: **Low** unlikely; **Medium** plausible and controlled; **High** expected without mitigation.  
Impact: **Low** localized/reversible; **Medium** material disruption; **High** data loss, security exposure, systemic failure, or expensive rework.

| Risk | Likelihood | Impact | Mitigation | Residual risk |
|---|---|---|---|---|
| `<risk>` | `<low/medium/high>` | `<low/medium/high>` | `<control>` | `<remaining>` |

## Backwards compatibility
| Existing consumer or behavior | Compatibility promise | Verification |
|---|---|---|
| `<consumer>` | `<promise>` | `<proof>` |
## Rollout and rollback
**Rollout:** `<sequence>`  
**Rollback trigger:** `<condition>`  
**Rollback procedure:** `<procedure>`

# 10. Test Plan and Success Metrics
<!-- Reference: Derive validation from the owner's concrete journey and affected seams. Separate what each layer proves from what it cannot prove, and preserve frozen artifacts exactly. -->
## Validation strategy
| Layer | What it proves | What it does not prove |
|---|---|---|
| Unit/contract | `<invariants>` | `<limits>` |
| Integration | `<seams>` | `<limits>` |
| Behavioral evaluation | `<agent behavior>` | `<limits>` |
| End-to-end journey | `<real outcome>` | `<limits>` |
| Manual review | `<taste/lived experience>` | `<limits>` |
## Exact acceptance journey
```text
Given <starting state>
When <real actions>
Then <observable result>
And <preserved behavior>
```
## Frozen artifacts and baselines
- `<fixture/rubric/baseline/prototype/compatibility case>`
## Success metrics
| Metric | Baseline | Required result | Measurement |
|---|---|---|---|
| `<metric>` | `<current>` | `<threshold>` | `<method>` |
## Failure conditions
- `<wrong behavior can still pass local tests>`
- `<negative requirement violated>`
- `<real journey fails>`
- `<frozen baseline changes without approval>`

# 11. Unresolved Questions
<!-- Reference: List only decisions that research and current-system evidence cannot settle. State the owner's choices and whether each question blocks review approval. -->
| Question | Why evidence cannot settle it | Owner decision required | Blocks approval |
|---|---|---|---|
| `<question>` | `<reason>` | `<choice>` | `<yes/no>` |

# 12. Decision Trace
<!-- Reference: Index each decision and negative requirement to its evidence, owning review section, and validation route. The trace contains those four links. -->
| Decision or negative requirement | Status | Evidence | Review section | Validation |
|---|---|---|---|---|
| `<decision>` | `<owner-decided/source-backed>` | `<source>` | `<section>` | `<proof>` |
## Exact literals to preserve
- `<interface/prompt/copy/state/path>`

# 13. Approval
<!-- Reference: The owner completes the gate and final decision after reviewing the canonical Markdown. Blocking questions remain visible in Unresolved Questions. -->
## Approval gate
- [ ] Current behavior and desired change are observable and agreed.
- [ ] Current System Audit has a closing verdict.
- [ ] Unsound basis has an owner-approved disposition.
- [ ] Load-bearing claims are observed, source-backed, or owner-decided.
- [ ] Relevant implementations and standards were inspected.
- [ ] Every affected seam has been reviewed.
- [ ] Negative requirements and frozen artifacts are explicit.
- [ ] Blocking questions are resolved.
- [ ] Validation includes the real journey.
- [ ] Generated Markdown preserves the approved review.

## Final decision
**Decision:** `<approved / changes requested / blocked>`  
**Owner:** `<name>`  
**Date:** `<date>`  
**Conditions or remaining notes:** `<notes>`
