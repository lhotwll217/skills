# skills

Luke Otwell's agent skills, published as a Claude Code plugin marketplace (`lhotwll217-skills`) with two plugins. Each skill is a folder with a `SKILL.md`, so the folders also install one at a time with the `skills` CLI.

## Layout

```text
.claude-plugin/marketplace.json      # marketplace manifest: lists the two plugins below
plugins/luke/                        # plugin "luke": the general skills (12)
  .claude-plugin/plugin.json
  skills/<name>/SKILL.md
plugins/pstack/                      # plugin "pstack": the portable pstack port (48)
  .claude-plugin/plugin.json
  skills/pstack/README.md            # index, provenance, capability notes
  skills/pstack-<name>/SKILL.md
deprecated/                          # unmaintained, kept for reference
```

Plugin skills load under their plugin namespace: `/luke:prior-art`, `/pstack:pstack-poteto-mode`. The pstack folders keep their `pstack-` prefix on purpose so the same folders can be symlinked flat into `~/.claude/skills/` without colliding with other `tdd`, `research`, or `teach` skills; under the plugin that yields the double prefix.

## Install

**As plugins (Claude Code, any machine).** Namespaced, updatable with `claude plugin update`:

```bash
claude plugin marketplace add lhotwll217/skills
claude plugin install luke@lhotwll217-skills
claude plugin install pstack@lhotwll217-skills
```

**One skill at a time (any agent that reads `SKILL.md`).** The `skills` CLI finds the nested folders:

```bash
npx skills add lhotwll217/skills --list
npx skills add lhotwll217/skills --skill writing-great-evals
```

**Flat symlinks (unprefixed names).** For `/pstack-poteto-mode` rather than `/pstack:pstack-poteto-mode`, link the folders into a skills root; the pstack folders must move together because they cross-link as siblings:

```bash
git clone https://github.com/lhotwll217/skills.git
for d in skills/plugins/pstack/skills/*/; do ln -sfn "$PWD/${d%/}" ~/.claude/skills/"$(basename "$d")"; done
```

## Cloud sessions

Claude Code cloud sessions (claude.ai/code, routines, Desktop "Continue in cloud") start from a fresh VM and do not see `~/.claude/skills` or user-scope plugins on your machine. Plugins declared in a repo's `.claude/settings.json` are documented to auto-install in cloud sessions but currently don't (anthropics/claude-code#87497, #88214), and `/plugin` is unavailable there. The path that works is installing from the environment's **Setup script**, which runs before Claude boots (claude.ai/code → environment settings → Setup script):

```bash
export CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1
claude plugin marketplace list 2>/dev/null | grep -q lhotwll217-skills || claude plugin marketplace add lhotwll217/skills || true
claude plugin install luke@lhotwll217-skills || true
claude plugin install pstack@lhotwll217-skills || true
```

`CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1` matters: the `owner/repo` shorthand clones over SSH by default, which a cloud VM lacks. The `|| true` guards keep a network failure from blocking session start. Every pstack entry point is `disable-model-invocation: true`: you type it, Claude never auto-loads it.

Verified 2026-09-13 by running these exact lines against GitHub in a fresh `$HOME` on Claude Code 2.1.267: both plugins installed, 12 and 48 skills cached, and `/pstack:pstack-tdd` executed in print mode. Not yet verified inside a live cloud VM.

## Skills

| Skill | Purpose |
|---|---|
| [pstack](plugins/pstack/skills/pstack/README.md) | On-demand, namespaced port of pstack's engineering workflows, with portable capability checks. |
| [chain-of-context](plugins/luke/skills/chain-of-context/SKILL.md) | Make durable project work navigable to cold-start agents through descriptive names, progressive discovery, and linked sources. |
| [current-system-audit](plugins/luke/skills/current-system-audit/SKILL.md) | Audit the current implementation and produce an evidence-backed safe-to-build-on verdict. |
| [grill-with-docs](plugins/luke/skills/grill-with-docs/SKILL.md) | Grill a repository-backed plan while maintaining its glossary and durable decisions. |
| [html-theme](plugins/luke/skills/html-theme/SKILL.md) | Apply Luke's house visual system to generated HTML, including Owner Operator's terminal semantic palette. |
| [interactive-diff-review](plugins/luke/skills/interactive-diff-review/SKILL.md) | Render a targeted Git diff as a local interactive review and persist anchored Comments to JSON. |
| [interactive-implementation-review](plugins/luke/skills/interactive-implementation-review/SKILL.md) | Turn grilling and delegated research into one interactive, evidence-backed implementation review. |
| [interactive-markdown-review](plugins/luke/skills/interactive-markdown-review/SKILL.md) | Open a Markdown file for interactive review and persist anchored Comments to JSON. |
| [prior-art](plugins/luke/skills/prior-art/SKILL.md) | Research implementations and standards with opened, pinned, quoted, linked, credible evidence. |
| [updating-prompts](plugins/luke/skills/updating-prompts/SKILL.md) | Change an existing prompt — find the decision fork, choose the owning layer, ship the smallest delta that holds, validate the whole agent. |
| [workstream-retro](plugins/luke/skills/workstream-retro/SKILL.md) | Reconstruct concurrent work as an interactive orchestration map with human checkpoints, delegated runs, reviews, reroutes, and outcomes. |
| [writing-great-evals](plugins/luke/skills/writing-great-evals/SKILL.md) | Write and review eval definitions — one contract per eval, choose the grading seam, keep the grader lean, grade against a 0–4 scale. |

## Deprecated

No longer maintained; kept for reference in [deprecated/](deprecated/).

| Skill | Purpose |
|---|---|
| [pre-invent-the-wheel](deprecated/pre-invent-the-wheel/SKILL.md) | Find and vet converged open-source precedent before implementing non-trivial functionality from scratch. |
| [premortem](deprecated/premortem/SKILL.md) | Find and handle assumption cliffs before substantial work, including ambiguity and related work that could be left stranded. |
