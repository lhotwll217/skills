---
name: prior-art
description: Research external implementations and standards before designing something that may already exist. Every decision-bearing citation must be opened, pinned, quoted, linked to a local copy and upstream source, and backed by credibility facts. Use for prior art, precedent, established practice, or build-versus-adopt decisions.
---

# Prior Art Research

Establish how the world outside already solves the problem, with evidence strong enough to settle a
design decision.

An unopened source is `inferred`. It may point to the next search, but it may not settle a decision.

## Citation bar

Every cited source is all five:

- **Opened** — read the artifact carrying the behavior in this session: implementation or governing
  spec, not a README or post when source can settle the question. Run it when reading is insufficient.
- **Pinned** — cite an exact commit for code and an exact version or publication date for standards.
- **Quoted** — include the load-bearing excerpt verbatim in the report.
- **Linked** — link both a local `sources/` copy and the upstream artifact at the pinned revision.
- **Credible** — state linked facts for authority, adoption, and battle-testing.

## Output bundle

Honor an owner-supplied destination. Otherwise, use the repository's existing research root or
create `research/`, then write a named bundle:

```text
<research-root>/<YYYY-MM-DD>-<topic>-prior-art/
├── <topic>-prior-art-research.md
└── sources/
    ├── search-log.md
    └── <opened evidence copies>
```

Never overwrite an earlier bundle. Save every cited artifact under `sources/`:

- Code: copy the whole cited file to `sources/<repo>@<shortrev>-<filename>`, beginning with a comment
  containing the pinned upstream URL.
- Standards and prose: copy the governing section to `sources/<source>-<topic>.md`, beginning with
  canonical URL, version, and access date.
- Discovery: record every query and search location in `sources/search-log.md`, separated into
  external-implementation and standard-practice lanes.

## Research pass

1. **Name the problem.** State in one sentence what the research must settle and which design
   decisions wait on it.
2. **Sweep before reading deep.** Use the Exa MCP for live discovery when available. If it is
   unavailable, state that limitation before using another search source. Log both search lanes in
   `sources/search-log.md`.
3. **Open the closest candidates.** Fetch pinned artifacts and read the implementation or governing
   text. Inspect every public integration seam that could avoid a fork: package exports, adapters,
   consumer entrypoints, configuration, and examples. Two candidates opened to load-bearing lines
   outweigh ten search snippets.
4. **Cite to the bar.** For each implementation, state what applies and does not. Tie each standard
   directly to the local decision it constrains.
5. **Recommend.** Choose `adopt`, `adapt`, or `build`, defining the boundary between the external
   mechanism and product-specific behavior.

Do not use `adapt` as a euphemism for copying a maintained implementation into local source. Using
the dependency through a public adapter, configuration layer, version override, or narrow wrapper is
still adoption when the dependency remains the behavior owner. Copying its renderer or policy logic
is a local fork or build and must clear that higher bar.

A peer-range or manifest mismatch is evidence of compatibility risk, not by itself proof that the
implementation is incompatible. Before rejecting adoption, test the exact local dependency set,
inspect the public consumer seam, and state whether a pinned override plus integration gate resolves
the risk. Prefer that bounded risk over duplicating working source when execution evidence supports
it.

If a lane produces nothing worth citing, write `None found` and include its search log. List every
remaining inference as an open question.

## Implementation citation format

````markdown
#### <repo>@<shortrev> — `<file>:<lines>`
[local](sources/<copy>) · [upstream](https://github.com/.../blob/<rev>/<file>#Lx-Ly)

```text
<verbatim excerpt>
```

**Maintained by:** <linked facts> · **Adoption:** <linked facts> · **Battle-tested:** <linked facts>
**What applies:** <what this settles locally>
**What does not:** <what remains product-specific>
````

Done means `<topic>-prior-art-research.md` contains the problem, candidate comparison, citations,
recommendation, and open questions; every load-bearing claim clears the citation bar; both lanes
carry citations or an evidenced `None found`; every local link resolves; and the recommendation
follows from inspected evidence rather than package names or search-result summaries.
