# Fork notes

This folder is a copy of [lhotwll217/mattpocock-skills](https://github.com/lhotwll217/mattpocock-skills) at `49dd158d1076134a641b33efb035946536778336`, a fork of [mattpocock/skills](https://github.com/mattpocock/skills) that is kept unedited. Matt Pocock wrote these skills, licensed under the MIT license in [LICENSE](LICENSE).

Luke Otwell's changes are made here only:

- `skills/productivity/writing-for-agents/SKILL.md` has a rewritten description and a `## Finishing` section that prunes, then lints with `scripts/jev-lint.py`.
- `skills/productivity/writing-for-agents/scripts/jev-lint.py` is new. It runs the `jev` CLI.
- `skills/engineering/grill-with-docs/` is Luke's version, which the model can invoke.

Upstream updates arrive by syncing the fork, then running `git subtree pull --prefix=plugins/mattpocock-skills https://github.com/lhotwll217/mattpocock-skills main --squash` from the repo root.
