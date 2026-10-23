#!/bin/bash
# Fail if any tracked file contains git merge conflict markers.
# Catches the case where a merge resolution is committed before all
# `<<<<<<<` / `=======` / `>>>>>>>` markers are removed, which broke a
# previous attention-chapter merge by leaving conflict markers in
# package.json that crashed the dev server with a JSON parse error.

set -euo pipefail

OFFENDERS=$(git ls-files \
  | grep -vE '^(scripts/lint-no-conflict-markers\.sh|.*\.test\.(ts|tsx))$' \
  | xargs grep -lE '^(<{7}|={7}|>{7})( |$)' 2>/dev/null || true)

if [ -n "$OFFENDERS" ]; then
  echo "ERROR: git merge conflict markers found in tracked files:" >&2
  echo "$OFFENDERS" >&2
  exit 1
fi

echo "No merge conflict markers found in tracked files."
