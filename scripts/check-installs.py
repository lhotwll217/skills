#!/usr/bin/env python3
"""Report every skill name that one agent can load from more than one place.

Reads Claude Code, Codex, Pi, and Owner Operator config and skill folders, never writes.
Exits 1 when any in-scope name has more than one source, 0 otherwise.
"""
import argparse
import fnmatch
import glob
import json
import os
import shutil
import sys
import tomllib
from pathlib import Path

AGENTS = ("claude", "codex", "pi", "oo")


def home():
    return Path(os.environ.get("HOME", str(Path.home())))


def read_json(path):
    try:
        return json.loads(Path(path).read_text())
    except (OSError, ValueError):
        return {}


def skill_name(skill_md):
    try:
        lines = skill_md.read_text(errors="replace").splitlines()
    except OSError:
        return skill_md.parent.name
    if lines and lines[0].strip() == "---":
        for line in lines[1:]:
            if line.strip() == "---":
                break
            if line.startswith("name:"):
                return line.split(":", 1)[1].strip().strip("'\"") or skill_md.parent.name
    return skill_md.parent.name


def skill_dirs(root, recursive, hidden=()):
    """Skill directories under root: root itself, its children, or (recursive) any descendant.

    Codex and Pi skip dot-directories and node_modules; `hidden` names dot-directories to keep.
    """
    root = Path(root)
    if not root.is_dir():
        return []
    if (root / "SKILL.md").is_file():
        return [root]
    found = []
    for child in sorted(root.iterdir()):
        if (child.name.startswith(".") and child.name not in hidden) or child.name == "node_modules":
            continue
        if not child.is_dir():
            continue
        if (child / "SKILL.md").is_file():
            found.append(child)
        elif recursive:
            found.extend(skill_dirs(child, True, hidden))
    return found


def plugin_skill_dirs(plugin_root, manifests):
    plugin_root = Path(plugin_root)
    paths = []
    for manifest in manifests:
        declared = read_json(plugin_root / manifest).get("skills")
        if declared:
            paths = [declared] if isinstance(declared, str) else list(declared)
            break
    dirs = skill_dirs(plugin_root / "skills", recursive=False)
    for p in paths:
        dirs.extend(skill_dirs(plugin_root / p, recursive=True))
    return list(dict.fromkeys(dirs))


def claude_sources():
    root = Path(os.environ.get("CLAUDE_CONFIG_DIR", home() / ".claude"))
    for d in skill_dirs(root / "skills", recursive=False):
        yield "personal", d
    enabled = {k for k, v in read_json(root / "settings.json").get("enabledPlugins", {}).items() if v}
    installed = read_json(root / "plugins" / "installed_plugins.json").get("plugins", {})
    for key in sorted(enabled):
        for entry in installed.get(key, []):
            if entry.get("scope", "user") != "user":
                continue
            for d in plugin_skill_dirs(entry["installPath"], [".claude-plugin/plugin.json"]):
                yield f"plugin {key}", d


def codex_sources():
    root = Path(os.environ.get("CODEX_HOME", home() / ".codex"))
    for d in skill_dirs(root / "skills", recursive=True, hidden=(".system",)):
        yield "codex-home", d
    for d in skill_dirs(home() / ".agents" / "skills", recursive=True):
        yield "agents", d
    try:
        config = tomllib.loads((root / "config.toml").read_text())
    except (OSError, tomllib.TOMLDecodeError):
        config = {}
    for key, value in sorted(config.get("plugins", {}).items()):
        if not value.get("enabled", True) or "@" not in key:
            continue
        name, market = key.split("@", 1)
        versions = sorted((root / "plugins" / "cache" / market / name).glob("*"), key=lambda v: v.stat().st_mtime)
        if versions:
            manifests = [".codex-plugin/plugin.json", "plugin.json", ".claude-plugin/plugin.json"]
            for d in plugin_skill_dirs(versions[-1], manifests):
                yield f"plugin {key}", d


def pi_package_root(source, agent_dir):
    if source.startswith("npm:"):
        spec = source[4:]
        name = "@" + spec[1:].split("@")[0] if spec.startswith("@") else spec.split("@")[0]
        return agent_dir / "npm" / "node_modules" / name
    if source.startswith("git:") or source.startswith("https://"):
        spec = source.split(":", 1)[1] if source.startswith("git:") else source.split("://", 1)[1]
        spec = spec.split("@", 1)[0].removesuffix(".git")
        return agent_dir / "git" / spec
    return (agent_dir / source).resolve()


