Read [pstack portability and capability checks](../pstack/README.md) before following this workflow. Owner and harness policy governs every step.

# Reflect

Mine the current conversation for durable learnings, then route them into skill edits.

Invoke when the user says "reflect" or "/pstack-reflect". Skip when the conversation is trivial, off-topic, or already covered by an existing skill the parent followed correctly. One-offs are not learnings.

## 1. Locate the active transcript

Resolve the current session’s stable ID using the host’s session context. Retrieve bounded evidence through the approved privacy-aware session-search route, including tools when checking actions. If the current session is excluded or unavailable, use a clearly labeled digest of this conversation rather than bypassing the policy. Pass that evidence or digest to reviewers.

## 2. Spawn three reviewers in parallel

One message, three calls through the supported delegation API, a general-purpose worker role, read-only investigation using available tools. Preserve the harness permission mode. Reviewers need tool access to look up the tickets, chat threads, and observability traces the transcript references.

Select each reviewer and synthesizer execution identity through the owner’s model-selection policy, using the roles in the table below. If a selected identity is unavailable, follow the host policy for fallback and report the identity actually used.

| Lens | Role | Prompt template |
|---|---|---|
| Judgment | reflect judgment | `references/judgment-reviewer.md` |
| Tooling | reflect tooling | `references/tooling-reviewer.md` |
| Divergent | reflect judgment | `references/divergent-reviewer.md` |

Pass each template verbatim, substituting the transcript evidence or digest where marked. Reviewers return findings in the delegation API response body.

## 3. Synthesize

One call through the supported delegation API, a general-purpose worker role, using the reflect-judgment identity selected through owner policy, read-only investigation using available tools. Preserve the harness permission mode. It spot-verifies citations, which can need the same tools. Pass `references/synthesizer.md` verbatim, with each reviewer's full output inlined where marked. It returns an Accepted / Rejected / Backlog list.

## 4. Structural enforcement check

Move any Accepted item that a lint rule, script, metadata flag, or runtime check would enforce more reliably to Backlog. See the [pstack-principle-encode-lessons-in-structure](../pstack-principle-encode-lessons-in-structure/WORKFLOW.md) principle skill.

## 5. Apply

Present the synthesizer's full Accepted / Rejected / Backlog output and wait for explicit approval before applying any Accepted edit. The user picks the subset and may redirect routings. Skill changes affect every future agent in the org. Do not auto-apply.

Keep backlog proposals in the response unless tracker writes are authorized. Accepted edits follow the owner’s approval policy.

Follow each approved row's Routing exactly:

- Trivial existing-skill edit (a one-line bullet, a tightened sentence, a stale fact corrected): the parent does it directly.
- Substantive existing-skill edit (a new section, a new pattern table, more than ~10 lines): hand to the skill-authoring guidance resolved in the portability entry point and run its draft / test / iterate loop.
- `tune description: <skill path>` (the skill exists but didn't trigger when it should have): hand to the resolved skill-authoring guidance and run its description-optimization loop.
- `new skill via create-skill: <kebab-name>`: hand creation to the resolved skill-authoring guidance. Do not invent the shape ad hoc.

If your environment ships a SKILL.md validator, run it on every touched skill before declaring done.

## 6. Summarize for the user

Short list, no preamble:

- Edits applied: `<skill path>`. What changed, one line each.
- New skills created: `<skill path>`. One line each (rare).
- Backlog filed to the devex tracker: `<issue title>` (`<tags>`). One line each.
- Dropped: one line per rejected finding + reason from the synthesizer.
