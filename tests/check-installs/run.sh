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

exit $((failures > 0))
