#!/usr/bin/env bash
set -u
here=$(cd "$(dirname "$0")" && pwd)
check=$here/../../scripts/check-installs.py
fixtures=$here/fixtures
failures=0

run() {
  env -u CLAUDE_CONFIG_DIR -u CODEX_HOME -u PI_CODING_AGENT_DIR -u OO_HOME \
    HOME="$fixtures/$1" python3 "$check" --agents claude,codex,pi
}

expect() {
  local name=$1 want_exit=$2 want_text=$3 out code
  out=$(run "$name"); code=$?
  if [[ $code -ne $want_exit ]]; then
    echo "FAIL $name: exit $code, expected $want_exit"; failures=$((failures + 1)); return
  fi
  if ! grep -qF -- "$want_text" <<<"$out"; then
    echo "FAIL $name: output lacks $want_text"; failures=$((failures + 1)); return
  fi
  echo "PASS $name"
}

expect clean 0 '"duplicates": {}'
expect duplicate 1 "$fixtures/duplicate/.agents/skills/beta"
expect duplicate 1 "$fixtures/duplicate/.codex/skills/beta"

pi_out=$(env -u PI_CODING_AGENT_DIR HOME="$fixtures/pi-package" python3 "$check" --agents pi --scope "$fixtures/pi-package/pkg" --counts)
if grep -q '"names": 1' <<<"$pi_out"; then
  echo "PASS pi-package exclusion drops skills/misc/*"
else
  echo "FAIL pi-package: expected 1 name, got $pi_out"; failures=$((failures + 1))
fi

exit $((failures > 0))
