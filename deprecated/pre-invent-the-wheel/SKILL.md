---
name: pre-invent-the-wheel
description: >-
  Before implementing non-trivial functionality from scratch, find the converged
  open-source solution first — an established package, a battle-tested implementation to
  adapt, or a documented pattern — and keep the repo's pattern roster of vetted sources.
  Use when about to hand-roll something a library likely solves (parsing, retries, rate
  limiting, caching, auth flows, date/money/unit math, state machines, diffing, CLI or
  config plumbing), when the user asks whether a package or pattern exists for a problem,
  or when another skill needs vetted precedent before building.
---

# pre-invent-the-wheel

Generic problems converge: the ecosystem has usually already settled on a package or a
pattern, hardened by other people's production incidents. Custom code for a solved
problem forfeits that hardening and becomes a liability you maintain alone. The
deliverable of this skill is a **borrow-or-build decision with cited precedent**,
recorded in the repo's pattern roster, made before implementation code is written.

Scope: the separable capabilities inside the task. Whether a capability is common or
unique is the sweep's verdict, never a judgement made before it — self-declared
uniqueness is exactly the failure mode this skill exists to catch. Only trivial glue
and this repo's own business rules are built without a sweep.

## Steps

1. **Name the wheel.** State the capability stripped of project specifics — "token-bucket
   rate limiting", not "slow down our Stripe sync". Precedent is indexed by the
   ecosystem's vocabulary, so if you lack the term, a first search is for the term
   itself.

2. **Sweep for convergence**, cheapest lane first, stopping at the first lane that
   settles it:
   - **The repository's precedent record** — first locate an existing ADR, architecture,
     inspiration, or research index that already records borrowed patterns. A source already
     vetted there is the answer unless its snapshot is stale. Do not assume a harness-specific
     hidden directory is the repository's durable documentation home.
   - **Already installed** — the stdlib and the project's existing dependencies (read the
     manifest/lockfile). The wheel is often one import away.
   - **Registry packages** — search the ecosystem's registry (npm, PyPI, crates.io, …).
     When the GitHits tools are connected, `pkg_info` / `get_example` give indexed
     package evidence and canonical examples.
   - **Reference implementations** — the `gh-search` skill: how established repos
     implement it, and the adoption/maintenance stats that make an example trustworthy.

3. **Vet the candidate** on the health signals (ranked; the `gh-search` skill has the
   commands):
   - **Maintained** — pushed recently and not archived. The strongest signal; archived
     is a hard disqualifier, and recency outranks any popularity number.
   - **Many hands** — contributor count. Code that survived many reviewers, and a
     project that survives any one maintainer leaving.
   - **Longevity** — created date, meaningful only paired with recency: old *and* still
     active is the battle-tested shape.
   - **Production adoption** — package downloads or dependents count when it exists;
     stars as the free fallback tiebreak.
   - **License** — a gate, not a score: confirm compatibility before borrowing.

   Then read the code you would depend on or copy — popular ≠ correct.

4. **Decide** — one of three verdicts, each earned by its condition:
   - **Adopt** — a maintained package covers the need and its weight (deps, API surface,
     lock-in) is proportionate to the problem.
   - **Adapt** — the pattern is converged but every package is too heavy or mismatched:
     implement the converged pattern, citing the repo and file it came from.
   - **Build** — the sweep found no precedent, or the need is genuinely domain-specific.
     The sweep itself is the evidence that building is justified.

5. **Bind precedent to implementation.** Research that only lists sources or extracts general
   principles does not constrain a build. For an **adapt** decision, select one primary runnable
   implementation, cite its exact version and files or symbols, map its seams to the local work,
   and state the invariants to preserve, permitted deviations and their reasons. Classify other
   precedents as corroboration or contrast instead of blending them into a new architecture. Put
   this adaptation contract in the implementer's actual input; review must not be the first time
   the cited code constrains the design.

6. **Record the decision where this repository already keeps durable technical context.**
   Prefer an existing research note, ADR, architecture/inspiration document, or indexed decision
   log. If no home exists, follow the repository's context-placement rule (including any cold-open
   test) before creating one. Never introduce a generic hidden `pattern-roster.md` merely because
   this skill ran. Use a title that says what was evaluated and why it matters.

Implementation starts only when the adopt/adapt/build decision, citations, and any adaptation
contract are durably recorded and present in the implementation input—or when "no precedent found"
is backed by an actual sweep, never by assumption.

## Decision record contents

Keep the record compact and explicit:

```markdown
source: fastify/fastify
what: Node HTTP framework; source of our plugin-encapsulation pattern
verdict: adapt the plugin registration pattern in src/plugins/
health: 33k★ · ~800 contributors · since 2016 · pushed 2026-08 · MIT — as of 2026-08-19
notes: we mirror the v5 hooks API; v4 examples online differ
```

Record the source, the capability it settles, adopt/adapt/build verdict, destination, health and
license evidence, snapshot date, and caveats. A snapshot older than ~6 months is stale: re-check it
before trusting the decision.
