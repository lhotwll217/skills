# Workstream retro orchestration grammar

Load this reference while modeling or rendering a workstream retro.

## Lanes

| Lane | Meaning |
|---|---|
| Human owner | Direct prompt, interactive participation, decision, approval, correction, freeze, push, or merge gate |
| Orchestrator parent | The orchestrator gathering evidence, issuing work, receiving results, and choosing the next route |
| Implementation | A child execution producing code, documents, research, tests, or repairs |
| Independent review | A fresh context reviewing Standards, Spec, design, security, or cumulative behavior |
| Artifacts & integration | Specs, ADRs, issues, branches, PRs/MRs, snapshots, evidence, and convergence points |

An interactive session opened for direct owner participation belongs in the human lane even when an agent harness executes it. An unattended child execution belongs in Implementation or Independent review. Do not merge these shapes.

## Node semantics

- **Human checkpoint** — consequential owner intervention plus the route change it caused.
- **Parent step** — evidence gathering, decomposition, delegation, synthesis, or routing.
- **Implementation** — fresh child execution context that creates or repairs an output.
- **Verification (`✓v`)** — tests, types, lint, smoke checks, or self-checks inside the execution context. Verification is not review.
- **Independent review** — fresh context judging work against an external standard or specification.
- **Artifact** — durable context or evidence handed between steps.
- **Loop summary** — collapsed repeated implementation/review/fix cycles with representative findings and final disposition.
- **Terminal outcome** — shipped, merged, frozen, superseded, blocked, or explicitly deferred.

## Edge semantics

- Solid outbound arrow — work or context sent out.
- Dashed inbound arrow — result or findings returned to the orchestrator parent.
- Artifact-colored arrow — evidence or durable context passed forward.
- Owner-colored arrow — feedback or approval changes the route.
- Warning-colored arrow — interruption, capacity reroute, retry, or supersession.
- Failure-colored arrow — rejected attempt or required correction.

Pair every color with a label, symbol, or line style.

## Styling and Owner Operator house palette

Keep `html-theme/theme.css` flat geometry and typography. When matching the Owner Operator workspace, use its terminal semantic palette as the concrete house style:

| Variable | Default meaning |
|---|---|
| `--terminal-bronze` | Human owner, consent, feedback |
| `--terminal-blue` | Parent context, delegation, information |
| `--terminal-green` | Completed implementation or successful execution |
| `--terminal-red` | Failure, rejection, destructive state |
| `--terminal-yellow` | Warning, interruption, capacity pressure, reroute |
| `--terminal-purple` | Independent review or high-reasoning analysis |
| `--terminal-teal` | Artifact, evidence, integration, convergence |

For another orchestrator, map these role semantics to its established theme. Additional named variables are allowed for stable categories the subject genuinely needs.

## Evidence rules

- Preserve exact execution mechanism or harness, child-agent identity, model, effort, tracker reference, count, and outcome when decision-relevant and safe.
- Use `unknown`, not a guess, when an execution identity is unavailable.
- Say `approximate phase count` when retries make raw-run counts misleading.
- Keep each claim attached to its workstream and source.
- Show unresolved limitations beside the success they qualify.

## Human checkpoint test

Include a human message only if it changed one of:

- scope;
- ownership or authority;
- execution mechanism, child, model, or effort routing;
- sequencing or concurrency;
- verification or review standard;
- acceptance evidence;
- release, freeze, merge, or follow-up disposition.

A checkpoint is incomplete without its consequence.

## Required visual hierarchy

1. **Overview:** purpose, final state, execution shapes, what orchestration changed.
2. **Topology:** readable lane-based route for one workstream at a time.
3. **Chronology:** concurrent workstreams aligned in time.
4. **Human checkpoints:** high-signal interventions and consequences.
5. **Detail:** trigger or start context, purpose, execution shape, identity, context in, return, and next route.
6. **Legend:** enough grammar to read the map without an essay.

Filters should dim non-matches so surrounding context remains visible. Repeated loops should expand on demand rather than dominate the default topology.
