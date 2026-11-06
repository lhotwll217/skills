"""Read a mixed-parent layout on stdin: current | role | destination [| fixed=file:line]."""
import argparse
from collections import defaultdict
from pathlib import Path
import sys


CONTROL = {".git", ".hg", ".svn", ".DS_Store", "__pycache__", "node_modules", ".venv"}
ENTRY = {"README", "README.md", "AGENTS.md", "CLAUDE.md", "CONTEXT.md", ".gitignore", ".gitattributes"}
MARKERS = {".git", ".hg", "package.json", "Cargo.toml", "go.mod", "pyproject.toml", "Package.swift"}


def present(path):
    return path.exists() or path.is_symlink()


def relative(value):
    path = Path(value)
    if not path.parts or path.is_absolute() or ".." in path.parts:
        raise ValueError(f"expected a path relative to the project parent: {value!r}")
    return path


def independent_unit(path):
    return path.is_symlink() or (path.is_dir() and any(present(path / marker) for marker in MARKERS))


def citation(root, text, moved):
    kind, sep, locator = text.partition("=")
    name, colon, number = locator.rpartition(":")
    if not sep or kind not in {"fixed", "owns"} or not colon or not number.isdigit():
        raise ValueError(f"cite the opened consumer or ownership source as fixed=file:line or owns=file:line: {text}")
    file = root / name
    if not file.exists() and file.is_relative_to(root):
        parts = file.relative_to(root).parts
        if parts and Path(parts[0]) in moved:
            file = root / moved[Path(parts[0])] / Path(*parts[1:])
    lines = file.read_text().splitlines()
    if not (0 < int(number) <= len(lines)) or not lines[int(number) - 1].strip():
        raise ValueError(f"empty or missing evidence at {locator}")
    print(f"{kind} evidence locator: {locator}")
    return kind


def check(root, delivered, lines):
    entries = {p.name for p in root.iterdir() if p.name not in CONTROL | ENTRY}
    rows, sources, destinations, owners = [], {}, set(), {}
    for line in lines:
        if not line.strip():
            continue
        fields = [field.strip() for field in line.split("|")]
        if len(fields) not in {3, 4} or not all(fields):
            raise ValueError("expected current | role | destination, optionally followed by a citation")
        current, role, target = fields[:3]
        dest = relative(target)
        src = None if current == "NEW" else relative(current)
        if src and (len(src.parts) != 1 or src in sources):
            raise ValueError(f"account for each immediate child once as a whole: {src}")
        if dest in destinations:
            raise ValueError(f"two units share the same destination: {dest}")
        if src:
            sources[src] = dest
        destinations.add(dest)
        location = root / (dest if delivered or src is None else src)
        if (src or delivered) and not present(location):
            raise ValueError(f"missing {'delivered' if delivered else 'current'} unit: {location}")
        if not delivered and src != dest and present(root / dest):
            raise ValueError(f"destination is occupied: {dest}")
        if delivered and src and src != dest and present(root / src):
            raise ValueError(f"old location still exists: {src}")
        evidence = fields[3] if len(fields) == 4 else None
        independent = independent_unit(location)
        if independent and src:
            owners[src] = owners[dest] = dest
        rows.append((src, role, dest, location, independent, evidence))
    expected = {p.parts[0] for p in destinations} if delivered else {p.name for p in sources}
    if entries != expected - CONTROL - ENTRY:
        raise ValueError(f"parent inventory and plan differ: {sorted(entries ^ (expected - CONTROL - ENTRY))}")
    homes, roles = defaultdict(set), defaultdict(set)
    for src, role, dest, location, independent, evidence in rows:
        if evidence:
            evidence = citation(root, evidence, sources if delivered else {})
        if evidence == "fixed" and src != dest:
            raise ValueError(f"fixed unit must retain its required location: {dest}")
        parent_unit = next((p for p in dest.parents if p.parts and (p in owners or independent_unit(root / p))), None)
        if parent_unit is not None:
            if evidence != "owns" or owners.get(parent_unit, parent_unit) not in dest.parents:
                raise ValueError(f"{dest} crosses the ownership boundary of {parent_unit}. Cite its authority or choose the project-owned home.")
            continue
        if evidence == "owns":
            raise ValueError(f"ownership citation does not identify an enclosing independent unit: {dest}")
        if evidence == "fixed" or (len(dest.parts) == 1 and dest.name in ENTRY):
            continue
        existing_home = src == dest and location.is_dir() and not independent
        if len(dest.parts) == 1 and not existing_home:
            raise ValueError(f"{dest} is loose at a mixed parent. Give this unit its role folder or verify its fixed path.")
        homes[role].add(dest.parts[0])
        roles[dest if existing_home else dest.parent].add(role)
    for folder, kinds in roles.items():
        if len(kinds) > 1:
            raise ValueError(f"{folder} mixes roles: {sorted(kinds)}")
    for role, paths in homes.items():
        if len(paths) > 1:
            raise ValueError(f"{role} is split among {sorted(paths)}")
    print(f"OK: {len(rows)} units, {'delivered' if delivered else 'proposed'} layout at {root}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("parent", type=Path)
    parser.add_argument("--delivered", action="store_true")
    args = parser.parse_args()
    try:
        check(args.parent.resolve(), args.delivered, sys.stdin)
    except (ValueError, OSError) as error:
        sys.exit(f"Layout check failed: {error}")