def pi_package_skill_dirs(root):
    patterns = read_json(root / "package.json").get("pi", {}).get("skills")
    if not patterns:
        return skill_dirs(root / "skills", recursive=True)
    include = [p for p in patterns if not p.startswith("!")]
    exclude = [p[1:] for p in patterns if p.startswith("!")]
    dirs = []
    for pattern in include:
        for match in sorted(glob.glob(str(root / pattern))):
            dirs.extend(skill_dirs(match, recursive=True))
    # Pi matches exclusions against the path relative to the package root, with no leading ./
    return [d for d in dict.fromkeys(dirs)
            if not any(fnmatch.fnmatch(str(d.relative_to(root)), x) for x in exclude)]


def pi_sources():
    agent_dir = Path(os.environ.get("PI_CODING_AGENT_DIR", home() / ".pi" / "agent"))
    for d in skill_dirs(agent_dir / "skills", recursive=True):
        yield "pi-home", d
    for d in skill_dirs(home() / ".agents" / "skills", recursive=True):
        yield "agents", d
    settings = read_json(agent_dir / "settings.json")
    for path in settings.get("skills", []):
        for d in skill_dirs(Path(os.path.expanduser(path)), recursive=True):
            yield "settings", d
    for package in settings.get("packages", []):
        source = package if isinstance(package, str) else package.get("source", "")
        for d in pi_package_skill_dirs(pi_package_root(source, agent_dir)):
            yield f"package {source}", d


def oo_sources():
    oo_home = Path(os.environ.get("OO_HOME", home() / ".owner-operator"))
    oo_bin = shutil.which("oo")
    if oo_bin:
        for d in skill_dirs(Path(os.path.realpath(oo_bin)).parent / "src" / "agent" / "skills", recursive=True):
            yield "bundled", d
    for d in skill_dirs(oo_home / "workspace" / "skills", recursive=True):
        yield "workspace", d
    policy = read_json(oo_home / "settings.json").get("skillPolicy") or {}
    personal = home() / ".agents" / "skills"
    if policy.get("mode") == "all-personal":
        for d in skill_dirs(personal, recursive=True):
            yield "personal", d
    elif policy.get("mode") == "allowlist":
        for name in policy.get("allowlist", []):
            for d in skill_dirs(personal / name, recursive=True):
                yield "personal", d


SOURCES = {"claude": claude_sources, "codex": codex_sources, "pi": pi_sources, "oo": oo_sources}


def build_map(agent):
    """Map each skill name to its distinct sources. Paths that resolve to one folder are one source."""
    names = {}
    for route, d in SOURCES[agent]():
        entry = {"route": route, "path": str(d), "real": os.path.realpath(d)}
        sources = names.setdefault(skill_name(d / "SKILL.md"), [])
        if all(e["real"] != entry["real"] for e in sources):
            sources.append(entry)
    return names


def scope_names(dirs):
    return {skill_name(d / "SKILL.md") for root in dirs for d in skill_dirs(root, recursive=True)}


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--agents", default=",".join(AGENTS), help="comma list of " + ", ".join(AGENTS))
    parser.add_argument("--scope", action="append", default=[], help="only check skill names found under this dir")
    parser.add_argument("--counts", action="store_true", help="print entry and duplicate counts only")
    args = parser.parse_args()

    agents = [a for a in args.agents.split(",") if a]
    unknown = set(agents) - set(AGENTS)
    if unknown:
        parser.error(f"unknown agents: {', '.join(sorted(unknown))}")
    in_scope = scope_names(args.scope) if args.scope else None

    report, failed = {}, False
    for agent in agents:
        names = build_map(agent)
        if in_scope is not None:
            names = {n: s for n, s in names.items() if n in in_scope}
        dupes = {n: s for n, s in sorted(names.items()) if len(s) > 1}
        failed |= bool(dupes)
        if args.counts:
            report[agent] = {"entries": sum(map(len, names.values())), "names": len(names), "duplicates": len(dupes)}
        else:
            report[agent] = {"duplicates": dupes, "names": len(names)}
    json.dump(report, sys.stdout, indent=2, sort_keys=True)
    print()
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
