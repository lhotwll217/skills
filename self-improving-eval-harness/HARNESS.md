# Eval-harness reference — layout, contracts, doctrine

The eval harness does not commit to an engine. The contracts below define it; promptfoo is the reference binding, and every promptfoo-specific spelling in this file is an example of satisfying a contract, not a requirement. Adapt all names and commands to the repo. "Harness" unqualified means the eval harness — the subject is often itself an agent harness.

## Run-folder layout

```
eval/
├── cases/                     # one file per category — the file is the suite,
│   ├── permissions.yaml       #   and the natural unit of a targeted run
│   └── retrieval.yaml
├── providers/                 # subject adapter + grader wiring
├── fixtures/                  # when testing accuracy: frozen, answer-key-isolated
├── runs/                      # gitignored — the inspection surface
│   ├── latest -> 2026-01-15_11-02_fix-empty-results/
│   └── 2026-01-15_11-02_fix-empty-results/
│       ├── run.json           # label, hypothesis, filters, repeat, model, grader, port, git if available
│       ├── results.json       # the engine's own output file, verbatim
│       ├── backend.log        # captured log of the runtime the runner booted; lines carry the correlation id
│       └── cases/<id>/        # custom capture, agentic subjects only
│           ├── trajectory.ndjson   # ordered tool calls with arguments and results
│           └── stderr.txt
├── history.jsonl              # local append-only record of every run
├── eval_stat_log.json         # committed ledger — full runs only
└── PROTOCOL.md                # this harness's drive instructions
```

The `runs/latest` symlink means an agent never guesses the newest folder. Inspection is jq/grep-shaped. With the promptfoo binding:

```bash
# which cases failed, and what did the judge say?
jq -r '.results.results[] | select(.success|not) | .gradingResult.reason' eval/runs/latest/results.json

# what route did the subject take on a failing case?
jq -r '.tool + " " + (.args|tostring)' eval/runs/latest/cases/<case-id>/trajectory.ndjson

# what did the runtime do while that case ran?
grep "case=<case-id>" eval/runs/latest/backend.log

# was the runtime healthy overall?
grep -n "429\|retry\|Traceback" eval/runs/latest/backend.log
```

## What the engine already records

Check the engine's results file before building any capture; custom capture exists only for what the engine cannot record. Promptfoo records per case: `vars`, `response.output`, `success` and `score`, judge rationale in `gradingResult.reason` and `componentResults[].reason`, `latencyMs`, `cost`, `namedScores`, and `tokenUsage` when the provider reports it. No engine records tool-call trajectories, stderr, or runtime logs — those are the only custom captures, and trajectory capture earns its build only for agentic subjects where the route is diagnostic.

Lean on the engine before writing code. The promptfoo binding covers:

- Subsetting: `--filter-metadata k=v`, `--filter-pattern`, `--filter-first-n`, `--filter-sample`
- Failure-driven reruns: `--filter-failing <evalId>`, `--filter-errors-only`, `--retry-errors`, `--resume`
- Storage and addressing: `promptfoo list evals`, `show`, `export eval <id>` — `runs/` is a greppable projection, not a second source of truth
- Repeats, concurrency, grader override

## The four contracts

1. **Case** — id + input vars + one concise rubric + plain metadata tags. Cases group into categorical files under `cases/`: the file is the suite, so targeted runs, diffs, and case review all stay local to one behavior area. Shape, with an illustrative schema:

   ```yaml
   # cases/retrieval.yaml — the retrieval suite
   - id: empty-results-fallback
     vars: { question: "Find the meeting notes from last spring" }
     rubric: "Offers the broader-window fallback search when nothing matches."
   ```

