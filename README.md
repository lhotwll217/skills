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
| [writing-great-evals](writing-great-evals/SKILL.md) | Write and review eval definitions — one contract per eval, choose the grading seam, keep the grader lean, grade against a 0–4 scale. |
| [updating-prompts](updating-prompts/SKILL.md) | Change an existing prompt — find the decision fork, choose the owning layer, ship the smallest delta that holds, validate the whole agent. |
