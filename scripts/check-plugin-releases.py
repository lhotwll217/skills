#!/usr/bin/env python3
"""Require a version increase when a published plugin's tracked contents change."""
import argparse
import json
from pathlib import PurePosixPath
import re
import subprocess
import sys

CATALOG = '.claude-plugin/marketplace.json'
RELEASE_REF = 'refs/heads/main'


def git(*args):
    return subprocess.check_output(['git', *args], stderr=subprocess.PIPE)


def version(value):
    if not isinstance(value, str) or not re.fullmatch(r'(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)', value):
        raise ValueError(f'expected a stable major.minor.patch version, got {value!r}')
    return tuple(map(int, value.split('.')))


def snapshot(ref):
    commit = git('rev-parse', '--verify', '--end-of-options', ref + '^{commit}').decode().strip()
    tree = {}
    for record in git('ls-tree', '-r', '-z', commit).split(b'\0'):
        if record:
            info, path = record.split(b'\t', 1)
            mode, kind, oid = info.decode().split()
            tree[path.decode('utf-8')] = (mode, kind, oid)

    def read(path):
        mode, kind, oid = tree[path]
        if kind != 'blob' or mode not in ('100644', '100755'):
            raise ValueError(f'{path}: expected a regular file')
        return json.loads(git('cat-file', 'blob', oid))

    plugins = {}
    for entry in read(CATALOG)['plugins']:
        name = entry['name']
        if name in plugins:
            raise ValueError(f'duplicate plugin {name}')
        source = entry['source']
        if not isinstance(source, str) or not source.startswith('./'):
            raise ValueError(f'{name}: only repository-relative plugin sources are supported')
        root = PurePosixPath(source)
        if '..' in root.parts or root.is_absolute() or str(root) == '.':
            raise ValueError(f'{name}: invalid plugin source {source!r}')
        prefix = str(root) + '/'
        manifest_path = prefix + '.claude-plugin/plugin.json'
        manifest = read(manifest_path)
        current = version(manifest.get('version'))
        if manifest['name'] != name or entry.get('version') != manifest['version']:
            raise ValueError(f'{name}: catalog and plugin manifest name/version must match')
        payload = {p[len(prefix):]: value for p, value in tree.items() if p.startswith(prefix)}
        # The release number itself is not a payload change. Preserve file mode.
        normalized = {k: v for k, v in manifest.items() if k != 'version'}
        payload['.claude-plugin/plugin.json'] = (tree[manifest_path][0], normalized)
        config = {k: v for k, v in entry.items() if k != 'version'}
        plugins[name] = (current, payload, config)
    return plugins


def check(base, head):
    before, after = snapshot(base), snapshot(head)
    errors = []
    for name, (current, payload, config) in after.items():
        if name not in before:
            continue
        previous, old_payload, old_config = before[name]
        changed = payload != old_payload or config != old_config
        if current < previous or (changed and current <= previous):
            reason = 'contents/configuration changed' if changed else 'version decreased'
            errors.append(f'{name}: {reason}; increase plugin and catalog version above '
                          f'{".".join(map(str, previous))} (candidate {".".join(map(str, current))})')
    if errors:
        raise ValueError('\n'.join(errors))
    print(f'Plugin release check passed: {base} -> {head}')


def pre_push():
    for line in sys.stdin:
        local_ref, local_oid, remote_ref, remote_oid = line.split()
        if remote_ref != RELEASE_REF or set(local_oid) == {'0'}:
            continue
        if set(remote_oid) == {'0'}:
            raise ValueError('main has no remote baseline; bootstrap requires an explicit review')
        # Do not guess a baseline for force pushes or unavailable remote history.
        git('merge-base', '--is-ancestor', remote_oid, local_oid)
        check(remote_oid, local_oid)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', help='publication baseline commit')
    parser.add_argument('--head', help='candidate commit')
    parser.add_argument('--pre-push', action='store_true', help='read Git pre-push ref updates from stdin')
    args = parser.parse_args()
    if args.pre_push and not (args.base or args.head):
        pre_push()
    elif not args.pre_push and args.base and args.head:
        check(args.base, args.head)
    else:
        parser.error('provide --base and --head, or --pre-push')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, KeyError, TypeError, UnicodeError, subprocess.CalledProcessError) as error:
        detail = error.stderr.decode(errors='replace').strip() if isinstance(error, subprocess.CalledProcessError) else str(error)
        print(f'Plugin release check failed: {detail or str(error)}\n'
              'Use available committed baseline/candidate history; commit matching plugin/catalog version increases.',
              file=sys.stderr)
        sys.exit(1)
