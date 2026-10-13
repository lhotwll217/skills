#!/usr/bin/env bash
set -u
here=$(cd "$(dirname "$0")" && pwd)
check=$here/../../scripts/check-installs.py
fixtures=$here/fixtures
failures=0

# expect <fixture> <agents> <exit> <python assertion over report r>
expect() {
  local name=$1 agents=$2 want_exit=$3 assertion=$4 out code
  out=$(env -u CLAUDE_CONFIG_DIR -u CODEX_HOME -u PI_CODING_AGENT_DIR -u OO_HOME \
    HOME="$fixtures/$name" python3 "$check" --agents "$agents" ${5:+--scope "$fixtures/$name/$5"})
  code=$?
  if [[ $code -ne $want_exit ]]; then
    echo "FAIL $name: exit $code, expected $want_exit"; failures=$((failures + 1)); return
  fi
  if ! python3 -c "import json, sys; r = json.loads(sys.argv[1]); assert $assertion" "$out" 2>/dev/null; then
    echo "FAIL $name: $assertion"; failures=$((failures + 1)); return
  fi
  echo "PASS $name: $assertion"
}

expect clean claude,codex,pi 0 'r["claude"]["names"] == 1 and r["codex"]["names"] == 1 and not r["codex"]["duplicates"]'
expect duplicate codex 1 'sorted(e["path"].split("/fixtures/duplicate/")[1] for e in r["codex"]["duplicates"]["beta"]) == [".agents/skills/beta", ".codex/skills/beta"]'
expect linked codex 0 'r["codex"]["names"] == 2 and not r["codex"]["duplicates"]'
expect pi-package pi 0 'r["pi"]["names"] == 1' pkg

# Pi resolves a relative package path lexically, so a symlinked home must not change where it points
tmp=$(mktemp -d); mkdir -p "$tmp/real/deep/.pi/agent" "$tmp/pkg/skills/kept"
ln -s "$tmp/real/deep" "$tmp/home"
cp "$fixtures/pi-package/pkg/skills/kept/SKILL.md" "$tmp/pkg/skills/kept/"
printf '{"packages": ["../../../pkg"]}\n' > "$tmp/real/deep/.pi/agent/settings.json"
out=$(env -u PI_CODING_AGENT_DIR HOME="$tmp/home" python3 "$check" --agents pi --counts)
if python3 -c "import json, sys; assert json.loads(sys.argv[1])['pi']['names'] == 1" "$out" 2>/dev/null; then
  echo "PASS pi-symlinked-home: relative package path resolves lexically"
else
  echo "FAIL pi-symlinked-home: $out"; failures=$((failures + 1))
fi
rm -rf "$tmp"

exit $((failures > 0))
