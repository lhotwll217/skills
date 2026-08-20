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
| [html-theme](html-theme/SKILL.md) | Apply Luke's house visual system to generated HTML, including Owner Operator's terminal semantic palette. |
| [interactive-diff-review](interactive-diff-review/SKILL.md) | Render a targeted Git diff as a local interactive review and persist anchored Comments to JSON. |
| [pre-invent-the-wheel](pre-invent-the-wheel/SKILL.md) | Find and vet converged open-source precedent before implementing non-trivial functionality from scratch. |
| [precheck](precheck/SKILL.md) | Run a premortem before substantial work to find and handle assumptions that could invalidate the result. |
| [workstream-retro](workstream-retro/SKILL.md) | Reconstruct concurrent work as an interactive orchestration map with human checkpoints, delegated runs, reviews, reroutes, and outcomes. |
| [writing-great-evals](writing-great-evals/SKILL.md) | Write and review eval definitions — one contract per eval, choose the grading seam, keep the grader lean, grade against a 0–4 scale. |
| [updating-prompts](updating-prompts/SKILL.md) | Change an existing prompt — find the decision fork, choose the owning layer, ship the smallest delta that holds, validate the whole agent. |
