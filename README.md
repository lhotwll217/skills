# skills

Luke Otwell's agent skills, published as a Claude Code plugin marketplace (`lhotwll217-skills`) with three plugins. Each skill is a folder with a `SKILL.md`, so the folders also install one at a time with the `skills` CLI.

## Layout

```text
.claude-plugin/marketplace.json      # marketplace manifest: lists the three plugins below
plugins/lotwell/                     # plugin "lotwell": the general skills (15)
  .claude-plugin/plugin.json
  skills/<name>/SKILL.md
plugins/pstack/                      # plugin "pstack": the portable pstack port (48)
  .claude-plugin/plugin.json
  skills/pstack/README.md            # index, provenance, capability notes
  skills/pstack-<name>/SKILL.md
plugins/mattpocock-skills/           # plugin "mattpocock-skills": Matt Pocock's skills (27), copied from a fork
  FORK.md                            # source, commit, and Luke's changes
deprecated/                          # unmaintained, kept for reference
```

Plugin skills load under their plugin namespace: `/lotwell:prior-art`, `/pstack:pstack-poteto-mode`. The pstack folders keep their `pstack-` prefix on purpose so the same folders can be symlinked flat into `~/.claude/skills/` without colliding with other `tdd`, `research`, or `teach` skills; under the plugin that yields the double prefix.

## Install

