#!/usr/bin/env python3
"""Three-way merge an upstream cursor/plugins pstack range into this port.

Usage: port-upstream.py <upstream-clone> <base-sha> <head-sha>

Each upstream file under pstack/skills and pstack/agents is mapped to its port
path, the mechanical port rewrites are applied to the base and head copies, and
`git merge-file` merges head into the port file. Conflicts are left as markers
for manual resolution and listed on stdout. New upstream skills also get the
SKILL.md wrapper and agents/openai.yaml.
"""
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILLS = ROOT / "skills"
HEADER = ("Read [pstack portability and capability checks](../pstack/README.md) "
          "before following this workflow. Owner and harness policy governs every step.")
OPENAI_YAML = "policy:\n  allow_implicit_invocation: false\n"


def git(clone, *args):
    return subprocess.run(["git", "-C", clone, *args], check=True,
                          capture_output=True).stdout


def port_path(rel):
    parts = rel.split("/")
    if parts[0] == "agents":
        return SKILLS / "pstack" / rel
    name, rest = parts[1], parts[2:]
    if rest == ["SKILL.md"]:
        rest = ["WORKFLOW.md"]
    return SKILLS / f"pstack-{name}" / Path(*rest)


def transform(text, rel, names):
    if text is None:
        return None
    depth = len(port_path(rel).relative_to(SKILLS).parts) - 1
    up = "../" * depth
    if rel.endswith("/SKILL.md") and rel.count("/") == 2 and text.startswith("---\n"):
        end = text.index("\n---\n", 4)
        text = HEADER + "\n" + text[end + 5:]

    def link(n):
        return f"[pstack-{n}]({up}pstack-{n}/WORKFLOW.md)"

    alt = "|".join(sorted(map(re.escape, names), key=len, reverse=True))
    text = re.sub(r"\*\*(" + alt + r")\*\*",
                  lambda m: link(m.group(1)), text)
    principles = [n[len("principle-"):] for n in names if n.startswith("principle-")]
    palt = "|".join(sorted(map(re.escape, principles), key=len, reverse=True))
    text = re.sub(r"\*\*(" + palt + r")\*\*(?= principle skill)",
                  lambda m: link("principle-" + m.group(1)), text)
    text = re.sub(r"\]\(((?:\.\./)+)(" + alt + r")/SKILL\.md",
                  lambda m: f"]({m.group(1)}pstack-{m.group(2)}/WORKFLOW.md", text)
    text = re.sub(r"\]\(((?:\.\./)+)(" + alt + r")/",
                  lambda m: f"]({m.group(1)}pstack-{m.group(2)}/", text)
    text = re.sub(r"`/(" + alt + r")(?![\w-])", r"`/pstack-\1", text)
    text = re.sub(r" \(default `[^`]+`\)", " (selected through owner policy)", text)
    text = text.replace("- `subagent_type`: `generalPurpose`",
                        "- Role: general-purpose worker, with the referenced prompt")
    text = text.replace("- `readonly`: `true`",
                        "- Access: read-only within the task scope")
    return text


def show(clone, sha, path):
    try:
        return git(clone, "show", f"{sha}:{path}").decode()
    except subprocess.CalledProcessError:
        return None


def wrapper(name, description):
    return (f"---\nname: pstack-{name}\ndescription: {description}\n"
            "disable-model-invocation: true\n---\n\n"
            "Read [pstack portability and routing](../pstack/README.md), then follow "
            f"[the {name} workflow](WORKFLOW.md) for the requested task only.\n")


def main(clone, base, head):
    names = sorted(git(clone, "ls-tree", "--name-only", f"{head}:pstack/skills").decode().split())
    changed = git(clone, "diff", "--name-status", base, head, "--",
                  "pstack/skills", "pstack/agents").decode().splitlines()
    conflicts = []
    for line in changed:
        status, path = line.split("\t")[0], line.split("\t")[-1]
        rel = path[len("pstack/"):]
        dest = port_path(rel)
        old = transform(show(clone, base, path), rel, names)
        new = transform(show(clone, head, path), rel, names)
        if new is None:
            dest.unlink(missing_ok=True)
            print(f"D {dest.relative_to(ROOT)}")
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        if old is None or not dest.exists():
            dest.write_text(new)
            print(f"A {dest.relative_to(ROOT)}")
            continue
        with tempfile.TemporaryDirectory() as tmp:
            (Path(tmp) / "base").write_text(old)
            (Path(tmp) / "head").write_text(new)
            r = subprocess.run(["git", "merge-file", "--diff3", "-L", "port", "-L", "base",
                                "-L", "upstream-head", str(dest), str(Path(tmp) / "base"),
                                str(Path(tmp) / "head")])
        mark = "C" if r.returncode else "M"
        if r.returncode:
            conflicts.append(dest)
        print(f"{mark} {dest.relative_to(ROOT)}")
    for name in names:
        d = SKILLS / f"pstack-{name}"
        if not (d / "SKILL.md").exists():
            fm = show(clone, head, f"pstack/skills/{name}/SKILL.md")
            desc = re.search(r"^description: (.*)$", fm, re.M).group(1)
            (d / "SKILL.md").write_text(wrapper(name, desc))
            (d / "agents").mkdir(exist_ok=True)
            (d / "agents" / "openai.yaml").write_text(OPENAI_YAML)
            print(f"A {(d / 'SKILL.md').relative_to(ROOT)} (wrapper, description needs review)")
    print(f"{len(conflicts)} conflicted files")


if __name__ == "__main__":
    main(*sys.argv[1:])
