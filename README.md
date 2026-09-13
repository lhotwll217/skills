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
| [pstack](pstack/README.md) | On-demand, namespaced port of pstack's engineering workflows, with portable capability checks. |
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

Claude Code cloud sessions (claude.ai/code, routines, Desktop "Continue in cloud") start from a fresh VM and do not see `~/.claude/skills` on your machine. To load the pstack skills there, set this as the environment's **Setup script** (claude.ai/code → environment settings):

```bash
git clone --depth 1 https://github.com/lhotwll217/skills.git "$HOME/.claude/skills-src" && bash "$HOME/.claude/skills-src/cloud-setup.sh" || true
```

The script symlinks every `pstack*` folder into the VM's `~/.claude/skills/`, so `/pstack-poteto-mode` and friends are typable in the session. Every pstack entry point is `disable-model-invocation: true`: you invoke them by name, Claude does not auto-load them.