2. **Adapter result** — normalized output + telemetry: latency always; tokens and cost when the surface reports them; trajectory when routes matter. The subject is invoked through its real product surface, and the adapter propagates the correlation id into it — a header, an env var, or a per-case conversation recorded in `run.json` — so runtime log lines join back to the case that caused them.
3. **Ledger entry** — one diff-friendly line per full run: subject, scope, repeat, scores, distributions, and dual git identity — the commit when it ran, plus the durable commit backfilled later. Validity gating covers infra validity, meaning grader errors and incomplete runs, not scores: failed campaigns stay in the ledger. For field sets, point at the code that builds the entry; docs that enumerate fields go stale.
4. **Gate** — compare two runs paired per case; report unpaired cases; exit nonzero on regression; print comparability caveats when model, grader, or repeat differ. Replay is free — persisted results re-compare with zero model calls; replay before buying another run.

## Runtime lifecycle

The runner owns its subject runtime: pick a free port, boot, wait for health with a timeout, inject the model-under-test through the runner env while the grader env stays clean, capture the log, kill the process group at the end, verify the port is dead. Run servers with auto-reload disabled. A batch across models is one runtime per model on sequential ports.

## Throughput

Provider rate limits bound concurrency long before CPU does. Sharding pays only under a capped aggregate: N runtimes on sequential ports, suites bin-packed across them, wait for all, aggregate into one run folder, tear all down. Teardown is part of validity — leaked runtimes saturate shared pools and turn later runs' latency numbers into garbage. Let a run finish in the shape it started; reshape between runs. With live external tools in the path, lower concurrency before trusting repeats.

## Protocol doc

The drive procedure ships with the harness — for example `eval/PROTOCOL.md` — versioned with the code it governs. Required coverage:

- **The flow, by example** — workflow, not law, and spelled with the repo's own commands. The shape, with an illustrative runner; the real targets are case ids, a suite file, a tag, and the whole set. Every run logs its artifacts; only the evidence run reaches the ledger:

  ```bash
  # one change is in — target the case it should fix (ids accept more than one):
  eval run --case empty-results-fallback --label fix-empty-results

  # it passed once; repeat the case three times — three passes is stable, one failure is flaky:
  eval run --case empty-results-fallback --repeat 3

  # target the suite the case lives in — the nearest downstream effects:
  eval run --suite retrieval

  # smoke-check the blast radius — hand-pick the cases across other suites most likely to
  # catch a regression from this change, one regular run, tagged in the label:
  eval run --case permissions-scope-basic --case guardrail-refusal --case link-format \
    --label "fix-empty-results :blast-radius"

  # next change, same rhythm. once satisfied with the accumulated batch:
  eval run --full --repeat 3 --label fix-empty-results-campaign   # the evidence run
  eval compare <before> <after> --gate                            # keep or revert, as an exit code
  eval publish <run>                                              # ledger line; backfill the commit later
  ```

- **Blast radius** — a regular targeted run over hand-picked cases from other suites where this change could plausibly regress: permission scoping after a prompt change, safety guardrails after a tool change. The run's label carries the colon-prefixed tag — `"<change> :blast-radius"` — so `grep ":blast-radius" history.jsonl` finds every such check. The point is token economics: a cheap, well-distributed sample catches most regressions during iteration, so the full run confirms instead of discovers. Whether to smoke-check, run a whole suite, or skip straight to full is a judgment on downstream risk.
- **Classification before repair** — every failure is a real regression, a behavior difference, or an eval/rubric/infra issue; repair code first, prompts second, assertions third. Fold in the repeat signal: failing all repeats is deterministic breakage, failing once is flakiness, and the two carry different priorities.
- **Gate semantics** — which comparison decides keep/revert, and the command that runs it.
- **Inspection** — this repo's equivalents of the jq/grep lines above, including the correlation-id join from runtime log to case.
- **Multi-suite campaigns** — a living review doc ordering the suites, updated after every pass.

## Harness tests

Highly recommended — they document the contract and catch drift. LLM-free and fast: fixture isolation so subjects can't read answer keys, stats math, gate logic against synthetic results, adapter result shape.
