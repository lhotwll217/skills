# Glossary

**Eval harness** — infrastructure that records the performance of the state of a system at one point in time. In this skill, "harness" unqualified always means the eval harness.

**Agent harness** — the runtime hosting an agent: a CLI, a daemon, an IDE agent. Frequently the subject under test. Never shortened to "harness" here.

**Subject** — the system under test, invoked through its real product surface. Distinct from the grader.

**Run** — one recorded measurement: cases executed against the subject at a point in time, leaving inspectable artifacts.

**Targeted run** — any subset of cases at any repeat count, for iteration. Demands nothing from git; never publishes.

**Full run** — the whole case set, every suite; the only run kind that may publish. Repeat 3 recommended: a case failing all three repeats is deterministically broken; failing once is flaky — different priorities.

**Suite** — a category of cases sharing one behavior area; one file per suite under `cases/`; the natural unit of a targeted run.

**Campaign** — one improvement effort: a batch of targeted iteration runs culminating in the full run that publishes. Failed campaigns publish too.

**Blast radius** — hand-picked cases from other suites where a change could plausibly regress, run together as one regular targeted run whose label carries the `:blast-radius` tag. A smoke check during iteration: catch likely regressions before the full run spends the tokens. Judgment, not mandate.

**Loop** — the discipline that turns runs into accepted changes: inspect, diagnose, change one thing, re-run, keep or revert on a gate.

**Gate** — a downstream comparison of two runs whose verdict is an exit code; the machine decision for keep or revert.

**Ledger** — the committed, diff-friendly record of full runs; one line per run, failed campaigns included.

**Grader** — the pinned judge model scoring outputs against rubrics. Never the subject; its errors carry a sentinel so they don't count as subject failures.

**Trajectory** — the ordered record of tool calls a subject made during one case, with arguments and results. Route evidence for agentic subjects.

**Correlation id** — a case identifier propagated into the subject — a header, an env var, or a per-case conversation — so runtime log lines join back to the case that caused them.

**Protocol doc** — the eval harness's drive instructions, shipped in-repo and versioned with it.

**Harness tests** — LLM-free tests of the eval harness's own invariants.