The repo ships three plugins: `lotwell` (Luke's skills), `pstack`, and `mattpocock-skills`. `lotwell` depends on the other two. Install each agent through one route only. A second route loads every skill twice.

**Claude Code.** One install brings all three plugins as `lotwell:`, `pstack:`, and `mattpocock-skills:` skills:

```bash
claude plugin marketplace add lhotwll217/skills
claude plugin install lotwell@lhotwll217-skills
```

**Codex.** Codex reads the same marketplace but not `dependencies`, so add each plugin:

```bash
codex plugin marketplace add lhotwll217/skills
codex plugin add lotwell@lhotwll217-skills
codex plugin add pstack@lhotwll217-skills
codex plugin add mattpocock-skills@lhotwll217-skills
```

**ChatGPT desktop app.** Add `lhotwll217/skills` as a marketplace source in the Plugins Directory, then install `lotwell`, `pstack`, and `mattpocock-skills`.

**Pi.** The root `package.json` makes the repo one Pi package with every skill from the three plugins:

```bash
pi install git:github.com/lhotwll217/skills
```

**Owner Operator.** Owner Operator loads skills from its workspace folder, not from Pi packages. Clone the repo and link each skill folder in:

```bash
git clone https://github.com/lhotwll217/skills.git
for d in skills/plugins/{lotwell,pstack}/skills/*/ skills/plugins/mattpocock-skills/skills/{engineering,productivity}/*/; do ln -sfn "$PWD/${d%/}" "${OO_HOME:-$HOME/.owner-operator}/workspace/skills/$(basename "$d")"; done
```

**Any other agent.** The `skills` CLI installs named skills. It finds the `lotwell` and `pstack` skills from the repo root. Matt Pocock's skills need the plugin folder, which also holds skills he has not promoted, so name the ones you want:

```bash
npx skills add lhotwll217/skills --list
npx skills add lhotwll217/skills --skill writing-great-evals
npx skills add https://github.com/lhotwll217/skills/tree/main/plugins/mattpocock-skills --skill tdd
```

## Cloud sessions

Claude Code cloud sessions (claude.ai/code, routines, Desktop "Continue in cloud") start from a fresh VM and do not see `~/.claude/skills` or user-scope plugins on your machine. Plugins declared in a repo's `.claude/settings.json` are documented to auto-install in cloud sessions but currently don't (anthropics/claude-code#87497, #88214), and `/plugin` is unavailable there. The path that works is installing from the environment's **Setup script**, which runs before Claude boots (claude.ai/code → environment settings → Setup script):

```bash
export CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1
claude plugin marketplace list 2>/dev/null | grep -q lhotwll217-skills || claude plugin marketplace add lhotwll217/skills || true
claude plugin install lotwell@lhotwll217-skills || true
```

`CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1` matters: the `owner/repo` shorthand clones over SSH by default, which a cloud VM lacks. The `|| true` guards keep a network failure from blocking session start. Every pstack entry point is `disable-model-invocation: true`: you type it, Claude never auto-loads it.

`lotwell` brings `pstack` and `mattpocock-skills` as dependencies. The earlier two-plugin version of these lines was verified on 2026-09-13 in a fresh `$HOME` on Claude Code 2.1.267. Not yet verified inside a live cloud VM.

## Skills

| Skill | Purpose |
|---|---|
| [pstack](plugins/pstack/skills/pstack/README.md) | On-demand, namespaced port of pstack's engineering workflows, with portable capability checks. |
| [align](plugins/lotwell/skills/align/SKILL.md) | Establish and maintain a reviewable agreement before work, with proportionate questioning and independent judgment. |
| [ask-the-right-questions](plugins/lotwell/skills/ask-the-right-questions/SKILL.md) | Find the few questions that matter most about a problem before anyone answers it, checking each question's presuppositions against the evidence. |
| [chain-of-context](plugins/lotwell/skills/chain-of-context/SKILL.md) | Make durable project work navigable to cold-start agents through descriptive names, progressive discovery, and linked sources. |
| [current-system-audit](plugins/lotwell/skills/current-system-audit/SKILL.md) | Audit the current implementation and produce an evidence-backed safe-to-build-on verdict. |
| [html-theme](plugins/lotwell/skills/html-theme/SKILL.md) | Apply Luke's house visual system to generated HTML, including Owner Operator's terminal semantic palette. |
| [interactive-diff-review](plugins/lotwell/skills/interactive-diff-review/SKILL.md) | Render a targeted Git diff as a local interactive review and persist anchored Comments to JSON. |
| [interactive-implementation-review](plugins/lotwell/skills/interactive-implementation-review/SKILL.md) | Turn grilling and delegated research into one interactive, evidence-backed implementation review. |
| [interactive-markdown-review](plugins/lotwell/skills/interactive-markdown-review/SKILL.md) | Open a Markdown file for interactive review and persist anchored Comments to JSON. |
| [prior-art](plugins/lotwell/skills/prior-art/SKILL.md) | Research implementations and standards with opened, pinned, quoted, linked, credible evidence. |
| [seo-analytics-research](plugins/lotwell/skills/seo-analytics-research/SKILL.md) | Research SEO questions with live DataForSEO evidence. |
| [show-me](plugins/lotwell/skills/show-me/SKILL.md) | Explain the current topic visually with the smallest diagram, sketch, or HTML view. Copied from [humanlayer/skills](https://github.com/humanlayer/skills/tree/653b6411c1f7/plugins/show-me) at `653b641` (MIT) and made model-callable; see its [README](plugins/lotwell/skills/show-me/README.md). align links to it by path. |
| [updating-prompts](plugins/lotwell/skills/updating-prompts/SKILL.md) | Change an existing prompt — find the decision fork, choose the owning layer, ship the smallest delta that holds, validate the whole agent. |
| [workstream-retro](plugins/lotwell/skills/workstream-retro/SKILL.md) | Reconstruct concurrent work as an interactive orchestration map with human checkpoints, delegated runs, reviews, reroutes, and outcomes. |
| [writing-great-evals](plugins/lotwell/skills/writing-great-evals/SKILL.md) | Write and review eval definitions — one contract per eval, choose the grading seam, keep the grader lean, grade against a 0–4 scale. |

## Deprecated

No longer maintained; kept for reference in [deprecated/](deprecated/).

| Skill | Purpose |
|---|---|
| [pre-invent-the-wheel](deprecated/pre-invent-the-wheel/SKILL.md) | Find and vet converged open-source precedent before implementing non-trivial functionality from scratch. |
| [premortem](deprecated/premortem/SKILL.md) | Find and handle assumption cliffs before substantial work, including ambiguity and related work that could be left stranded. |
