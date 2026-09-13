#!/usr/bin/env bash
# Link the pstack skills from this clone into Claude Code's personal skills dir.
# Intended for a Claude Code cloud environment "Setup script" (runs before Claude
# boots, so the skills load in the same session). Safe to run locally too.
# Best-effort: never exits non-zero, because a failing setup script blocks session start.
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
mkdir -p "$DEST" || { echo "cloud-setup: cannot create $DEST"; exit 0; }
n=0
for d in "$SRC"/pstack*/; do
  d="${d%/}"
  [ -f "$d/SKILL.md" ] || continue
  ln -sfn "$d" "$DEST/$(basename "$d")" && n=$((n + 1))
done
echo "cloud-setup: linked $n pstack skills into $DEST"
exit 0
