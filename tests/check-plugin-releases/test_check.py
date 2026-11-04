#!/usr/bin/env python3
"""Exercise the production CLI and hook against committed temporary repositories."""
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
CHECK = ROOT / 'scripts/check-plugin-releases.py'
HOOK = ROOT / '.githooks/pre-push'


class ReleaseGuardTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name)
        self.git('init', '-q')
        self.git('config', 'user.name', 'Fixture')
        self.git('config', 'user.email', 'fixture@example.invalid')
        self.entries = []
        for name in ('one', 'two'):
            self.entries.append(dict(name=name, source=f'./plugins/{name}', version='1.0.0'))
            self.write(f'plugins/{name}/.claude-plugin/plugin.json', dict(name=name, version='1.0.0'))
            self.write(f'plugins/{name}/skills/example/assets/client.js', 'old')
        self.catalog()
        self.base = self.commit()

    def git(self, *args):
        return subprocess.check_output(['git', *args], cwd=self.repo, stderr=subprocess.PIPE).decode().strip()

    def write(self, path, value):
        target = self.repo / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(value) if isinstance(value, dict) else value)

    def catalog(self):
        self.write('.claude-plugin/marketplace.json', dict(name='fixture', plugins=self.entries))

    def bump(self, name='one', value='1.0.1', manifest=True):
        next(e for e in self.entries if e['name'] == name)['version'] = value
        self.catalog()
        if manifest:
            self.write(f'plugins/{name}/.claude-plugin/plugin.json', dict(name=name, version=value))

    def commit(self):
        self.git('add', '.')
        self.git('commit', '-qm', 'fixture')
        return self.git('rev-parse', 'HEAD')

    def run_check(self, expected, base=None, head=None, stdin=None):
        args = ['--pre-push'] if stdin is not None else ['--base', base or self.base, '--head', head or 'HEAD']
        result = subprocess.run(['python3', str(CHECK), *args], cwd=self.repo,
                                input=stdin, text=True, capture_output=True)
        self.assertEqual(result.returncode, expected, result.stdout + result.stderr)
        return result

    def test_asset_change_fails_then_matching_bump_passes(self):
        self.write('plugins/one/skills/example/assets/client.js', 'redesign')
        changed = self.commit()
        self.assertIn('one: contents/configuration changed', self.run_check(1).stderr)
        self.bump()
        released = self.commit()
        self.run_check(0)  # Entire multi-commit publication, not merely HEAD^.
        self.run_check(0, base=changed, head=released)
        self.write('plugins/one/skills/example/assets/client.js', 'next redesign')
        self.commit()
        self.run_check(1, base=released)  # A previously published bump cannot be reused.

    def test_catalog_only_and_wrong_plugin_bumps_fail(self):
        self.write('plugins/one/skills/example/assets/client.js', 'new')
        self.bump(manifest=False)
        self.commit()
        self.run_check(1)
        self.bump(value='1.0.0')
        self.bump(name='two')
        self.commit()
        self.run_check(1)

    def test_unrelated_files_and_uncommitted_edits_do_not_count(self):
        self.write('README.md', 'documentation')
        self.commit()
        self.write('plugins/one/skills/example/assets/client.js', 'uncommitted')
        self.run_check(0)
        self.commit()
        self.bump()  # An uncommitted bump cannot rescue the committed change.
        self.run_check(1)

    def test_manifest_configuration_requires_bump(self):
        self.write('plugins/one/.claude-plugin/plugin.json', dict(name='one', version='1.0.0', hooks={}))
        self.commit()
        self.run_check(1)

    def test_catalog_configuration_requires_bump(self):
        self.entries[0]['description'] = 'changed distribution metadata'
        self.catalog()
        self.commit()
        self.run_check(1)

    def test_deletions_moves_and_modes_require_bump(self):
        path = self.repo / 'plugins/one/skills/example/assets/client.js'
        path.rename(path.with_name('renamed.js'))
        self.commit()
        self.run_check(1)
        path.with_name('renamed.js').unlink()
        self.commit()
        self.run_check(1)
        self.write('plugins/one/tool', 'tool')
        baseline = self.commit()
        (self.repo / 'plugins/one/tool').chmod(0o755)
        self.commit()
        self.run_check(1, base=baseline)

    def test_invalid_versions_and_missing_history_fail(self):
        self.run_check(1, base='not-a-commit')
        self.bump(value='0.9.9')
        self.commit()
        self.run_check(1)
        self.bump(value='1.0.1-beta')
        self.commit()
        self.run_check(1)

    def test_added_removed_and_broken_sources(self):
        self.entries.pop()
        self.catalog()
        self.commit()
        self.run_check(0)
        self.entries.append(dict(name='two', source='./plugins/two', version='1.0.0'))
        self.catalog()
        self.run_check(0, base=self.git('rev-parse', 'HEAD'), head=self.commit())
        self.entries[0]['source'] = './missing'
        self.catalog()
        self.commit()
        self.run_check(1)

    def test_hook_reads_outgoing_objects_instead_of_worktree_or_head(self):
        self.write('plugins/one/skills/example/assets/client.js', 'redesign')
        bad = self.commit()
        self.bump()
        good = self.commit()
        # Real shell hook, run outside repository root, with production files in fixture.
        self.write('scripts/check-plugin-releases.py', CHECK.read_text())
        for candidate, expected in [(bad, 1), (good, 0)]:
            result = subprocess.run([str(HOOK)], cwd=self.repo / 'plugins', text=True,
                                    input=f'refs/heads/main {candidate} refs/heads/main {self.base}\n',
                                    capture_output=True)
            self.assertEqual(result.returncode, expected, result.stdout + result.stderr)
        self.run_check(0, stdin=f'refs/heads/topic {bad} refs/heads/topic {self.base}\n')
        self.run_check(1, stdin=f'refs/heads/main {good} refs/heads/main {"0" * 40}\n')
        self.run_check(0, stdin=f'(delete) {"0" * 40} refs/heads/main {good}\n')
        self.run_check(1, stdin=f'refs/heads/main {self.base} refs/heads/main {good}\n')


if __name__ == '__main__':
    unittest.main()
