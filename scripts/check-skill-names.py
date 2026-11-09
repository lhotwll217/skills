#!/usr/bin/env python3
"""Require every published skill's `name:` to carry its plugin's prefix.

Pi and Owner Operator load skills by `name:` with no plugin namespace, so two plugins
shipping `tdd` collide there. Claude Code names plugin skills by folder, so folders keep
their upstream names and only the `name:` line is prefixed.
"""
import json
from pathlib import Path
import re
import sys

CATALOG = '.claude-plugin/marketplace.json'
PREFIXES = {'lotwell': 'lotwell-', 'pstack': 'pstack-', 'mattpocock-skills': 'pocock-'}


def main():
    root = Path(__file__).resolve().parent.parent
    errors = []
    for plugin in json.loads((root / CATALOG).read_text())['plugins']:
        prefix = PREFIXES.get(plugin['name'])
        if prefix is None:
            errors.append(f"{plugin['name']}: no prefix assigned in scripts/check-skill-names.py")
            continue
        for skill_md in sorted((root / plugin['source']).rglob('SKILL.md')):
            match = re.search(r'^name:\s*["\']?([^"\'\n]+)', skill_md.read_text(), re.M)
            expected = prefix + skill_md.parent.name
            if not match or match.group(1).strip() != expected:
                errors.append(f"{skill_md.relative_to(root)}: name must be {expected}")
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        return 1
    print('Skill names carry their plugin prefixes.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
