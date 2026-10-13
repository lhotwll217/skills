#!/usr/bin/env python3
"""Check this port against an upstream cursor/plugins commit.

Usage: check-port.py <upstream-clone> <upstream-sha> [map|flags|headers|links|cursorisms]

map         every upstream skill file has a port counterpart
flags       every SKILL.md is user-invoked in Claude Code and Codex
headers     every WORKFLOW.md opens with the portability header
links       every relative Markdown link resolves
cursorisms  lines naming Cursor-only tools, for review (never fails)

Exits 1 when a failing check finds a problem.
"""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILLS = ROOT / "skills"
HEADER = ("Read [pstack portability and capability checks](../pstack/README.md) "
          "before following this workflow. Owner and harness policy governs every step.")
CURSORISMS = re.compile(r"AskQuestion|create-skill|subagent_type|generalPurpose|"
                        r"pstack-models\.mdc|\.cursor/|cursor-team-kit|/loop\b|/goal\b|"
                        r"cloud-sleeper|run_in_background|Custom Mode|Cursor")


def upstream_files(clone, sha):
    out = subprocess.run(["git", "-C", clone, "ls-tree", "-r", "--name-only", sha,
                          "pstack/skills"], check=True, capture_output=True, text=True)
    return [p[len("pstack/skills/"):] for p in out.stdout.split()]


def check_map(clone, sha):
    problems, lines = [], []
    names = set()
    for rel in upstream_files(clone, sha):
        name, rest = rel.split("/", 1)
        names.add(name)
        dest = SKILLS / f"pstack-{name}" / ("WORKFLOW.md" if rest == "SKILL.md" else rest)
        ok = dest.is_file()
        if rest == "SKILL.md":
            lines.append(f"{'ok' if ok else 'UNMAPPED'}\tskills/{rel}\t{dest.relative_to(ROOT)}")
        if not ok:
            problems.append(f"missing {dest.relative_to(ROOT)} for upstream skills/{rel}")
    extra = sorted(d.name for d in SKILLS.iterdir()
                   if d.is_dir() and d.name != "pstack" and d.name[len("pstack-"):] not in names)
    problems += [f"port-only skill {d}" for d in extra]
    mapped = sum(line.startswith("ok\t") for line in lines)
    lines.append(f"{len(names)} upstream skills, {mapped} mapped, {len(extra)} port-only")
    return lines, problems


def skill_dirs():
    return sorted(d for d in SKILLS.iterdir() if (d / "SKILL.md").is_file())


def check_flags(*_):
    lines, problems = [], []
    for d in skill_dirs():
        text = (d / "SKILL.md").read_text()
        fm = text.split("---\n")[1] if text.startswith("---\n") else ""
        yaml = d / "agents" / "openai.yaml"
        claude = re.search(r"^disable-model-invocation: true$", fm, re.M) is not None
        named = re.search(rf"^name: {re.escape(d.name)}$", fm, re.M) is not None
        codex = yaml.is_file() and "allow_implicit_invocation: false" in yaml.read_text()
        lines.append(f"{d.name}\tname={named}\tdisable-model-invocation={claude}\tcodex-implicit-off={codex}")
        if not (claude and named and codex):
            problems.append(f"{d.name} flags incomplete")
    return lines, problems


def check_headers(*_):
    lines, problems = [], []
    for wf in sorted(SKILLS.glob("*/WORKFLOW.md")):
        ok = wf.read_text().split("\n", 1)[0] == HEADER
        lines.append(f"{'ok' if ok else 'MISSING'}\t{wf.relative_to(ROOT)}")
        if not ok:
            problems.append(f"{wf.relative_to(ROOT)} lacks the portability header")
    return lines, problems


def prose(text):
    text = re.sub(r"^ {0,3}(`{3,}|~{3,}).*?^ {0,3}\1[ \t]*$", "", text, flags=re.M | re.S)
    return re.sub(r"`[^`\n]*`", "", text)


def check_links(*_):
    lines, problems = [], []
    for md in sorted(SKILLS.rglob("*.md")):
        for target in re.findall(r"\]\(([^)\s]+)\)", prose(md.read_text())):
            if re.match(r"[a-z]+:", target) or target.startswith("#"):
                continue
            path = target.split("#", 1)[0]
            if "<" in path or "{" in path or ("/" not in path and "." not in path):
                continue
            ok = (md.parent / path).exists()
            if not ok:
                problems.append(f"{md.relative_to(ROOT)} -> {target}")
                lines.append(f"BROKEN\t{md.relative_to(ROOT)}\t{target}")
    lines.append(f"{len(problems)} broken relative links")
    return lines, problems


def check_cursorisms(*_):
    lines = []
    for f in sorted(SKILLS.rglob("*")):
        if f.is_file() and f.suffix in {".md", ".yaml"}:
            for n, line in enumerate(f.read_text().splitlines(), 1):
                if CURSORISMS.search(line):
                    lines.append(f"{f.relative_to(ROOT)}:{n}: {line.strip()[:240]}")
    return lines, []


CHECKS = {"map": check_map, "flags": check_flags, "headers": check_headers,
          "links": check_links, "cursorisms": check_cursorisms}


def main(clone, sha, *only):
    failed = False
    for name in only or CHECKS:
        lines, problems = CHECKS[name](clone, sha)
        print(f"## {name}: {'FAIL' if problems else 'PASS'}")
        print("\n".join(lines))
        for p in problems:
            print(f"PROBLEM {p}")
        failed |= bool(problems)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main(*sys.argv[1:])
