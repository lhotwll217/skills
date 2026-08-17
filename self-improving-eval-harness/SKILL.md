---
name: self-improving-eval-harness
description: Design eval harnesses that support self-improvement loops. Use when standing up an eval harness in a repo, when extending or auditing one (run recording, ledgers, gates, runtime lifecycle, sharding), or when another skill needs harness infrastructure around its evals.
---

An **eval harness** records the performance of the state of a system at one point in time. The **loop** is the discipline that turns those runs into accepted changes: inspect, diagnose, change one thing, re-run, keep or revert on a **gate**. This skill designs the eval harness. The drive procedure is deliberately not here: a complete eval harness ships its own **protocol doc**, co-located and versioned with the code it governs — whoever runs a campaign reads the repo's doc, not this skill.

Bold terms are defined in [GLOSSARY.md](GLOSSARY.md). Unqualified "harness" always means the eval harness; the subject is often itself an **agent harness** — the language keeps the two distinct.

Everything below is a **menu, not a mandate**: pick primitives by use case. The skill fixes *artifacts and their contracts* — what exists on disk and what it contains. Any eval engine that satisfies the contracts works; promptfoo is the reference binding used for concrete spellings, never a commitment. All command spellings are illustrative; the CLI surface is each repo's own.

## Doctrine

Cross-cutting rules; per-primitive rules live in the table.

1. **Runs are targeted or full — nothing else.** A **targeted run** is any subset at any repeat count, for iteration. A **full run** covers the whole case set — every suite — and is the only kind that may publish; repeat 3 is the recommended default, because the repeat count is the flakiness detector. Sequencing targeted runs is the operator's workflow, not the skill's.
2. **Two-tier provenance.** Targeted runs demand nothing from git — evals run before the work is committed, and a clean-worktree requirement there is a footgun. Provenance — commit identity and validity checks — applies at exactly one point: a full run publishing to the ledger. In-flight full runs backfill the durable commit once it exists.
3. **Runs never halt on failure.** Failures are the loop's data. The only machine decision is the gate — a downstream comparison of two completed runs, delivered as an exit code.
4. **Inspectability first.** Every run leaves artifacts a coding agent can diagnose from — what was asked, what the subject did, what the judge said, what the runtime logged — without re-running anything. Runtime logs join back to cases through a propagated **correlation id**.
5. **Record once.** Whatever the engine's results file already contains — output, judge rationale, scores, latency, cost — is read from there, not copied into side files. Custom capture exists only for what the engine cannot record. Name each artifact for its contents, like `backend.log` or `trajectory.ndjson`, not for an eval-glossary role.

## The primitives

| Primitive | What it is | Use when |
|---|---|---|
| Cases | categorical files under `cases/`, one per behavior area; each case = id + vars + one concise rubric + tags | Always. Quality bar: `writing-great-evals` |
| Subject adapter | thin seam invoking the real product surface — CLI, daemon, or HTTP — normalizing output + telemetry, propagating the correlation id | Always — the one part no engine supplies |
| Fixtures & sandbox | frozen, seeded, answer-key-isolated ground truth | Accuracy against known facts; often skippable for purely behavioral evals |
| Runtime lifecycle | the runner boots, health-checks, and kills its own server per run | The subject is a running service |
| Grader wiring | pinned cheap judge, never the subject or its env; judge errors are sentinel-marked | Whenever rubrics grade |
| Run recording | one browsable folder per run — the inspection surface | Always |
| Stats | pure module: raw results → distributions → compact entry | Runs feed decisions across sessions |
| Ledger | committed diff-friendly line per full run; failed campaigns included, because excluding them is survivorship bias | Multi-session campaigns, PR evidence |
| Gate | downstream comparison of two runs, paired per case, exit code | Every keep/revert decision |
| Targeting & repeats | run any subset at any repeat: one case, several cases, a suite, previous failures, or a hand-picked **blast radius** | Always |
| Throughput | concurrency capped by provider rate limits; sharding only under a capped aggregate; teardown as validity | Long full runs |
| Protocol doc | the harness's own drive instructions, shipped in-repo | Every complete harness |
| Harness tests | LLM-free tests of harness invariants | Highly recommended — they document the contract and catch drift |

Depth for build, extend, and audit work — layout, the four contracts, grader, lifecycle and throughput doctrine, protocol-doc coverage — lives in [HARNESS.md](HARNESS.md); work from it whenever touching harness structure. An audit verifies every contract and every doctrine line against the repo.

Case quality — contract, grading seam, admission — belongs to `writing-great-evals`; prompt changes the loop proposes belong to `updating-prompts`. Point, don't restate.
