# skills

Standalone agent skills. Each skill is a folder with a `SKILL.md`; install them individually — the repo is not a package.

## Install

List available skills:

```bash
npx skills add lhotwll217/skills --list
```

Add one skill:

```bash
npx skills add lhotwll217/skills --skill writing-great-evals
```

## Skills

| Skill | Purpose |
|---|---|
| [pstack](plugins/pstack/skills/pstack/README.md) | On-demand, namespaced port of pstack's engineering workflows, with portable capability checks. |
| [chain-of-context](chain-of-context/SKILL.md) | Make durable project work navigable to cold-start agents through descriptive names, progressive discovery, and linked sources. |
| [current-system-audit](current-system-audit/SKILL.md) | Audit the current implementation and produce an evidence-backed safe-to-build-on verdict. |
| [grill-with-docs](grill-with-docs/SKILL.md) | Grill a repository-backed plan while maintaining its glossary and durable decisions. |
| [html-theme](html-theme/SKILL.md) | Apply Luke's house visual system to generated HTML, including Owner Operator's terminal semantic palette. |
| [interactive-diff-review](interactive-diff-review/SKILL.md) | Render a targeted Git diff as a local interactive review and persist anchored Comments to JSON. |
| [interactive-implementation-review](interactive-implementation-review/SKILL.md) | Turn grilling and delegated research into one interactive, evidence-backed implementation review. |
| [interactive-markdown-review](interactive-markdown-review/SKILL.md) | Open a Markdown file for interactive review and persist anchored Comments to JSON. |
| [prior-art](prior-art/SKILL.md) | Research implementations and standards with opened, pinned, quoted, linked, credible evidence. |
| [updating-prompts](updating-prompts/SKILL.md) | Change an existing prompt — find the decision fork, choose the owning layer, ship the smallest delta that holds, validate the whole agent. |
| [workstream-retro](workstream-retro/SKILL.md) | Reconstruct concurrent work as an interactive orchestration map with human checkpoints, delegated runs, reviews, reroutes, and outcomes. |
| [writing-great-evals](writing-great-evals/SKILL.md) | Write and review eval definitions — one contract per eval, choose the grading seam, keep the grader lean, grade against a 0–4 scale. |

## Deprecated

No longer maintained; kept for reference in [deprecated/](deprecated/).

| Skill | Purpose |
|---|---|
| [pre-invent-the-wheel](deprecated/pre-invent-the-wheel/SKILL.md) | Find and vet converged open-source precedent before implementing non-trivial functionality from scratch. |
| [premortem](deprecated/premortem/SKILL.md) | Find and handle assumption cliffs before substantial work, including ambiguity and related work that could be left stranded. |

## Cloud sessions

Claude Code cloud sessions (claude.ai/code, routines, Desktop "Continue in cloud") start from a fresh VM and do not see `~/.claude/skills` or user-scope plugins on your machine. Plugins declared in a repo's `.claude/settings.json` are documented to auto-install in cloud sessions but currently don't (anthropics/claude-code#87497, #88214). The path that works is installing the plugin from the environment's **Setup script**, which runs before Claude boots (claude.ai/code → environment settings → Setup script):

```bash
export CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1
claude plugin marketplace list 2>/dev/null | grep -q lhotwll217-skills || claude plugin marketplace add lhotwll217/skills || true
claude plugin install pstack@lhotwll217-skills || true
```

Skills then surface under the plugin namespace, e.g. `/pstack:pstack-poteto-mode`. Every pstack entry point is `disable-model-invocation: true`: you invoke them by name, Claude does not auto-load them.

Locally, the same two commands install the plugin, or symlink `plugins/pstack/skills/*` into `~/.claude/skills/` for unprefixed `/pstack-poteto-mode` names.
